/* =========================================================================
   EinsatzFit — Trainings-App für Einsatzkräfte (Polizei / Feuerwehr / Ski)
   Vanilla JS, Hash-Routing, State in einem localStorage-Key. Zero Dependencies.
   Kernideen:
   - ORTE mit eigenem Material (Wache / Zuhause / Unterwegs ...) – vor jeder
     Einheit wählbar; der Plan passt sich dem Material des Ortes an.
   - Tägliche BESCHWERDEN -> automatische Ersatz-Übungen (Kaskade).
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
    springseil:     { label: 'Springseil',      icon: '➰' },
    trap_bar:       { label: 'Trap-Bar',        icon: '🏋️' },
    ez_stange:      { label: 'EZ-Stange',       icon: '🏋️' },
    hantelbank:     { label: 'Hantelbank',      icon: '🛋️' },
    dip_barren:     { label: 'Dip-Barren',      icon: '🤸' },
    trx:            { label: 'Schlingentrainer',icon: '🪢' },
    medizinball:    { label: 'Medizinball',     icon: '⚽' },
    sandsack:       { label: 'Sandsack',        icon: '💼' },
    ab_roller:      { label: 'Bauchroller',     icon: '🛞' },
    seilzug:        { label: 'Kabelzug',        icon: '🏗️' },
    laufband:       { label: 'Laufband',        icon: '🏃' },
    ergometer:      { label: 'Ergometer',       icon: '🚴' }
  };
  // Geräte mit einstellbarem Gewichts-Vorrat (für die Vorschlag-Einrastung)
  const WEIGHTED_EQUIP = ['kurzhanteln','langhantel','kettlebell','gewichtsweste','trap_bar','ez_stange'];

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
    single_leg_balance:['calves','glutes'], wall_sit:['quads'],
    front_squat:['quads','glutes','abs'], sumo_deadlift:['glutes','hamstrings','lowerback','quads'],
    good_morning:['hamstrings','lowerback','glutes'], reverse_lunge:['quads','glutes'],
    incline_db_press:['chest','shoulders','triceps'], hammer_curl:['biceps','forearms'],
    chinup:['lats','biceps','forearms'], trx_row:['lats','traps','biceps'],
    reverse_fly:['shoulders','traps'], diamond_pushup:['triceps','chest'],
    lateral_raise:['shoulders'], sandbag_squat:['quads','glutes','lowerback'],
    sandbag_carry:['forearms','traps','abs','lowerback'], bear_crawl:['abs','shoulders','quads'],
    broad_jump:['quads','glutes','calves'], flutter_kick:['abs']
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
     loads: belastete Regionen. alternatives: mögliche Ausweichkette.
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
      steps:['Rücken an der Wand, Oberschenkel waagerecht.','Knie über den Knöcheln.','Position halten, ruhig atmen.','Langsam hochschieben.'] },

    /* ---- Stufe 2: zusätzliche Übungen ---- */
    front_squat: { id:'front_squat', name:'Frontkniebeuge', emoji:'🏋️',
      target:'Oberschenkel vorne, Rumpf', equipment:['langhantel','kurzhanteln','kettlebell'], loads:['knie'], sets:4, reps:'6–10', min:8, alternatives:['bw_squat'],
      steps:['Gewicht vorne auf den Schultern ablegen, Ellenbogen hoch.','Schulterbreiter Stand, Rumpf fest.','Aufrecht in die Hocke, Knie Richtung Zehen.','Durch die Fersen nach oben drücken.'],
      coach:'Aufrechter Oberkörper – fordert Rumpf und vordere Oberschenkel stärker.' },
    sumo_deadlift: { id:'sumo_deadlift', name:'Sumo-Kreuzheben', emoji:'🏋️',
      target:'Gesäß, Beininnenseite, Rücken', equipment:['langhantel','kurzhanteln','kettlebell'], loads:['ruecken'], sets:4, reps:'5–8', min:8, alternatives:['hip_thrust'],
      steps:['Breiter Stand, Zehen leicht nach außen.','Gewicht mittig greifen, Rücken gerade, Brust raus.','Über Fersen und Hüfte strecken.','Kontrolliert ablassen, Rücken neutral.'] },
    good_morning: { id:'good_morning', name:'Good Morning', emoji:'🙇',
      target:'Beinrückseite, unterer Rücken', equipment:['langhantel','band'], loads:['ruecken'], sets:3, reps:'10–12', min:6, alternatives:['glute_bridge'],
      steps:['Gewicht/Band im Nacken, leichte Kniebeugung.','Hüfte nach hinten, Oberkörper neigen, Rücken gerade.','Bis Zug in der Beinrückseite.','Hüfte nach vorn aufrichten.'],
      coach:'Nur so weit beugen, wie der Rücken gerade bleibt.' },
    reverse_lunge: { id:'reverse_lunge', name:'Rückwärts-Ausfallschritt', emoji:'🦵',
      target:'Oberschenkel, Gesäß, Balance', equipment:[], loads:['knie'], sets:3, reps:'10 / Seite', min:5, alternatives:['box_squat'],
      steps:['Aufrechter Stand, optional Gewicht halten.','Einen Schritt nach hinten, hinteres Knie Richtung Boden.','Vorderes Knie stabil über dem Fuß.','Zurück in den Stand, Seite wechseln.'],
      coach:'Rückwärts ist meist knieschonender als vorwärts.' },
    incline_db_press: { id:'incline_db_press', name:'Schrägbankdrücken', emoji:'💪',
      target:'Obere Brust, Schulter, Trizeps', equipment:['kurzhanteln'], requires:['hantelbank'], loads:['schulter'], sets:4, reps:'8–12', min:7, alternatives:['floor_press'],
      steps:['Auf der schräg gestellten Bank, Gewichte über der Brust.','Schulterblätter zusammen.','Kontrolliert zur oberen Brust senken.','Nach oben drücken.'] },
    hammer_curl: { id:'hammer_curl', name:'Hammer-Curls', emoji:'🔨',
      target:'Bizeps, Unterarm', equipment:['kurzhanteln'], loads:['ellenbogen'], sets:3, reps:'10–12', min:4, alternatives:['curl'],
      steps:['Gewichte seitlich, Handflächen zeigen zueinander.','Ellenbogen am Körper.','Nach oben curlen, Daumen oben.','Langsam ablassen.'] },
    chinup: { id:'chinup', name:'Klimmzüge (Untergriff)', emoji:'🙆',
      target:'Rücken, Bizeps', equipment:['klimmzugstange'], loads:['schulter','ellenbogen'], sets:4, reps:'max / 5–8', min:7, alternatives:['inverted_row'],
      steps:['Stange im Untergriff, schulterbreit.','Schulterblätter aktiv nach unten.','Brust zur Stange ziehen.','Kontrolliert ablassen.'],
      coach:'Untergriff nimmt den Bizeps stärker mit.' },
    trx_row: { id:'trx_row', name:'Rudern am Schlingentrainer', emoji:'🪢',
      target:'Oberer Rücken, Rumpf', equipment:['trx'], loads:[], sets:3, reps:'10–15', min:6, alternatives:['db_row'],
      steps:['Griffe halten, Körper schräg zurücklehnen.','Körper gerade, Rumpf fest.','Brust zu den Händen ziehen.','Kontrolliert ablassen.'] },
    reverse_fly: { id:'reverse_fly', name:'Reverse Flys', emoji:'🕊️',
      target:'Hintere Schulter, oberer Rücken (Haltung)', equipment:['kurzhanteln','band'], loads:['schulter'], sets:3, reps:'12–15', min:4, alternatives:['band_pullapart'],
      steps:['Leicht vorgebeugt, Arme hängen (oder Band vorn).','Arme seitlich öffnen, leicht gebeugt.','Schulterblätter zusammen.','Langsam zurückführen.'] },
    diamond_pushup: { id:'diamond_pushup', name:'Enge Liegestütze', emoji:'💠',
      target:'Trizeps, innere Brust', equipment:[], loads:['schulter','handgelenk','ellenbogen'], sets:3, reps:'8–12', min:5, alternatives:['pushup_knee'],
      steps:['Hände eng unter der Brust (Dreieck).','Körper in einer Linie, Rumpf fest.','Kontrolliert absenken, Ellenbogen eng.','Nach oben drücken.'] },
    lateral_raise: { id:'lateral_raise', name:'Seitheben', emoji:'🙆',
      target:'Seitliche Schulter', equipment:['kurzhanteln','band'], loads:['schulter'], sets:3, reps:'12–15', min:4, alternatives:['band_pullapart'],
      steps:['Gewichte seitlich, Arme leicht gebeugt.','Arme bis Schulterhöhe seitlich heben.','Kurz halten, nicht schwingen.','Langsam ablassen.'] },
    sandbag_squat: { id:'sandbag_squat', name:'Sandsack-Kniebeuge', emoji:'💼',
      target:'Oberschenkel, Gesäß, Rumpf (Einsatz)', equipment:['sandsack'], loads:['knie'], sets:3, reps:'10–12', min:6, alternatives:['bw_squat'],
      steps:['Sandsack vor der Brust oder auf der Schulter.','Schulterbreiter Stand, Rumpf fest.','In die Hocke, Rücken gerade.','Nach oben drücken.'],
      coach:'Instabile Last – einsatznah, fordert den Rumpf extra.' },
    sandbag_carry: { id:'sandbag_carry', name:'Sandsack tragen', emoji:'💼',
      target:'Ganzkörper, Griff, Rumpf (Einsatz)', equipment:['sandsack'], loads:[], sets:3, reps:'30–40 m', min:6, alternatives:['farmers_carry'],
      steps:['Sandsack schultern oder umarmen.','Aufrecht, Rumpf fest.','Kontrolliert gehen, ruhig atmen.','Einsatznah: z. B. über Treppen tragen.'] },
    bear_crawl: { id:'bear_crawl', name:'Bärengang', emoji:'🐻',
      target:'Rumpf, Schulter, Koordination', equipment:[], loads:['schulter','handgelenk'], sets:3, reps:'20–30 Sek', min:4, alternatives:['plank'],
      steps:['Vierfüßlerstand, Knie knapp über dem Boden.','Rücken flach, Rumpf fest.','Diagonal Hand und Fuß versetzen.','Kontrolliert vor und zurück.'] },
    broad_jump: { id:'broad_jump', name:'Standweitsprung', emoji:'🦘',
      target:'Explosivkraft Beine (Athletik)', equipment:[], loads:['knie','sprunggelenk'], sets:3, reps:'5–8', min:5, alternatives:['bw_squat'],
      steps:['Leicht in die Hocke, Arme nach hinten.','Explosiv nach vorn abspringen.','Weich auf beiden Füßen landen.','Kurz stabilisieren, zurückgehen.'] },
    flutter_kick: { id:'flutter_kick', name:'Beinschere', emoji:'🦵',
      target:'Unterer Bauch', equipment:[], loads:[], sets:3, reps:'30–40 Sek', min:4, alternatives:['dead_bug'],
      steps:['Rücklings, Hände unter dem Gesäß.','Unteren Rücken flach halten.','Beine gestreckt leicht anheben.','Abwechselnd auf und ab scheren.'] }
  };

  /* ----------------------------------------------------------------------
     Session-Typen & Wochenplan
     ---------------------------------------------------------------------- */
  // Conservative load filters, not a clinical assessment.
  EX.box_squat.loads = ['knie'];
  EX.wall_pushup.loads = ['schulter', 'handgelenk', 'ellenbogen'];
  EX.inverted_row.loads = ['schulter', 'ellenbogen'];
  EX.db_row.loads = ['ruecken', 'schulter', 'ellenbogen'];
  EX.band_row.loads = ['schulter', 'ellenbogen'];
  EX.face_pull.loads = ['schulter'];
  EX.band_pullapart.loads = ['schulter'];
  EX.iso_curl.loads = ['ellenbogen', 'handgelenk'];
  EX.squat_thrust.loads = ['knie', 'handgelenk', 'schulter'];
  EX.bird_dog.loads = ['handgelenk', 'knie', 'schulter'];
  EX.side_plank_knee.loads = ['schulter'];
  EX.hanging_knee_raise.loads = ['schulter', 'ellenbogen'];
  EX.calf_raise.loads = ['sprunggelenk'];
  EX.single_leg_balance.loads = ['sprunggelenk'];
  EX.farmers_carry.loads = ['ruecken', 'schulter', 'handgelenk'];
  EX.suitcase_carry.loads = ['ruecken', 'schulter', 'handgelenk'];
  EX.ruck_carry.loads = ['ruecken', 'knie', 'sprunggelenk'];
  EX.jumping_jack.loads = ['knie', 'sprunggelenk', 'schulter'];
  EX.bench_press.requires=['box']; EX.hip_thrust.requires=['box']; EX.split_squat.requires=['box']; EX.box_squat.requires=['box'];

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

    const focus = state?.focus || "balanced";
    if (focus === "strength") base[base.indexOf("WORKCAP")] = "GANZ";
    if (focus === "endurance") { base[base.indexOf("WORKCAP")] = "CONDITION"; if (base.length >= 4) base[1] = "GANZ"; }
    if (winter && state?.winterPrep !== false) {
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
    const range = (a,b,s) => { const r=[]; for (let v=a; v<=b+1e-9; v=Math.round((v+s)*100)/100) r.push(Math.round(v*100)/100); return r; };
    return [
      { id: uid(), name: 'Wache', icon: '🏢',
        equipment: ['langhantel','kurzhanteln','kettlebell','klimmzugstange','cardio','box','matte','band','gewichtsweste'],
        inv: { langhantel: range(20,150,2.5), kurzhanteln: range(2.5,40,2.5), kettlebell: [8,12,16,20,24,28,32], gewichtsweste: [5,10,15,20] } },
      { id: uid(), name: 'Zuhause', icon: '🏠',
        equipment: ['kurzhanteln','band','matte','springseil'],
        inv: { kurzhanteln: [5,7.5,10,12.5,15,17.5,20,22.5,25] } },
      { id: uid(), name: 'Unterwegs', icon: '🎒', equipment: [] }
    ];
  }

  function defaultState() {
    const locs = defaultLocations();
    return {
      version: 2,
      favorites: [],
      focus: "balanced",
      experience: "regular",
      winterPrep: true,
      lastBackupAt: "",
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
      return raw ? Training.normalize(JSON.parse(raw), defaultState(), EX, SESSIONS, EQUIP) : defaultState();
    } catch (e) {
      // Preserve unreadable data for recovery instead of silently overwriting it.
      try { const raw=localStorage.getItem(KEY); if(raw) localStorage.setItem(KEY+'-recovery-'+Date.now(),raw); } catch (_) {}
      alert('Gespeicherte Daten konnten nicht vollständig gelesen werden. Eine Wiederherstellungskopie bleibt auf diesem Gerät, sofern Speicher verfügbar ist.');
      return defaultState();
    }
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
    for (const h of [...state.history].sort((a,b)=>b.date.localeCompare(a.date))) {
      const e=(h.exercises||[]).find(e=>e.id===exId);
      if(e && Training.completed(e).length) return {...e,date:h.date};
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
    return { count: r.count - d, set: r.set - d - (state.experience === "beginner" ? 1 : 0), load: Math.min(r.load, d ? 0.9 : 1), tone: r.tone, label: r.label, icon: r.icon, deload: !!d };
  }

  function toNum(v){ const n=parseFloat(String(v).replace(',','.')); return Number.isFinite(n)?n:NaN; }
  // verfügbare Gewichte für diese Übung am aktiven Ort (erste passende Geräteliste)
  function achievableFor(ex){
    const loc=activeLocation(), inv=loc&&loc.inv; if(!inv) return null;
    const avail=availableEquip();
    for(const e of (ex.equipment||[])){ if(avail.includes(e)&&inv[e]&&inv[e].length) return inv[e]; }
    return null;
  }
  function snapLoad(w, list){
    if(!Array.isArray(list)||!list.length) return w;
    if(w<=list[0]) return list[0];
    var best=list[0];
    for(const v of list){ if(v<=w+1e-9) best=v; }
    return best;
  }
  // Vorschlag fürs nächste Gewicht; rastet auf tatsächlich verfügbare Gewichte ein
  function suggestNext(ex) {
    const lp=lastPerfFor(ex.id);
    const sg = lp ? Training.suggestion(ex,lp,effMods().load) : null;
    if(sg){ const list=achievableFor(ex); if(list){ const snapped=snapLoad(sg.next,list);
      if(Math.abs(snapped-sg.next)>1e-9){ sg.next=snapped; sg.snapped=true; sg.up=snapped>sg.last; sg.down=snapped<sg.last; } } }
    return sg;
  }

  // Geschätztes 1RM (Epley) und Bestwerte (PRs)
  function epley(w,r,id) { return Training.oneRM(w,r,EX[id]); }

  function round1(x) { return Math.round(x * 10) / 10; }
  // bisheriger Bestwert für Übung, optional bis zu einem Index (exklusiv) der History
  function prFor(exId, beforeIdx) {
    var maxW = 0, best1 = 0;
    for (var i = (beforeIdx == null ? 0 : beforeIdx); i < state.history.length; i++) {
      var h = state.history[i]; if (!h.exercises) continue;
      for (var j = 0; j < h.exercises.length; j++) {
        var e = h.exercises[j]; if (e.id !== exId) continue;
        Training.completed(e).forEach(x=>{var w=Number(x.weight);if(w>maxW)maxW=w;var o=epley(x.weight,x.reps,e.id);if(o>best1)best1=o;});
      }
    }
    return { maxW: maxW, best1: best1 };
  }

  /* ----------------------------------------------------------------------
     Adaptions-Logik
     ---------------------------------------------------------------------- */
  function conflictOf(ex) {
    if(ex.requires?.some(k=>!availableEquip().includes(k)))return 'Zusätzlich benötigt: '+ex.requires.map(k=>EQUIP[k].label).join(', ');
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
      warning: 'Keine passende Alternative (' + startConflict + '). Diese Übung auslassen; bei Beschwerden fachlich abklären.' };
  }

  function rememberUndo(label, callback) {
    undoAction = {label, callback};
  }
  function undoHTML() {
    return undoAction ? '<div class="undo-bar" role="status"><span>'+esc(undoAction.label)+'</span><button class="btn btn--soft btn--sm" data-action="undo">Rückgängig</button><button class="iconbtn" data-action="dismiss-undo" aria-label="Hinweis schließen">×</button></div>' : '';
  }
  function openAlternatives(pid) {
    if (!EX[pid]) return;
    document.getElementById('swap-dialog')?.remove();
    const current=resolveExercise(pid).exercise.id;
    const options=chainFrom(pid).filter(id=>id!==current);
    const dialog=document.createElement('dialog');dialog.id='swap-dialog';dialog.className='swap-dialog';
    dialog.setAttribute('aria-labelledby','swap-title');
    dialog.innerHTML='<div class="row-between"><h2 id="swap-title">Übung auswählen</h2><button class="iconbtn" data-action="close-swap" aria-label="Auswahl schließen">×</button></div><p class="small muted">Alternativen zu '+esc(EX[pid].name)+'. Material und hinterlegte Belastungen werden berücksichtigt. Die Schwierigkeit kann abweichen.</p>'+options.map(id=>{
      const ex=EX[id], conflict=conflictOf(ex), used=state.currentSession?.planned.some(other=>other!==pid&&resolveExercise(other).exercise.id===id);
      const blocked=conflict||(used?'Bereits in dieser Einheit':null);
      return '<button class="alternative-option" data-action="choose-swap" data-id="'+pid+'" data-exercise="'+id+'" '+(blocked?'disabled':'')+'><strong>'+esc(ex.name)+'</strong><span>'+esc(ex.sets+' × '+ex.reps)+'</span><small>'+esc(blocked||([...(ex.equipment||[]),...(ex.requires||[])].length?[ex.equipment.map(k=>EQUIP[k].label).join(' / '),...(ex.requires||[]).map(k=>EQUIP[k].label)].filter(Boolean).join(' + '):'Ohne Geräte'))+'</small></button>';
    }).join('')+(options.length?'':'<p>Keine hinterlegte Alternative für diese Übung.</p>');
    document.body.appendChild(dialog);dialog.addEventListener('click',onClick);dialog.addEventListener('close',()=>{dialog.remove();document.querySelector('[data-action="swap"][data-id="'+pid+'"]')?.focus({preventScroll:true});});dialog.showModal();
  }
  function chooseAlternative(pid,id) {
    if(!chainFrom(pid).includes(id)||conflictOf(EX[id]))return;
    const session=state.currentSession, entry=session?.entries[pid];
    if(session?.planned.some(other=>other!==pid&&resolveExercise(other).exercise.id===id))return;
    if(entry?.setLog?.some(x=>x.done||x.weight!==''||x.reps!==''||x.rpe!=='')&&!confirm('Beim Tausch werden die Sätze dieser Übung zurückgesetzt. Du kannst den Tausch anschließend rückgängig machen. Fortfahren?'))return;
    const before=JSON.stringify(entry||{}),old=state.swaps[pid];let after;
    state.swaps[pid]=id;if(session)session.entries[pid]={};
    rememberUndo('Übung getauscht',()=>{if(state.currentSession!==session||session&&JSON.stringify(session.entries[pid])!==after)return false;if(old)state.swaps[pid]=old;else delete state.swaps[pid];if(session)session.entries[pid]=JSON.parse(before);return true;});
    document.getElementById('swap-dialog')?.close();save();render();after=JSON.stringify(session?.entries[pid]);
  }

  /* ----------------------------------------------------------------------
     Dauer-Skalierung & Plan
     ---------------------------------------------------------------------- */
  function scaledExercises(type) {
    const st=SESSIONS[type];
    if(st.conditioning)return state.sessionMinutes>=35?st.ex.slice():[];
    const budget=state.sessionMinutes-10,chosen=[];let used=0;
    for(const id of st.ex){const ex=resolveExercise(id).exercise;const duration=ex.min||5;if(used+duration<=budget){chosen.push(id);used+=duration;}}
    const target=Math.max(1,chosen.length+effMods().count);
    return chosen.slice(0,target);
  }

  function conditioningPlan() {
    const core=state.sessionMinutes>=35?8:0;
    const minutes=Math.max(10,state.sessionMinutes-10-core);
    const avail=availableEquip(),comp=activeComplaints();
    if(avail.includes('cardio'))return {title:'Cardio nach Tagesform',detail:minutes+' Min am passenden Cardiogerät, zusätzlich 5 Min Aufwärmen und 5 Min Abwärmen. Lockeres Grundtempo; bei guter Tagesform im Mittelteil kurze zügige Abschnitte mit gleich langer lockerer Erholung. Bei Beschwerden nur schmerzfreie Bewegung.'};
    if(avail.includes('rucksack')&&!comp.length)return {title:'Rucking · Marsch mit Last',detail:minutes+' Min gleichmäßiger Marsch mit gut sitzendem Rucksack. Last moderat wählen; zusätzlich 5 Min Aufwärmen und 5 Min Abwärmen.'};
    return {title:comp.length?'Lockere Ausdauer nach Verträglichkeit':'Laufen / zügiges Gehen',detail:minutes+' Min im kontrollierten Tempo, zusätzlich 5 Min Aufwärmen und 5 Min Abwärmen. '+(comp.length?'Nur wenn schmerzfrei möglich; sonst den Ausdauerblock auslassen.':'Sprechen sollte noch möglich sein. Gehpausen nach Bedarf.')};
  }

  /* ----------------------------------------------------------------------
     Fortschritt
     ---------------------------------------------------------------------- */
  function mondayOf(d) { const x = new Date(d); const off = (x.getDay() + 6) % 7; x.setDate(x.getDate() - off); x.setHours(0,0,0,0); return x; }
  function dateObj(iso) { const p = iso.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }

  function sessionsThisWeek() {
    const mon = mondayOf(new Date());
    const end=new Date(mon); end.setDate(end.getDate()+7);
    return state.history.filter(h=>dateObj(h.date)>=mon && dateObj(h.date)<end && h.date<=todayStr()).length;
  }
  function weekStreak() {
    var streak = 0;
    var mon = mondayOf(new Date());
    for (var w = 0; w < 104; w++) {
      var start = new Date(mon); start.setDate(start.getDate() - w * 7);
      var end = new Date(start); end.setDate(end.getDate() + 7);
      var count = state.history.filter(function (h) { var d = dateObj(h.date); return d >= start && d < end; }).length;
      if (count >= state.frequency) streak++;
      else if (w > 0) break;
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
    const s=state.currentSession;if(!s)return;
    const st=SESSIONS[s.type], exercises=[], prs=[];
    let volume=0,doneCount=0;
    s.planned.forEach(pid=>{
      const r=resolveExercise(pid),e=s.entries[pid];
      if(!e || r.warning)return;
      const ex=EX[e.exerciseId]||r.exercise;
      const sets=(e.setLog||[]).filter(x=>x.done && Training.validSet(x,ex));
      if(!sets.length)return;
      const best=sets.reduce((a,b)=>Number(b.weight)>Number(a.weight)?b:a,sets[0]);
      const bestRM=Math.max(...sets.map(x=>epley(x.weight,x.reps,ex.id)));
      const prev=prFor(ex.id);
      const rec={id:ex.id,name:ex.name,sets:sets.length,targetSets:e.setLog.length,reps:ex.reps,weight:best.weight,doneReps:best.reps,rpe:best.rpe,setLog:sets};
      rec.pr=Number(best.weight)>prev.maxW || bestRM>prev.best1;
      if(rec.pr)prs.push({name:ex.name,weight:Number(best.weight),reps:best.reps,e1rm:round1(bestRM)});
      volume+=Training.volume(rec,ex);doneCount++;exercises.push(rec);
    });
    if(!doneCount && !s.condDone){alert('Hake mindestens einen ausgeführten Satz oder den Ausdauerblock ab. Leere Einheiten werden nicht als Training gezählt.');return;}
    const incomplete=s.planned.some(pid=>(s.entries[pid]?.setLog||[]).some(x=>!x.done));
    if(incomplete && !confirm('Es sind noch Sätze offen. Nur die abgeschlossenen Sätze speichern und die Einheit beenden?'))return;
    const minutes=Math.max(1,Math.round((Date.now()-Date.parse(s.startedAt))/60000));
    if(!checkpoint('Vor Trainingsabschluss'))return;
    undoAction=null;state.history.unshift({id:uid(),date:todayStr(),type:s.type,typeName:st.name,location:(activeLocation()||{}).name||'',minutes,exercises,volume:Math.round(volume),notes:s.notes||'',conditioning:s.condDone?conditioningPlan().detail:null});
    state.lastSummary={typeName:st.name,icon:st.icon,minutes,doneCount:doneCount+(s.condDone?1:0),total:s.planned.length+(st.conditioning?1:0),volume:Math.round(volume),prs,conditioning:!!st.conditioning};
    const completedId=state.history[0].id, oldSwaps={...state.swaps};
    rememberUndo('Training gespeichert',()=>{if(state.currentSession||!state.history.some(h=>h.id===completedId))return false;state.history=state.history.filter(h=>h.id!==completedId);state.currentSession=s;state.swaps=oldSwaps;state.lastSummary=null;location.hash='#/session/'+s.type;return true;});
    state.currentSession=null;state.swaps={};stopTimer();save();location.hash='#/';render();
  }

  /* ----------------------------------------------------------------------
     Theme
     ---------------------------------------------------------------------- */
  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', state.theme);
    if(window.EinsatzNative?.isNative())window.EinsatzNative.appearance(state.theme==='dark'||state.theme==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches).catch(()=>{});
  }

  /* ----------------------------------------------------------------------
     Backup: Export / Import
     ---------------------------------------------------------------------- */
  function checkpoint(reason) {
    try {localStorage.setItem(KEY+'-checkpoint',JSON.stringify({savedAt:new Date().toISOString(),reason,state}));return true;}
    catch(e){alert('Sicherung konnte nicht gespeichert werden. Bitte zuerst eine Backup-Datei exportieren.');return false;}
  }
  function checkpointInfo() {
    try {const c=JSON.parse(localStorage.getItem(KEY+'-checkpoint'));return c&&c.state&&c.savedAt?c:null;}catch(e){return null;}
  }
  function restoreCheckpoint() {
    const c=checkpointInfo();if(!c)return;
    try {
      const restored=Training.normalize(c.state,defaultState(),EX,SESSIONS,EQUIP);
      if(!confirm('Lokale Sicherung wiederherstellen? Der aktuelle Stand wird als neue Sicherung aufbewahrt.'))return;
      if(!checkpoint('Vor Wiederherstellung'))return;
      stopTimer();state=restored;undoAction=null;save();applyTheme();location.hash='#/';render();
    }catch(e){alert('Die Sicherung ist nicht lesbar. Aktuelle Daten bleiben erhalten.');}
  }
  function backupStatusHTML() {
    const c=checkpointInfo();
    return '<p class="small muted">'+(state.lastBackupAt?'Letzter angeforderter Datei-Export: '+esc(new Date(state.lastBackupAt).toLocaleDateString('de-DE'))+'. Prüfe, ob die Datei gespeichert wurde.':'Noch kein Datei-Export vermerkt.')+'</p>'+(c?'<p class="small">Lokaler Sicherungspunkt: '+esc(c.reason)+' · '+esc(new Date(c.savedAt).toLocaleString('de-DE'))+'</p><button class="btn btn--soft" data-action="restore-checkpoint">Sicherung wiederherstellen</button><p class="small faint">Liegt auf diesem Gerät und schützt nicht vor gelöschten Browserdaten oder Geräteverlust.</p>':'');
  }
  function exportData() {
    try {
      state.lastBackupAt=new Date().toISOString();save();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'einsatzfit-backup-' + todayStr() + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);render();
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
        Training.normalize(obj, defaultState(), EX, SESSIONS, EQUIP);
        if (!confirm('Backup laden? Deine aktuellen Daten werden vollständig ersetzt.')) return;
        if(!checkpoint('Vor Backup-Import'))return;
        undoAction=null;state = Training.normalize(obj, defaultState(), EX, SESSIONS, EQUIP);
        stopTimer();
        save(); applyTheme(); editLocationId = null; editingHistoryId = null;
        location.hash = '#/'; render(); alert('Backup geladen.');
      } catch (e) { alert('Datei konnte nicht gelesen werden.'); }
    };
    if(file.size>10*1024*1024){alert('Backup ist zu groß (max. 10 MB).');return;}
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
    if (['verlauf','orte','einstellungen','bibliothek'].indexOf(parts[0]) !== -1) return { route: parts[0] };
    return { route: 'home' };
  }

  var onboardStep = 1;
  var editLocationId = null;
  var editingHistoryId = null;

  /* ----------------------------------------------------------------------
     Render
     ---------------------------------------------------------------------- */
  function render() {
    const openPreviews=[...document.querySelectorAll('.session-preview[open]')].map(el=>el.dataset.id);
    const app = document.getElementById('app');
    if (!state.onboarded) { app.innerHTML = renderOnboarding()+(checkpointInfo()?'<div class="view"><div class="card">'+backupStatusHTML()+'</div></div>':''); window.scrollTo(0,0); return; }
    const r = parseHash();
    var html, nav;
    switch (r.route) {
      case 'session': html = renderSession(r.param); nav = null; break;
      case 'bibliothek': html = renderLibrary(); nav = 'bibliothek'; break;
      case 'verlauf': html = renderVerlauf(); nav = 'verlauf'; break;
      case 'orte': html = renderOrte(); nav = 'orte'; break;
      case 'einstellungen': html = renderSettings(); nav = 'einstellungen'; break;
      case 'uebung': html = renderUebung(r.param); nav = 'bibliothek'; break;
      default: html = renderDashboard(); nav = 'home';
    }
    app.innerHTML = html + undoHTML() + (nav !== null ? renderNav(nav) : '');
    openPreviews.forEach(id=>{const el=app.querySelector('.session-preview[data-id="'+id+'"]');if(el)el.open=true;});
    ExercisePreview.mount();
    filterLibrary();
    if(state.currentSession)save();
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
      item('#/bibliothek','bibliothek','▤','Übungen') +
      item('#/orte','orte','📍','Orte') +
      item('#/einstellungen','einstellungen','⚙️','Mehr') +
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
        '<p class="muted small">Mehrfachauswahl. Betroffene Übungen werden automatisch durch andere ' +
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

  function invEditorHTML(loc){
    const eqs = WEIGHTED_EQUIP.filter(e=>loc.equipment.includes(e));
    if(!eqs.length) return '';
    const inv = loc.inv||{};
    return '<hr class="sep"><div class="small" style="font-weight:700">Verfügbare Gewichte (optional)</div>' +
      '<p class="small faint" style="margin:4px 0 0">Trage ein, welche Gewichte es hier gibt – dann rasten die Gewichts­vorschläge auf machbare Werte ein.</p>' +
      eqs.map(function(eq){
        const list=inv[eq]||[];
        const total = (eq==='langhantel'||eq==='trap_bar'||eq==='ez_stange');
        const chips = list.length
          ? list.map(function(v){ return '<button class="chip" data-action="inv-remove" data-id="'+loc.id+'" data-eq="'+eq+'" data-val="'+v+'" aria-label="'+fmtKg(v)+' kg entfernen">'+fmtKg(v)+' ✕</button>'; }).join('')
          : '<span class="small faint">noch keine – unten erzeugen</span>';
        return '<div style="margin-top:12px"><div class="small" style="font-weight:600">'+EQUIP[eq].icon+' '+esc(EQUIP[eq].label)+(total?' · Gesamtgewicht':' · pro Stück')+'</div>' +
          '<div class="chips" style="margin-top:6px">'+chips+'</div>' +
          '<div class="inline-fields" style="margin-top:6px">' +
          '<div class="field"><input inputmode="decimal" id="invmin-'+loc.id+'-'+eq+'" placeholder="'+(total?'z.B. 20':'z.B. 5')+'"></div>' +
          '<div class="field"><input inputmode="decimal" id="invmax-'+loc.id+'-'+eq+'" placeholder="bis"></div>' +
          '<div class="field"><input inputmode="decimal" id="invstep-'+loc.id+'-'+eq+'" placeholder="Schritt"></div>' +
          '<button class="btn btn--soft btn--sm" data-action="inv-gen" data-id="'+loc.id+'" data-eq="'+eq+'" style="flex:0 0 auto">Erzeugen</button></div></div>';
      }).join('');
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
          invEditorHTML(loc) +
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
      '<a class="btn btn--lg btn--block" href="#/session/'+(resume?resume.type:type)+'">'+(resume?'Training fortsetzen':'Einheit starten')+' ▸</a></div>';

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
      quickAdaptHTML() + planExplanationHTML() +
      stats +

      '<div class="card"><div class="row-between" style="margin-bottom:10px"><h3 style="margin:0">Tagesbefinden</h3>'+readinessPill+'</div>' +
      '<p class="small muted" style="margin:0 0 10px">Tippe an, was heute zwickt – der Plan sucht nach passenden Alternativen. Bei Schmerzen abbrechen.</p>' +
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
    if (!Object.hasOwn(SESSIONS,type)) return renderNotFound(type);
    if(state.currentSession && state.currentSession.type!==type) return '<div class="view"><h1>Training läuft noch</h1><div class="card"><p>Deine bisherigen Sätze bleiben erhalten.</p><a class="btn" href="#/session/'+state.currentSession.type+'">Fortsetzen</a><button class="btn btn--crit" data-action="discard-session">Laufende Einheit verwerfen</button></div></div>';
    if (!state.currentSession) { state.currentSession = newSession(type); save(); }
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
        '<div class="scheme">Gesamtziel '+state.sessionMinutes+' Min inkl. Auf-/Abwärmen</div></div>' +
        checkEl(s.condDone, 'Kondition erledigt', 'toggle-cond', '') + '</div>' +
        '<p class="small" style="margin-top:10px">'+esc(plan.detail)+'</p></div>';
      s.planned.forEach(function (pid, idx) {
        middle += exerciseCard(resolveExercise(pid), s.entries[pid], 'Finisher ' + (idx+1), true);
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

    return '<div class="view view--full">'+header+sessionProgressHTML(s)+locBar+note+warm+middle+cool+'<div class="card field"><label for="session-notes">Trainingsnotiz</label><textarea id="session-notes" data-field="session-notes" maxlength="2000" placeholder="Technik, Energie, Besonderheiten …">'+esc(s.notes||'')+'</textarea><p class="small muted">RPE: 7 ≈ 3 Wiederholungen übrig · 8 ≈ 2 · 9 ≈ 1 · 10 = Maximum.</p></div>'+finish+'</div>';
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
    const effSets = Math.max(1, ex.sets + mods.set);
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
            ' <button class="sug" data-action="apply-suggest" data-id="'+res.plannedId+'" data-w="'+sg.next+'">Vorschlag '+fmtKg(sg.next)+' kg '+arrow+(sg.snapped?' ✓':'')+'</button><p class="small muted">'+esc(sg.reason)+(sg.snapped?' Auf verfügbares Gewicht gerundet.':'')+'</p></div>';
        }
      }
    }

    const io = withIO && !res.warning ? setRowsHTML(res,entry,effSets) : '';

    return '<div class="exercise '+(entry.done?'done':'')+'">' +
      '<div class="head"><div class="grow"><div class="num">'+esc(num)+'</div><h3>'+esc(ex.name)+'</h3>' +
      '<div class="scheme">'+effSets+' × '+esc(ex.reps)+setsNote+'</div></div>' +
      '<span class="pill pill--steel">'+(entry.setLog?entry.setLog.filter(x=>x.done).length:0)+' / '+(entry.setLog?entry.setLog.length:effSets)+' Sätze</span></div>' +
      notice + progLine + io +
      '<div class="ex-actions">' +
      '<a class="btn btn--soft btn--sm" href="#/uebung/'+ex.id+'">Übung ansehen</a>' +
      '<button class="btn btn--muted btn--sm" data-action="swap" data-id="'+res.plannedId+'">Tauschen</button>'+ (withIO?'<button class="btn btn--muted btn--sm" data-action="move-later" data-id="'+res.plannedId+'" '+(state.currentSession.planned.at(-1)===res.plannedId?'disabled':'')+'>Später machen ↓</button>':'')+'</div>'+
      '<details class="session-preview" data-id="'+res.plannedId+'"><summary>Bewegung direkt ansehen</summary>'+ExercisePreview.html(ex)+'</details></div>';
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
    if(!state.history.some(h=>h.exercises.some(e=>e.id===chartExercise)))chartExercise=state.history.flatMap(h=>h.exercises)[0]?.id||'';
    const metrics=metricOptions();if(!metrics.some(x=>x[0]===chartMetric))chartMetric=metrics[0][0];
    const metric=metrics.find(x=>x[0]===chartMetric);
    const series = chartSeries();
    const alt = series.length ? series.map(function (p){ return formatDate(p.date)+': '+round1(p.max)+' '+metric[2]; }).join(' · ') : 'Noch keine passenden Satzdaten.';
    const ids=[...new Set(state.history.flatMap(h=>h.exercises.map(e=>e.id)))];
    const chart = '<div class="card"><h3>Fortschritt pro Übung</h3><label for="chart-exercise">Übung wählen</label><select id="chart-exercise">'+ids.map(id=>'<option value="'+id+'" '+(id===chartExercise?'selected':'')+'>'+esc(EX[id].name)+'</option>').join('')+'</select><label for="chart-metric">Messwert</label><select id="chart-metric">'+metrics.map(([id,label])=>'<option value="'+id+'" '+(id===chartMetric?'selected':'')+'>'+label+'</option>').join('')+'</select>' +
      (series.length
        ? '<div class="chart-wrap"><canvas id="chart" width="520" height="190" role="img" aria-label="Verlauf dieser Übung. '+esc(alt)+'"></canvas></div>'
        : '<p class="muted small">Noch keine Werte für diesen Messwert. Wähle einen anderen Messwert oder erfasse einen Satz.</p>') +
      '<p class="small muted">'+esc(alt)+'</p><p class="small faint">Werte je Training. Volumen = Zusatzgewicht × Wiederholungen. Vergleiche bei gleicher Technik und Ausrüstung; ein höherer Wert allein beweist keinen Fortschritt.</p></div>';

    // Bestwerte (PRs)
    var prMap = {};
    state.history.forEach(function (h) {
      (h.exercises || []).forEach(function (e) {
        var w = parseFloat(e.weight); if (isNaN(w) || w <= 0) return;
        var o = prFor(e.id).best1;
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
        }).join('')+'<p class="small faint" style="margin:8px 0 0">1RM geschätzt (Epley), nur für 1–12 Wiederholungen; keine Zeit- oder Distanzübungen.</p></div>'
      : '';

    const items = state.history.map(function (h) {
      var lines;
      lines = '<ul>'+h.exercises.map(function (e) {
        var d = []; if (e.weight) d.push(e.weight+' kg'); if (e.doneReps) d.push(e.doneReps+' '+Training.unit(EX[e.id]));
        return '<li>'+esc(e.name)+(e.setLog?' · '+e.setLog.length+' Sätze: '+e.setLog.map(x=>esc((x.weight||'0')+' kg × '+x.reps+' '+Training.unit(EX[e.id]))).join(' / '):'')+(e.pr?' 🏆':'')+(e.setLog?'':d.length?' – '+esc(d.join(', ')):' – '+e.sets+'×'+e.reps)+'</li>';
      }).join('')+'</ul>';
      if(h.conditioning)lines='<p>'+esc(h.conditioning)+'</p>'+lines;

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
        '<span class="small muted tnum">'+formatDate(h.date)+'</span></div>'+metaTags+lines+(h.notes?'<p class="small muted">Notiz: '+esc(h.notes)+'</p>':'')+edit+'</div>';
    }).join('');

    return '<div class="view">'+header+activityHTML()+chart+prCard+items+'</div>';
  }

  function metricOptions() {
    const ex=EX[chartExercise];if(!ex)return [['reps','Wiederholungen','Wdh.']];
    const unit=Training.unit(ex);
    return [['reps',unit==='Wdh.'?'Beste Wiederholungszahl':'Bester Satz · '+unit,unit],['weight','Höchstes Zusatzgewicht','kg'],...(unit==='Wdh.'?[['volume','Trainingsvolumen','kg'],['oneRM','Geschätztes 1RM (1–12 Wdh.)','kg']]:[])];
  }
  function chartSeries() { return Training.series(state.history,EX[chartExercise],chartMetric); }
  function activityHTML() {
    const weeks=Training.weeklyActivity(state.history,todayStr());
    return '<div class="card"><h3>Deine letzten 8 Wochen</h3><div class="activity-weeks">'+weeks.map(w=>'<div><strong>'+w.count+'</strong><span>'+formatDate(w.date).slice(0,5)+'</span><small>'+Math.round(w.minutes)+' Min</small></div>').join('')+'</div><p class="small muted">Einheiten je Kalenderwoche · letzte Spalte = laufende Woche. Minuten entsprechen der erfassten Dauer.</p></div>';
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
  function trainingProfileHTML() {
    const select=(id,label,values,value)=>'<label for="'+id+'">'+label+'</label><select id="'+id+'" '+(state.currentSession?'disabled':'')+'>'+values.map(([k,v])=>'<option value="'+k+'" '+(value===k?'selected':'')+'>'+v+'</option>').join('')+'</select>';
    return '<div class="card"><h3>Dein Trainingsprofil</h3>'+select('training-focus','Schwerpunkt',[['balanced','Einsatzfitness · ausgewogen'],['strength','Mehr Kraft'],['endurance','Mehr Ausdauer']],state.focus)+select('training-experience','Trainingserfahrung',[['beginner','Einstieg / Wiedereinstieg'],['regular','Regelmäßig trainierend']],state.experience)+select('winter-prep','Ski-Vorbereitung im Winter',[['on','Automatisch ergänzen'],['off','Nicht ergänzen']],state.winterPrep?'on':'off')+'<p class="small muted">Der Schwerpunkt ändert die Verteilung der Einheiten. Beim Einstieg wird je Übung ein Satz weniger geplant. '+(state.currentSession?'Änderungen sind nach der laufenden Einheit möglich.':'Deine gespeicherten Trainings bleiben erhalten.')+'</p></div>';
  }
  function planExplanationHTML() {
    const mods=effMods();
    return '<details class="card plan-explanation"><summary>Warum dieser Plan?</summary><p>'+esc(({balanced:'Kraft, Tragen und Ausdauer im Wechsel.',strength:'Eine zusätzliche Ganzkörpereinheit ersetzt Work Capacity.',endurance:'Ausdauer ersetzt Work Capacity; ab vier Einheiten ergänzt Ganzkörpertraining den Unterkörper-Schwerpunkt.'})[state.focus]||'Ausgewogenes Training.')+'</p><ul><li>'+state.frequency+' Einheiten im Wechsel, Ziel '+state.sessionMinutes+' Minuten pro Einheit.</li><li>Material am gewählten Ort bestimmt die Übungen.</li><li>'+esc(mods.label)+(mods.set<0?' · '+Math.abs(mods.set)+' Satz/Sätze weniger je Übung.':': regulärer Umfang.')+'</li><li>'+ (mods.deload?'Entlastungsblock aktiv.':'Nach jeweils drei Trainingsblöcken folgt ein Entlastungsblock; ein Block umfasst '+state.frequency+' Einheiten.')+'</li></ul><p class="small muted">Dauer ist eine Schätzung. Pausen und Übungstempo können die tatsächliche Zeit verlängern. Ruhetage bestimmst du passend zu deiner Erholung.</p><a href="#/einstellungen">Trainingsprofil ändern →</a></details>';
  }
  function renderSettings() {
    return '<div class="view">' +
      '<div class="topbar"><div class="grow"><p class="eyebrow">Konfiguration</p><h1>Einstellungen</h1></div></div>' +

      trainingProfileHTML() + '<div class="card"><h3>Trainingsmenge</h3>'+freqDurationHTML()+
      '<div class="card card--flat"><label>Standard-Satzpause (Auto-Timer)</label>' +
      '<div class="stepper"><button data-action="rest-dec" aria-label="kürzer">–</button>' +
      '<div class="val">'+(state.restDefault?state.restDefault:'Aus')+'<small>'+(state.restDefault?'SEKUNDEN':'KEIN TIMER')+'</small></div>' +
      '<button data-action="rest-inc" aria-label="länger">+</button></div>' +
      '<p class="small muted" style="margin:10px 0 0">Startet nach jedem abgehakten Satz automatisch. 0 = aus.</p></div></div>' +

      '<div class="card"><h3>Beschwerden</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Betroffene Übungen werden nach den hinterlegten Belastungen gefiltert. Das ist keine medizinische Freigabe. ' +
      'Du kannst das auch direkt auf dem Dashboard pro Tag setzen.</p>' +
      complaintTogglesHTML() +
      '<div class="field"><label for="ct">Sonstige Beschwerden</label>' +
      '<textarea id="ct" data-field="complaintsText" placeholder="z. B. Nacken verspannt">'+esc(state.complaintsText)+'</textarea>' +
      '<p class="small muted">Wird im Training als Hinweis angezeigt.</p></div></div>' +

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
      '<button class="btn btn--soft" data-action="export-csv">⤓ Sätze als CSV</button>' +
      '<button class="btn btn--muted" data-action="copy-data">Kopieren</button></div>' +
      '<label class="btn btn--ghost btn--block" for="importFile" style="margin-top:10px">⤒ Backup laden (Import)</label>' +
      '<input type="file" id="importFile" accept="application/json,.json" class="hidden">' +
      '<p class="small faint" style="margin:8px 0 0">Vor einem Import wird der aktuelle Stand lokal gesichert.</p>'+backupStatusHTML()+'</div>' +

      '<div class="card"><h3>Profil</h3>' +
      '<div class="field"><label for="nm">Name (optional)</label>' +
      '<input type="text" id="nm" value="'+esc(state.name)+'" data-field="name" placeholder="Dein Name"></div>' +
      '<div class="btn-row" style="margin-top:14px">' +
      '<button class="btn btn--crit" data-action="reset-all">App zurücksetzen</button></div></div>' +

      '<p class="center small faint" style="margin-top:6px">EinsatzFit · läuft offline · Daten nur auf diesem Gerät</p>' +
      '</div>';
  }

  /* ---------- Übungsdetail ---------- */
  function renderUebung(id) {
    const ex = Object.hasOwn(EX,id) ? EX[id] : null; if (!ex) return renderNotFound(id);
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
    const tab = (detailTab === 'mus') ? 'mus' : 'move';
    const visual = (tab === 'move')
      ? ExercisePreview.html(ex)
      : '<div class="row-between" style="margin-bottom:6px"><span class="eyebrow" style="margin:0">Beanspruchte Muskeln</span>' +
        '<span style="font-size:1.5rem">'+(ex.emoji||'💪')+'</span></div>' + bodyDiagram(id) +
        '<div class="tags" style="margin-top:12px">'+musTags+'</div>' +
        '<p class="small muted" style="margin:10px 0 0">Zielmuskulatur: '+esc(ex.target)+'</p>';
    return '<div class="view">' +
      '<div class="topbar"><a class="iconbtn" href="'+(state.currentSession?'#/session/'+state.currentSession.type:'#/bibliothek')+'" aria-label="Zurück zum Training oder zur Bibliothek">‹</a>' +
      '<h1 style="font-size:1.2rem">'+esc(ex.name)+'</h1></div>' +
      '<div class="card"><div class="seg" role="tablist" aria-label="Übung kennenlernen">' +
      '<button class="seg-btn '+(tab==='move'?'active':'')+'" id="tab-move" role="tab" aria-controls="detail-panel" tabindex="'+(tab==='move'?'0':'-1')+'" aria-selected="'+(tab==='move')+'" data-action="detail-tab" data-tab="move">🎬 Bewegung</button>' +
      '<button class="seg-btn '+(tab==='mus'?'active':'')+'" id="tab-mus" role="tab" aria-controls="detail-panel" tabindex="'+(tab==='mus'?'0':'-1')+'" aria-selected="'+(tab==='mus')+'" data-action="detail-tab" data-tab="mus">💪 Muskeln</button>' +
      '</div><div id="detail-panel" role="tabpanel" tabindex="0" aria-labelledby="tab-'+tab+'">'+visual+'</div></div>' +
      '<div class="card stack"><div><h3 style="margin-bottom:6px">Schema</h3>' +
      '<p class="tnum" style="margin:0">'+ex.sets+' Sätze × '+esc(ex.reps)+'</p>'+prLine+'</div>' +
      '<div class="tags">'+eqTags+loadTags+'</div></div>' +
      '<div class="card"><h3>So geht’s</h3>'+steps+coach+'</div>' +
      exerciseHistoryHTML(id) +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Events
     ---------------------------------------------------------------------- */
  var libraryQuery='', libraryFilter='all', chartExercise='', chartMetric='reps', detailTab='move';
  let undoAction = null;
  function sessionProgressHTML(s) {
    const entries=s.planned.map(id=>s.entries[id]||{});
    const sets=entries.flatMap(e=>e.setLog||[]),done=sets.filter(x=>x.done).length;
    const conditioning=SESSIONS[s.type].conditioning?1:0,total=sets.length+conditioning,completed=done+(s.condDone?1:0);
    const volume=entries.reduce((n,e)=>n+Training.volume(e,EX[e.exerciseId]),0);
    return '<section class="card session-progress" aria-label="Trainingsfortschritt"><div class="row-between"><strong>'+completed+' / '+total+' '+(conditioning?'Blöcke & Sätze':'Sätze')+'</strong><span class="small muted">'+Math.round(volume).toLocaleString('de-DE')+' kg Volumen</span></div><progress max="'+Math.max(1,total)+'" value="'+completed+'" aria-label="Abgeschlossene Sätze"></progress><p class="small muted">'+(completed===total&&total?'Alles erfasst – du kannst die Einheit abschließen.':'Satz für Satz. Deine Eingaben werden gespeichert.')+'</p>'+(done<sets.length?'<button class="btn btn--soft btn--sm" data-action="next-set">Zum nächsten offenen Satz ↓</button>':'')+'</section>';
  }
  function persistTimer() {
    try {
      if(!ef.running||!state?.currentSession){localStorage.removeItem(KEY+'-timer');return;}
      const {mode,phase,deadline,work,rest,rounds,round}=ef;
      localStorage.setItem(KEY+'-timer',JSON.stringify({session:state.currentSession.startedAt,mode,phase,deadline,work,rest,rounds,round}));
    } catch(e) {/* Training data save reports storage errors separately. */}
  }
  function restoreTimer() {
    try {
      const t=JSON.parse(localStorage.getItem(KEY+'-timer')||'null');
      if(!state.currentSession||!t||t.session!==state.currentSession.startedAt)return;
      if(!['rest','interval'].includes(t.mode)||!['rest','work'].includes(t.phase)||!Number.isFinite(t.deadline)||Math.abs(t.deadline-Date.now())>86400000)return;
      if(t.mode==='interval'&&(!Number.isInteger(t.round)||!Number.isInteger(t.rounds)||t.round<1||t.rounds<t.round||t.rounds>100||!(t.work>0&&t.work<=3600)||!(t.rest>=0&&t.rest<=3600)))return;
      Object.assign(ef,{mode:t.mode,phase:t.phase,deadline:t.deadline,work:t.work,rest:t.rest,rounds:t.rounds,round:t.round,running:true});tickTimer();
      if(ef.running)ef.iv=setInterval(tickTimer,1000);
    } catch(e) {/* A broken timer must never prevent restoring a workout. */}
  }

  function quickAdaptHTML() {
    return '<div class="card"><div class="row-between"><h3>Heute weniger Zeit?</h3><span class="pill pill--steel">Dein Rhythmus</span></div><p class="small muted">Dauer vor dem Start wählen. Die nächste Einheit passt sich an.</p><div class="chips">'+[20,30,45,60,75].map(n=>'<button class="chip" aria-pressed="'+(state.sessionMinutes===n)+'" data-action="quick-duration" data-minutes="'+n+'">'+n+' Min</button>').join('')+'</div><a class="library-link" href="#/bibliothek">Alle Übungen & Bewegungsvorschauen →</a></div>';
  }
  function ensureSets(res,entry,count) {
    const ex=res.exercise;
    if(entry.exerciseId!==ex.id && entry.exerciseId){entry.setLog=null;entry.done=false;entry.weight='';entry.reps='';entry.rpe='';}
    entry.exerciseId=ex.id;
    if(!Array.isArray(entry.setLog)||!entry.setLog.length){
      // Legacy entries contain one observed set, not proof that all prescribed sets were done.
      entry.setLog=Array.from({length:count},(_,i)=>({weight:i===0?entry.weight||'':'',reps:i===0?entry.reps||'':'',rpe:i===0?entry.rpe||'':'',done:i===0&&entry.done===true&&Number(entry.reps)>0}));
    }
    entry.done=entry.setLog.every(x=>x.done);
    return entry.setLog;
  }
  function setRowsHTML(res,entry,count) {
    const rows=ensureSets(res,entry,count),id=res.plannedId,unit=Training.unit(res.exercise),lp=lastPerfFor(res.exercise.id);
    const previous=lp?Training.completed(lp):[];
    return '<div class="set-table"><div class="set-heading"><span>Satz</span><span>kg</span><span>'+unit+'</span><span>RPE</span><span>✓</span></div>'+rows.map((row,i)=>{
      const prefix=id+'-'+i;
      const field=(key,label,min,max,step)=>'<input aria-label="'+esc(res.exercise.name)+' Satz '+(i+1)+' '+label+'" type="number" inputmode="decimal" min="'+min+'" max="'+max+'" step="'+step+'" value="'+esc(row[key])+'" data-field="'+key+'" data-id="'+id+'" data-set="'+i+'" '+(row.done?'readonly':'')+' placeholder="'+esc(previous[i]?.[key]||'–')+'">';
      return '<div class="set-row '+(row.done?'is-done':'')+'"><span class="tnum">'+(i+1)+'</span>'+field('weight','Gewicht in Kilogramm',0,1000,0.5)+field('reps',unit,1,10000,unit==='Wdh.'?1:0.5)+field('rpe','RPE (optional)',1,10,0.5)+'<button class="set-check" aria-label="Satz '+(i+1)+' '+esc(res.exercise.name)+' erledigt" aria-pressed="'+row.done+'" data-action="toggle-set" data-id="'+id+'" data-set="'+i+'">'+(row.done?'✓':'○')+'</button></div>';
    }).join('')+'</div><div class="btn-row">'+(previous.length?'<button class="btn btn--soft btn--sm" data-action="copy-last" data-id="'+id+'">Letzte Werte übernehmen</button>':'')+'<button class="btn btn--muted btn--sm" data-action="add-set" data-id="'+id+'" '+(rows.length>=12?'disabled':'')+'>＋ Satz</button><button class="btn btn--muted btn--sm" data-action="remove-set" data-id="'+id+'" '+(rows.length<=1||rows[rows.length-1].done?'disabled':'')+'>− Letzter Satz</button></div>'+(previous.length?'<p class="small muted">Letztes Training '+esc(formatDate(lp.date))+': '+previous.map(x=>esc((x.weight||'0')+' kg × '+x.reps+' '+unit)).join(' · ')+'</p>':'')+'<p class="small faint">'+(/Seite/.test(res.exercise.reps)?'Wert pro Seite eingeben. ':'')+'Bei Eigengewicht kann kg leer bleiben.</p>';
  }
  function copyLastSets(pid) {
    const entry=state.currentSession?.entries[pid];if(!entry)return;
    const previous=lastPerfFor(entry.exerciseId);if(!previous)return;
    const old=JSON.stringify(entry.setLog), load=effMods().load;
    entry.setLog=Training.fillPrevious(entry.setLog,Training.completed(previous),load);
    if(old===JSON.stringify(entry.setLog)){alert('Keine leeren Felder mit passenden früheren Werten gefunden.');return;}
    const after=JSON.stringify(entry.setLog);
    rememberUndo('Frühere Werte übernommen',()=>{if(state.currentSession?.entries[pid]!==entry||JSON.stringify(entry.setLog)!==after)return false;entry.setLog=JSON.parse(old);return true;});
    save();render();
  }
  function toggleSet(el) {
    const e=state.currentSession?.entries[el.dataset.id],row=e?.setLog?.[Number(el.dataset.set)];if(!row)return;
    const ex=EX[e.exerciseId];
    if(!row.done&&!Training.validSet(row,ex)){alert('Bitte einen gültigen Wert für '+Training.unit(ex)+' eintragen. Gewicht: 0–1000 kg; RPE optional: 1–10.');return;}
    undoAction=null;row.done=!row.done;e.done=e.setLog.every(x=>x.done);save();
    if(row.done&&state.restDefault>0){ensureAudio();startRest(state.restDefault);}
    const y=window.scrollY;render();window.scrollTo(0,y);
    document.querySelector('[data-action="toggle-set"][data-id="'+el.dataset.id+'"][data-set="'+el.dataset.set+'"]')?.focus({preventScroll:true});
  }
  function renderLibrary() {
    return '<div class="view"><div class="topbar"><div><p class="eyebrow">Lernen & entdecken</p><h1>Deine Übungsbibliothek</h1></div></div><div class="card"><label for="exercise-search">Übung, Muskel oder Gerät suchen</label><input id="exercise-search" type="search" value="'+esc(libraryQuery)+'" placeholder="z. B. Kniebeuge, Rücken, Band"><label for="exercise-filter">Auswahl</label><select id="exercise-filter">'+[['all','Alle Übungen'],['available','Mit meinem Material'],['favorites','Meine Favoriten'],['bodyweight','Ohne Geräte']].map(([v,l])=>'<option value="'+v+'" '+(libraryFilter===v?'selected':'')+'>'+l+'</option>').join('')+'</select><p id="library-count" class="small muted" aria-live="polite"></p></div><div id="library-results">'+Object.values(EX).map(ex=>'<article class="card library-item" data-exercise="'+ex.id+'"><div class="row-between"><div><span class="eyebrow">'+esc(ex.target)+'</span><h3><a href="#/uebung/'+ex.id+'">'+esc(ex.name)+'</a></h3></div><button class="iconbtn" data-action="favorite" data-id="'+ex.id+'" aria-label="'+esc(ex.name)+' als Favorit" aria-pressed="'+state.favorites.includes(ex.id)+'">'+(state.favorites.includes(ex.id)?'★':'☆')+'</button></div><p class="small muted">'+(ex.equipment.length?ex.equipment.map(e=>esc(EQUIP[e]?.label||e)).join(' / '):'Eigengewicht')+'</p><a class="btn btn--soft btn--sm" href="#/uebung/'+ex.id+'">▶ Bewegung & Anleitung</a></article>').join('')+'</div><div id="library-empty" class="card" hidden>Keine passende Übung. Versuche einen anderen Suchbegriff oder Filter.</div></div>';
  }
  function filterLibrary() {
    let count=0;
    document.querySelectorAll('[data-exercise]').forEach(el=>{
      const ex=EX[el.dataset.exercise],hay=[ex.name,ex.target,...ex.equipment.map(k=>EQUIP[k]?.label||k)].join(' ').toLocaleLowerCase('de');
      const fits=libraryFilter==='all'||libraryFilter==='favorites'&&state.favorites.includes(ex.id)||libraryFilter==='bodyweight'&&!ex.equipment.length||libraryFilter==='available'&&(!ex.equipment.length||ex.equipment.some(k=>availableEquip().includes(k)))&&(!ex.requires||ex.requires.every(k=>availableEquip().includes(k)));
      el.hidden=!(fits&&hay.includes(libraryQuery.trim().toLocaleLowerCase('de')));if(!el.hidden)count++;
    });
    const el=document.getElementById('library-count');if(el)el.textContent=count+' von '+Object.keys(EX).length+' Übungen';
    const empty=document.getElementById('library-empty');if(empty)empty.hidden=count>0;
  }
  function exerciseHistoryHTML(id) {
    const records=state.history.filter(h=>h.exercises.some(e=>e.id===id)).slice(0,8);
    return '<div class="card"><h3>Dein Verlauf für diese Übung</h3>'+(records.length?records.map(h=>'<div class="exercise-history"><strong>'+esc(formatDate(h.date))+'</strong><span>'+h.exercises.filter(e=>e.id===id).flatMap(e=>Training.completed(e)).map(x=>esc((x.weight||'0')+' kg × '+x.reps+' '+Training.unit(EX[id]))).join(' · ')+'</span></div>').join(''):'<p class="small muted">Nach dem ersten protokollierten Satz siehst du hier deine Entwicklung.</p>')+'</div>';
  }
  function exportCSV() {
    const rows=[['Datum','Einheit','Übung','Satz','kg','Wert','Einheit des Werts','RPE','Notiz']];
    state.history.forEach(h=>h.exercises.forEach(e=>Training.completed(e).forEach((x,i)=>rows.push([h.date,h.typeName,e.name,i+1,x.weight,x.reps,Training.unit(EX[e.id]),x.rpe,h.notes||'']))));
    const cell=v=>'"'+String(v??'').replace(/^\s*[=+@-]/,"' $&").replace(/"/g,'""')+'"';
    const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='einsatzfit-saetze-'+todayStr()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function onClick(ev) {
    const el = ev.target.closest('[data-action]'); if (!el) return;
    const a = el.getAttribute('data-action');
    if(['set-loc','toggle-complaint','toggle-loc-equip','remove-loc','set-readiness'].includes(a) && state.currentSession && Object.values(state.currentSession.entries).some(e=>e.setLog?.some(x=>x.done||x.weight!==''||x.reps!==''||x.rpe!==''))){alert('Beende zuerst die laufende Einheit, damit deine erfassten Satzwerte erhalten bleiben.');return;}
    if(['set-loc','toggle-complaint','toggle-loc-equip','remove-loc','set-readiness','freq-dec','freq-inc','dur-dec','dur-inc','quick-duration'].includes(a))undoAction=null;
    switch (a) {
      case 'onb-next': onboardStep = Math.min(5, onboardStep+1); render(); break;
      case 'onb-back': onboardStep = Math.max(1, onboardStep-1); render(); break;
      case 'onb-finish': state.onboarded = true; save(); onboardStep = 1; location.hash = '#/'; render(); break;

      case 'detail-tab': detailTab = el.getAttribute('data-tab'); render(); document.getElementById('tab-'+detailTab)?.focus({preventScroll:true}); break;

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
      case 'inv-gen': {
        const lid = el.getAttribute('data-id'), eq = el.getAttribute('data-eq');
        const loc = state.locations.find(function (l){ return l.id === lid; }); if (!loc) break;
        const mn = toNum((document.getElementById('invmin-'+lid+'-'+eq)||{}).value);
        const mx = toNum((document.getElementById('invmax-'+lid+'-'+eq)||{}).value);
        let st = toNum((document.getElementById('invstep-'+lid+'-'+eq)||{}).value);
        if (!Number.isFinite(mn) || !Number.isFinite(mx) || mn <= 0 || mx < mn) { alert('Bitte gültige Werte für „von“ und „bis“ eingeben.'); break; }
        if (!Number.isFinite(st) || st <= 0) st = 2.5;
        const add = []; for (let v = mn; v <= mx + 1e-9 && add.length < 80; v += st) add.push(Math.round(v*100)/100);
        loc.inv = loc.inv || {};
        const merged = [...new Set([...(loc.inv[eq]||[]), ...add])].filter(v => v>0 && v<=500).sort((a,b)=>a-b).slice(0,80);
        if (merged.length) loc.inv[eq] = merged; else delete loc.inv[eq];
        if (!Object.keys(loc.inv).length) delete loc.inv;
        save(); render(); break;
      }
      case 'inv-remove': {
        const lid = el.getAttribute('data-id'), eq = el.getAttribute('data-eq'), val = toNum(el.getAttribute('data-val'));
        const loc = state.locations.find(function (l){ return l.id === lid; });
        if (loc && loc.inv && loc.inv[eq]) {
          loc.inv[eq] = loc.inv[eq].filter(v => Math.abs(v - val) > 1e-9);
          if (!loc.inv[eq].length) delete loc.inv[eq];
          if (!Object.keys(loc.inv).length) delete loc.inv;
          save(); render();
        }
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
      case 'swap': openAlternatives(el.dataset.id); break;
      case 'close-swap': document.getElementById('swap-dialog')?.close(); break;
      case 'choose-swap': chooseAlternative(el.dataset.id,el.dataset.exercise); break;
      case 'dismiss-undo': undoAction=null;render();break;
      case 'undo': {const action=undoAction;undoAction=null;if(action && !action.callback())alert('Diese Aktion kann nach weiteren Änderungen nicht mehr rückgängig gemacht werden.');save();render();break;}
      case 'next-set': {const row=document.querySelector('.set-row:not(.is-done)');if(row){row.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});row.querySelector('[data-field="reps"]')?.focus({preventScroll:true});}break;}
      case 'move-later': {const session=state.currentSession;if(!session)break;const before=session.planned.slice(),pid=el.dataset.id;session.planned=session.planned.filter(id=>id!==pid).concat(pid);const after=session.planned.join(',');rememberUndo('Übung nach hinten verschoben',()=>{if(state.currentSession!==session||session.planned.join(',')!==after)return false;session.planned=before;return true;});save();render();break;}
      case 'copy-last': copyLastSets(el.dataset.id);break;
      case 'restore-checkpoint': restoreCheckpoint();break;
      case 'finish': finishSession(); break;

      case 'set-readiness': state.readiness = { date: todayStr(), level: el.getAttribute('data-level') }; save(); render(); break;
      case 'apply-suggest': {
        const pid = el.getAttribute('data-id'); const wv = el.getAttribute('data-w');
        if (state.currentSession && state.currentSession.entries[pid]) { (state.currentSession.entries[pid].setLog||[]).forEach(x=>{if(!x.done)x.weight=wv;}); save(); render(); }
        break;
      }
      case 'export-data': exportData(); break;
      case 'export-csv': exportCSV(); break;
      case 'favorite': {const id=el.dataset.id;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();render();break;}
      case 'quick-duration': if(state.currentSession){alert('Beende zuerst die laufende Einheit.');break;}state.sessionMinutes=Number(el.dataset.minutes);save();render();break;
      case 'discard-session': if(confirm('Laufende Einheit und ihre noch nicht abgeschlossenen Trainingsdaten verwerfen?')){if(!checkpoint('Vor Verwerfen der Einheit'))break;const old=state.currentSession,swaps={...state.swaps};state.currentSession=null;state.swaps={};stopTimer();rememberUndo('Einheit verworfen',()=>{if(state.currentSession)return false;state.currentSession=old;state.swaps=swaps;location.hash='#/session/'+old.type;return true;});save();location.hash='#/';render();}break;
      case 'toggle-set': toggleSet(el);break;
      case 'add-set': {const e=state.currentSession?.entries[el.dataset.id];if(e&&e.setLog.length<12){const prev=e.setLog[e.setLog.length-1]||{};e.setLog.push({weight:prev.weight||'',reps:'',rpe:'',done:false});save();render();}break;}
      case 'remove-set': {const e=state.currentSession?.entries[el.dataset.id];if(e&&e.setLog.length>1&&!e.setLog[e.setLog.length-1].done){const removed=e.setLog.pop(), length=e.setLog.length;rememberUndo('Satz entfernt',()=>{if(state.currentSession?.entries[el.dataset.id]!==e||e.setLog.length!==length)return false;e.setLog.push(removed);return true;});save();render();}break;}
      case 'copy-data': copyData(); break;

      case 'edit-history': editingHistoryId = el.getAttribute('data-id'); render(); break;
      case 'cancel-edit': editingHistoryId = null; render(); break;
      case 'save-history-date': {
        const hid = el.getAttribute('data-id'); const di = document.getElementById('hd-'+hid);
        if(di?.value>todayStr()){alert('Ein Training kann nicht in der Zukunft liegen.');break;}
        if (di && di.value) { const en = state.history.find(function (x){ return x.id === hid; }); if (en) en.date = di.value; state.history.sort((a,b)=>b.date.localeCompare(a.date));save(); }
        editingHistoryId = null; render(); break;
      }
      case 'delete-history': {
        if (confirm('Diesen Eintrag löschen?')) { const hid = el.getAttribute('data-id');
          const removed=state.history.find(x=>x.id===hid);state.lastSummary=null;state.history = state.history.filter(function (x){ return x.id !== hid; });rememberUndo('Training gelöscht',()=>{if(!removed||state.history.some(x=>x.id===hid))return false;state.history.push(removed);state.history.sort((a,b)=>b.date.localeCompare(a.date));return true;});save();render(); }
        break;
      }
      case 'reset-all': {
        if (confirm('Einstellungen und Verlauf zurücksetzen? Ein lokaler Sicherungspunkt bleibt zur Wiederherstellung erhalten.')) { if(!checkpoint('Vor Zurücksetzen'))break;undoAction=null;stopTimer();localStorage.removeItem(KEY); state = defaultState(); onboardStep = 1; applyTheme(); location.hash = '#/'; render(); }
        break;
      }
    }
  }

  function onInput(ev) {
    const t = ev.target;
    if(t.id==='exercise-search'){libraryQuery=t.value;filterLibrary();return;}
    const f = t.getAttribute('data-field'); if (!f) return;
    if(f==='session-notes'){if(state.currentSession){state.currentSession.notes=t.value;save();}return;}
    if(t.dataset.set!==undefined){const e=state.currentSession?.entries[t.dataset.id];const row=e?.setLog[Number(t.dataset.set)];if(row&&!row.done){undoAction=null;document.querySelector('.undo-bar')?.remove();row[f]=t.value;save();}return;}
    if (f === 'weight' || f === 'reps' || f === 'rpe') {
      const id = t.getAttribute('data-id');
      if (state.currentSession && state.currentSession.entries[id]) { state.currentSession.entries[id][f] = t.value; save(); }
    } else if (f === 'complaintsText') { state.complaintsText = t.value; save(); }
    else if (f === 'name') { state.name = t.value; save(); }
    else if (f === 'loc-name') { const loc = state.locations.find(function (l){ return l.id === t.getAttribute('data-id'); }); if (loc) { loc.name = t.value; save(); } }
  }

  function onChange(ev) {
    const t = ev.target;
    if(['training-focus','training-experience','winter-prep'].includes(t.id)){if(state.currentSession)return;undoAction=null;if(t.id==='training-focus')state.focus=t.value;if(t.id==='training-experience')state.experience=t.value;if(t.id==='winter-prep')state.winterPrep=t.value==='on';save();render();return;}
    if(t.id==='chart-metric'){chartMetric=t.value;render();return;}
    if(t.id==='exercise-filter'){libraryFilter=t.value;filterLibrary();return;}
    if(t.id==='chart-exercise'){chartExercise=t.value;render();return;}
    if (t && t.id === 'importFile' && t.files && t.files[0]) { importData(t.files[0]); t.value = ''; }
  }

  function onKey(ev) {
    if(ev.target.matches('[role="tab"]')&&['ArrowLeft','ArrowRight','Home','End'].includes(ev.key)){ev.preventDefault();detailTab=ev.key==='Home'?'move':ev.key==='End'?'mus':detailTab==='move'?'mus':'move';render();document.getElementById('tab-'+detailTab).focus({preventScroll:true});return;}
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
      '<details class="timer-options"><summary>Intervalltraining</summary><div class="ef-intv"><span class="ef-lbl">Intervall</span>' +
      '<button class="ef-btn" data-t="intv" data-w="20" data-r="10" data-n="8">20/10 ×8</button>' +
      '<button class="ef-btn" data-t="intv" data-w="40" data-r="20" data-n="8">40/20 ×8</button>' +
      '<button class="ef-btn" data-t="intv" data-w="60" data-r="0" data-n="10">EMOM ×10</button>' +
      '</div></details>';
    document.body.appendChild(el);
    if(window.ResizeObserver)new ResizeObserver(()=>document.documentElement.style.setProperty('--timer-height',el.getBoundingClientRect().height+'px')).observe(el);
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
  function buzz(ms) {
    if(window.EinsatzNative?.isNative()) {window.EinsatzNative.haptic().catch(()=>{});return;}
    if(navigator.vibrate){try{navigator.vibrate(ms||120);}catch(e){}}
  }

  function doneSignal() { beep(1047, 0.22); setTimeout(function () { beep(1319, 0.28); }, 180); buzz(300); }

  function onTimerClick(ev) {
    var b = ev.target.closest('[data-t]'); if (!b) return;
    ensureAudio();
    var t = b.getAttribute('data-t');
    if (t === 'rest') startRest(parseInt(b.getAttribute('data-s'), 10));
    else if (t === 'add') {if(ef.running){tickTimer();}if(ef.running){ef.deadline+=15000;ef.left=Math.max(0,Math.ceil((ef.deadline-Date.now())/1000));persistTimer();updateTimer();}else startRest(15);}
    else if (t === 'stop') stopTimer();
    else if (t === 'intv') startInterval(+b.getAttribute('data-w'), +b.getAttribute('data-r'), +b.getAttribute('data-n'));
  }

  function startTick() { ef.deadline=Date.now()+ef.left*1000; clearInterval(ef.iv); persistTimer(); updateTimer(); ef.iv = setInterval(tickTimer, 1000); }
  function startRest(sec) { ef.mode = 'rest'; ef.phase = 'rest'; ef.left = sec; ef.running = true; beep(660, 0.08); buzz(60); startTick(); }
  function startInterval(work, rest, rounds) {
    ef.mode = 'interval'; ef.work = work; ef.rest = rest; ef.rounds = rounds; ef.round = 1; ef.phase = 'work'; ef.left = work; ef.running = true;
    beep(880, 0.18); buzz(150); startTick();
  }
  function stopTimer() { ef.running = false; clearInterval(ef.iv); ef.iv = null; ef.left = 0; ef.mode = 'rest'; ef.phase = 'idle'; persistTimer(); updateTimer(); }

  function tickTimer() {
    if (!ef.running) return;
    const previousPhase=ef.phase,previousRound=ef.round;
    while(ef.running && Date.now()>=ef.deadline){const deadline=ef.deadline;onPhaseEnd();ef.deadline=deadline+ef.left*1000;}
    if(ef.running)ef.left=Math.max(0,Math.ceil((ef.deadline-Date.now())/1000));
    if(previousPhase!==ef.phase||previousRound!==ef.round)persistTimer();
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
    updateTimer();
  }

  /* ----------------------------------------------------------------------
     PWA: Installation & Updates
     ---------------------------------------------------------------------- */
  var efReg = null, efDeferredPrompt = null, efRefreshing = false;

  function isStandalone() {
    try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; }
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
  function isNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function nativeInit() {
    if(!window.EinsatzNative?.isNative())return;
    window.EinsatzNative.hideSplash().catch(()=>{});
  }

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
    if (isNative() || isStandalone() || state.hideInstallHint) return '';
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
    if (isNative()) return; // in der nativen App liefert Capacitor die Dateien aus
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
    restoreTimer();
    applyTheme();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.theme==='auto')applyTheme();});
    const app = document.getElementById('app');
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    app.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', ()=>{detailTab='move';render();window.scrollTo(0,0);});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ef.running)tickTimer();});

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); efDeferredPrompt = e;
      if (state.onboarded && parseHash().route === 'home') render();
    });
    window.addEventListener('appinstalled', function () { efDeferredPrompt = null; state.hideInstallHint = true; save(); });

    render();
    nativeInit();
    if ('serviceWorker' in navigator) window.addEventListener('load', registerSW);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
