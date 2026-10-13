/* =========================================================================
   EinsatzFit — Trainings-App für Einsatzkräfte (Polizei / Feuerwehr / Ski)
   Vanilla JS, Hash-Routing, State in einem localStorage-Key. Zero Dependencies.
   Kernideen:
   - ORTE mit eigenem Material (Wache / Zuhause / Unterwegs ...) – vor jeder
     Einheit wählbar; der Plan passt sich dem Material des Ortes an.
   - Tägliche BESCHWERDEN -> automatische sichere Ersatz-Übungen (Kaskade).
   - Voll einstellbar: Einheiten/Woche UND Dauer pro Einheit (Plan skaliert).
   - Schwerpunkt Polizei/Feuerwehr, Ski als leichter Winter-Zusatz.
   ========================================================================= */
(function () {
  'use strict';

  const KEY = 'einsatzfit-state-v1';

  /* ----------------------------------------------------------------------
     Kataloge
     ---------------------------------------------------------------------- */
  const EQUIP = {
    kurzhanteln:    { label: 'Kurzhanteln',     icon: '🏋️' },
    langhantel:     { label: 'Langhantel',      icon: '🏋️' },
    kettlebell:     { label: 'Kettlebell',      icon: '🔔' },
    band:           { label: 'Widerstandsband', icon: '🎗️' },
    klimmzugstange: { label: 'Klimmzugstange',  icon: '🙆' },
    gewichtsweste:  { label: 'Gewichtsweste',   icon: '🦺' },
    box:            { label: 'Erhöhung / Bank', icon: '🪑' },
    matte:          { label: 'Matte',           icon: '🟦' },
    cardio:         { label: 'Cardiogerät',     icon: '🚣' },
    rucksack:       { label: 'Rucksack / Last', icon: '🎒' },
    springseil:     { label: 'Springseil',      icon: '➰' }
  };

  const COMPLAINTS = {
    ruecken:     { label: 'Rücken',      icon: '🔙' },
    schulter:    { label: 'Schulter',    icon: '💪' },
    knie:        { label: 'Knie',        icon: '🦵' },
    handgelenk:  { label: 'Handgelenk',  icon: '✋' },
    ellenbogen:  { label: 'Ellenbogen',  icon: '💪' },
    sprunggelenk:{ label: 'Sprunggelenk',icon: '🦶' },
    nacken:      { label: 'Nacken',      icon: '🧣' }
  };

  const WINTER_MONTHS = [9, 10, 11, 0, 1, 2]; // Okt–Mär (0-basiert)

  // Beanspruchte Muskelgruppen je Übung (für das Muskel-Diagramm)
  const MUSCLE_LABELS = {
    chest:'Brust', shoulders:'Schultern', biceps:'Bizeps', triceps:'Trizeps', forearms:'Unterarme',
    abs:'Bauch', obliques:'seitl. Bauch', quads:'Oberschenkel', hamstrings:'Beinrückseite',
    glutes:'Gesäß', calves:'Waden', lats:'Latissimus', traps:'Trapez', lowerback:'unterer Rücken'
  };
  const MUS = {
    back_squat:['quads','glutes','lowerback','abs'], bw_squat:['quads','glutes'], box_squat:['quads','glutes'],
    deadlift:['hamstrings','glutes','lowerback','traps','forearms'], rdl:['hamstrings','glutes','lowerback'],
    hip_thrust:['glutes','hamstrings'], glute_bridge:['glutes'], split_squat:['quads','glutes'],
    bw_split_squat:['quads','glutes'], step_up:['quads','glutes'], walking_lunge:['quads','glutes'], calf_raise:['calves'],
    bench_press:['chest','shoulders','triceps'], floor_press:['chest','triceps'], ohp:['shoulders','triceps'],
    pushup:['chest','shoulders','triceps','abs'], pushup_knee:['chest','triceps'], incline_pushup:['chest','shoulders'],
    wall_pushup:['chest','shoulders'], pullup:['lats','biceps','forearms'], inverted_row:['lats','biceps','traps'],
    db_row:['lats','traps','biceps'], band_row:['lats','traps'], face_pull:['shoulders','traps'],
    band_pullapart:['shoulders','traps'], scap_squeeze:['traps'], curl:['biceps','forearms'], iso_curl:['biceps'],
    farmers_carry:['forearms','traps','abs'], suitcase_carry:['obliques','forearms'], ruck_carry:['lowerback','quads','calves'],
    kb_swing:['glutes','hamstrings','lowerback'], thruster:['quads','shoulders','glutes'], burpee:['chest','quads','abs'],
    squat_thrust:['quads','abs'], mountain_climber:['abs','shoulders'], jump_rope:['calves'], jumping_jack:['shoulders','calves'],
    fast_march:['quads','calves'], box_jump:['quads','glutes','calves'],
    plank:['abs','shoulders'], dead_bug:['abs'], bird_dog:['lowerback','glutes'], side_plank:['obliques','shoulders'],
    side_plank_knee:['obliques'], pallof:['obliques','abs'], hollow_hold:['abs'], hanging_knee_raise:['abs','forearms'],
    lying_leg_raise:['abs'], eccentric_squat:['quads'], skater_jump:['quads','glutes','calves'],
    lateral_stepout:['quads','glutes'], lateral_band_walk:['glutes'], step_down:['quads','glutes'],
    single_leg_balance:['calves','glutes'], wall_sit:['quads']
  };

  // Schematische Muskel-Shapes (ellipse/rect) für Front- und Rückenfigur.
  const BODY_FRONT = [
    ['head','e',30,11,8,8], ['neck','r',27,17,6,5],
    ['shoulders','e',15,27,7,5],['shoulders','e',45,27,7,5],
    ['chest','e',23,39,8,6],['chest','e',37,39,8,6],
    ['biceps','e',12,49,4,9],['biceps','e',48,49,4,9],
    ['forearms','e',9,67,3.6,9],['forearms','e',51,67,3.6,9],
    ['abs','r',24,47,12,22],
    ['obliques','e',19,58,3,8],['obliques','e',41,58,3,8],
    ['quads','e',23,93,6.5,17],['quads','e',37,93,6.5,17],
    ['calves','e',23,126,5,13],['calves','e',37,126,5,13]
  ];
  const BODY_BACK = [
    ['head','e',30,11,8,8], ['neck','r',27,17,6,5],
    ['traps','e',30,26,12,5],
    ['lats','e',22,45,7,11],['lats','e',38,45,7,11],
    ['triceps','e',12,49,4,9],['triceps','e',48,49,4,9],
    ['forearms','e',9,67,3.6,9],['forearms','e',51,67,3.6,9],
    ['lowerback','r',25,56,10,12],
    ['glutes','e',24,76,7,7],['glutes','e',36,76,7,7],
    ['hamstrings','e',23,97,6.5,15],['hamstrings','e',37,97,6.5,15],
    ['calves','e',23,126,5,13],['calves','e',37,126,5,13]
  ];
  function figureSVG(shapes, hi, label) {
    var body = shapes.map(function (s) {
      var g = s[0], t = s[1];
      var neutral = (g === 'head' || g === 'neck');
      var on = !neutral && hi.indexOf(g) !== -1;
      var fill = neutral ? 'var(--faint)' : (on ? 'var(--orange)' : 'var(--muscle-base)');
      var op = neutral ? '0.5' : (on ? '1' : '0.65');
      if (t === 'e') return '<ellipse cx="'+s[2]+'" cy="'+s[3]+'" rx="'+s[4]+'" ry="'+s[5]+'" style="fill:'+fill+'" opacity="'+op+'"/>';
      return '<rect x="'+s[2]+'" y="'+s[3]+'" width="'+s[4]+'" height="'+s[5]+'" rx="3" style="fill:'+fill+'" opacity="'+op+'"/>';
    }).join('');
    return '<figure class="bodyfig"><svg viewBox="0 0 60 145" width="100%" height="100%" aria-hidden="true">'+body+'</svg>'+
      '<figcaption>'+label+'</figcaption></figure>';
  }
  function bodyDiagram(exId) {
    var hi = MUS[exId] || [];
    return '<div class="bodymap">'+figureSVG(BODY_FRONT, hi, 'Vorne')+figureSVG(BODY_BACK, hi, 'Hinten')+'</div>';
  }

  /* ----------------------------------------------------------------------
     Übungsdatenbank
     equipment: "mindestens eines davon nötig" ([] = nur Körpergewicht).
     loads: belastete Regionen. alternatives: sichere Ausweichkette.
     min: geschätzte Minuten (für Dauer-Skalierung).
     ---------------------------------------------------------------------- */
  const EX = {
    /* ---- Unterkörper / Hinge ---- */
    back_squat: { id:'back_squat', name:'Kniebeuge (mit Gewicht)', emoji:'🏋️',
      target:'Oberschenkel, Gesäß, Rumpf', equipment:['langhantel','kurzhanteln','kettlebell','gewichtsweste'], loads:['knie'],
      sets:4, reps:'6–10', min:8, alternatives:['bw_squat'],
      steps:['Gewicht stabil am Körper/Schulter positionieren.','Schulterbreiter Stand, Rumpf fest, Blick nach vorn.','Hüfte nach hinten/unten, Knie Richtung Zehen, Rücken gerade.','Durch die Fersen nach oben drücken.'],
      coach:'Tiefe nur so weit, wie die Technik sauber bleibt. Sauber vor schwer.' },
    bw_squat: { id:'bw_squat', name:'Kniebeuge Eigengewicht', emoji:'🦵',
      target:'Oberschenkel, Gesäß', equipment:[], loads:['knie'], sets:3, reps:'15–20', min:5, alternatives:['box_squat'],
      steps:['Schulterbreiter Stand, Arme zur Balance nach vorn.','Hüfte nach hinten, kontrolliert absenken.','So tief wie schmerzfrei möglich.','Nach oben drücken, Gesäß anspannen.'] },
    box_squat: { id:'box_squat', name:'Kniebeuge zum Kasten', emoji:'🪑',
      target:'Oberschenkel, Gesäß (gelenkschonend)', equipment:[], loads:[], sets:3, reps:'12', min:5, alternatives:[],
      steps:['Vor eine stabile Erhöhung/Stuhl stellen.','Kontrolliert zum Kasten absenken, kurz antippen.','Ohne Schwung wieder aufstehen.','Kleiner, schmerzfreier Bewegungsradius.'] },
    deadlift: { id:'deadlift', name:'Kreuzheben', emoji:'🏋️',
      target:'Rückseite, Gesäß, unterer Rücken', equipment:['langhantel','kurzhanteln','kettlebell'], loads:['ruecken'], sets:4, reps:'5–8', min:8, alternatives:['hip_thrust','glute_bridge'],
      steps:['Gewicht dicht am Körper, Füße hüftbreit.','Brust raus, Rücken gerade, Lat-Spannung.','Hüfte und Knie strecken, Gewicht nah am Bein führen.','Kontrolliert ablassen, Rücken bleibt neutral.'],
      coach:'Neutraler Rücken ist Pflicht. Bei Rückenthema automatisch Hip Thrust.' },
    rdl: { id:'rdl', name:'Rumänisches Kreuzheben', emoji:'🏋️',
      target:'Beinrückseite, Gesäß', equipment:['langhantel','kurzhanteln','kettlebell'], loads:['ruecken'], sets:3, reps:'8–12', min:7, alternatives:['hip_thrust','glute_bridge'],
      steps:['Gewicht vor den Oberschenkeln, leichte Kniebeugung.','Hüfte nach hinten schieben, Rücken gerade.','Gewicht nah am Bein absenken bis Zug hinten.','Hüfte nach vorn strecken, aufrichten.'] },
    hip_thrust: { id:'hip_thrust', name:'Hip Thrust', emoji:'🍑',
      target:'Gesäß, Beinrückseite', equipment:['langhantel','kurzhanteln','kettlebell'], loads:[], sets:3, reps:'10–12', min:6, alternatives:['glute_bridge'],
      steps:['Oberer Rücken an Bank/Couch, Gewicht gepolstert auf der Hüfte.','Füße aufgestellt, hüftbreit.','Hüfte nach oben bis Körper gerade, Gesäß fest.','Kontrolliert ablassen.'] },
    glute_bridge: { id:'glute_bridge', name:'Beckenheben', emoji:'🍑',
      target:'Gesäß, Rumpf (rückenschonend)', equipment:[], loads:[], sets:3, reps:'15', min:4, alternatives:[],
      steps:['Rücklings, Knie angewinkelt, Füße aufgestellt.','Bauch leicht anspannen.','Hüfte nach oben drücken, oben halten.','Langsam ablassen.'] },
    split_squat: { id:'split_squat', name:'Bulgarian Split Squat', emoji:'🦵',
      target:'Beine einseitig, Balance', equipment:['kurzhanteln','kettlebell','gewichtsweste'], loads:['knie'], sets:3, reps:'8–10 / Seite', min:7, alternatives:['bw_split_squat','step_up'],
      steps:['Hinteren Fuß erhöht ablegen, Gewicht seitlich halten.','Aufrechter Oberkörper.','Vorderes Bein kontrolliert beugen.','Durch die Ferse nach oben drücken.'] },
    bw_split_squat: { id:'bw_split_squat', name:'Ausfallschritt Eigengewicht', emoji:'🦵',
      target:'Beine einseitig, Balance', equipment:[], loads:['knie'], sets:3, reps:'10 / Seite', min:5, alternatives:['box_squat'],
      steps:['Aufrechter Stand, Hände in die Hüfte.','Schritt nach vorn, kontrolliert absenken.','Vorderes Knie über dem Fuß.','Zurück in den Stand, Seite wechseln.'] },
    step_up: { id:'step_up', name:'Step-Ups (mit Last optional)', emoji:'🪜',
      target:'Beine, Kondition, Einsatz-Spezifik', equipment:['box'], loads:['knie'], sets:3, reps:'10 / Seite', min:6, alternatives:['bw_split_squat','box_squat'],
      steps:['Auf stabile Erhöhung/Treppe steigen.','Ganzen Fuß aufsetzen, über die Ferse hochdrücken.','Oben kurz Balance, kontrolliert absteigen.','Last als Rucksack/Weste möglich (Treppen-Spezifik Feuerwehr).'],
      coach:'Treppen mit Last = Feuerwehr-Realität. Kontrolliert absteigen schont die Knie.' },
    walking_lunge: { id:'walking_lunge', name:'Gehende Ausfallschritte', emoji:'🚶',
      target:'Beine, Gesäß, Stabilität', equipment:[], loads:['knie'], sets:3, reps:'10 / Seite', min:5, alternatives:['box_squat'],
      steps:['Aufrecht, optional Gewicht seitlich.','Schritt nach vorn, hinteres Knie Richtung Boden.','Vorderes Knie stabil über dem Fuß.','Abdrücken in den nächsten Schritt.'] },
    calf_raise: { id:'calf_raise', name:'Wadenheben', emoji:'🦶',
      target:'Waden, Sprunggelenk', equipment:[], loads:[], sets:3, reps:'15–20', min:4, alternatives:[],
      steps:['Aufrecht, ggf. an Wand abstützen.','Langsam auf die Fußballen.','Oben kurz halten.','Kontrolliert ablassen.'] },

    /* ---- Oberkörper Druck ---- */
    bench_press: { id:'bench_press', name:'Bankdrücken', emoji:'💪',
      target:'Brust, Schulter, Trizeps', equipment:['langhantel','kurzhanteln'], loads:['schulter'], sets:4, reps:'6–10', min:8, alternatives:['floor_press','pushup'],
      steps:['Auf Bank/Boden, Gewicht über der Brust.','Schulterblätter zusammen, Spannung.','Kontrolliert zur Brust senken.','Kraftvoll nach oben drücken.'] },
    floor_press: { id:'floor_press', name:'Floor Press', emoji:'💪',
      target:'Brust, Trizeps (schulterschonend)', equipment:['kurzhanteln','kettlebell'], loads:['schulter'], sets:3, reps:'8–12', min:6, alternatives:['pushup','pushup_knee'],
      steps:['Rücklings, Knie angewinkelt, Gewicht über Brust.','Ellenbogen bis zum Boden senken (natürlicher Stopp).','Kurz halten.','Nach oben drücken.'] },
    ohp: { id:'ohp', name:'Überkopfdrücken', emoji:'🙌',
      target:'Schulter, Trizeps, Rumpf', equipment:['langhantel','kurzhanteln','kettlebell'], loads:['schulter'], sets:3, reps:'6–10', min:7, alternatives:['floor_press','pushup_knee'],
      steps:['Gewicht auf Schulterhöhe, Rumpf fest.','Gerade nach oben drücken, Kopf leicht durch.','Oben kurz stabilisieren.','Kontrolliert zurück.'],
      coach:'Bei Schulterthema automatisch auf schonendes Drücken umgestellt.' },
    pushup: { id:'pushup', name:'Liegestütz', emoji:'💪',
      target:'Brust, Schulter, Rumpf', equipment:[], loads:['schulter','handgelenk'], sets:3, reps:'10–20', min:5, alternatives:['pushup_knee','incline_pushup','wall_pushup'],
      steps:['Hände etwas breiter als schulterbreit, Körper in Linie.','Rumpf fest.','Kontrolliert absenken, Ellenbogen leicht nach hinten.','Nach oben drücken.'] },
    pushup_knee: { id:'pushup_knee', name:'Liegestütz auf Knien', emoji:'💪',
      target:'Brust, Trizeps', equipment:[], loads:['schulter','handgelenk'], sets:3, reps:'10–15', min:4, alternatives:['incline_pushup','wall_pushup'],
      steps:['Knie am Boden, Hände unter den Schultern.','Körper von Kopf bis Knie gerade.','Kontrolliert absenken.','Nach oben drücken.'] },
    incline_pushup: { id:'incline_pushup', name:'Liegestütz erhöht', emoji:'💪',
      target:'Brust (leichter)', equipment:['box'], loads:['schulter','handgelenk'], sets:3, reps:'12', min:4, alternatives:['wall_pushup'],
      steps:['Hände auf stabile Erhöhung.','Körper gerade.','Kontrolliert zur Kante senken.','Wegdrücken.'] },
    wall_pushup: { id:'wall_pushup', name:'Wand-Liegestütz', emoji:'🧱',
      target:'Brust, Schulter (sehr schonend)', equipment:[], loads:[], sets:3, reps:'15', min:4, alternatives:[],
      steps:['Armlänge vor der Wand, Hände auf Brusthöhe.','Körper gerade, Rumpf fest.','Zur Wand beugen.','Wegdrücken.'] },

    /* ---- Oberkörper Zug ---- */
    pullup: { id:'pullup', name:'Klimmzüge', emoji:'🙆',
      target:'Rücken, Bizeps, Grip', equipment:['klimmzugstange'], loads:['schulter','ellenbogen'], sets:4, reps:'max / 5–8', min:7, alternatives:['inverted_row','db_row','band_row'],
      steps:['Stange etwas breiter als schulterbreit greifen.','Schulterblätter aktiv nach unten.','Brust zur Stange ziehen.','Kontrolliert ablassen, volle Streckung.'],
      coach:'Einsatzrelevant (Überwinden, Ziehen). Negativ-Wdh. wenn noch kein voller Klimmzug.' },
    inverted_row: { id:'inverted_row', name:'Australian Rows', emoji:'🙋',
      target:'Rücken, hintere Schulter', equipment:['klimmzugstange'], loads:[], sets:3, reps:'10–12', min:6, alternatives:['db_row','band_row'],
      steps:['Unter niedrige Stange legen, Fersen am Boden.','Körper gerade, Griff schulterbreit.','Brust zur Stange ziehen.','Kontrolliert ablassen.'] },
    db_row: { id:'db_row', name:'Kurzhantel-Rudern', emoji:'💪',
      target:'Oberer Rücken, hintere Schulter', equipment:['kurzhanteln','kettlebell'], loads:[], sets:3, reps:'10–12', min:6, alternatives:['band_row','bird_dog'],
      steps:['Eine Hand auf Bank/Knie abstützen, Rücken gerade.','Gewicht hängen lassen.','Ellenbogen eng nach hinten ziehen.','Schulterblatt zusammen, langsam ablassen.'] },
    band_row: { id:'band_row', name:'Rudern mit Band', emoji:'🎗️',
      target:'Oberer Rücken', equipment:['band'], loads:[], sets:3, reps:'15', min:5, alternatives:['bird_dog'],
      steps:['Band um festen Punkt auf Brusthöhe.','Arme gestreckt, leichte Vorspannung.','Ellenbogen nach hinten, Schulterblätter zusammen.','Langsam zurückführen.'] },
    face_pull: { id:'face_pull', name:'Face Pull', emoji:'🎗️',
      target:'Hintere Schulter, Haltung', equipment:['band'], loads:[], sets:3, reps:'15', min:4, alternatives:['band_pullapart','scap_squeeze'],
      steps:['Band auf Kopfhöhe befestigen.','Zu den Schläfen ziehen, Ellenbogen hoch.','Schulterblätter zusammen.','Langsam zurück.'] },
    band_pullapart: { id:'band_pullapart', name:'Band auseinanderziehen', emoji:'🎗️',
      target:'Obere Rücken-/Schultermuskulatur', equipment:['band'], loads:[], sets:3, reps:'15', min:4, alternatives:['scap_squeeze'],
      steps:['Band auf Brusthöhe mit beiden Händen.','Arme öffnen, Band zur Brust.','Schulterblätter zusammenziehen.','Langsam zurück.'] },
    scap_squeeze: { id:'scap_squeeze', name:'Schulterblätter zusammenziehen', emoji:'🧍',
      target:'Haltung (ohne Material)', equipment:[], loads:[], sets:3, reps:'15', min:3, alternatives:[],
      steps:['Aufrecht, Arme locker.','Schulterblätter nach hinten/unten.','Kurz halten.','Lösen.'] },
    curl: { id:'curl', name:'Bizeps-Curl', emoji:'💪',
      target:'Bizeps', equipment:['kurzhanteln','kettlebell','band'], loads:['handgelenk','ellenbogen'], sets:3, reps:'10–12', min:4, alternatives:['iso_curl'],
      steps:['Gewicht seitlich, Ellenbogen am Körper.','Nach oben curlen.','Oben anspannen.','Langsam ablassen.'] },
    iso_curl: { id:'iso_curl', name:'Isometrischer Bizeps-Halt', emoji:'💪',
      target:'Bizeps (schonend)', equipment:[], loads:[], sets:3, reps:'20–30 Sek', min:3, alternatives:[],
      steps:['Unterarm 90°, Handfläche nach oben.','Mit anderer Hand dagegen drücken.','Spannung halten.','Lösen, Seite wechseln.'] },

    /* ---- Tragen / Grip (Einsatz-spezifisch) ---- */
    farmers_carry: { id:'farmers_carry', name:'Farmer’s Carry', emoji:'🧳',
      target:'Grip, Rumpf, Haltung, Ganzkörper', equipment:['kurzhanteln','kettlebell','langhantel'], loads:[], sets:3, reps:'30–40 m', min:5, alternatives:['suitcase_carry','ruck_carry','bird_dog'],
      steps:['Je ein schweres Gewicht seitlich.','Schultern zurück, Bauch fest.','Kontrolliert gehen, ruhig atmen.','Griff bewusst fest.'],
      coach:'Tragen unter Last = Kerneinsatz (Person/Gerät tragen). Grip nicht vernachlässigen.' },
    suitcase_carry: { id:'suitcase_carry', name:'Koffertragen (einseitig)', emoji:'🧳',
      target:'Seitliche Rumpfmuskulatur, Grip', equipment:['kurzhanteln','kettlebell'], loads:[], sets:3, reps:'25 m / Seite', min:5, alternatives:['bird_dog'],
      steps:['Ein Gewicht einseitig halten.','Aufrecht bleiben, nicht zur Seite kippen.','Kontrolliert gehen.','Seite wechseln.'] },
    ruck_carry: { id:'ruck_carry', name:'Rucksack-Marsch', emoji:'🎒',
      target:'Ganzkörper-Ausdauer, Rücken, Beine', equipment:['rucksack'], loads:[], sets:1, reps:'10–20 Min', min:12, alternatives:['bird_dog'],
      steps:['Rucksack mit Last gut sitzend schnüren.','Zügiges, gleichmäßiges Gehtempo.','Aufrechte Haltung, Rumpf aktiv.','Gelände/Treppen einbauen (einsatznah).'] },

    /* ---- Work Capacity / Kondition ---- */
    kb_swing: { id:'kb_swing', name:'Kettlebell Swing', emoji:'🔔',
      target:'Hüftkraft, Kondition, Rücken', equipment:['kettlebell','kurzhanteln'], loads:['ruecken'], sets:4, reps:'15–20', min:5, alternatives:['hip_thrust','glute_bridge'],
      steps:['Gewicht hängt zwischen den Beinen.','Explosiv Hüfte strecken, Gewicht schwingt hoch.','Rücken neutral, Kraft aus der Hüfte.','Kontrolliert zurückpendeln.'],
      coach:'Explosiv aus der Hüfte – nicht mit dem Rücken heben. Bei Rückenthema -> Hip Thrust.' },
    thruster: { id:'thruster', name:'Thruster (Hocke + Druck)', emoji:'🔥',
      target:'Ganzkörper, Kondition', equipment:['kurzhanteln','kettlebell','langhantel'], loads:['knie','schulter'], sets:3, reps:'10–12', min:5, alternatives:['bw_squat','pushup_knee'],
      steps:['Gewicht auf Schulterhöhe.','In die Kniebeuge.','Explosiv aufstehen und über Kopf drücken.','Zurück zur Schulter.'] },
    burpee: { id:'burpee', name:'Burpees', emoji:'🔥',
      target:'Ganzkörper-Kondition', equipment:[], loads:['knie','handgelenk','schulter'], sets:4, reps:'10–15', min:5, alternatives:['squat_thrust','fast_march'],
      steps:['Aus dem Stand in die Hocke, Hände auf.','Beine nach hinten (Liegestützposition).','Zurück in die Hocke.','Explosiv hoch (optional Strecksprung).'] },
    squat_thrust: { id:'squat_thrust', name:'Squat-Thrust (ohne Sprung)', emoji:'⚡',
      target:'Kondition (gelenkschonend)', equipment:[], loads:[], sets:3, reps:'12–15', min:4, alternatives:['fast_march'],
      steps:['In die Hocke, Hände auf.','Beine kontrolliert nach hinten.','Zurück in die Hocke.','Aufstehen – ohne Sprung.'] },
    mountain_climber: { id:'mountain_climber', name:'Bergsteiger', emoji:'⛰️',
      target:'Rumpf, Kondition', equipment:[], loads:['handgelenk','schulter'], sets:3, reps:'30–40 Sek', min:4, alternatives:['fast_march'],
      steps:['Liegestützposition, Rumpf fest.','Knie abwechselnd zur Brust ziehen.','Tempo kontrolliert steigern.','Hüfte stabil.'] },
    jump_rope: { id:'jump_rope', name:'Seilspringen', emoji:'➰',
      target:'Kondition, Koordination', equipment:['springseil'], loads:['sprunggelenk','knie'], sets:4, reps:'45–60 Sek', min:5, alternatives:['jumping_jack','fast_march'],
      steps:['Aufrecht, Ellenbogen am Körper.','Aus den Handgelenken drehen.','Leicht auf den Fußballen springen.','Gleichmäßiger Rhythmus.'] },
    jumping_jack: { id:'jumping_jack', name:'Hampelmänner', emoji:'🤸',
      target:'Kondition (ohne Gerät)', equipment:[], loads:['sprunggelenk'], sets:3, reps:'30–40', min:4, alternatives:['fast_march'],
      steps:['Aus dem Stand Arme und Beine öffnen.','Rhythmisch springen.','Gleichmäßig atmen.','Tempo nach Gefühl.'] },
    fast_march: { id:'fast_march', name:'Marschieren auf der Stelle', emoji:'🚶',
      target:'Kondition (gelenkschonend)', equipment:[], loads:[], sets:3, reps:'45 Sek', min:4, alternatives:[],
      steps:['Zügig auf der Stelle marschieren.','Knie aktiv anheben.','Arme mitschwingen.','Gleichmäßiges Tempo.'] },
    box_jump: { id:'box_jump', name:'Box Jumps', emoji:'📦',
      target:'Explosivkraft Beine', equipment:['box'], loads:['knie','sprunggelenk'], sets:3, reps:'8–10', min:5, alternatives:['step_up','bw_squat'],
      steps:['Vor stabile Box/Erhöhung.','Explosiv abspringen, weich landen.','Ganzer Fuß auf der Box, aufrichten.','Kontrolliert absteigen (nicht springen).'] },

    /* ---- Rumpf / Stabilität ---- */
    plank: { id:'plank', name:'Unterarmstütz (Plank)', emoji:'🧘',
      target:'Rumpf, Schultergürtel', equipment:[], loads:['schulter'], sets:3, reps:'30–60 Sek', min:4, alternatives:['dead_bug'],
      steps:['Unterarme unter den Schultern.','Körper von Kopf bis Ferse gerade.','Bauch und Gesäß anspannen.','Ruhig atmen, Position halten.'] },
    dead_bug: { id:'dead_bug', name:'Dead Bug', emoji:'🪲',
      target:'Tiefe Bauchmuskulatur (rückenschonend)', equipment:[], loads:[], sets:3, reps:'10 / Seite', min:4, alternatives:[],
      steps:['Rücklings, Arme senkrecht, Knie 90°.','Unteren Rücken flach halten.','Gegenüberliegenden Arm + Bein strecken.','Zurück, Seite wechseln.'] },
    bird_dog: { id:'bird_dog', name:'Bird Dog', emoji:'🐦',
      target:'Rückenstrecker, Rumpfstabilität', equipment:[], loads:[], sets:3, reps:'10 / Seite', min:4, alternatives:[],
      steps:['Vierfüßlerstand, Rücken gerade.','Bauch leicht fest.','Gegenüberliegenden Arm + Bein strecken.','Kurz halten, Seite wechseln.'] },
    side_plank: { id:'side_plank', name:'Seitstütz', emoji:'🧘',
      target:'Seitliche Rumpfmuskulatur', equipment:[], loads:['schulter'], sets:3, reps:'20–30 Sek / Seite', min:4, alternatives:['side_plank_knee'],
      steps:['Seitlich auf Unterarm stützen.','Hüfte nach oben, Körper in Linie.','Position halten.','Seite wechseln.'] },
    side_plank_knee: { id:'side_plank_knee', name:'Seitstütz auf dem Knie', emoji:'🧘',
      target:'Seitliche Rumpfmuskulatur (leichter)', equipment:[], loads:[], sets:3, reps:'25 Sek / Seite', min:3, alternatives:['dead_bug'],
      steps:['Seitlich, unteres Knie abgelegt.','Hüfte anheben.','Ruhig halten.','Seite wechseln.'] },
    pallof: { id:'pallof', name:'Pallof-Press', emoji:'🎗️',
      target:'Anti-Rotation, tiefer Rumpf', equipment:['band'], loads:[], sets:3, reps:'10 / Seite', min:4, alternatives:['dead_bug'],
      steps:['Band seitlich auf Brusthöhe.','Seitlich stehen, Band vor der Brust.','Arme nach vorn strecken, Rotation widerstehen.','Zurück, Seite wechseln.'] },
    hollow_hold: { id:'hollow_hold', name:'Hollow Hold', emoji:'🛶',
      target:'Rumpfspannung', equipment:[], loads:[], sets:3, reps:'20–30 Sek', min:3, alternatives:['dead_bug'],
      steps:['Rücklings, unterer Rücken am Boden.','Arme und Beine leicht anheben.','Körper zur flachen Schale spannen.','Ruhig atmen.'] },
    hanging_knee_raise: { id:'hanging_knee_raise', name:'Hängendes Knieheben', emoji:'🙆',
      target:'Bauch, Grip', equipment:['klimmzugstange'], loads:[], sets:3, reps:'10–15', min:4, alternatives:['lying_leg_raise'],
      steps:['An der Stange hängen, Schultern aktiv.','Knie kontrolliert zur Brust.','Oben kurz halten.','Langsam ablassen, nicht schwingen.'] },
    lying_leg_raise: { id:'lying_leg_raise', name:'Beinheben liegend', emoji:'🦵',
      target:'Unterer Bauch', equipment:[], loads:['ruecken'], sets:3, reps:'12–15', min:4, alternatives:['dead_bug'],
      steps:['Rücklings, Hände unter dem Gesäß.','Unteren Rücken flach halten.','Beine gestreckt heben und senken.','Nicht ablegen, Spannung halten.'] },

    /* ---- Ski-Prep (Winter) ---- */
    eccentric_squat: { id:'eccentric_squat', name:'Langsame exzentrische Kniebeuge', emoji:'🎿',
      target:'Quadrizeps exzentrisch (Ski)', equipment:[], loads:['knie'], sets:3, reps:'8 (3–4 Sek runter)', min:5, alternatives:['box_squat'],
      steps:['Schulterbreiter Stand, optional Gewicht.','3–4 Sekunden langsam absenken.','Unten kurz halten.','Zügig aufstehen.'],
      coach:'Exzentrik bereitet die Knie auf lange Skitage vor.' },
    skater_jump: { id:'skater_jump', name:'Skater-Sprünge', emoji:'⛷️',
      target:'Laterale Kraft, Balance (Ski)', equipment:[], loads:['knie','sprunggelenk'], sets:3, reps:'10 / Seite', min:5, alternatives:['lateral_stepout'],
      steps:['Seitlich von Bein zu Bein springen.','Weich auf einem Bein landen.','Kurz stabilisieren.','Zur anderen Seite abspringen.'] },
    lateral_stepout: { id:'lateral_stepout', name:'Seitliche Ausfallschritte', emoji:'↔️',
      target:'Innen-/Außenseite Beine (Ski)', equipment:[], loads:['knie'], sets:3, reps:'10 / Seite', min:4, alternatives:['lateral_band_walk'],
      steps:['Breiter Seitschritt, in ein Bein beugen.','Anderes Bein gestreckt.','Gesäß nach hinten, Rücken gerade.','Zurück zur Mitte, Seite wechseln.'] },
    lateral_band_walk: { id:'lateral_band_walk', name:'Seitwärtsgehen mit Band', emoji:'🎗️',
      target:'Hüftstabilität (Ski, Knie-Prävention)', equipment:['band'], loads:[], sets:3, reps:'12 / Seite', min:4, alternatives:['glute_bridge'],
      steps:['Band um die Beine (über Knie/Knöchel).','Leichte Kniebeuge-Position.','Kontrollierte Seitschritte, Spannung halten.','Knie bleiben über den Füßen.'] },
    step_down: { id:'step_down', name:'Step-Downs (exzentrisch)', emoji:'🪜',
      target:'Knie-Kontrolle, Quads (Ski)', equipment:['box'], loads:['knie'], sets:3, reps:'8 / Seite', min:4, alternatives:['bw_split_squat'],
      steps:['Auf Erhöhung stehen.','Ein Bein langsam zum Boden senken.','Ferse leicht antippen, Knie stabil.','Kontrolliert zurück.'] },
    single_leg_balance: { id:'single_leg_balance', name:'Einbeinstand / Balance', emoji:'🧍',
      target:'Balance, Sprunggelenk (Ski)', equipment:[], loads:[], sets:3, reps:'30 Sek / Seite', min:3, alternatives:[],
      steps:['Auf einem Bein stehen.','Rumpf fest, Blick nach vorn.','Balance halten (Augen zu = schwerer).','Seite wechseln.'] },
    wall_sit: { id:'wall_sit', name:'Wandsitz', emoji:'🧱',
      target:'Isometrische Quads (Ski-Ausdauer)', equipment:[], loads:['knie'], sets:3, reps:'30–45 Sek', min:4, alternatives:['box_squat'],
      steps:['Rücken an der Wand, Oberschenkel waagerecht.','Knie über den Knöcheln.','Position halten, ruhig atmen.','Langsam hochschieben.'] }
  };

  /* ----------------------------------------------------------------------
     Session-Typen & Wochenplan
     ---------------------------------------------------------------------- */
  const SESSIONS = {
    KRAFT_A: { id:'KRAFT_A', name:'Kraft · Unterkörper & Tragen', short:'Kraft UK', icon:'🏋️',
      tags:['Kraft','Tragen','Core'], ex:['back_squat','deadlift','split_squat','farmers_carry','hanging_knee_raise','calf_raise'] },
    KRAFT_B: { id:'KRAFT_B', name:'Kraft · Oberkörper & Zug', short:'Kraft OK', icon:'💪',
      tags:['Druck','Zug','Grip'], ex:['bench_press','pullup','db_row','ohp','face_pull','curl'] },
    WORKCAP: { id:'WORKCAP', name:'Work Capacity', short:'Work Cap', icon:'🔥',
      tags:['Kondition','Kraftausdauer'], ex:['kb_swing','thruster','burpee','step_up','mountain_climber','farmers_carry'] },
    GANZ:    { id:'GANZ', name:'Ganzkörper-Kraft', short:'Ganzkörper', icon:'⚙️',
      tags:['Kraft','Ganzkörper'], ex:['back_squat','bench_press','db_row','kb_swing','plank','farmers_carry'] },
    CONDITION:{ id:'CONDITION', name:'Ausdauer & Rucking', short:'Ausdauer', icon:'🏃',
      tags:['Ausdauer','Rucking'], conditioning:true, ex:['plank','dead_bug'] },
    SKIPREP: { id:'SKIPREP', name:'Ski-Prep', short:'Ski-Prep', icon:'🎿',
      tags:['Beine','Balance','Knie-Prävention'], ski:true, ex:['eccentric_squat','step_down','skater_jump','lateral_stepout','single_leg_balance','wall_sit'] }
  };

  function weeklyPlan(perWeek, winter) {
    const base = {
      2: ['GANZ','WORKCAP'],
      3: ['KRAFT_A','KRAFT_B','WORKCAP'],
      4: ['KRAFT_A','KRAFT_B','WORKCAP','CONDITION'],
      5: ['KRAFT_A','KRAFT_B','WORKCAP','CONDITION','GANZ'],
      6: ['KRAFT_A','KRAFT_B','WORKCAP','CONDITION','GANZ','CONDITION']
    }[Math.min(6, Math.max(2, perWeek))].slice();

    if (winter) {
      const g = base.indexOf('GANZ');
      if (g !== -1) base[g] = 'SKIPREP';
      else {
        const c = base.lastIndexOf('CONDITION');
        if (c !== -1 && base.filter(function (t) { return t === 'CONDITION'; }).length > 1) base[c] = 'SKIPREP';
      }
    }
    return base;
  }

  const WARMUP_TEXT = 'Mobilisieren & aktivieren (5 Min): Hüftkreisen, Beinschwingen, Schulterkreisen, ' +
    '10 Kniebeugen, 10 Ausfallschritte, Schulterblätter aktivieren. Puls hochbringen.';
  const COOLDOWN_TEXT = 'Abwärmen (3–5 Min): locker ausgehen/ausschütteln, Oberschenkel, Hüftbeuger, ' +
    'Brust und Nacken dehnen, ruhig atmen.';

  /* ----------------------------------------------------------------------
     State
     ---------------------------------------------------------------------- */
  function defaultLocations() {
    return [
      { id: uid(), name: 'Wache', icon: '🏢',
        equipment: ['langhantel','kurzhanteln','kettlebell','klimmzugstange','cardio','box','matte','band','gewichtsweste'] },
      { id: uid(), name: 'Zuhause', icon: '🏠',
        equipment: ['kurzhanteln','band','matte','springseil'] },
      { id: uid(), name: 'Unterwegs', icon: '🎒', equipment: [] }
    ];
  }

  function defaultState() {
    const locs = defaultLocations();
    return {
      version: 1,
      onboarded: false,
      name: '',
      locations: locs,
      activeLocationId: locs[0].id,
      complaints: { ruecken:false, schulter:false, knie:false, handgelenk:false, ellenbogen:false, sprunggelenk:false, nacken:false },
      complaintsText: '',
      frequency: 4,          // Einheiten/Woche
      sessionMinutes: 45,    // Ziel-Dauer je Einheit
      theme: 'auto',         // auto | dark | light
      readiness: { date: '', level: 'normal' }, // Tages-Erholung (Autoregulation)
      restDefault: 90,       // Standard-Satzpause (Sek) für Auto-Timer
      lastSummary: null,     // Zusammenfassung der letzten Einheit (für Banner)
      hideInstallHint: false,
      swaps: {},
      currentSession: null,
      history: []
    };
  }

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const p = JSON.parse(raw);
      const d = defaultState();
      const merged = Object.assign(d, p);
      merged.complaints = Object.assign(d.complaints, p.complaints || {});
      if (!merged.locations || !merged.locations.length) { merged.locations = d.locations; merged.activeLocationId = d.activeLocationId; }
      if (!merged.activeLocationId || !merged.locations.some(function (l) { return l.id === merged.activeLocationId; })) {
        merged.activeLocationId = merged.locations[0].id;
      }
      return merged;
    } catch (e) { return defaultState(); }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { alert('Speichern nicht möglich – Speicher voll oder privater Modus?'); }
  }

  /* ----------------------------------------------------------------------
     Helpers
     ---------------------------------------------------------------------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
  function formatDate(iso) { if (!iso) return ''; const p = iso.split('-'); return p.length === 3 ? p[2]+'.'+p[1]+'.'+p[0] : iso; }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function ytLink(name) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' Übung Technik'); }
  function isWinter() { return WINTER_MONTHS.indexOf(new Date().getMonth()) !== -1; }
  function activeLocation() { return state.locations.find(function (l) { return l.id === state.activeLocationId; }) || state.locations[0]; }
  function availableEquip() { const loc = activeLocation(); return (loc && loc.equipment) ? loc.equipment : []; }
  function activeComplaints() { return Object.keys(state.complaints).filter(function (k) { return state.complaints[k]; }); }

  /* ----------------------------------------------------------------------
     Progression & Autoregulation
     ---------------------------------------------------------------------- */
  const HEAVY_LIFT = { back_squat:1, deadlift:1, rdl:1, hip_thrust:1, split_squat:1 };
  function incFor(id) { return HEAVY_LIFT[id] ? 5 : 2.5; }
  function roundKg(x) { return Math.max(0, Math.round(x / 2.5) * 2.5); }
  function fmtKg(n) { return (n % 1 === 0) ? String(n) : n.toFixed(1).replace('.', ','); }
  function parseTopReps(s) { const m = String(s).match(/\d+/g); return m ? Math.max.apply(null, m.map(Number)) : null; }

  // jüngste erfasste Leistung für eine Übung (history ist neueste zuerst)
  function lastPerfFor(exId) {
    for (var i = 0; i < state.history.length; i++) {
      var h = state.history[i]; if (!h.exercises) continue;
      for (var j = 0; j < h.exercises.length; j++) {
        if (h.exercises[j].id === exId) return { weight: h.exercises[j].weight, reps: h.exercises[j].doneReps, rpe: h.exercises[j].rpe, date: h.date };
      }
    }
    return null;
  }

  const READINESS = {
    frisch:      { label:'Frisch',             icon:'⚡', count:0,  set:0,  load:1.00, tone:'good'  },
    normal:      { label:'Normal',             icon:'🟢', count:0,  set:0,  load:1.00, tone:'steel' },
    muede:       { label:'Müde / Nachtschicht',icon:'🌙', count:-1, set:-1, load:0.90, tone:'warn'  },
    angeschlagen:{ label:'Angeschlagen',       icon:'🤕', count:-2, set:-1, load:0.85, tone:'crit'  }
  };
  function todayReadiness() { return (state.readiness && state.readiness.date === todayStr()) ? state.readiness.level : 'normal'; }
  function programWeek() { return Math.floor(state.history.length / state.frequency) + 1; }
  function isDeload() { return state.history.length > 0 && programWeek() % 4 === 0; }
  function effMods() {
    const r = READINESS[todayReadiness()] || READINESS.normal;
    const d = isDeload() ? 1 : 0;
    return { count: r.count - d, set: r.set - d, load: Math.min(r.load, d ? 0.9 : 1), tone: r.tone, label: r.label, icon: r.icon, deload: !!d };
  }

  // Vorschlag fürs nächste Gewicht aus letzter Leistung + Tagesform
  function suggestNext(ex) {
    const lp = lastPerfFor(ex.id); if (!lp) return null;
    const lastW = parseFloat(lp.weight);
    if (isNaN(lastW) || lastW <= 0) return { repeat: true, text: (lp.reps ? lp.reps + ' Wdh.' : 'erledigt') };
    const top = parseTopReps(ex.reps); const lastR = parseInt(lp.reps, 10); const mods = effMods();
    var next;
    if (mods.load < 1) next = roundKg(lastW * mods.load);
    else if (!isNaN(lastR) && top && lastR >= top) next = lastW + incFor(ex.id);
    else next = lastW;
    return { last: lastW, lastReps: lp.reps, next: next, up: next > lastW, down: next < lastW };
  }

  // Geschätztes 1RM (Epley) und Bestwerte (PRs)
  function epley(w, r) { w = parseFloat(w); r = parseInt(r, 10); if (isNaN(w) || w <= 0 || isNaN(r) || r <= 0) return 0; return w * (1 + r / 30); }
  function round1(x) { return Math.round(x * 10) / 10; }
  // bisheriger Bestwert für Übung, optional bis zu einem Index (exklusiv) der History
  function prFor(exId, beforeIdx) {
    var maxW = 0, best1 = 0;
    for (var i = (beforeIdx == null ? 0 : beforeIdx); i < state.history.length; i++) {
      var h = state.history[i]; if (!h.exercises) continue;
      for (var j = 0; j < h.exercises.length; j++) {
        var e = h.exercises[j]; if (e.id !== exId) continue;
        var w = parseFloat(e.weight); if (!isNaN(w) && w > maxW) maxW = w;
        var o = epley(e.weight, e.doneReps); if (o > best1) best1 = o;
      }
    }
    return { maxW: maxW, best1: best1 };
  }

  /* ----------------------------------------------------------------------
     Adaptions-Logik
     ---------------------------------------------------------------------- */
  function conflictOf(ex) {
    if (ex.equipment && ex.equipment.length) {
      const avail = availableEquip();
      const ok = ex.equipment.some(function (e) { return avail.indexOf(e) !== -1; });
      if (!ok) {
        const names = ex.equipment.map(function (e) { return EQUIP[e] ? EQUIP[e].label : e; });
        return 'Material fehlt (' + names.join(' oder ') + ')';
      }
    }
    const comp = activeComplaints();
    for (var i = 0; i < ex.loads.length; i++) {
      if (comp.indexOf(ex.loads[i]) !== -1) return 'belastet ' + (COMPLAINTS[ex.loads[i]] ? COMPLAINTS[ex.loads[i]].label : ex.loads[i]);
    }
    return null;
  }

  function chainFrom(startId) {
    const chain = [], seen = {};
    (function walk(id) {
      if (!id || seen[id] || !EX[id]) return;
      seen[id] = true; chain.push(id);
      (EX[id].alternatives || []).forEach(walk);
    })(startId);
    return chain;
  }

  function resolveExercise(plannedId) {
    const swapTarget = state.swaps[plannedId];
    const swapped = swapTarget && swapTarget !== plannedId && !!EX[swapTarget];
    const startId = swapped ? swapTarget : plannedId;
    const chain = chainFrom(startId);
    const startConflict = conflictOf(EX[startId]);

    for (var i = 0; i < chain.length; i++) {
      const ex = EX[chain[i]];
      if (!conflictOf(ex)) {
        var reason = null;
        if (i > 0) reason = 'Ersetzt wegen: ' + startConflict;
        else if (swapped) reason = 'Manuell getauscht';
        return { exercise: ex, plannedId: plannedId, replaced: i > 0, swapped: swapped, reason: reason, warning: null };
      }
    }
    return { exercise: EX[startId], plannedId: plannedId, replaced: false, swapped: swapped,
      reason: swapped ? 'Manuell getauscht' : null,
      warning: 'Keine sichere Alternative (' + startConflict + '). Bewegungsradius reduzieren, bei Schmerz abbrechen.' };
  }

  function swapExercise(plannedId) {
    const options = chainFrom(plannedId);
    const current = state.swaps[plannedId] || plannedId;
    var idx = options.indexOf(current); if (idx === -1) idx = 0;
    state.swaps[plannedId] = options[(idx + 1) % options.length];
    save();
  }

  /* ----------------------------------------------------------------------
     Dauer-Skalierung & Plan
     ---------------------------------------------------------------------- */
  function scaledExercises(type) {
    const st = SESSIONS[type];
    if (st.conditioning) return st.ex.slice(); // Core-Finisher; Hauptblock separat
    const avail = Math.max(10, state.sessionMinutes - 10); // Warm/Cool reservieren
    const chosen = []; var total = 0;
    for (var i = 0; i < st.ex.length; i++) {
      const m = EX[st.ex[i]].min || 5;
      if (chosen.length < 3 || total + m <= avail) { chosen.push(st.ex[i]); total += m; }
      else break;
    }
    // Autoregulation / Deload: Übungszahl reduzieren (min. 3)
    const mods = effMods();
    const target = Math.max(3, chosen.length + mods.count);
    return chosen.slice(0, Math.min(chosen.length, target));
  }

  function conditioningPlan() {
    const minutes = state.sessionMinutes;
    const avail = availableEquip();
    const knee = state.complaints.knie;
    const ankle = state.complaints.sprunggelenk;
    if (avail.indexOf('cardio') !== -1) {
      return { title: 'Cardio-Intervalle (Gerät)', detail: minutes + ' Min am Cardiogerät: 5 Min locker einrudern/-fahren, dann ' +
        '6–8 × (1 Min zügig / 1 Min locker), 5 Min auslaufen.' };
    }
    if (avail.indexOf('rucksack') !== -1 && !knee) {
      return { title: 'Rucking (Marsch mit Last)', detail: minutes + ' Min zügiger Marsch mit beladenem Rucksack, ' +
        'wenn möglich mit Steigungen/Treppen (einsatznah). Aufrechte Haltung, Rumpf aktiv.' };
    }
    if (knee || ankle) {
      return { title: 'Zügiges Gehen (gelenkschonend)', detail: minutes + ' Min zügiges Gehen in gleichmäßigem Tempo – ' +
        'wegen Gelenkthema kein Laufen/Springen.' };
    }
    return { title: 'Lauf-Intervalle', detail: 'Gesamt ca. ' + minutes + ' Min: 5 Min locker einlaufen, dann ' +
      '6 × (2 Min zügig / 1 Min gehen), 5 Min auslaufen. Tempo nach Gefühl.' };
  }

  /* ----------------------------------------------------------------------
     Fortschritt
     ---------------------------------------------------------------------- */
  function mondayOf(d) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); x.setHours(0,0,0,0); return x; }
  function dateObj(iso) { const p = iso.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }

  function sessionsThisWeek() {
    const mon = mondayOf(new Date());
    return state.history.filter(function (h) { return dateObj(h.date) >= mon; }).length;
  }
  function weekStreak() {
    var streak = 0;
    var mon = mondayOf(new Date());
    for (var w = 0; w < 104; w++) {
      var start = new Date(mon); start.setDate(start.getDate() - w * 7);
      var end = new Date(start); end.setDate(end.getDate() + 7);
      var count = state.history.filter(function (h) { var d = dateObj(h.date); return d >= start && d < end; }).length;
      if (count >= state.frequency) streak++;
      else break;
    }
    return streak;
  }
  function nextType() {
    const plan = weeklyPlan(state.frequency, isWinter());
    return plan[state.history.length % plan.length];
  }

  /* ----------------------------------------------------------------------
     Session-Handling
     ---------------------------------------------------------------------- */
  function newSession(type) {
    const planned = scaledExercises(type);
    const entries = {};
    planned.forEach(function (pid) { entries[pid] = { done:false, weight:'', reps:'', rpe:'' }; });
    const s = { type:type, startedAt:new Date().toISOString(), warmup:false, cooldown:false, planned:planned, entries:entries };
    if (SESSIONS[type].conditioning) s.condDone = false;
    return s;
  }

  function finishSession() {
    const s = state.currentSession; if (!s) return;
    const st = SESSIONS[s.type];
    const exercises = [];
    var volume = 0, doneCount = 0, prs = [];
    if (!st.conditioning) {
      s.planned.forEach(function (pid) {
        const r = resolveExercise(pid); const e = s.entries[pid] || {};
        const rec = { id:r.exercise.id, name:r.exercise.name, sets:r.exercise.sets, reps:r.exercise.reps, weight:e.weight||'', doneReps:e.reps||'', rpe:e.rpe||'' };
        exercises.push(rec);
        if (e.done) doneCount++;
        const w = parseFloat(e.weight), rp = parseInt(e.reps, 10);
        if (!isNaN(w) && w > 0 && !isNaN(rp) && rp > 0) volume += w * rp;
        // PR? gegen bisherige History (vor dem Hinzufügen)
        if (!isNaN(w) && w > 0) {
          const prev = prFor(r.exercise.id);
          const e1 = epley(e.weight, e.reps);
          if (w > prev.maxW || (e1 > 0 && e1 > prev.best1)) {
            prs.push({ name: r.exercise.name, weight: w, reps: e.reps, e1rm: round1(e1) });
            rec.pr = true;
          }
        }
      });
    } else if (s.condDone) { doneCount = 1; }

    state.history.unshift({
      id: uid(), date: todayStr(), type: s.type, typeName: st.name,
      location: (activeLocation() || {}).name || '', minutes: state.sessionMinutes,
      exercises: exercises,
      conditioning: st.conditioning ? conditioningPlan().detail : null
    });
    state.lastSummary = {
      typeName: st.name, icon: st.icon, minutes: state.sessionMinutes,
      doneCount: doneCount, total: st.conditioning ? 1 : s.planned.length,
      volume: Math.round(volume), prs: prs, conditioning: !!st.conditioning
    };
    state.currentSession = null; state.swaps = {};
    save(); location.hash = '#/'; render();
  }

  /* ----------------------------------------------------------------------
     Theme
     ---------------------------------------------------------------------- */
  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.theme);
  }

  /* ----------------------------------------------------------------------
     Backup: Export / Import
     ---------------------------------------------------------------------- */
  function exportData() {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'einsatzfit-backup-' + todayStr() + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) { alert('Export nicht möglich.'); }
  }
  function copyData() {
    const text = JSON.stringify(state);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { alert('Backup in die Zwischenablage kopiert.'); },
        function () { alert('Kopieren nicht möglich.'); });
    } else { alert('Zwischenablage nicht verfügbar – nutze stattdessen die Backup-Datei.'); }
  }
  function importData(file) {
    const fr = new FileReader();
    fr.onload = function () {
      try {
        const obj = JSON.parse(fr.result);
        if (!obj || typeof obj !== 'object' || !Array.isArray(obj.history) || !Array.isArray(obj.locations)) {
          alert('Ungültige Backup-Datei.'); return;
        }
        if (!confirm('Backup laden? Deine aktuellen Daten werden vollständig ersetzt.')) return;
        const d = defaultState();
        state = Object.assign(d, obj);
        state.complaints = Object.assign(d.complaints, obj.complaints || {});
        if (!state.locations.length) { state.locations = d.locations; state.activeLocationId = d.locations[0].id; }
        if (!state.locations.some(function (l) { return l.id === state.activeLocationId; })) state.activeLocationId = state.locations[0].id;
        save(); applyTheme(); editLocationId = null; editingHistoryId = null;
        location.hash = '#/'; render(); alert('Backup geladen.');
      } catch (e) { alert('Datei konnte nicht gelesen werden.'); }
    };
    fr.readAsText(file);
  }

  /* ----------------------------------------------------------------------
     Routing
     ---------------------------------------------------------------------- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    if (!parts.length) return { route: 'home' };
    if (parts[0] === 'session') return { route: 'session', param: parts[1] };
    if (parts[0] === 'uebung') return { route: 'uebung', param: parts[1] };
    if (['verlauf','orte','einstellungen'].indexOf(parts[0]) !== -1) return { route: parts[0] };
    return { route: 'home' };
  }

  var onboardStep = 1;
  var editLocationId = null;
  var editingHistoryId = null;

  /* ----------------------------------------------------------------------
     Render
     ---------------------------------------------------------------------- */
  function render() {
    const app = document.getElementById('app');
    if (!state.onboarded) { app.innerHTML = renderOnboarding(); window.scrollTo(0,0); return; }
    const r = parseHash();
    var html, nav;
    switch (r.route) {
      case 'session': html = renderSession(r.param); nav = null; break;
      case 'verlauf': html = renderVerlauf(); nav = 'verlauf'; break;
      case 'orte': html = renderOrte(); nav = 'orte'; break;
      case 'einstellungen': html = renderSettings(); nav = 'einstellungen'; break;
      case 'uebung': html = renderUebung(r.param); nav = 'home'; break;
      default: html = renderDashboard(); nav = 'home';
    }
    app.innerHTML = html + (nav !== null ? renderNav(nav) : '');
    window.scrollTo(0, 0);
    if (r.route === 'verlauf') drawChart();
    showTimer(r.route === 'session');
  }

  function renderNav(active) {
    function item(href, key, ico, label) {
      return '<a href="'+href+'" class="'+(active===key?'active':'')+'" aria-label="'+label+'"'+(active===key?' aria-current="page"':'')+'>' +
        '<span class="ico" aria-hidden="true">'+ico+'</span>'+label+'</a>';
    }
    return '<nav class="bottom-nav" aria-label="Hauptnavigation"><div class="inner">' +
      item('#/','home','🎯','Heute') +
      item('#/verlauf','verlauf','📈','Verlauf') +
      item('#/orte','orte','📍','Orte') +
      item('#/einstellungen','einstellungen','⚙️','Einstellung') +
      '</div></nav>';
  }

  /* ---------- Onboarding ---------- */
  function renderOnboarding() {
    const total = 5;
    var dotsArr = [];
    for (var i = 0; i < total; i++) dotsArr.push('<span class="dot '+(i+1 === onboardStep ? 'active':'')+'"></span>');
    const dots = '<div class="dots" aria-hidden="true">' + dotsArr.join('') + '</div>';

    var body = '';
    if (onboardStep === 1) {
      body = '<div class="hero-ex">🎯</div>' +
        '<h2>Willkommen bei EinsatzFit</h2>' +
        '<p>Dein Training für den Dienst – ausgelegt auf <strong>Polizei &amp; Feuerwehr</strong> ' +
        '(Kraft, Work Capacity, Tragen &amp; Greifen, Kondition), mit <strong>Ski-Vorbereitung</strong> im Winter.</p>' +
        '<p class="muted small">In den nächsten Schritten richten wir deine Orte, dein Material, Beschwerden ' +
        'und deine Trainingsmenge ein. Alles später jederzeit änderbar.</p>' +
        '<div class="btn-row"><button class="btn btn--lg" data-action="onb-next">Einrichten starten</button></div>';
    } else if (onboardStep === 2) {
      body = '<h2>Deine Orte &amp; dein Material</h2>' +
        '<p class="muted small">Du trainierst an verschiedenen Orten mit unterschiedlichem Material. ' +
        'Richte sie hier ein – vor jeder Einheit wählst du einfach, wo du bist.</p>' +
        locationsEditorHTML() +
        '<div class="btn-row"><button class="btn btn--ghost" data-action="onb-back">Zurück</button>' +
        '<button class="btn" data-action="onb-next">Weiter</button></div>';
    } else if (onboardStep === 3) {
      body = '<h2>Aktuelle Beschwerden?</h2>' +
        '<p class="muted small">Mehrfachauswahl. Betroffene Übungen werden automatisch durch sichere ' +
        'Alternativen ersetzt. Nichts ist vorausgewählt – du kannst das jeden Tag neu setzen.</p>' +
        complaintTogglesHTML() +
        '<div class="field"><label for="ob-ct">Sonstige Beschwerden (optional)</label>' +
        '<textarea id="ob-ct" data-field="complaintsText" placeholder="z. B. Nacken verspannt">'+esc(state.complaintsText)+'</textarea></div>' +
        '<div class="btn-row"><button class="btn btn--ghost" data-action="onb-back">Zurück</button>' +
        '<button class="btn" data-action="onb-next">Weiter</button></div>';
    } else if (onboardStep === 4) {
      body = '<h2>Trainingsmenge</h2>' +
        '<p class="muted small">Wie viel passt in deinen Dienst-/Alltag? Jederzeit anpassbar – ' +
        'wenn du mal weniger Zeit hast, stell die Dauer einfach runter, der Plan skaliert mit.</p>' +
        freqDurationHTML() +
        '<div class="btn-row"><button class="btn btn--ghost" data-action="onb-back">Zurück</button>' +
        '<button class="btn" data-action="onb-next">Weiter</button></div>';
    } else {
      body = '<div class="hero-ex">✅</div>' +
        '<h2>Alles bereit</h2>' +
        '<p>Dein Plan steht: <strong>'+state.frequency+' Einheiten/Woche</strong> à <strong>'+state.sessionMinutes+' Min</strong>, ' +
        'Schwerpunkt Polizei/Feuerwehr'+(isWinter()?', aktuell mit Ski-Prep (Winter)':'')+'.</p>' +
        '<p class="muted small">Auf dem Dashboard wählst du vor jeder Einheit deinen Ort und bestätigst dein ' +
        'Tagesbefinden. Los geht’s.</p>' +
        '<div class="btn-row"><button class="btn btn--ghost" data-action="onb-back">Zurück</button>' +
        '<button class="btn btn--lg" data-action="onb-finish">Zum Dashboard</button></div>';
    }

    return '<div class="view view--full">' +
      '<p class="eyebrow">Einrichtung · Schritt '+onboardStep+' / '+total+'</p>' + dots +
      '<div class="card">'+body+'</div></div>';
  }

  function complaintTogglesHTML() {
    return Object.keys(COMPLAINTS).map(function (k) {
      const on = !!state.complaints[k];
      return '<div class="toggle" role="checkbox" tabindex="0" aria-checked="'+(on?'true':'false')+'" data-action="toggle-complaint" data-key="'+k+'">' +
        '<span class="ico" aria-hidden="true">'+COMPLAINTS[k].icon+'</span>' +
        '<span class="label">'+COMPLAINTS[k].label+'</span><span class="box" aria-hidden="true"></span></div>';
    }).join('');
  }

  function summaryBannerHTML() {
    const sm = state.lastSummary; if (!sm) return '';
    const prBlock = (sm.prs && sm.prs.length)
      ? '<div class="sum-prs">'+sm.prs.map(function (p){ return '<div class="sum-pr">🏆 <b>'+esc(p.name)+'</b> '+fmtKg(p.weight)+' kg × '+esc(p.reps)+(p.e1rm?' · ≈1RM '+p.e1rm+' kg':'')+'</div>'; }).join('')+'</div>'
      : '';
    const stats = sm.conditioning
      ? '<div class="sum-grid"><div><b class="tnum">'+sm.minutes+'′</b><span>Dauer</span></div><div><b>✓</b><span>Kondition</span></div></div>'
      : '<div class="sum-grid"><div><b class="tnum">'+sm.doneCount+'/'+sm.total+'</b><span>erledigt</span></div>' +
        '<div><b class="tnum">'+(sm.volume||0)+'</b><span>kg Volumen</span></div>' +
        '<div><b class="tnum">'+(sm.prs?sm.prs.length:0)+'</b><span>neue PRs</span></div></div>';
    return '<div class="card card--accent"><div class="row-between"><div class="row" style="gap:8px"><span style="font-size:1.4rem">'+esc(sm.icon||'✅')+'</span><h3 style="margin:0">Einheit abgeschlossen</h3></div>' +
      '<button class="iconbtn" data-action="dismiss-summary" aria-label="Schließen" style="width:38px;height:38px;font-size:1.1rem">✕</button></div>' +
      '<p class="small muted" style="margin:6px 0 10px">'+esc(sm.typeName)+'</p>'+stats+prBlock+'</div>';
  }

  function readinessCardHTML() {
    const lvl = todayReadiness();
    const mods = effMods();
    const chips = Object.keys(READINESS).map(function (k) { const r = READINESS[k];
      return '<button class="chip chip--steel" aria-pressed="'+(lvl===k?'true':'false')+'" data-action="set-readiness" data-level="'+k+'">'+r.icon+' '+esc(r.label)+'</button>';
    }).join('');
    var note = '';
    if (mods.count < 0 || mods.set < 0 || mods.load < 1) {
      var parts = [];
      if (mods.count < 0) parts.push(Math.abs(mods.count)+' Übung(en) weniger');
      if (mods.set < 0) parts.push('reduzierte Sätze');
      if (mods.load < 1) parts.push('Last-Vorschläge ~'+Math.round((1-mods.load)*100)+'% niedriger');
      note = '<div class="notice notice--info" style="margin-top:10px">Heute angepasst: '+parts.join(', ')+'.</div>';
    }
    const cur = READINESS[lvl] || READINESS.normal;
    return '<div class="card"><div class="row-between" style="margin-bottom:10px"><h3 style="margin:0">Erholung heute</h3>' +
      '<span class="pill pill--'+cur.tone+'">'+cur.icon+' '+esc(cur.label)+'</span></div>' +
      '<p class="small muted" style="margin:0 0 10px">Nach Nachtschicht oder bei Belastung anpassen – der Plan skaliert Umfang und Last automatisch.</p>' +
      '<div class="chips">'+chips+'</div>'+note+'</div>';
  }

  function locationsEditorHTML() {
    return state.locations.map(function (loc) {
      const open = editLocationId === loc.id;
      const count = loc.equipment.length;
      const head = '<div class="row-between" style="cursor:pointer" data-action="toggle-loc-edit" data-id="'+loc.id+'">' +
        '<div class="row"><span style="font-size:1.4rem">'+esc(loc.icon||'📍')+'</span>' +
        '<div><div style="font-weight:700">'+esc(loc.name)+'</div>' +
        '<div class="small muted tnum">'+count+' Geräte'+(count===0?' · nur Eigengewicht':'')+'</div></div></div>' +
        '<span class="muted">'+(open?'▲':'▼')+'</span></div>';
      var inner = '';
      if (open) {
        inner = '<hr class="sep">' +
          '<div class="field"><label>Name</label>' +
          '<input type="text" value="'+esc(loc.name)+'" data-field="loc-name" data-id="'+loc.id+'"></div>' +
          '<div style="margin-top:12px" class="small muted">Vorhandenes Material:</div>' +
          '<div class="chips" style="margin-top:8px">' +
          Object.keys(EQUIP).map(function (eq) {
            const on = loc.equipment.indexOf(eq) !== -1;
            return '<button class="chip" aria-pressed="'+(on?'true':'false')+'" data-action="toggle-loc-equip" data-id="'+loc.id+'" data-eq="'+eq+'">' +
              EQUIP[eq].icon+' '+esc(EQUIP[eq].label)+'</button>';
          }).join('') + '</div>' +
          '<div class="btn-row" style="margin-top:14px">' +
          '<button class="btn btn--crit btn--sm" data-action="remove-loc" data-id="'+loc.id+'">Ort löschen</button></div>';
      }
      return '<div class="card card--flat">'+head+inner+'</div>';
    }).join('') +
    '<div class="inline-fields" style="margin-top:4px">' +
    '<div class="field" style="flex:1"><input type="text" id="newLocInput" placeholder="Neuer Ort (z. B. Fitnessstudio)"></div>' +
    '<button class="btn btn--soft" data-action="add-loc" style="flex:0 0 auto">+ Ort</button></div>';
  }

  function freqDurationHTML() {
    return '<div class="card card--flat"><label>Einheiten pro Woche</label>' +
      '<div class="stepper">' +
      '<button data-action="freq-dec" aria-label="weniger">–</button>' +
      '<div class="val">'+state.frequency+'<small>/ WOCHE</small></div>' +
      '<button data-action="freq-inc" aria-label="mehr">+</button></div></div>' +
      '<div class="card card--flat"><label>Dauer pro Einheit</label>' +
      '<div class="stepper">' +
      '<button data-action="dur-dec" aria-label="kürzer">–</button>' +
      '<div class="val">'+state.sessionMinutes+'<small>MINUTEN</small></div>' +
      '<button data-action="dur-inc" aria-label="länger">+</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">Der Plan wählt automatisch so viele Übungen, wie in die Zeit passen.</p></div>';
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const type = nextType();
    const st = SESSIONS[type];
    const goal = state.frequency;
    const thisWeek = sessionsThisWeek();
    const streak = weekStreak();
    const loc = activeLocation();

    const locSwitch = '<div class="loc-switch">' +
      state.locations.map(function (l) {
        const on = l.id === state.activeLocationId;
        const g = l.equipment.length ? l.equipment.length + ' Geräte' : 'Eigengewicht';
        return '<button class="loc-chip" aria-pressed="'+(on?'true':'false')+'" data-action="set-loc" data-id="'+l.id+'">' +
          '<span class="n">'+esc(l.icon||'📍')+' '+esc(l.name)+'</span><span class="g">'+g+'</span></button>';
      }).join('') +
      '<a class="loc-chip" href="#/orte" style="justify-content:center;align-items:center"><span class="n">＋</span><span class="g">Ort</span></a>' +
      '</div>';

    const compChips = '<div class="chips">' +
      Object.keys(COMPLAINTS).map(function (k) {
        const on = !!state.complaints[k];
        return '<button class="chip" aria-pressed="'+(on?'true':'false')+'" data-action="toggle-complaint" data-key="'+k+'">' +
          COMPLAINTS[k].icon+' '+COMPLAINTS[k].label+'</button>';
      }).join('') + '</div>';

    const ac = activeComplaints();
    const readinessPill = ac.length
      ? '<span class="pill pill--warn">'+ac.length+' Beschwerde'+(ac.length>1?'n':'')+' aktiv</span>'
      : '<span class="pill pill--good">Voll einsatzbereit</span>';

    const resume = state.currentSession;
    const hero = '<div class="card card--accent hero-session">' +
      '<div class="kicker"><span class="eyebrow">Heute empfohlen</span>'+
        (isWinter() && st.ski ? '<span class="pill pill--steel">❄️ Winter</span>' : '')+'</div>' +
      '<div class="row" style="gap:10px"><span style="font-size:1.8rem">'+st.icon+'</span>' +
      '<h2 style="margin:0">'+esc(st.name)+'</h2></div>' +
      '<div class="meta">' +
      '<div class="m"><b class="tnum">'+state.sessionMinutes+'′</b><span>Dauer</span></div>' +
      '<div class="m"><b>'+esc(loc.icon||'📍')+' '+esc(loc.name)+'</b><span>Ort</span></div>' +
      '<div class="m"><b class="tnum">'+scaledExercises(type).length+(st.conditioning?'+':'')+'</b><span>Übungen</span></div>' +
      '</div>' +
      '<div class="tags" style="margin-bottom:14px">'+st.tags.map(function (t){return '<span class="tag">'+esc(t)+'</span>';}).join('')+'</div>' +
      (resume ? '<p class="small" style="margin:0 0 10px"><span class="pill pill--orange">Laufende Einheit</span> '+esc(SESSIONS[resume.type].name)+'</p>' : '') +
      '<a class="btn btn--lg btn--block" href="#/session/'+type+'">Einheit starten  ▸</a></div>';

    const stats = '<div class="statgrid">' +
      '<div class="stat"><b class="tnum">'+thisWeek+'<span class="unit">/'+goal+'</span></b><span>Diese Woche</span></div>' +
      '<div class="stat"><b class="tnum">'+streak+'</b><span>Wochen-Serie</span></div>' +
      '<div class="stat"><b class="tnum">'+state.history.length+'</b><span>Einheiten</span></div>' +
      '</div>';

    const mon = mondayOf(new Date());
    const dayNames = ['Mo','Di','Mi','Do','Fr','Sa','So'];
    const todayIso = todayStr();
    var weekrow = '<div class="weekrow">';
    for (var i = 0; i < 7; i++) {
      var d = new Date(mon); d.setDate(d.getDate() + i);
      var iso = d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
      var done = state.history.some(function (h) { return h.date === iso; });
      var cls = 'weekdot' + (done ? ' done' : '') + (iso === todayIso ? ' today' : '');
      weekrow += '<div class="'+cls+'"><span>'+dayNames[i]+'</span><b>'+(done?'✓':'·')+'</b></div>';
    }
    weekrow += '</div>';

    const plan = weeklyPlan(state.frequency, isWinter());
    const startIdx = state.history.length % plan.length;
    var planList = '';
    for (var p = 0; p < plan.length; p++) {
      var t = plan[(startIdx + p) % plan.length];
      var s = SESSIONS[t];
      planList += '<a class="row-between" href="#/session/'+t+'" style="text-decoration:none;color:inherit;padding:11px 2px;border-bottom:1px solid var(--line-soft)">' +
        '<div class="row"><span style="font-size:1.3rem">'+s.icon+'</span>' +
        '<div><div style="font-weight:650">'+esc(s.short)+(p===0?' <span class="pill pill--orange" style="margin-left:4px">Nächste</span>':'')+'</div>' +
        '<div class="small muted">'+esc(s.name)+'</div></div></div>' +
        '<span class="btn btn--soft btn--sm">Start</span></a>';
    }

    const complaintNote = state.complaintsText.trim()
      ? '<div class="notice notice--warn" style="margin-top:12px">🩹 Dein Hinweis: '+esc(state.complaintsText.trim())+'</div>' : '';

    return '<div class="view">' +
      '<div class="topbar"><div class="grow"><p class="eyebrow">'+(isWinter()?'Wintersaison · Ski-Prep aktiv':'Einsatzbereitschaft')+'</p>' +
      '<h1>'+(state.name ? 'Servus '+esc(state.name) : 'Dein Training')+'</h1></div>' +
      '<button class="iconbtn" data-action="cycle-theme" aria-label="Design wechseln">'+(state.theme==='light'?'☀️':state.theme==='dark'?'🌙':'◐')+'</button></div>' +

      summaryBannerHTML() +

      (isDeload() ? '<div class="card card--steel"><strong>🔄 Deload-Woche (Woche '+programWeek()+')</strong>' +
        '<p class="small" style="margin:6px 0 0">Volumen &amp; Last sind bewusst reduziert – Technik und Erholung im Fokus. Nächste Woche wieder voll angreifen.</p></div>' : '') +

      '<div class="card card--tight"><div class="row-between" style="margin-bottom:10px"><span class="eyebrow" style="margin:0">Wo bist du?</span>'+
        '<span class="small muted">Material passt sich an</span></div>'+locSwitch+'</div>' +

      hero +
      stats +

      '<div class="card"><div class="row-between" style="margin-bottom:10px"><h3 style="margin:0">Tagesbefinden</h3>'+readinessPill+'</div>' +
      '<p class="small muted" style="margin:0 0 10px">Tippe an, was heute zwickt – der Plan baut betroffene Übungen sicher um.</p>' +
      compChips + complaintNote + '</div>' +

      readinessCardHTML() +

      '<div class="card"><div class="row-between" style="margin-bottom:8px"><h3 style="margin:0">Diese Woche</h3>' +
      '<span class="small muted tnum">'+thisWeek+' / '+goal+'</span></div>'+weekrow+'</div>' +

      '<div class="card"><h3>Dein Wochenplan</h3>'+planList+'</div>' +

      '<div class="card card--flat stack">' +
      '<h3>Immer dabei</h3>' +
      '<p class="small"><strong>Aufwärmen:</strong> '+WARMUP_TEXT+'</p><hr class="sep">' +
      '<p class="small"><strong>Sicherheit:</strong> Technik vor Gewicht. Bei echtem Schmerz (nicht Muskelkater) abbrechen. ' +
      'Nach Dienst/Nachtschicht Intensität anpassen.</p></div>' +

      installHintHTML() +

      '</div>';
  }

  /* ---------- Session ---------- */
  function renderSession(type) {
    const st = SESSIONS[type];
    if (!st) return renderNotFound(type);
    if (!state.currentSession || state.currentSession.type !== type) { state.currentSession = newSession(type); save(); }
    const s = state.currentSession;
    const loc = activeLocation();

    const header = '<div class="topbar">' +
      '<a class="iconbtn" href="#/" aria-label="Zurück">‹</a>' +
      '<div class="grow"><p class="eyebrow">'+esc(st.tags.join(' · '))+'</p><h1 style="font-size:1.3rem">'+esc(st.name)+'</h1></div></div>';

    const locBar = '<div class="card card--tight"><div class="row-between"><span class="small muted">Ort / Material</span>' +
      '<span class="small tnum">'+esc(loc.icon||'📍')+' '+esc(loc.name)+' · '+(loc.equipment.length||'Eigengewicht')+(loc.equipment.length?' Geräte':'')+'</span></div>' +
      '<div class="loc-switch" style="margin-top:10px">' +
      state.locations.map(function (l) {
        const on = l.id === state.activeLocationId;
        return '<button class="loc-chip" aria-pressed="'+(on?'true':'false')+'" data-action="set-loc" data-id="'+l.id+'">' +
          '<span class="n">'+esc(l.icon||'📍')+' '+esc(l.name)+'</span><span class="g">'+(l.equipment.length?l.equipment.length+' Geräte':'Eigengewicht')+'</span></button>';
      }).join('') + '</div></div>';

    const warm = stepCard('Aufwärmen', '≈5 Min', WARMUP_TEXT, s.warmup, 'toggle-warmup');

    var middle = '';
    if (st.conditioning) {
      const plan = conditioningPlan();
      middle = '<div class="exercise '+(s.condDone?'done':'')+'">' +
        '<div class="head"><div class="grow"><div class="num">Hauptteil</div><h3>'+esc(plan.title)+'</h3>' +
        '<div class="scheme">'+state.sessionMinutes+' Min</div></div>' +
        checkEl(s.condDone, 'Kondition erledigt', 'toggle-cond', '') + '</div>' +
        '<p class="small" style="margin-top:10px">'+esc(plan.detail)+'</p></div>';
      s.planned.forEach(function (pid, idx) {
        middle += exerciseCard(resolveExercise(pid), s.entries[pid], 'Finisher ' + (idx+1), false);
      });
    } else {
      middle = s.planned.map(function (pid, idx) {
        return exerciseCard(resolveExercise(pid), s.entries[pid], 'Übung ' + (idx+1) + ' / ' + s.planned.length, true);
      }).join('');
    }

    const cool = stepCard('Abwärmen', '3–5 Min', COOLDOWN_TEXT, s.cooldown, 'toggle-cooldown');

    const mods = effMods();
    var note = '';
    if (mods.set < 0 || mods.count < 0 || mods.deload) {
      note += '<div class="notice notice--info" style="margin:0 0 12px">'+(mods.deload?'🔄 Deload · ':'')+(READINESS[todayReadiness()]?READINESS[todayReadiness()].icon+' '+esc(READINESS[todayReadiness()].label):'')+
        ' – Umfang/Last heute reduziert. Technik sauber, kein Maximalkraft-Versuch.</div>';
    }
    if (state.complaintsText.trim()) {
      note += '<div class="notice notice--warn" style="margin:0 0 12px">🩹 Dein Hinweis: '+esc(state.complaintsText.trim())+' – achte besonders darauf.</div>';
    }

    const finish = '<button class="btn btn--lg btn--block" data-action="finish">Einheit abschließen ✓</button>' +
      '<p class="small muted center" style="margin-top:8px">Alle Eingaben werden automatisch gespeichert.</p>';

    return '<div class="view view--full">'+header+locBar+note+warm+middle+cool+finish+'</div>';
  }

  function stepCard(title, scheme, text, done, action) {
    return '<div class="exercise '+(done?'done':'')+'">' +
      '<div class="head"><div class="grow"><h3>'+esc(title)+'</h3><div class="scheme">'+esc(scheme)+'</div></div>' +
      checkEl(done, title+' erledigt', action, '')+'</div>' +
      '<p class="small muted" style="margin-top:10px">'+esc(text)+'</p></div>';
  }
  function checkEl(done, label, action, id) {
    return '<div class="check" role="checkbox" tabindex="0" aria-checked="'+(done?'true':'false')+'" aria-label="'+esc(label)+'" data-action="'+action+'"'+(id?' data-id="'+esc(id)+'"':'')+'></div>';
  }

  function exerciseCard(res, entry, num, withIO) {
    const ex = res.exercise;
    entry = entry || { done:false, weight:'', reps:'', rpe:'' };
    var notice = '';
    if (res.warning) notice = '<div class="notice notice--warn">⚠️ '+esc(res.warning)+'</div>';
    else if (res.reason) notice = '<div class="notice notice--swap">↺ '+esc(res.reason)+'</div>';

    // Autoregulation: effektive Satzzahl
    const mods = effMods();
    const effSets = Math.max(2, ex.sets + mods.set);
    const setsNote = (mods.set < 0) ? ' <span class="faint small">(angepasst)</span>' : '';

    // Progression: "letztes Mal" + Vorschlag
    var progLine = '';
    if (withIO) {
      const sg = suggestNext(ex);
      if (sg) {
        if (sg.repeat) {
          progLine = '<div class="last-line">Letztes Mal: '+esc(sg.text)+'</div>';
        } else {
          const arrow = sg.up ? '↑' : (sg.down ? '↓' : '→');
          progLine = '<div class="last-line">Letztes Mal: <b>'+fmtKg(sg.last)+' kg</b>'+(sg.lastReps?' × '+esc(sg.lastReps):'') +
            ' <button class="sug" data-action="apply-suggest" data-id="'+res.plannedId+'" data-w="'+sg.next+'">Vorschlag '+fmtKg(sg.next)+' kg '+arrow+'</button></div>';
        }
      }
    }

    const io = withIO ? '<div class="io-fields">' +
      '<div class="field"><label for="w-'+res.plannedId+'">Gewicht kg</label>' +
      '<input id="w-'+res.plannedId+'" type="number" inputmode="decimal" min="0" step="0.5" value="'+esc(entry.weight)+'" data-field="weight" data-id="'+res.plannedId+'" placeholder="–"></div>' +
      '<div class="field"><label for="r-'+res.plannedId+'">Wdh.</label>' +
      '<input id="r-'+res.plannedId+'" type="number" inputmode="numeric" min="0" step="1" value="'+esc(entry.reps)+'" data-field="reps" data-id="'+res.plannedId+'" placeholder="–"></div>' +
      '<div class="field" style="flex:.7"><label for="rpe-'+res.plannedId+'">RPE</label>' +
      '<input id="rpe-'+res.plannedId+'" type="number" inputmode="decimal" min="0" max="10" step="0.5" value="'+esc(entry.rpe)+'" data-field="rpe" data-id="'+res.plannedId+'" placeholder="–"></div></div>' : '';

    return '<div class="exercise '+(entry.done?'done':'')+'">' +
      '<div class="head"><div class="grow"><div class="num">'+esc(num)+'</div><h3>'+esc(ex.name)+'</h3>' +
      '<div class="scheme">'+effSets+' × '+esc(ex.reps)+setsNote+'</div></div>' +
      checkEl(entry.done, ex.name+' erledigt', 'toggle-ex', res.plannedId)+'</div>' +
      notice + progLine + io +
      '<div class="ex-actions">' +
      '<a class="btn btn--soft btn--sm" href="#/uebung/'+ex.id+'">Übung ansehen</a>' +
      '<button class="btn btn--muted btn--sm" data-action="swap" data-id="'+res.plannedId+'">Tauschen</button></div></div>';
  }

  function renderNotFound(id) {
    return '<div class="view view--full">' +
      '<div class="topbar"><a class="iconbtn" href="#/" aria-label="Zurück">‹</a><h1>Nicht gefunden</h1></div>' +
      '<div class="card center stack"><div class="hero-ex">🧭</div>' +
      '<h2>Gibt es nicht</h2><p class="muted">Die Kennung „'+esc(id)+'" ist unbekannt.</p>' +
      '<a class="btn btn--block" href="#/">Zur Übersicht</a></div></div>';
  }

  /* ---------- Verlauf ---------- */
  function renderVerlauf() {
    const header = '<div class="topbar"><div class="grow"><p class="eyebrow">Logbuch</p><h1>Verlauf</h1></div></div>';
    if (!state.history.length) {
      return '<div class="view">'+header +
        '<div class="card empty"><span class="emoji">📈</span><p>Noch keine Einheiten.</p>' +
        '<p class="small">Starte dein erstes Training über „Heute" – danach erscheint hier dein Fortschritt.</p>' +
        '<a class="btn" href="#/">Zur Übersicht</a></div></div>';
    }
    const series = chartSeries();
    const alt = series.length ? series.map(function (p){ return formatDate(p.date)+': '+p.max+' kg'; }).join(' · ') : 'Noch keine Gewichtsdaten.';
    const chart = '<div class="card"><h3>Maximalgewicht pro Einheit</h3>' +
      (series.length
        ? '<div class="chart-wrap"><canvas id="chart" width="520" height="190" role="img" aria-label="Verlauf des Maximalgewichts pro Einheit. '+esc(alt)+'"></canvas></div>'
        : '<p class="muted small">Trag bei Übungen Gewichte ein – dann erscheint hier die Kurve.</p>') +
      '<p class="small muted">'+esc(alt)+'</p></div>';

    // Bestwerte (PRs)
    var prMap = {};
    state.history.forEach(function (h) {
      (h.exercises || []).forEach(function (e) {
        var w = parseFloat(e.weight); if (isNaN(w) || w <= 0) return;
        var o = epley(e.weight, e.doneReps);
        if (!prMap[e.id]) prMap[e.id] = { name: e.name, maxW: 0, best1: 0 };
        if (w > prMap[e.id].maxW) prMap[e.id].maxW = w;
        if (o > prMap[e.id].best1) prMap[e.id].best1 = o;
        prMap[e.id].name = e.name;
      });
    });
    var prArr = Object.keys(prMap).map(function (k){ return prMap[k]; })
      .sort(function (a,b){ return b.best1 - a.best1; }).slice(0, 8);
    var prCard = prArr.length
      ? '<div class="card"><h3>🏆 Bestwerte</h3>'+prArr.map(function (p){
          return '<div class="row-between" style="padding:9px 0;border-bottom:1px solid var(--line-soft)"><span>'+esc(p.name)+'</span>' +
            '<span class="small tnum"><b>'+fmtKg(p.maxW)+' kg</b>'+(p.best1>0?' · ≈1RM '+round1(p.best1):'')+'</span></div>';
        }).join('')+'<p class="small faint" style="margin:8px 0 0">1RM geschätzt (Epley-Formel) aus Gewicht × Wiederholungen.</p></div>'
      : '';

    const items = state.history.map(function (h) {
      var lines;
      if (h.type === 'CONDITION') lines = '<ul><li>'+esc(h.conditioning || 'Ausdauereinheit')+'</li></ul>';
      else lines = '<ul>'+h.exercises.map(function (e) {
        var d = []; if (e.weight) d.push(e.weight+' kg'); if (e.doneReps) d.push(e.doneReps+' Wdh.');
        return '<li>'+esc(e.name)+(e.pr?' 🏆':'')+(d.length?' – '+esc(d.join(', ')):' – '+e.sets+'×'+e.reps)+'</li>';
      }).join('')+'</ul>';

      var edit;
      if (editingHistoryId === h.id) {
        edit = '<div class="inline-fields" style="margin-top:10px">' +
          '<div class="field" style="flex:1"><input type="date" id="hd-'+h.id+'" value="'+esc(h.date)+'"></div>' +
          '<button class="btn btn--sm" data-action="save-history-date" data-id="'+h.id+'">OK</button>' +
          '<button class="btn btn--muted btn--sm" data-action="cancel-edit">×</button></div>';
      } else {
        edit = '<div class="btn-row" style="margin-top:10px">' +
          '<button class="btn btn--soft btn--sm" data-action="edit-history" data-id="'+h.id+'">Datum ändern</button>' +
          '<button class="btn btn--crit btn--sm" data-action="delete-history" data-id="'+h.id+'">Löschen</button></div>';
      }
      const metaTags = '<div class="tags" style="margin-top:4px">' +
        (h.location?'<span class="tag">📍 '+esc(h.location)+'</span>':'') +
        (h.minutes?'<span class="tag">⏱ '+h.minutes+'′</span>':'') + '</div>';

      return '<div class="card history-item">' +
        '<div class="meta"><h3 style="margin:0">'+(SESSIONS[h.type]?SESSIONS[h.type].icon+' ':'')+esc(h.typeName)+'</h3>' +
        '<span class="small muted tnum">'+formatDate(h.date)+'</span></div>'+metaTags+lines+edit+'</div>';
    }).join('');

    return '<div class="view">'+header+chart+prCard+items+'</div>';
  }

  function chartSeries() {
    return state.history.slice().reverse().map(function (h) {
      const w = (h.exercises||[]).map(function (e){ return parseFloat(e.weight); }).filter(function (v){ return !isNaN(v) && v>0; });
      return { date:h.date, max: w.length ? Math.max.apply(null, w) : 0 };
    }).filter(function (p){ return p.max > 0; });
  }

  function drawChart() {
    const canvas = document.getElementById('chart'); if (!canvas) return;
    const series = chartSeries(); if (!series.length) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 320, cssH = 190;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0,0,cssW,cssH);
    const css = getComputedStyle(document.documentElement);
    const orange = (css.getPropertyValue('--orange') || '#ff6a2b').trim();
    const line = (css.getPropertyValue('--line') || '#273341').trim();
    const muted = (css.getPropertyValue('--muted') || '#94a3b6').trim();
    const padL = 38, padR = 14, padT = 14, padB = 26;
    const w = cssW - padL - padR, h = cssH - padT - padB;
    const maxV = Math.max.apply(null, series.map(function (p){ return p.max; }));
    const niceMax = Math.max(5, Math.ceil(maxV/5)*5);

    ctx.strokeStyle = line; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL,padT); ctx.lineTo(padL,padT+h); ctx.lineTo(padL+w,padT+h); ctx.stroke();
    ctx.font = '11px ui-monospace, monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var g=0; g<=2; g++) { var val=(niceMax/2)*g, yy=padT+h-(val/niceMax)*h;
      ctx.strokeStyle = line; ctx.globalAlpha=.5; ctx.beginPath(); ctx.moveTo(padL,yy); ctx.lineTo(padL+w,yy); ctx.stroke(); ctx.globalAlpha=1;
      ctx.fillStyle = muted; ctx.fillText(String(val), padL-6, yy); }

    function xAt(i){ return series.length===1 ? padL+w/2 : padL+(i/(series.length-1))*w; }
    function yAt(v){ return padT+h-(v/niceMax)*h; }

    ctx.beginPath(); ctx.moveTo(xAt(0), padT+h);
    series.forEach(function (p,i){ ctx.lineTo(xAt(i), yAt(p.max)); });
    ctx.lineTo(xAt(series.length-1), padT+h); ctx.closePath();
    ctx.fillStyle = orange; ctx.globalAlpha = .12; ctx.fill(); ctx.globalAlpha = 1;

    ctx.strokeStyle = orange; ctx.lineWidth = 2.5; ctx.beginPath();
    series.forEach(function (p,i){ var x=xAt(i), y=yAt(p.max); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); }); ctx.stroke();
    ctx.fillStyle = orange;
    series.forEach(function (p,i){ ctx.beginPath(); ctx.arc(xAt(i), yAt(p.max), 3.5, 0, Math.PI*2); ctx.fill(); });
    ctx.fillStyle = muted; ctx.textBaseline='top'; ctx.textAlign='left';
    ctx.fillText(formatDate(series[0].date).slice(0,5), padL, padT+h+6);
    if (series.length>1){ ctx.textAlign='right'; ctx.fillText(formatDate(series[series.length-1].date).slice(0,5), padL+w, padT+h+6); }
  }

  /* ---------- Orte ---------- */
  function renderOrte() {
    return '<div class="view">' +
      '<div class="topbar"><div class="grow"><p class="eyebrow">Material-Profile</p><h1>Orte</h1></div></div>' +
      '<p class="muted small" style="margin-bottom:12px">Lege für jeden Ort fest, welches Material da ist. ' +
      'Der aktive Ort bestimmt, womit der Plan rechnet. Tipp auf einen Ort zum Bearbeiten.</p>' +
      '<div class="card card--tight"><div class="small muted" style="margin-bottom:8px">Aktiver Ort</div>' +
      '<div class="loc-switch">' + state.locations.map(function (l) {
        const on = l.id === state.activeLocationId;
        return '<button class="loc-chip" aria-pressed="'+(on?'true':'false')+'" data-action="set-loc" data-id="'+l.id+'">' +
          '<span class="n">'+esc(l.icon||'📍')+' '+esc(l.name)+'</span><span class="g">'+(l.equipment.length?l.equipment.length+' Geräte':'Eigengewicht')+'</span></button>';
      }).join('') + '</div></div>' +
      locationsEditorHTML() +
      '</div>';
  }

  /* ---------- Einstellungen ---------- */
  function renderSettings() {
    return '<div class="view">' +
      '<div class="topbar"><div class="grow"><p class="eyebrow">Konfiguration</p><h1>Einstellungen</h1></div></div>' +

      '<div class="card"><h3>Trainingsmenge</h3>'+freqDurationHTML()+
      '<div class="card card--flat"><label>Standard-Satzpause (Auto-Timer)</label>' +
      '<div class="stepper"><button data-action="rest-dec" aria-label="kürzer">–</button>' +
      '<div class="val">'+(state.restDefault?state.restDefault:'Aus')+'<small>'+(state.restDefault?'SEKUNDEN':'KEIN TIMER')+'</small></div>' +
      '<button data-action="rest-inc" aria-label="länger">+</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">Startet nach jedem abgehakten Satz automatisch. 0 = aus.</p></div></div>' +

      '<div class="card"><h3>Beschwerden</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Betroffene Übungen werden automatisch sicher ersetzt. ' +
      'Du kannst das auch direkt auf dem Dashboard pro Tag setzen.</p>' +
      complaintTogglesHTML() +
      '<div class="field"><label for="ct">Sonstige Beschwerden</label>' +
      '<textarea id="ct" data-field="complaintsText" placeholder="z. B. Nacken verspannt">'+esc(state.complaintsText)+'</textarea>' +
      '<p class="small muted">Wird im Training als Hinweis angezeigt.</p></div></div>' +

      '<div class="card"><h3>Ausrichtung</h3>' +
      '<p class="small"><span class="pill pill--orange">Schwerpunkt Polizei / Feuerwehr</span></p>' +
      '<p class="small muted" style="margin:8px 0 0">Kraft, Work Capacity, Tragen &amp; Greifen, Kondition. ' +
      'Im Winter'+(isWinter()?' (aktuell aktiv)':'')+' kommt automatisch eine Ski-Prep-Einheit dazu (Beine, Balance, Knie-Prävention).</p></div>' +

      '<div class="card"><h3>Design</h3>' +
      '<div class="chips">' +
      ['auto','dark','light'].map(function (t) {
        const label = t==='auto'?'◐ Automatisch':t==='dark'?'🌙 Dunkel':'☀️ Hell';
        return '<button class="chip" aria-pressed="'+(state.theme===t?'true':'false')+'" data-action="set-theme" data-theme="'+t+'">'+label+'</button>';
      }).join('') + '</div></div>' +

      '<div class="card"><h3>Datensicherung</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Deine Daten liegen nur auf diesem Gerät. Sichere sie regelmäßig – ' +
      'z. B. vor einem Handywechsel oder App-Update.</p>' +
      '<div class="btn-row">' +
      '<button class="btn btn--soft" data-action="export-data">⤓ Backup-Datei</button>' +
      '<button class="btn btn--muted" data-action="copy-data">Kopieren</button></div>' +
      '<label class="btn btn--ghost btn--block" for="importFile" style="margin-top:10px">⤒ Backup laden (Import)</label>' +
      '<input type="file" id="importFile" accept="application/json,.json" class="hidden">' +
      '<p class="small faint" style="margin:8px 0 0">Import ersetzt alle aktuellen Daten.</p></div>' +

      '<div class="card"><h3>Profil</h3>' +
      '<div class="field"><label for="nm">Name (optional)</label>' +
      '<input type="text" id="nm" value="'+esc(state.name)+'" data-field="name" placeholder="Dein Name"></div>' +
      '<div class="btn-row" style="margin-top:14px">' +
      '<button class="btn btn--crit" data-action="reset-all">Alle Daten zurücksetzen</button></div></div>' +

      '<p class="center small faint" style="margin-top:6px">EinsatzFit · läuft offline · Daten nur auf diesem Gerät</p>' +
      '</div>';
  }

  /* ---------- Übungsdetail ---------- */
  function renderUebung(id) {
    const ex = EX[id]; if (!ex) return renderNotFound(id);
    const eqTags = (ex.equipment && ex.equipment.length)
      ? '<span class="tag">benötigt: '+ex.equipment.map(function (e){ return EQUIP[e]?EQUIP[e].label:e; }).join(' / ')+'</span>'
      : '<span class="tag">kein Gerät nötig</span>';
    const loadTags = ex.loads.map(function (l){ return '<span class="tag tag--load">belastet '+(COMPLAINTS[l]?COMPLAINTS[l].label:l)+'</span>'; }).join('');
    const steps = '<ol class="steps">'+ex.steps.map(function (s){ return '<li>'+esc(s)+'</li>'; }).join('')+'</ol>';
    const coach = ex.coach ? '<div class="coach">💡 '+esc(ex.coach)+'</div>' : '';
    const musTags = (MUS[id]||[]).map(function (m){ return '<span class="tag">'+esc(MUSCLE_LABELS[m]||m)+'</span>'; }).join('');
    const pr = prFor(id);
    const prLine = pr.maxW > 0
      ? '<div class="row-between" style="margin-top:4px"><span class="pill pill--orange">🏆 Bestwert '+fmtKg(pr.maxW)+' kg</span>' +
        (pr.best1>0?'<span class="small muted tnum">≈ 1RM '+round1(pr.best1)+' kg</span>':'')+'</div>'
      : '';
    return '<div class="view">' +
      '<div class="topbar"><a class="iconbtn" href="#/" aria-label="Zurück">‹</a>' +
      '<h1 style="font-size:1.2rem">'+esc(ex.name)+'</h1></div>' +
      '<div class="card"><div class="row-between" style="margin-bottom:4px"><h3 style="margin:0">Beanspruchte Muskeln</h3>' +
      '<span style="font-size:1.6rem">'+(ex.emoji||'💪')+'</span></div>' +
      bodyDiagram(id) +
      '<div class="tags" style="margin-top:10px">'+musTags+'</div></div>' +
      '<div class="card stack"><div><h3>Zielmuskulatur</h3><p class="muted" style="margin:0">'+esc(ex.target)+'</p></div>' +
      '<div><h3 style="margin-bottom:6px">Schema</h3><p class="tnum" style="margin:0">'+ex.sets+' Sätze × '+esc(ex.reps)+'</p>'+prLine+'</div>' +
      '<div class="tags">'+eqTags+loadTags+'</div></div>' +
      '<div class="card"><h3>So geht’s</h3>'+steps+coach+'</div>' +
      '<div class="card stack"><p class="small muted">Kurzes Technik-Video? Öffnet eine YouTube-Suche (kein eigenes Hosting).</p>' +
      '<a class="btn btn--ghost btn--block" href="'+ytLink(ex.name)+'" target="_blank" rel="noopener">▶ Auf YouTube suchen</a></div>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Events
     ---------------------------------------------------------------------- */
  function onClick(ev) {
    const el = ev.target.closest('[data-action]'); if (!el) return;
    const a = el.getAttribute('data-action');
    switch (a) {
      case 'onb-next': onboardStep = Math.min(5, onboardStep+1); render(); break;
      case 'onb-back': onboardStep = Math.max(1, onboardStep-1); render(); break;
      case 'onb-finish': state.onboarded = true; save(); onboardStep = 1; location.hash = '#/'; render(); break;

      case 'cycle-theme': {
        state.theme = state.theme==='auto'?'dark':state.theme==='dark'?'light':'auto';
        applyTheme(); save(); render(); break;
      }
      case 'set-theme': state.theme = el.getAttribute('data-theme'); applyTheme(); save(); render(); break;

      case 'toggle-complaint': { const k = el.getAttribute('data-key'); state.complaints[k] = !state.complaints[k]; save(); render(); break; }

      case 'set-loc': state.activeLocationId = el.getAttribute('data-id'); save(); render(); break;
      case 'toggle-loc-edit': editLocationId = (editLocationId === el.getAttribute('data-id')) ? null : el.getAttribute('data-id'); render(); break;
      case 'toggle-loc-equip': {
        const lid = el.getAttribute('data-id'), eq = el.getAttribute('data-eq');
        const loc = state.locations.find(function (l){ return l.id === lid; });
        if (loc) { const i = loc.equipment.indexOf(eq); if (i===-1) loc.equipment.push(eq); else loc.equipment.splice(i,1); save(); render(); }
        break;
      }
      case 'add-loc': {
        const inp = document.getElementById('newLocInput');
        if (inp && inp.value.trim()) { const nl = { id:uid(), name:inp.value.trim(), icon:'📍', equipment:[] }; state.locations.push(nl); editLocationId = nl.id; save(); render(); }
        break;
      }
      case 'remove-loc': {
        const lid = el.getAttribute('data-id');
        if (state.locations.length <= 1) { alert('Mindestens ein Ort muss bestehen bleiben.'); break; }
        if (confirm('Diesen Ort löschen?')) {
          state.locations = state.locations.filter(function (l){ return l.id !== lid; });
          if (state.activeLocationId === lid) state.activeLocationId = state.locations[0].id;
          if (editLocationId === lid) editLocationId = null;
          save(); render();
        }
        break;
      }

      case 'freq-dec': state.frequency = Math.max(2, state.frequency-1); save(); render(); break;
      case 'freq-inc': state.frequency = Math.min(6, state.frequency+1); save(); render(); break;
      case 'dur-dec': state.sessionMinutes = Math.max(20, state.sessionMinutes-5); save(); render(); break;
      case 'dur-inc': state.sessionMinutes = Math.min(75, state.sessionMinutes+5); save(); render(); break;

      case 'toggle-warmup': if (state.currentSession){ state.currentSession.warmup = !state.currentSession.warmup; save(); render(); } break;
      case 'toggle-cooldown': if (state.currentSession){ state.currentSession.cooldown = !state.currentSession.cooldown; save(); render(); } break;
      case 'toggle-cond': if (state.currentSession){ state.currentSession.condDone = !state.currentSession.condDone; save(); render(); } break;
      case 'toggle-ex': {
        const pid = el.getAttribute('data-id');
        if (state.currentSession && state.currentSession.entries[pid]) {
          const e = state.currentSession.entries[pid]; e.done = !e.done; save();
          if (e.done && state.restDefault > 0) { ensureAudio(); startRest(state.restDefault); } // Auto-Pausentimer
          render();
        }
        break;
      }
      case 'dismiss-summary': state.lastSummary = null; save(); render(); break;
      case 'rest-dec': state.restDefault = Math.max(0, state.restDefault - 15); save(); render(); break;
      case 'rest-inc': state.restDefault = Math.min(300, state.restDefault + 15); save(); render(); break;
      case 'start-rest': ensureAudio(); startRest(state.restDefault || 90); break;

      case 'dismiss-install': state.hideInstallHint = true; save(); render(); break;
      case 'install-app': {
        if (efDeferredPrompt) { efDeferredPrompt.prompt(); efDeferredPrompt.userChoice.finally(function () { efDeferredPrompt = null; render(); }); }
        break;
      }
      case 'swap': swapExercise(el.getAttribute('data-id')); render(); break;
      case 'finish': finishSession(); break;

      case 'set-readiness': state.readiness = { date: todayStr(), level: el.getAttribute('data-level') }; save(); render(); break;
      case 'apply-suggest': {
        const pid = el.getAttribute('data-id'); const wv = el.getAttribute('data-w');
        if (state.currentSession && state.currentSession.entries[pid]) { state.currentSession.entries[pid].weight = wv; save(); render(); }
        break;
      }
      case 'export-data': exportData(); break;
      case 'copy-data': copyData(); break;

      case 'edit-history': editingHistoryId = el.getAttribute('data-id'); render(); break;
      case 'cancel-edit': editingHistoryId = null; render(); break;
      case 'save-history-date': {
        const hid = el.getAttribute('data-id'); const di = document.getElementById('hd-'+hid);
        if (di && di.value) { const en = state.history.find(function (x){ return x.id === hid; }); if (en) en.date = di.value; save(); }
        editingHistoryId = null; render(); break;
      }
      case 'delete-history': {
        if (confirm('Diesen Eintrag löschen?')) { const hid = el.getAttribute('data-id');
          state.history = state.history.filter(function (x){ return x.id !== hid; }); save(); render(); }
        break;
      }
      case 'reset-all': {
        if (confirm('Wirklich ALLE Daten löschen und neu beginnen?')) { localStorage.removeItem(KEY); state = defaultState(); onboardStep = 1; applyTheme(); location.hash = '#/'; render(); }
        break;
      }
    }
  }

  function onInput(ev) {
    const t = ev.target; const f = t.getAttribute('data-field'); if (!f) return;
    if (f === 'weight' || f === 'reps' || f === 'rpe') {
      const id = t.getAttribute('data-id');
      if (state.currentSession && state.currentSession.entries[id]) { state.currentSession.entries[id][f] = t.value; save(); }
    } else if (f === 'complaintsText') { state.complaintsText = t.value; save(); }
    else if (f === 'name') { state.name = t.value; save(); }
    else if (f === 'loc-name') { const loc = state.locations.find(function (l){ return l.id === t.getAttribute('data-id'); }); if (loc) { loc.name = t.value; save(); } }
  }

  function onChange(ev) {
    const t = ev.target;
    if (t && t.id === 'importFile' && t.files && t.files[0]) { importData(t.files[0]); t.value = ''; }
  }

  function onKey(ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
    const el = ev.target.closest('[role="checkbox"][data-action]');
    if (el) { ev.preventDefault(); el.click(); }
  }

  /* ----------------------------------------------------------------------
     Timer (Satzpause + Intervalle) — lebt außerhalb von #app,
     damit er Re-Renders der App übersteht.
     ---------------------------------------------------------------------- */
  var ef = { iv:null, left:0, running:false, mode:'rest', phase:'idle', work:0, rest:0, rounds:0, round:0, actx:null };

  function timerDOM() {
    var el = document.getElementById('ef-timer');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'ef-timer'; el.className = 'ef-timer hidden'; el.setAttribute('data-phase', 'idle');
    el.innerHTML =
      '<div class="ef-top"><div class="ef-read"><span id="ef-mode" class="ef-mode">Timer</span>' +
      '<span id="ef-time" class="ef-time">0:00</span></div>' +
      '<div class="ef-presets">' +
      '<button class="ef-btn" data-t="rest" data-s="60">1:00</button>' +
      '<button class="ef-btn" data-t="rest" data-s="90">1:30</button>' +
      '<button class="ef-btn" data-t="rest" data-s="120">2:00</button>' +
      '<button class="ef-btn" data-t="add">+15</button>' +
      '<button class="ef-btn ef-stop" data-t="stop" aria-label="Timer stoppen">■</button>' +
      '</div></div>' +
      '<div class="ef-intv"><span class="ef-lbl">Intervall</span>' +
      '<button class="ef-btn" data-t="intv" data-w="20" data-r="10" data-n="8">20/10 ×8</button>' +
      '<button class="ef-btn" data-t="intv" data-w="40" data-r="20" data-n="8">40/20 ×8</button>' +
      '<button class="ef-btn" data-t="intv" data-w="60" data-r="0" data-n="10">EMOM ×10</button>' +
      '</div>';
    document.body.appendChild(el);
    el.addEventListener('click', onTimerClick);
    return el;
  }

  function ensureAudio() {
    try {
      if (!ef.actx) ef.actx = new (window.AudioContext || window.webkitAudioContext)();
      if (ef.actx && ef.actx.state === 'suspended') ef.actx.resume();
    } catch (e) {}
  }
  function beep(freq, dur) {
    if (!ef.actx) return;
    try {
      var o = ef.actx.createOscillator(), g = ef.actx.createGain();
      o.type = 'sine'; o.frequency.value = freq || 880; o.connect(g); g.connect(ef.actx.destination);
      var t = ef.actx.currentTime;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.15));
      o.start(t); o.stop(t + (dur || 0.15));
    } catch (e) {}
  }
  function buzz(ms) { if (navigator.vibrate) { try { navigator.vibrate(ms || 120); } catch (e) {} } }
  function doneSignal() { beep(1047, 0.22); setTimeout(function () { beep(1319, 0.28); }, 180); buzz(300); }

  function onTimerClick(ev) {
    var b = ev.target.closest('[data-t]'); if (!b) return;
    ensureAudio();
    var t = b.getAttribute('data-t');
    if (t === 'rest') startRest(parseInt(b.getAttribute('data-s'), 10));
    else if (t === 'add') { ef.left += 15; if (!ef.running) { ef.running = true; ef.mode = 'rest'; ef.phase = 'rest'; startTick(); } updateTimer(); }
    else if (t === 'stop') stopTimer();
    else if (t === 'intv') startInterval(+b.getAttribute('data-w'), +b.getAttribute('data-r'), +b.getAttribute('data-n'));
  }

  function startTick() { clearInterval(ef.iv); updateTimer(); ef.iv = setInterval(tickTimer, 1000); }
  function startRest(sec) { ef.mode = 'rest'; ef.phase = 'rest'; ef.left = sec; ef.running = true; beep(660, 0.08); buzz(60); startTick(); }
  function startInterval(work, rest, rounds) {
    ef.mode = 'interval'; ef.work = work; ef.rest = rest; ef.rounds = rounds; ef.round = 1; ef.phase = 'work'; ef.left = work; ef.running = true;
    beep(880, 0.18); buzz(150); startTick();
  }
  function stopTimer() { ef.running = false; clearInterval(ef.iv); ef.iv = null; ef.left = 0; ef.mode = 'rest'; ef.phase = 'idle'; updateTimer(); }

  function tickTimer() {
    if (!ef.running) return;
    ef.left--;
    if (ef.left <= 0) onPhaseEnd();
    updateTimer();
  }
  function onPhaseEnd() {
    if (ef.mode === 'rest') { doneSignal(); ef.running = false; clearInterval(ef.iv); ef.left = 0; ef.phase = 'done'; return; }
    // Intervall
    if (ef.phase === 'work' && ef.rest > 0) { ef.phase = 'rest'; ef.left = ef.rest; beep(440, 0.15); buzz(120); return; }
    if (ef.round >= ef.rounds) { doneSignal(); ef.running = false; clearInterval(ef.iv); ef.left = 0; ef.phase = 'done'; return; }
    ef.round++; ef.phase = 'work'; ef.left = ef.work; beep(880, 0.18); buzz(150);
  }

  function fmtTime(s) { s = Math.max(0, s | 0); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function updateTimer() {
    var el = document.getElementById('ef-timer'); if (!el) return;
    var timeEl = document.getElementById('ef-time'), modeEl = document.getElementById('ef-mode');
    if (timeEl) timeEl.textContent = fmtTime(ef.left);
    var label = 'Timer', phase = 'idle';
    if (ef.mode === 'rest') {
      if (ef.phase === 'done') { label = 'Pause fertig'; phase = 'done'; }
      else if (ef.running) { label = 'Satzpause'; phase = 'rest'; }
    } else if (ef.mode === 'interval') {
      if (ef.phase === 'work') { label = 'Arbeit ' + ef.round + '/' + ef.rounds; phase = 'work'; }
      else if (ef.phase === 'rest') { label = 'Pause ' + ef.round + '/' + ef.rounds; phase = 'rest'; }
      else if (ef.phase === 'done') { label = 'Fertig 💪'; phase = 'done'; }
    }
    if (modeEl) modeEl.textContent = label;
    el.setAttribute('data-phase', phase);
  }

  function showTimer(v) {
    var el = timerDOM();
    el.classList.toggle('hidden', !v);
    document.body.classList.toggle('has-timer', v);
    if (!v) stopTimer();
    else updateTimer();
  }

  /* ----------------------------------------------------------------------
     PWA: Installation & Updates
     ---------------------------------------------------------------------- */
  var efReg = null, efDeferredPrompt = null, efRefreshing = false;

  function isStandalone() {
    try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; }
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }

  function toastDOM() {
    var el = document.getElementById('ef-toast');
    if (el) return el;
    el = document.createElement('div'); el.id = 'ef-toast'; el.className = 'ef-toast hidden';
    document.body.appendChild(el);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-action]'); if (!b) return;
      var a = b.getAttribute('data-action');
      if (a === 'sw-update') { if (efReg && efReg.waiting) efReg.waiting.postMessage({ type: 'SKIP_WAITING' }); hideToast(); }
      else if (a === 'toast-close') hideToast();
    });
    return el;
  }
  function showToast(html) { var el = toastDOM(); el.innerHTML = html; el.classList.remove('hidden'); }
  function hideToast() { var el = document.getElementById('ef-toast'); if (el) el.classList.add('hidden'); }

  function installHintHTML() {
    if (isStandalone() || state.hideInstallHint) return '';
    var body = isIOS()
      ? 'Installiere EinsatzFit als App: In Safari <b>Teilen</b> ⎋ antippen → <b>„Zum Home-Bildschirm"</b>.'
      : 'Installiere EinsatzFit als App für Offline-Nutzung und Vollbild.';
    var btn = (!isIOS() && efDeferredPrompt)
      ? '<button class="btn btn--soft btn--sm" data-action="install-app">App installieren</button>' : '';
    return '<div class="card card--steel"><div class="row-between"><div class="row" style="gap:8px"><span style="font-size:1.3rem">📲</span>' +
      '<h3 style="margin:0">Als App installieren</h3></div>' +
      '<button class="iconbtn" data-action="dismiss-install" aria-label="Schließen" style="width:36px;height:36px;font-size:1rem">✕</button></div>' +
      '<p class="small" style="margin:8px 0 '+(btn?'10px':'0')+'">'+body+'</p>'+btn+'</div>';
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      efReg = reg;
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast();
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast();
        });
      });
    }).catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (efRefreshing) return; efRefreshing = true; location.reload();
    });
  }
  function showUpdateToast() {
    showToast('<span>🔄 Neue Version verfügbar.</span>' +
      '<button class="btn btn--sm" data-action="sw-update">Aktualisieren</button>' +
      '<button class="iconbtn" data-action="toast-close" aria-label="Schließen" style="width:34px;height:34px">✕</button>');
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  function init() {
    state = load();
    applyTheme();
    const app = document.getElementById('app');
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    app.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', render);

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); efDeferredPrompt = e;
      if (state.onboarded && parseHash().route === 'home') render();
    });
    window.addEventListener('appinstalled', function () { efDeferredPrompt = null; state.hideInstallHint = true; save(); });

    render();
    if ('serviceWorker' in navigator) window.addEventListener('load', registerSW);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
