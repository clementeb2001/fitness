/* Original schematic movement illustrations, bundled for offline playback. */
(function () {
  'use strict';
  // Joints: head, shoulder, hip, left elbow/hand, right elbow/hand,
  // left knee/foot, right knee/foot. Side and front views are intentionally simple.
  const stand=[[150,42],[150,66],[150,132],[128,96],[126,125],[172,96],[174,125],[132,171],[123,208],[168,171],[177,208]];
  const pose = changes => stand.map((p,i)=>changes[i]||p);
  const squat=pose({0:[168,82],1:[160,106],2:[122,148],3:[190,110],4:[210,100],5:[187,116],6:[211,108],7:[174,162],8:[174,208],9:[143,171],10:[150,208]});
  const hinge=pose({0:[194,105],1:[177,112],2:[119,140],3:[179,144],4:[180,177],5:[189,146],6:[190,179],7:[137,174],8:[139,208],9:[153,174],10:[160,208]});
  const lunge=pose({0:[142,74],1:[142,98],2:[142,152],3:[121,124],4:[121,153],5:[164,124],6:[165,153],7:[97,157],8:[91,208],9:[179,192],10:[217,208]});
  const armsUp=pose({3:[123,36],4:[128,10],5:[177,36],6:[172,10]});
  const floor=[[73,143],[96,150],[166,158],[101,177],[99,208],[117,178],[120,208],[205,179],[237,208],[203,181],[230,208]];
  const floorLow=[[65,177],[89,180],[164,188],[117,202],[99,208],[133,204],[120,208],[206,199],[237,208],[201,199],[230,208]];
  const back=[[67,189],[91,195],[168,197],[104,205],[133,208],[111,201],[141,205],[191,156],[220,208],[178,158],[210,208]];
  const bridge=back.map(p=>p.slice()); bridge[2]=[155,161];bridge[7]=[190,162];bridge[9]=[181,165];
  const dog=[[76,109],[99,121],[171,127],[101,165],[100,208],[116,164],[115,208],[174,200],[214,208],[161,197],[203,208]];
  const dogReach=dog.map(p=>p.slice());dogReach[3]=[68,123];dogReach[4]=[32,123];dogReach[9]=[212,128];dogReach[10]=[253,130];
  const deadBug=back.map(p=>p.slice());deadBug[3]=[103,157];deadBug[4]=[104,119];deadBug[5]=[114,157];deadBug[6]=[116,118];deadBug[7]=[169,152];deadBug[8]=[210,152];deadBug[9]=[181,151];deadBug[10]=[223,151];
  const deadBugReach=deadBug.map(p=>p.slice());deadBugReach[3]=[63,178];deadBugReach[4]=[30,161];deadBugReach[9]=[206,179];deadBugReach[10]=[248,180];
  const row=hinge.map(p=>p.slice());row[3]=[140,120];row[4]=[158,142];row[5]=[152,118];row[6]=[170,142];
  const wall=pose({0:[165,52],1:[160,76],2:[140,138],3:[190,82],4:[230,87],5:[192,92],6:[230,99]});
  const wallLow=pose({0:[208,55],1:[198,78],2:[164,139],3:[217,112],4:[230,87],5:[216,124],6:[230,99]});
  const pressLow=back.map(p=>p.slice());pressLow[3]=[83,208];pressLow[4]=[85,173];pressLow[5]=[119,208];pressLow[6]=[121,173];
  const pressHigh=back.map(p=>p.slice());pressHigh[3]=[92,155];pressHigh[4]=[94,116];pressHigh[5]=[104,155];pressHigh[6]=[105,116];
  const hang=pose({0:[150,59],1:[150,82],2:[150,140],3:[121,48],4:[110,17],5:[180,48],6:[190,17],7:[133,178],8:[127,213],9:[168,178],10:[175,213]});
  const pulled=pose({0:[150,14],1:[150,37],2:[150,105],3:[109,62],4:[110,17],5:[191,62],6:[190,17],7:[133,143],8:[127,179],9:[168,143],10:[175,179]});
  const marchA=pose({7:[117,143],8:[109,178]});
  const marchB=pose({9:[183,143],10:[191,178]});
  const side=[[81,124],[104,143],[163,165],[99,179],[124,208],[115,107],[124,74],[201,187],[244,208],[196,189],[236,208]];
  const plank=floor.map(p=>p.slice());plank[3]=[99,202];plank[4]=[66,208];plank[5]=[116,202];plank[6]=[84,208];
  const sit=pose({0:[97,72],1:[97,96],2:[98,154],3:[123,127],4:[155,139],5:[111,125],6:[146,140],7:[162,154],8:[169,208],9:[150,160],10:[156,208]});
  const step=pose({7:[117,126],8:[101,157],9:[174,170],10:[191,208]});
  const stepTop=stand.map(p=>[p[0]-30,p[1]-48]);
  const curl=pose({3:[127,97],4:[127,62],5:[173,97],6:[173,62]});
  const reach=pose({3:[181,72],4:[213,73],5:[179,83],6:[212,85]});
  const reachBack=pose({3:[126,83],4:[158,73],5:[131,99],6:[163,84]});
  const lateral=pose({0:[120,78],1:[120,101],2:[125,151],7:[83,165],8:[77,208],9:[187,180],10:[228,208]});
  const mirror=p=>p.map(([x,y])=>[300-x,y]);
  const map={};
  function add(ids,frames,props='',weights=false,seconds=5) {ids.split(' ').forEach(id=>map[id]={frames,props,weights,seconds});}
  const bench='<path d="M65 194H171M77 194V213M159 194V213"/>';
  const box='<path d="M77 210V159H135V210"/>';
  const bar='<path d="M95 17H205"/>';
  const band='<path d="M239 65V120M239 84L210 78"/>';
  const rack=pose({3:[126,85],4:[135,65],5:[174,85],6:[165,65]});
  const rackSquat=squat.map(p=>p.slice());rackSquat[3]=[137,124];rackSquat[4]=[147,103];rackSquat[5]=[184,124];rackSquat[6]=[173,103];
  add('back_squat',[rack,rackSquat,rack],'',true);
  add('bw_squat eccentric_squat',[reach,squat,reach],'',false,7);
  add('box_squat',[stand,squat,stand],'<path d="M91 210V157H131V210"/>');
  add('deadlift rdl',[stand,hinge,stand],'',true);
  add('glute_bridge',[back,bridge,back]);
  const hipLow=back.map(p=>p.slice());hipLow[0]=[67,123];hipLow[1]=[91,141];
  const hipHigh=hipLow.map(p=>p.slice());hipHigh[2]=[158,145];hipHigh[7]=[194,151];hipHigh[9]=[185,152];
  add('hip_thrust',[hipLow,hipHigh,hipLow],'<path d="M52 143H108M60 143V213M100 143V213"/><path d="M133 151H174"/>');
  const split=lunge.map(p=>p.slice());split[10]=[216,157];
  const splitHigh=stand.map(p=>p.slice());splitHigh[9]=[182,136];splitHigh[10]=[216,157];
  add('split_squat',[splitHigh,split,splitHigh],'<path d="M196 210V161H238V210"/>',true);
  add('bw_split_squat walking_lunge',[stand,lunge,stand,mirror(lunge),stand]);
  add('step_up step_down',[step,stepTop,step],box);
  add('calf_raise',[stand,stand.map(p=>[p[0],p[1]-9]),stand]);
  add('bench_press',[pressLow,pressHigh,pressLow],bench,true);
  add('floor_press',[pressLow,pressHigh,pressLow],'',true);
  add('ohp',[curl,armsUp,curl],'',true);
  add('pushup',[floor,floorLow,floor]);
  const knee=floor.map(p=>p.slice());knee[7]=[197,208];knee[9]=[188,208];knee[8]=[226,186];knee[10]=[218,188];
  const kneeLow=floorLow.map(p=>p.slice());[7,8,9,10].forEach(i=>kneeLow[i]=knee[i]);
  add('pushup_knee',[knee,kneeLow,knee]);
  const incline=floor.map(p=>p.slice());[0,1,3,4,5,6].forEach(i=>incline[i]=[incline[i][0],incline[i][1]-48]);
  const inclineLow=floorLow.map(p=>p.slice());[0,1,3,4,5,6].forEach(i=>inclineLow[i]=[inclineLow[i][0],inclineLow[i][1]-48]);
  add('incline_pushup',[incline,inclineLow,incline],box);
  add('wall_pushup',[wall,wallLow,wall],'<path d="M231 30V211"/>');
  add('pullup',[hang,pulled,hang],bar);
  const inv=[[88,128],[107,141],[158,164],[105,108],[106,77],[119,112],[120,77],[202,185],[242,208],[199,188],[234,208]];
  const invUp=inv.map(p=>p.slice());invUp[0]=[95,76];invUp[1]=[115,90];invUp[2]=[167,136];invUp[3]=[84,105];invUp[5]=[101,118];
  add('inverted_row',[inv,invUp,inv],'<path d="M65 77H157M69 77V211M154 77V211"/>');
  add('db_row',[hinge,row,hinge],'',true);
  add('band_row',[reach,reachBack,reach],band);
  add('face_pull',[reach,pose({3:[119,58],4:[140,42],5:[184,58],6:[165,42]}),reach],band);
  add('band_pullapart',[reach,pose({3:[109,71],4:[74,75],5:[191,71],6:[226,75]}),reach],'<path d="M73 76H227"/>');
  add('scap_squeeze',[stand,pose({1:[150,63],3:[117,95],4:[120,129],5:[183,95],6:[180,129]}),stand]);
  add('curl',[stand,curl,stand],'',true);
  add('iso_curl',[pose({3:[125,100],4:[151,100],5:[172,91],6:[150,95]})]);
  add('farmers_carry suitcase_carry',[marchA,marchB,marchA],'',true);
  add('ruck_carry',[marchA,marchB,marchA],'<path d="M135 78Q112 74 116 117L140 122Z"/>');
  add('kb_swing',[hinge,reach,hinge],'',true,3);
  add('thruster',[squat,curl,armsUp,curl,squat],'',true);
  add('burpee',[stand,squat,floor,squat,armsUp,stand],'',false,7);
  add('squat_thrust',[stand,squat,floor,squat,stand],'',false,7);
  const climber=floor.map(p=>p.slice());climber[7]=[127,185];climber[8]=[169,208];
  add('mountain_climber',[floor,climber,floor],'',false,2);
  add('jump_rope',[stand,stand.map(p=>[p[0],p[1]-15]),stand],'<path d="M123 119Q35 213 150 217Q265 213 177 119"/>',false,1.5);
  add('jumping_jack',[stand,pose({3:[115,45],4:[132,15],5:[185,45],6:[168,15],7:[115,169],8:[89,208],9:[185,169],10:[211,208]}),stand],'',false,2);
  add('fast_march',[marchA,marchB,marchA],'',false,2);
  add('box_jump',[squat,stepTop,step,stand],box,false,5);
  add('plank',[plank]);
  add('dead_bug',[deadBug,deadBugReach,deadBug]);
  add('bird_dog',[dog,dogReach,dog]);
  add('side_plank',[side]);
  const sideKnee=side.map(p=>p.slice());sideKnee[7]=[195,208];sideKnee[8]=[226,205];
  add('side_plank_knee',[sideKnee]);
  add('pallof',[reachBack,reach,reachBack],band);
  const hollow=back.map(p=>p.slice());hollow[0]=[66,174];hollow[1]=[92,185];hollow[3]=[61,163];hollow[4]=[28,145];hollow[5]=[68,171];hollow[6]=[35,151];hollow[7]=[205,175];hollow[8]=[242,161];hollow[9]=[203,179];hollow[10]=[239,165];
  add('hollow_hold',[hollow]);
  add('hanging_knee_raise',[hang,pose({0:hang[0],1:hang[1],2:hang[2],3:hang[3],4:hang[4],5:hang[5],6:hang[6],7:[107,140],8:[109,177],9:[117,146],10:[120,182]}),hang],bar);
  const legs=back.map(p=>p.slice());legs[7]=[204,201];legs[8]=[247,202];legs[9]=[201,205];legs[10]=[244,207];
  const legsUp=legs.map(p=>p.slice());legsUp[7]=[167,152];legsUp[8]=[165,104];legsUp[9]=[176,152];legsUp[10]=[174,104];
  add('lying_leg_raise',[legs,legsUp,legs]);
  add('skater_jump',[marchA.map(p=>[p[0]-35,p[1]]),marchB.map(p=>[p[0]+35,p[1]]),marchA.map(p=>[p[0]-35,p[1]])],'',false,3);
  add('lateral_stepout',[stand,lateral,stand,mirror(lateral),stand]);
  add('lateral_band_walk',[squat,squat.map(p=>[p[0]+30,p[1]]),squat],'<path d="M141 172L175 165"/>');
  add('single_leg_balance',[marchA]);
  add('wall_sit',[sit],'<path d="M86 31V211"/>');
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function html(ex) {
    return '<section class="movement" data-preview="'+ex.id+'" aria-label="Bewegungsvorschau '+esc(ex.name)+'"><div class="row-between"><span class="eyebrow">Bewegung verstehen</span><span class="pill pill--steel">Offline verfügbar</span></div><svg viewBox="0 0 300 235" role="img" aria-label="Schematische Bewegung: '+esc(ex.name)+'"><path d="M25 214H275" stroke="currentColor" opacity=".15"/><g class="movement-props" fill="none" stroke="currentColor" stroke-width="5">'+map[ex.id].props+'</g><g class="movement-person"></g></svg><div class="preview-controls"><button class="btn btn--soft btn--sm" data-preview-action="play">▶ Abspielen</button><button class="btn btn--muted btn--sm" data-preview-action="step">Schritt weiter</button><select aria-label="Vorschaugeschwindigkeit" data-preview-speed><option value="1">Normales Tempo</option><option value="0.5">Langsam</option></select></div><p class="small muted">Schematische '+(map[ex.id].frames.length===1?'Halteposition':'Bewegungsfolge')+' · '+esc(ex.name)+'. Geräte und Körperproportionen vereinfacht; beachte die Anleitung darunter.</p></section>';
  }
  let raf;
  function mount() {
    cancelAnimationFrame(raf);
    raf=null;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const players=[...document.querySelectorAll('[data-preview]')].map(el=>({el,def:map[el.dataset.preview],t:0,playing:false,speed:1}));
    function draw(p) {
      const frames=p.def.frames, f=(p.t%1)*(frames.length-1), i=Math.floor(f), mix=(1-Math.cos((f-i)*Math.PI))/2;
      const points=frames[i].map((v,k)=>v.map((n,j)=>n+(frames[Math.min(i+1,frames.length-1)][k][j]-n)*mix));
      const path=ids=>ids.map((id,k)=>(k?'L':'M')+points[id].join(',')).join(' ');
      p.el.querySelector('.movement-person').innerHTML='<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="10"><path stroke="var(--steel)" opacity=".6" d="'+path([1,5,6])+' '+path([2,9,10])+'"/><path stroke="var(--orange)" d="'+path([1,2])+' '+path([1,3,4])+' '+path([2,7,8])+'"/></g><circle cx="'+points[0][0]+'" cy="'+points[0][1]+'" r="13" fill="var(--text)"/>'+ (p.def.weights?[4,6].filter(i=>p.el.dataset.preview!=='suitcase_carry'||i===4).map(i=>'<rect x="'+(points[i][0]-13)+'" y="'+(points[i][1]-5)+'" width="26" height="10" rx="3" fill="var(--text)"/>').join(''):'');
    }
    players.forEach(p=>{
      draw(p);
      p.el.addEventListener('click',e=>{const b=e.target.closest('[data-preview-action]');if(!b)return;
        if(b.dataset.previewAction==='step'){p.playing=false;p.t=(p.t+1/Math.max(1,p.def.frames.length-1))%1;draw(p);}
        else p.playing=!p.playing;
        p.el.querySelector('[data-preview-action="play"]').textContent=p.playing?'Ⅱ Pause':'▶ Abspielen';
        if(p.playing)schedule();
      });
      p.el.closest('.session-preview')?.addEventListener('toggle',e=>{
        if(!e.target.open){p.playing=false;p.el.querySelector('[data-preview-action="play"]').textContent='▶ Abspielen';}
      });
      p.el.querySelector('[data-preview-speed]').onchange=e=>p.speed=Number(e.target.value);
      if(reduced)p.el.querySelector('[data-preview-action="play"]').setAttribute('aria-label','Animation bewusst abspielen (reduzierte Bewegung aktiv)');
    });
    if(!players.length)return;
    let last=performance.now();
    function schedule(){if(raf===null){last=performance.now();raf=requestAnimationFrame(tick);}}
    function tick(now){raf=null;const dt=Math.min(now-last,100);last=now;players.forEach(p=>{if(p.playing&&!document.hidden&&p.el.isConnected){p.t+=dt/1000/p.def.seconds*p.speed;draw(p);}});if(players.some(p=>p.playing&&p.el.isConnected))raf=requestAnimationFrame(tick);}
  }
  window.ExercisePreview={html,mount,ids:Object.keys(map)};
})();
