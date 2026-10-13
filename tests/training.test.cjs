const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const dir=path.join(__dirname,'..');
require(path.join(dir,'training.js'));
const T=globalThis.Training;
const context={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null}},navigator:{},console,Training:T,Date,Math,alert(){},setTimeout,clearTimeout,setInterval,clearInterval};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(dir,'previews.js'),'utf8'),context);
const source=fs.readFileSync(path.join(dir,'app.js'),'utf8').replace('  if (document.readyState', '  window.testAPI={EX,SESSIONS,EQUIP,defaultState,resolveExercise,scaledExercises,sessionsThisWeek,weekStreak,effMods,tickTimer,ef,setState:s=>state=s};\n  if (document.readyState');
vm.runInContext(source,context);
const A=context.window.testAPI;
test('every catalog exercise has an offline movement preview',()=>{
 assert.deepEqual(Object.keys(A.EX).sort(),[...context.window.ExercisePreview.ids].sort());
 for(const ex of Object.values(A.EX)){assert.match(context.window.ExercisePreview.html(ex),/data-preview=/);assert.doesNotMatch(context.window.ExercisePreview.html(ex),/https?:/);}
});
test('units and repetition goals do not confuse tempo, minutes and distance',()=>{
 assert.equal(T.unit(A.EX.farmers_carry),'m');assert.equal(T.unit(A.EX.ruck_carry),'Min.');assert.equal(T.unit(A.EX.plank),'Sek.');
 assert.equal(T.unit(A.EX.eccentric_squat),'Wdh.');assert.equal(T.upper(A.EX.eccentric_squat),8);assert.equal(T.upper(A.EX.pullup),8);
});
test('volume includes completed sets only and excludes duration and distance',()=>{
 const entry={setLog:[{weight:'20',reps:'10',done:true},{weight:'25',reps:'8',done:true},{weight:'100',reps:'10',done:false}]};
 assert.equal(T.volume(entry,A.EX.bench_press),400);assert.equal(T.volume(entry,A.EX.farmers_carry),0);assert.equal(T.volume(entry,A.EX.plank),0);
});
test('estimated 1RM excludes high reps and time/distance exercises',()=>{
 assert.equal(T.oneRM(60,10,A.EX.bench_press),80);assert.equal(T.oneRM(60,1,A.EX.bench_press),60);
 assert.equal(T.oneRM(60,60,A.EX.plank),0);assert.equal(T.oneRM(60,30,A.EX.farmers_carry),0);assert.equal(T.oneRM(60,20,A.EX.bench_press),0);
});
test('progression requires all target sets and RPE, reduces excessive effort',()=>{
 const ex=A.EX.bench_press, previous={targetSets:4,setLog:Array.from({length:4},()=>({weight:'40',reps:'10',rpe:'8',done:true}))};
 assert.equal(T.suggestion(ex,previous,1).next,41);
 previous.setLog[3].reps='8';assert.equal(T.suggestion(ex,previous,1).next,40);
 previous.setLog[3].reps='10';previous.setLog[3].rpe='';assert.equal(T.suggestion(ex,previous,1).next,40);
 previous.setLog[3].rpe='10';assert.equal(T.suggestion(ex,previous,1).next,38);
 assert.equal(T.suggestion(ex,previous,.85).next,34);
 assert.equal(T.suggestion(A.EX.farmers_carry,previous,1),null);
});
test('invalid set values never pass completion validation',()=>{
 for(const values of [{reps:'-1'},{weight:'Infinity'},{reps:'2.5'},{rpe:'11'},{reps:''},{weight:'-20'}])assert.equal(T.validSet({weight:'20',reps:'10',rpe:'',...values},A.EX.bench_press),false);
 assert.equal(T.validSet({weight:'',reps:'10',rpe:''},A.EX.pushup),true);
});
test('legacy data migration keeps actual observations without invented sets',()=>{
 const d=A.defaultState(),old={...d,onboarded:true,history:[{id:'h1',date:'2026-10-12',type:'KRAFT_A',exercises:[{id:'back_squat',sets:4,weight:'40',doneReps:'8'}]}]};
 const n=T.normalize(old,A.defaultState(),A.EX,A.SESSIONS,A.EQUIP);
 assert.equal(n.history.length,1);assert.equal(T.completed(n.history[0].exercises[0]).length,1);assert.equal(n.history[0].exercises[0].weight,'40');
});
test('malformed imports are rejected or sanitized, IDs cannot inject markup',()=>{
 assert.throws(()=>T.normalize({history:[]},A.defaultState(),A.EX,A.SESSIONS,A.EQUIP));
 const raw={...A.defaultState(),frequency:999,theme:'evil',history:[{id:'"><img>',date:'2026-10-12',type:'KRAFT_A'}],locations:[{id:'bad"',name:'bad',equipment:[]}]};
 const n=T.normalize(raw,A.defaultState(),A.EX,A.SESSIONS,A.EQUIP);assert.equal(n.history.length,0);assert.equal(n.frequency,6);assert.equal(n.theme,'auto');assert.ok(n.locations.length);
});
test('equipment and complaint fallback never claims unsupported exercises safe',()=>{
 const s=A.defaultState();s.locations=[{id:'test',name:'Test',equipment:[]}];s.activeLocationId='test';A.setState(s);
 assert.equal(A.resolveExercise('bench_press').exercise.id,'pushup');
 s.complaints.schulter=true;assert.ok(A.resolveExercise('bench_press').warning);
 s.complaints.knie=true;assert.ok(A.resolveExercise('back_squat').warning);
});
test('week streak survives an unfinished current week',()=>{
 const s=A.defaultState();s.frequency=2;const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7)-1);const iso=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 s.history=[{date:iso},{date:iso}];A.setState(s);assert.equal(A.weekStreak(),1);
});

test('timer catches up to real elapsed time after background suspension',()=>{
 Object.assign(A.ef,{mode:'rest',phase:'rest',running:true,left:90,deadline:Date.now()-1000});A.tickTimer();assert.equal(A.ef.running,false);assert.equal(A.ef.left,0);
 Object.assign(A.ef,{mode:'interval',phase:'work',running:true,left:20,work:20,rest:10,round:1,rounds:8,deadline:Date.now()-35000});A.tickTimer();assert.equal(A.ef.round,2);assert.equal(A.ef.phase,'rest');assert.ok(A.ef.left>0&&A.ef.left<=5);
 A.ef.running=false;
});
test('20-minute plans reserve time for warmup and cooldown',()=>{
 const s=A.defaultState();s.sessionMinutes=20;A.setState(s);
 for(const id of Object.keys(A.SESSIONS)){const ex=A.scaledExercises(id);if(!A.SESSIONS[id].conditioning)assert.ok(ex.reduce((sum,k)=>sum+A.resolveExercise(k).exercise.min,0)<=10);}
});
