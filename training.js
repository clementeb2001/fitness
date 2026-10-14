/* Pure training calculations. No network, no personal data leaves this device. */
(function(root) {
  'use strict';
  const num = v => Number(String(v).replace(',', '.'));
  // Verfügbare Gewichte je Ort und Gerät (für Vorschlag-Einrastung). Streng validiert.
  const WEIGHTED = ['kurzhanteln','langhantel','kettlebell','gewichtsweste','trap_bar','ez_stange'];
  function cleanInv(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
    const list = a => Array.isArray(a)
      ? [...new Set(a.map(num).filter(v => Number.isFinite(v) && v > 0 && v <= 500).map(v => Math.round(v*100)/100))].sort((x,y)=>x-y).slice(0,80)
      : [];
    const out = {};
    for (const k of WEIGHTED) { const v = list(raw[k]); if (v.length) out[k] = v; }
    return Object.keys(out).length ? out : undefined;
  }
  function unit(ex) {
    const target=ex.reps.split('(')[0]; // Parentheses can contain tempo cues, not the logged unit.
    if (/Sek/.test(target)) return 'Sek.';
    if (/Min/.test(target)) return 'Min.';
    if (/\d\s*m(?:\s|$)/.test(target)) return 'm';
    return 'Wdh.';
  }
  function upper(ex) {
    const m = ex.reps.match(/^(?:max\s*\/\s*)?(\d+)(?:[–-](\d+))?/);
    return m ? Number(m[2] || m[1]) : null;
  }
  function oneRM(weight, reps, ex) {
    const w = num(weight), r = num(reps);
    return (!ex || unit(ex) === 'Wdh.') && w > 0 && r >= 1 && r <= 12 ? (r === 1 ? w : w * (1 + r / 30)) : 0;
  }
  function completed(e) {
    const valid=s=>Number.isFinite(num(s.reps)) && num(s.reps)>0 && num(s.reps)<=10000 && Number.isFinite(num(s.weight)) && num(s.weight)>=0 && num(s.weight)<=1000;
    if (Array.isArray(e.setLog)) return e.setLog.filter(s => s.done && valid(s));
    const legacy={weight:e.weight || '', reps:e.doneReps || '', rpe:e.rpe || '', done:true};
    return e.done === false || !valid(legacy) ? [] : [legacy];
  }
  function volume(e, ex) {
    return ex && unit(ex) !== 'Wdh.' ? 0 : completed(e).reduce((total,s) => total + (num(s.weight) > 0 && num(s.reps) > 0 ? num(s.weight)*num(s.reps) : 0),0);
  }
  function validSet(s, ex) {
    return Number.isFinite(num(s.reps)) && num(s.reps) > 0 && num(s.reps) <= 10000 &&
      (unit(ex) !== 'Wdh.' || Number.isInteger(num(s.reps))) &&
      Number.isFinite(num(s.weight)) && num(s.weight) >= 0 && num(s.weight) <= 1000 &&
      (s.rpe === '' || (Number.isFinite(num(s.rpe)) && num(s.rpe) >= 1 && num(s.rpe) <= 10));
  }
  function suggestion(ex, previous, load) {
    const sets = completed(previous).filter(s => num(s.weight) > 0 && num(s.reps) > 0);
    if (!sets.length || unit(ex) !== 'Wdh.') return null;
    const weight = Math.min(...sets.map(s => num(s.weight)));
    const rpes = sets.map(s => s.rpe === '' ? null : num(s.rpe));
    const easy = sets.every(s => num(s.reps) >= upper(ex)) && rpes.every(r => r !== null && r <= 8);
    const hard = rpes.some(r => r !== null && r >= 9.5);
    const increment = Math.min(2.5, Math.max(0.5, Math.round(weight * 0.025 * 2)/2));
    let next = weight, reason = 'Gewicht halten; erst alle Sätze am oberen Wiederholungsziel mit RPE ≤ 8 abschließen.';
    if (load < 1) { next = Math.floor(weight*load*2)/2; reason = 'Wegen Tagesform oder Entlastungswoche reduziert.'; }
    else if (hard) { next = Math.floor(weight*0.95*2)/2; reason = 'Letzte Belastung sehr hoch (RPE ≥ 9,5): etwas leichter starten.'; }
    else if (easy && sets.length >= (previous.targetSets || ex.sets)) { next += increment; reason = 'Alle Zielsätze erreicht, RPE ≤ 8: kleine Steigerung vorgeschlagen.'; }
    return {last:weight, next, reason, lastReps:sets.map(s=>s.reps).join('/'),up:next>weight,down:next<weight};
  }
  function fillPrevious(rows, previous, load=1) {
    return rows.map((row,i)=>{
      const old=previous[i];if(row.done||!old)return {...row};
      return {...row,weight:row.weight!==''?row.weight:(num(old.weight)>0?String(Math.floor(num(old.weight)*Math.min(1,Math.max(0,load))*2)/2):''),reps:row.reps!==''?row.reps:String(old.reps),rpe:row.rpe};
    });
  }
  function series(history, ex, metric) {
    if(!ex)return [];
    return history.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(h=>{
      const entries=(h.exercises||[]).filter(e=>e.id===ex.id), sets=entries.flatMap(completed);
      let values=sets.map(s=>metric==='oneRM'?oneRM(s.weight,s.reps,ex):num(metric==='weight'?s.weight:s.reps)).filter(v=>Number.isFinite(v)&&v>0);
      const value=metric==='volume'?entries.reduce((n,e)=>n+volume(e,ex),0):values.length?Math.max(...values):0;
      return {date:h.date,max:value};
    }).filter(p=>p.max>0);
  }
  function weeklyActivity(history, today) {
    const date=new Date(today+'T12:00:00Z');date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
    return Array.from({length:8},(_,i)=>{
      const start=new Date(date);start.setUTCDate(start.getUTCDate()-(7-i)*7);
      const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);
      const key=start.toISOString().slice(0,10), limit=end.toISOString().slice(0,10);
      const entries=history.filter(h=>h.date>=key&&h.date<limit&&h.date<=today);
      return {date:key,count:entries.length,minutes:entries.reduce((n,h)=>n+(Number(h.minutes)||0),0)};
    });
  }
  function normalize(raw, defaults, exercises, sessions, equipment) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Ungültiger Datenaufbau');
    if (!Array.isArray(raw.locations) || !Array.isArray(raw.history)) throw Error('Orte oder Verlauf fehlen');
    const text = (v,n=200) => typeof v === 'string' ? v.slice(0,n) : '';
    const id = v => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
    const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v;
    const clamp = (v,min,max,fallback) => Number.isFinite(Number(v)) ? Math.min(max,Math.max(min,Number(v))) : fallback;
    const out = {...defaults};
    out.focus=['balanced','strength','endurance'].includes(raw.focus)?raw.focus:'balanced';
    out.experience=['beginner','regular'].includes(raw.experience)?raw.experience:'regular';
    out.winterPrep=raw.winterPrep!==false;
    out.lastBackupAt=typeof raw.lastBackupAt==='string'&&Number.isFinite(Date.parse(raw.lastBackupAt))?raw.lastBackupAt:'';
    out.name=text(raw.name); out.complaintsText=text(raw.complaintsText,1000); out.onboarded=raw.onboarded===true;
    out.frequency=Math.round(clamp(raw.frequency,2,6,4)); out.sessionMinutes=Math.round(clamp(raw.sessionMinutes,20,75,45));
    out.restDefault=Math.round(clamp(raw.restDefault,0,300,90));
    out.theme=['auto','dark','light'].includes(raw.theme)?raw.theme:'auto';
    out.hideInstallHint=raw.hideInstallHint===true;
    out.locations=raw.locations.filter(l=>l && id(l.id) && Array.isArray(l.equipment)).map(l=>({id:l.id,name:text(l.name)||'Ort',icon:text(l.icon,8)||'📍',equipment:l.equipment.filter(e=>Object.hasOwn(equipment,e)),inv:cleanInv(l.inv)}));
    out.locations=out.locations.filter((l,i,a)=>a.findIndex(x=>x.id===l.id)===i);
    if (!out.locations.length) out.locations=defaults.locations;
    out.activeLocationId=out.locations.some(l=>l.id===raw.activeLocationId)?raw.activeLocationId:out.locations[0].id;
    out.complaints=Object.fromEntries(Object.keys(defaults.complaints).map(k=>[k,raw.complaints?.[k]===true]));
    out.readiness=raw.readiness && ['normal','frisch','muede','angeschlagen'].includes(raw.readiness.level) && date(raw.readiness.date)?raw.readiness:defaults.readiness;
    out.favorites=Array.isArray(raw.favorites)?raw.favorites.filter(k=>Object.hasOwn(exercises,k)):[];
    out.swaps={}; Object.entries(raw.swaps||{}).forEach(([k,v])=>{if(Object.hasOwn(exercises,k)&&Object.hasOwn(exercises,v))out.swaps[k]=v;});
    const cleanSet=s=>({weight:String(s?.weight??'').slice(0,12),reps:String(s?.reps??'').slice(0,12),rpe:String(s?.rpe??'').slice(0,5),done:s?.done===true});
    out.history=raw.history.filter(h=>h&&id(h.id)&&date(h.date)&&Object.hasOwn(sessions,h.type)).map(h=>({
      id:h.id,date:h.date,type:h.type,typeName:sessions[h.type].name,location:text(h.location),minutes:clamp(h.minutes,0,1440,0),
      notes:text(h.notes,2000),conditioning:text(h.conditioning,2000),volume:clamp(h.volume,0,1e9,0),
      exercises:(Array.isArray(h.exercises)?h.exercises:[]).filter(e=>e&&Object.hasOwn(exercises,e.id)).map(e=>({
        id:e.id,name:exercises[e.id].name,sets:clamp(e.sets,0,30,1),targetSets:clamp(e.targetSets,1,30,exercises[e.id].sets),reps:text(e.reps),
        weight:String(e.weight??'').slice(0,12),doneReps:String(e.doneReps??'').slice(0,12),rpe:String(e.rpe??'').slice(0,5),
        ...(Array.isArray(e.setLog)?{setLog:e.setLog.slice(0,30).map(cleanSet)}:{}),pr:e.pr===true
      }))
    })).sort((a,b)=>b.date.localeCompare(a.date));
    const s=raw.currentSession;
    if(s&&Object.hasOwn(sessions,s.type)&&Array.isArray(s.planned)&&s.entries&&Number.isFinite(Date.parse(s.startedAt))){
      out.currentSession={type:s.type,startedAt:s.startedAt,warmup:s.warmup===true,cooldown:s.cooldown===true,condDone:s.condDone===true,notes:text(s.notes,2000),planned:s.planned.filter(k=>Object.hasOwn(exercises,k)),entries:{}};
      out.currentSession.planned.forEach(k=>{const e=s.entries[k]||{}; out.currentSession.entries[k]={...cleanSet(e),exerciseId:Object.hasOwn(exercises,e.exerciseId)?e.exerciseId:null,...(Array.isArray(e.setLog)?{setLog:e.setLog.slice(0,30).map(cleanSet)}:{})};});
    }
    return out;
  }
  root.Training={unit,upper,oneRM,completed,volume,validSet,suggestion,normalize,fillPrevious,series,weeklyActivity};
})(typeof window==='undefined'?globalThis:window);
