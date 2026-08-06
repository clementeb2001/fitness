/* =========================================================================
   „Fit wieder starten“ – Vanilla-JS-PWA
   Alles clientseitig. Persistenz: ein localStorage-Key mit dem State als JSON.
   Keine Frameworks, keine externen Abhängigkeiten.
   ========================================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'fit-wieder-starten-state-v1';

  /* ----------------------------------------------------------------------
     Labels
     ---------------------------------------------------------------------- */
  const COMPLAINT_LABELS = {
    ruecken: 'Rücken',
    schulter: 'Schulter',
    knie: 'Knie',
    handgelenk: 'Handgelenk'
  };
  const EQUIP_LABELS = {
    kurzhanteln: 'Kurzhanteln',
    widerstandsband: 'Widerstandsband',
    matte: 'Matte'
  };
  const ORDER = ['A', 'B', 'C']; // Kraft-Rotation

  /* ----------------------------------------------------------------------
     Übungsdatenbank
     Jede Übung: equipment[] (benötigtes Material), loads[] (belastete Regionen),
     alternatives[] (Ausweichkette, kaskadierend bis eine sichere passt).
     Terminale Alternativen benötigen kein Material und belasten nichts.
     ---------------------------------------------------------------------- */
  const EXERCISES = {
    /* ---- Unterkörper ---- */
    goblet_squat: {
      id: 'goblet_squat', name: 'Goblet-Kniebeuge', emoji: '🏋️',
      target: 'Oberschenkel, Gesäß, Rumpf',
      equipment: ['kurzhanteln'], loads: ['knie'],
      sets: 3, reps: '10–12',
      alternatives: ['band_squat', 'bw_squat'],
      steps: [
        'Eine Kurzhantel senkrecht vor der Brust halten, Ellenbogen zeigen nach unten.',
        'Füße schulterbreit, Zehen leicht nach außen.',
        'Hüfte nach hinten und unten schieben, Knie in Richtung der Zehen, Rücken gerade.',
        'Kontrolliert bis kurz vor die Parallele, dann durch die Fersen nach oben drücken.'
      ]
    },
    band_squat: {
      id: 'band_squat', name: 'Kniebeuge mit Band', emoji: '🦵',
      target: 'Oberschenkel, Gesäß',
      equipment: ['widerstandsband'], loads: ['knie'],
      sets: 3, reps: '12–15',
      alternatives: ['bw_squat'],
      steps: [
        'Band unter beide Füße stellen, Enden auf Schulterhöhe halten.',
        'Schulterbreiter Stand, Rumpf fest.',
        'In die Knie gehen, Spannung im Band halten.',
        'Kontrolliert nach oben drücken.'
      ]
    },
    bw_squat: {
      id: 'bw_squat', name: 'Kniebeuge mit Körpergewicht', emoji: '🦵',
      target: 'Oberschenkel, Gesäß',
      equipment: [], loads: ['knie'],
      sets: 3, reps: '15',
      alternatives: ['box_squat'],
      steps: [
        'Schulterbreiter Stand, Arme zur Balance nach vorn.',
        'Hüfte nach hinten schieben, langsam absenken.',
        'So tief wie schmerzfrei möglich, Knie stabil.',
        'Nach oben drücken, Gesäß anspannen.'
      ]
    },
    box_squat: {
      id: 'box_squat', name: 'Aufstehen vom Stuhl', emoji: '🪑',
      target: 'Oberschenkel, Gesäß (gelenkschonend)',
      equipment: [], loads: [],
      sets: 3, reps: '12',
      alternatives: ['glute_bridge'],
      steps: [
        'Vor einen stabilen Stuhl stellen.',
        'Langsam hinsetzen, ohne komplett abzusitzen.',
        'Kurz Kontakt, dann kontrolliert wieder aufstehen.',
        'Kleiner Bewegungsradius, ganz ohne Schmerz.'
      ]
    },
    rdl: {
      id: 'rdl', name: 'Kreuzheben mit Kurzhanteln', emoji: '🏋️',
      target: 'Rückseite Oberschenkel, Gesäß, unterer Rücken',
      equipment: ['kurzhanteln'], loads: ['ruecken'],
      sets: 3, reps: '10–12',
      alternatives: ['hip_thrust', 'glute_bridge'],
      steps: [
        'Kurzhanteln vor den Oberschenkeln halten.',
        'Leichte Kniebeugung, Rücken gerade.',
        'Hüfte nach hinten schieben, Hanteln nah am Bein absenken.',
        'Wenn Zug in der Oberschenkelrückseite, wieder aufrichten.'
      ]
    },
    hip_thrust: {
      id: 'hip_thrust', name: 'Hip Thrust', emoji: '🍑',
      target: 'Gesäß, Rückseite Oberschenkel',
      equipment: ['kurzhanteln'], loads: [],
      sets: 3, reps: '12',
      alternatives: ['glute_bridge'],
      steps: [
        'Oberer Rücken an eine Couch/Bank gelehnt, Füße aufgestellt.',
        'Kurzhantel auf der Hüfte abstützen (gepolstert).',
        'Hüfte nach oben drücken, bis Oberkörper und Oberschenkel eine Linie bilden.',
        'Oben Gesäß anspannen, langsam ablassen.'
      ]
    },
    glute_bridge: {
      id: 'glute_bridge', name: 'Beckenheben (Glute Bridge)', emoji: '🍑',
      target: 'Gesäß, Rumpf (rückenschonend)',
      equipment: [], loads: [],
      sets: 3, reps: '15',
      alternatives: [],
      steps: [
        'Auf den Rücken legen, Knie angewinkelt, Füße aufgestellt.',
        'Bauch leicht anspannen.',
        'Hüfte nach oben drücken, oben kurz halten.',
        'Langsam ablassen, ohne komplett abzulegen.'
      ]
    },
    lunge: {
      id: 'lunge', name: 'Ausfallschritt mit Kurzhanteln', emoji: '🦵',
      target: 'Oberschenkel, Gesäß, Balance',
      equipment: ['kurzhanteln'], loads: ['knie'],
      sets: 3, reps: '10 je Seite',
      alternatives: ['bw_lunge', 'glute_bridge'],
      steps: [
        'Kurzhanteln seitlich halten, aufrechter Stand.',
        'Einen Schritt nach vorn, hinteres Knie Richtung Boden.',
        'Vorderes Knie über dem Fußgelenk, nicht darüber hinaus.',
        'Zurückdrücken in den Stand, Seite wechseln.'
      ]
    },
    bw_lunge: {
      id: 'bw_lunge', name: 'Ausfallschritt ohne Gewicht', emoji: '🦵',
      target: 'Oberschenkel, Gesäß, Balance',
      equipment: [], loads: ['knie'],
      sets: 3, reps: '10 je Seite',
      alternatives: ['box_squat'],
      steps: [
        'Aufrechter Stand, Hände in die Hüfte.',
        'Schritt nach vorn, kontrolliert absenken.',
        'Kleiner, schmerzfreier Bewegungsradius.',
        'Zurück in den Stand, Seite wechseln.'
      ]
    },
    calf_raise: {
      id: 'calf_raise', name: 'Wadenheben', emoji: '🦶',
      target: 'Waden',
      equipment: [], loads: [],
      sets: 3, reps: '15–20',
      alternatives: [],
      steps: [
        'Aufrechter Stand, ggf. an der Wand abstützen.',
        'Langsam auf die Fußballen heben.',
        'Oben kurz halten.',
        'Kontrolliert absenken.'
      ]
    },

    /* ---- Oberkörper (schulterschonend) ---- */
    db_row: {
      id: 'db_row', name: 'Kurzhantel-Rudern', emoji: '💪',
      target: 'Oberer Rücken, hintere Schulter, Bizeps',
      equipment: ['kurzhanteln'], loads: [],
      sets: 3, reps: '10–12',
      alternatives: ['band_row'],
      steps: [
        'Mit einer Hand auf Stuhl/Couch abstützen, Rücken gerade.',
        'Kurzhantel in der anderen Hand hängen lassen.',
        'Ellenbogen eng am Körper nach hinten ziehen.',
        'Schulterblatt zusammen, langsam ablassen.'
      ]
    },
    band_row: {
      id: 'band_row', name: 'Rudern mit Band', emoji: '💪',
      target: 'Oberer Rücken, hintere Schulter',
      equipment: ['widerstandsband'], loads: [],
      sets: 3, reps: '15',
      alternatives: ['bird_dog'],
      steps: [
        'Band um einen festen Punkt (Türanker/Heizung) auf Brusthöhe.',
        'Enden greifen, Arme gestreckt, leichte Vorspannung.',
        'Ellenbogen nach hinten ziehen, Schulterblätter zusammen.',
        'Langsam zurückführen.'
      ]
    },
    floor_press: {
      id: 'floor_press', name: 'Bankdrücken am Boden (Floor Press)', emoji: '💪',
      target: 'Brust, Trizeps (schulterschonend, kurzer Weg)',
      equipment: ['kurzhanteln'], loads: ['schulter'],
      sets: 3, reps: '10–12',
      alternatives: ['pushup_knee', 'wall_pushup'],
      steps: [
        'Auf den Rücken legen, Knie angewinkelt, Kurzhanteln über der Brust.',
        'Ellenbogen bis zum Boden absenken (natürlicher Stopp, schont Schulter).',
        'Kurz halten.',
        'Wieder nach oben drücken.'
      ]
    },
    pushup: {
      id: 'pushup', name: 'Liegestütz', emoji: '💪',
      target: 'Brust, Schulter, Trizeps, Rumpf',
      equipment: [], loads: ['schulter', 'handgelenk'],
      sets: 3, reps: '8–12',
      alternatives: ['pushup_knee', 'wall_pushup'],
      steps: [
        'Hände etwas breiter als schulterbreit, Körper in einer Linie.',
        'Rumpf anspannen.',
        'Kontrolliert absenken, Ellenbogen leicht nach hinten.',
        'Nach oben drücken.'
      ]
    },
    pushup_knee: {
      id: 'pushup_knee', name: 'Liegestütz auf den Knien', emoji: '💪',
      target: 'Brust, Trizeps (leichter)',
      equipment: [], loads: ['schulter', 'handgelenk'],
      sets: 3, reps: '10–12',
      alternatives: ['wall_pushup'],
      steps: [
        'Knie am Boden, Hände unter den Schultern.',
        'Körper von Kopf bis Knie in einer Linie.',
        'Kontrolliert absenken.',
        'Nach oben drücken.'
      ]
    },
    wall_pushup: {
      id: 'wall_pushup', name: 'Liegestütz an der Wand', emoji: '🧱',
      target: 'Brust, Schulter (sehr gelenkschonend)',
      equipment: [], loads: [],
      sets: 3, reps: '12–15',
      alternatives: [],
      steps: [
        'Armlänge vor eine Wand stellen, Hände auf Brusthöhe an die Wand.',
        'Körper gerade, Rumpf fest.',
        'Kontrolliert zur Wand beugen.',
        'Wieder wegdrücken.'
      ]
    },
    band_pullapart: {
      id: 'band_pullapart', name: 'Band auseinanderziehen', emoji: '🎗️',
      target: 'Obere Rücken- & Schultermuskulatur (Haltung)',
      equipment: ['widerstandsband'], loads: [],
      sets: 3, reps: '15',
      alternatives: ['scapular_squeeze'],
      steps: [
        'Band mit beiden Händen auf Brusthöhe greifen, Arme vorn.',
        'Band nach außen ziehen, Arme öffnen.',
        'Schulterblätter zusammenziehen.',
        'Langsam zurückführen.'
      ]
    },
    scapular_squeeze: {
      id: 'scapular_squeeze', name: 'Schulterblätter zusammenziehen', emoji: '🧍',
      target: 'Haltungsmuskulatur (ohne Material)',
      equipment: [], loads: [],
      sets: 3, reps: '15',
      alternatives: [],
      steps: [
        'Aufrecht stehen oder sitzen, Arme locker.',
        'Schulterblätter langsam nach hinten/unten zusammenziehen.',
        'Kurz halten.',
        'Langsam lösen.'
      ]
    },
    biceps_curl: {
      id: 'biceps_curl', name: 'Bizeps-Curl mit Kurzhanteln', emoji: '💪',
      target: 'Bizeps',
      equipment: ['kurzhanteln'], loads: ['handgelenk'],
      sets: 3, reps: '10–12',
      alternatives: ['band_curl', 'iso_curl'],
      steps: [
        'Kurzhanteln seitlich halten, Ellenbogen am Körper.',
        'Unterarme nach oben führen.',
        'Oben kurz anspannen.',
        'Langsam ablassen.'
      ]
    },
    band_curl: {
      id: 'band_curl', name: 'Bizeps-Curl mit Band', emoji: '🎗️',
      target: 'Bizeps',
      equipment: ['widerstandsband'], loads: ['handgelenk'],
      sets: 3, reps: '15',
      alternatives: ['iso_curl'],
      steps: [
        'Band unter die Füße stellen, Enden greifen.',
        'Ellenbogen am Körper, nach oben curlen.',
        'Oben anspannen.',
        'Langsam ablassen.'
      ]
    },
    iso_curl: {
      id: 'iso_curl', name: 'Isometrischer Bizeps-Halt', emoji: '💪',
      target: 'Bizeps (ohne Material, handgelenkschonend)',
      equipment: [], loads: [],
      sets: 3, reps: '20–30 Sek',
      alternatives: [],
      steps: [
        'Unterarm im 90°-Winkel, Handfläche nach oben.',
        'Mit der anderen Hand dagegen drücken.',
        'Spannung 20–30 Sekunden halten.',
        'Locker lassen, Seite wechseln.'
      ]
    },
    triceps_kickback: {
      id: 'triceps_kickback', name: 'Trizeps-Kickback', emoji: '💪',
      target: 'Trizeps',
      equipment: ['kurzhanteln'], loads: [],
      sets: 3, reps: '12',
      alternatives: ['band_pushdown', 'bench_dip'],
      steps: [
        'Leicht vorgebeugt, Oberarm parallel zum Körper.',
        'Kurzhantel halten, Ellenbogen fixiert.',
        'Unterarm nach hinten strecken.',
        'Langsam zurückführen.'
      ]
    },
    band_pushdown: {
      id: 'band_pushdown', name: 'Trizeps-Drücken mit Band', emoji: '🎗️',
      target: 'Trizeps',
      equipment: ['widerstandsband'], loads: [],
      sets: 3, reps: '15',
      alternatives: ['bench_dip'],
      steps: [
        'Band oben (Tür/Haken) befestigen.',
        'Ellenbogen am Körper, Unterarme nach unten drücken.',
        'Unten kurz anspannen.',
        'Langsam zurück.'
      ]
    },
    bench_dip: {
      id: 'bench_dip', name: 'Trizeps-Dips an der Kante', emoji: '🪑',
      target: 'Trizeps',
      equipment: [], loads: ['schulter'],
      sets: 3, reps: '10–12',
      alternatives: ['wall_pushup'],
      steps: [
        'Hände auf Stuhlkante, Gesäß davor.',
        'Ellenbogen kontrolliert beugen.',
        'Nur so tief, wie die Schulter schmerzfrei erlaubt.',
        'Nach oben drücken.'
      ]
    },

    /* ---- Kraft & Stabilität / Rumpf ---- */
    plank: {
      id: 'plank', name: 'Unterarmstütz (Plank)', emoji: '🧘',
      target: 'Rumpf, Schultergürtel',
      equipment: [], loads: ['schulter'],
      sets: 3, reps: '20–40 Sek',
      alternatives: ['dead_bug'],
      steps: [
        'Auf die Unterarme stützen, Ellenbogen unter den Schultern.',
        'Körper von Kopf bis Ferse in einer Linie.',
        'Bauch und Gesäß anspannen.',
        'Ruhig atmen und Position halten.'
      ]
    },
    dead_bug: {
      id: 'dead_bug', name: 'Dead Bug', emoji: '🧘',
      target: 'Tiefe Bauchmuskulatur (rückenschonend)',
      equipment: [], loads: [],
      sets: 3, reps: '10 je Seite',
      alternatives: [],
      steps: [
        'Auf den Rücken, Arme senkrecht nach oben, Knie im 90°-Winkel.',
        'Unteren Rücken flach am Boden halten.',
        'Gegenüberliegenden Arm und Bein langsam ausstrecken.',
        'Zurückführen, Seite wechseln.'
      ]
    },
    bird_dog: {
      id: 'bird_dog', name: 'Bird Dog', emoji: '🧘',
      target: 'Rückenstrecker, Rumpfstabilität',
      equipment: [], loads: [],
      sets: 3, reps: '10 je Seite',
      alternatives: [],
      steps: [
        'Vierfüßlerstand, Hände unter Schultern, Knie unter Hüfte.',
        'Rücken gerade, Bauch leicht fest.',
        'Gegenüberliegenden Arm und Bein ausstrecken.',
        'Kurz halten, langsam zurück, Seite wechseln.'
      ]
    },
    side_plank: {
      id: 'side_plank', name: 'Seitstütz', emoji: '🧘',
      target: 'Seitliche Rumpfmuskulatur',
      equipment: [], loads: ['schulter'],
      sets: 3, reps: '20 Sek je Seite',
      alternatives: ['side_plank_knee'],
      steps: [
        'Seitlich auf den Unterarm stützen.',
        'Hüfte nach oben, Körper in einer Linie.',
        'Position halten.',
        'Seite wechseln.'
      ]
    },
    side_plank_knee: {
      id: 'side_plank_knee', name: 'Seitstütz auf dem Knie', emoji: '🧘',
      target: 'Seitliche Rumpfmuskulatur (leichter)',
      equipment: [], loads: [],
      sets: 3, reps: '20 Sek je Seite',
      alternatives: ['dead_bug'],
      steps: [
        'Seitlich auf den Unterarm, unteres Knie abgelegt.',
        'Hüfte anheben.',
        'Position ruhig halten.',
        'Seite wechseln.'
      ]
    },
    superman: {
      id: 'superman', name: 'Rückenstrecker (Superman)', emoji: '🦸',
      target: 'Unterer Rücken, Gesäß',
      equipment: [], loads: ['ruecken'],
      sets: 3, reps: '12',
      alternatives: ['bird_dog'],
      steps: [
        'Auf den Bauch legen, Arme nach vorn.',
        'Arme und Beine leicht vom Boden heben.',
        'Kurz halten, nicht überstrecken.',
        'Langsam ablegen.'
      ]
    },
    pallof: {
      id: 'pallof', name: 'Pallof-Press mit Band', emoji: '🎗️',
      target: 'Anti-Rotation, tiefe Rumpfmuskulatur',
      equipment: ['widerstandsband'], loads: [],
      sets: 3, reps: '10 je Seite',
      alternatives: ['dead_bug'],
      steps: [
        'Band seitlich auf Brusthöhe befestigen.',
        'Seitlich zum Anker stehen, Band mit beiden Händen vor der Brust.',
        'Arme nach vorn strecken, Rotation widerstehen.',
        'Zurückführen, Seite wechseln.'
      ]
    },
    carry: {
      id: 'carry', name: 'Farmer’s Carry', emoji: '🏋️',
      target: 'Griffkraft, Rumpf, Haltung',
      equipment: ['kurzhanteln'], loads: [],
      sets: 3, reps: '30 Sek gehen',
      alternatives: ['bird_dog'],
      steps: [
        'Je eine Kurzhantel seitlich halten.',
        'Aufrecht, Schultern zurück, Bauch fest.',
        'Kontrolliert durch den Raum gehen.',
        'Ruhig atmen.'
      ]
    }
  };

  /* ----------------------------------------------------------------------
     Workouts
     ---------------------------------------------------------------------- */
  const WORKOUTS = {
    A: {
      id: 'A', name: 'Workout A · Unterkörper', kind: 'strength',
      exercises: ['goblet_squat', 'rdl', 'lunge', 'calf_raise']
    },
    B: {
      id: 'B', name: 'Workout B · Oberkörper', kind: 'strength',
      exercises: ['db_row', 'floor_press', 'band_pullapart', 'biceps_curl', 'triceps_kickback']
    },
    C: {
      id: 'C', name: 'Workout C · Kraft & Stabilität', kind: 'strength',
      exercises: ['goblet_squat', 'pushup_knee', 'plank', 'bird_dog', 'pallof', 'carry']
    },
    D: {
      id: 'D', name: 'Workout D · Ausdauer', kind: 'endurance',
      exercises: []
    }
  };

  const WARMUP_TEXT = '5 Min locker machen: Armkreisen, Hüftkreisen, 15–20 Hampelmänner ' +
    '(oder Marschieren auf der Stelle), Schulterblätter kreisen. Puls sanft hochbringen.';
  const COOLDOWN_TEXT = '3–5 Min abwärmen: locker dehnen (Oberschenkel, Brust, Nacken), ' +
    'tief und ruhig atmen, nachspüren.';

  /* Ausdauer: Gehen/Joggen-Intervalle über 4 Wochen; bei Knie-Beschwerde reines Gehen. */
  function endurancePlan(week, kneeActive) {
    if (kneeActive) {
      return {
        title: 'Zügiges Gehen (knieschonend)',
        detail: '30 Min zügiges Gehen in gleichmäßigem Tempo. Kein Joggen – wegen der Knie-Beschwerde automatisch auf reines Gehen umgestellt.'
      };
    }
    const plans = {
      1: { title: 'Intervall Woche 1', detail: '5 × (3 Min gehen + 1 Min leichtes Joggen) = 20 Min. Locker bleiben, Atmung kontrollieren.' },
      2: { title: 'Intervall Woche 2', detail: '4 × (3 Min gehen + 2 Min joggen) = 20 Min. Jogg-Abschnitte etwas länger.' },
      3: { title: 'Intervall Woche 3', detail: '3 × (2 Min gehen + 4 Min joggen) = 18 Min. Mehr Joggen als Gehen.' },
      4: { title: 'Intervall Woche 4', detail: '20 Min durchgehend locker joggen. Wenn nötig kurze Gehpausen einlegen.' }
    };
    return plans[Math.min(Math.max(week, 1), 4)];
  }

  /* ----------------------------------------------------------------------
     State
     ---------------------------------------------------------------------- */
  function defaultState() {
    return {
      version: 1,
      onboarded: false,
      complaints: { ruecken: false, schulter: false, knie: false, handgelenk: false },
      complaintsText: '',
      equipment: [],          // Standardgeräte (ids aus EQUIP_LABELS)
      customEquipment: [],     // eigene Geräte (Freitext)
      frequency: { strength: 3, endurance: 1 },
      swaps: {},               // { plannedId: gewählteId }
      currentSession: null,    // laufendes Training (Live-Zwischenspeicher)
      history: [],             // absolvierte Sessions (neueste zuerst)
      programStartIndex: 0     // Offset für Neustart des 4-Wochen-Programms
    };
  }

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed, {
        complaints: Object.assign(defaultState().complaints, parsed.complaints || {}),
        frequency: Object.assign(defaultState().frequency, parsed.frequency || {})
      });
    } catch (e) {
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      alert('Speichern nicht möglich – ist der Speicher voll oder privater Modus aktiv?');
    }
  }

  /* ----------------------------------------------------------------------
     Adaptions-Logik (Kern)
     ---------------------------------------------------------------------- */
  function activeComplaints() {
    return Object.keys(state.complaints).filter(function (k) { return state.complaints[k]; });
  }

  // Gibt einen Konflikt-Grund als Text zurück oder null (=sicher).
  function conflictOf(ex) {
    for (var i = 0; i < ex.equipment.length; i++) {
      var eq = ex.equipment[i];
      if (state.equipment.indexOf(eq) === -1) {
        return 'Material fehlt (' + (EQUIP_LABELS[eq] || eq) + ')';
      }
    }
    var active = activeComplaints();
    for (var j = 0; j < ex.loads.length; j++) {
      var ld = ex.loads[j];
      if (active.indexOf(ld) !== -1) {
        return 'belastet ' + (COMPLAINT_LABELS[ld] || ld);
      }
    }
    return null;
  }

  // Vollständige Ausweichkette ab einer Übung (Tiefensuche, dedupliziert).
  function chainFrom(startId) {
    var chain = [];
    var seen = {};
    (function walk(id) {
      if (!id || seen[id] || !EXERCISES[id]) return;
      seen[id] = true;
      chain.push(id);
      var alts = EXERCISES[id].alternatives || [];
      for (var i = 0; i < alts.length; i++) walk(alts[i]);
    })(startId);
    return chain;
  }

  /* Löst eine geplante Übung auf:
     (a) manueller Tausch → Startpunkt, (b) Material geprüft, (c) Beschwerden geprüft.
     Auch nach manuellem Tausch wird die Sicherheit geprüft. */
  function resolveExercise(plannedId) {
    var swapTarget = state.swaps[plannedId];
    var swapped = swapTarget && swapTarget !== plannedId && !!EXERCISES[swapTarget];
    var startId = swapped ? swapTarget : plannedId;

    var chain = chainFrom(startId);
    var startConflict = conflictOf(EXERCISES[startId]);

    for (var i = 0; i < chain.length; i++) {
      var ex = EXERCISES[chain[i]];
      if (!conflictOf(ex)) {
        var reason = null;
        if (i > 0) reason = 'Ersetzt wegen: ' + startConflict;
        else if (swapped) reason = 'Manuell getauscht';
        return {
          exercise: ex, plannedId: plannedId, swapped: swapped,
          replaced: i > 0, reason: reason, warning: null
        };
      }
    }
    // Keine sichere Alternative gefunden → Original mit Warnhinweis.
    return {
      exercise: EXERCISES[startId], plannedId: plannedId, swapped: swapped,
      replaced: false,
      reason: swapped ? 'Manuell getauscht' : null,
      warning: 'Keine sichere Alternative (' + startConflict + '). Bewegungsradius reduzieren, langsam und kontrolliert – bei Schmerz abbrechen.'
    };
  }

  function swapExercise(plannedId) {
    var options = chainFrom(plannedId); // enthält plannedId als erstes
    var current = state.swaps[plannedId] || plannedId;
    var idx = options.indexOf(current);
    if (idx === -1) idx = 0;
    var next = options[(idx + 1) % options.length];
    state.swaps[plannedId] = next;
    save();
  }

  /* ----------------------------------------------------------------------
     Programm-Fortschritt
     ---------------------------------------------------------------------- */
  function strengthTotal() {
    return state.history.filter(function (h) { return ORDER.indexOf(h.workoutId) !== -1; }).length;
  }
  function strengthCount() {
    return Math.max(0, strengthTotal() - (state.programStartIndex || 0));
  }
  function totalGoal() {
    return 4 * state.frequency.strength;
  }
  function isCompleted() {
    return strengthCount() >= totalGoal();
  }
  function currentWeek() {
    if (isCompleted()) return 4;
    return Math.min(4, Math.floor(strengthCount() / state.frequency.strength) + 1);
  }
  function nextIndex() {
    return strengthCount() % 3;
  }
  function nextWorkoutId() {
    return ORDER[nextIndex()];
  }

  /* ----------------------------------------------------------------------
     Session-Handling
     ---------------------------------------------------------------------- */
  function newSession(id) {
    var w = WORKOUTS[id];
    var entries = {};
    if (id !== 'D') {
      w.exercises.forEach(function (pid) { entries[pid] = { done: false, weight: '', reps: '' }; });
    } else {
      entries.endurance = { done: false };
    }
    return { workoutId: id, startedAt: new Date().toISOString(), warmup: false, cooldown: false, entries: entries };
  }

  function finishWorkout() {
    var s = state.currentSession;
    if (!s) return;
    var w = WORKOUTS[s.workoutId];
    var exercises = [];
    if (s.workoutId !== 'D') {
      w.exercises.forEach(function (pid) {
        var r = resolveExercise(pid);
        var e = s.entries[pid] || {};
        exercises.push({
          id: r.exercise.id, name: r.exercise.name,
          sets: r.exercise.sets, reps: r.exercise.reps,
          weight: e.weight || '', doneReps: e.reps || '', done: !!e.done
        });
      });
    }
    var entry = {
      id: uid(),
      date: todayStr(),
      workoutId: s.workoutId,
      workoutName: w.name,
      exercises: exercises,
      endurance: s.workoutId === 'D'
        ? endurancePlan(currentWeek(), state.complaints.knie).detail
        : null
    };
    state.history.unshift(entry);
    state.currentSession = null;
    state.swaps = {};
    save();
    location.hash = '#/';
    render(); // falls hash schon '#/' war
  }

  /* ----------------------------------------------------------------------
     Hilfsfunktionen
     ---------------------------------------------------------------------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function formatDate(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return p[2] + '.' + p[1] + '.' + p[0];
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function ytLink(name) {
    return 'https://www.youtube.com/results?search_query=' +
      encodeURIComponent(name + ' Übung richtige Technik');
  }

  /* ----------------------------------------------------------------------
     Routing
     ---------------------------------------------------------------------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    if (parts.length === 0) return { route: 'home' };
    if (parts[0] === 'workout') return { route: 'workout', param: parts[1] };
    if (parts[0] === 'uebung') return { route: 'uebung', param: parts[1] };
    if (parts[0] === 'verlauf' || parts[0] === 'material' || parts[0] === 'beschwerden') {
      return { route: parts[0] };
    }
    return { route: 'home' };
  }

  /* Transiente UI-Zustände (nicht persistiert) */
  var onboardStep = 1;
  var editingHistoryId = null;

  /* ----------------------------------------------------------------------
     Rendering
     ---------------------------------------------------------------------- */
  function render() {
    var app = document.getElementById('app');

    if (!state.onboarded) {
      app.innerHTML = renderOnboarding();
      window.scrollTo(0, 0);
      return;
    }

    var r = parseHash();
    var html, navKey;

    switch (r.route) {
      case 'workout': html = renderWorkout(r.param); navKey = null; break;
      case 'verlauf': html = renderVerlauf(); navKey = 'verlauf'; break;
      case 'material': html = renderMaterial(); navKey = 'material'; break;
      case 'beschwerden': html = renderBeschwerden(); navKey = 'beschwerden'; break;
      case 'uebung': html = renderUebung(r.param); navKey = 'home'; break;
      default: html = renderDashboard(); navKey = 'home'; break;
    }

    app.innerHTML = html + (navKey !== null ? renderNav(navKey) : '');
    window.scrollTo(0, 0);

    if (r.route === 'verlauf') drawChart();
  }

  function renderNav(active) {
    function item(href, key, ico, label) {
      return '<a href="' + href + '" class="' + (active === key ? 'active' : '') +
        '" aria-label="' + label + '"' + (active === key ? ' aria-current="page"' : '') + '>' +
        '<span class="ico" aria-hidden="true">' + ico + '</span>' + label + '</a>';
    }
    return '<nav class="bottom-nav" aria-label="Hauptnavigation"><div class="inner">' +
      item('#/', 'home', '🏠', 'Übersicht') +
      item('#/verlauf', 'verlauf', '📈', 'Verlauf') +
      item('#/material', 'material', '🧰', 'Material') +
      item('#/beschwerden', 'beschwerden', '⚙️', 'Beschwerden') +
      '</div></nav>';
  }

  /* ---------- Onboarding ---------- */
  function renderOnboarding() {
    var dots = '<div class="dots" aria-hidden="true">' +
      [1, 2, 3, 4].map(function (n) {
        return '<span class="dot ' + (n === onboardStep ? 'active' : '') + '"></span>';
      }).join('') + '</div>';

    var body = '';
    if (onboardStep === 1) {
      body =
        '<div class="hero">👟</div>' +
        '<h2>Willkommen zurück!</h2>' +
        '<p>Schön, dass du wieder loslegst. Diese App begleitet dich in <strong>4 Wochen</strong> ' +
        'zurück in die Bewegung – zuhause, in deinem Tempo.</p>' +
        '<p class="muted small">Der Plan ist bewusst gelenkschonend aufgebaut. In den nächsten Schritten ' +
        'passen wir ihn an dich an. Du kannst später alles jederzeit ändern.</p>' +
        '<div class="btn-row"><button class="btn btn--lg" data-action="onb-next">Los geht’s</button></div>';
    } else if (onboardStep === 2) {
      body =
        '<h2>Hast du aktuell Beschwerden?</h2>' +
        '<p class="muted small">Mehrfachauswahl möglich. Wir bauen betroffene Übungen automatisch ' +
        'auf sichere Alternativen um. Nichts ist vorausgewählt.</p>' +
        complaintTogglesHTML() +
        '<div class="field"><label for="ob-ctext">Sonstige Beschwerden (optional)</label>' +
        '<textarea id="ob-ctext" data-field="complaintsText" placeholder="z. B. Nacken verspannt">' +
        esc(state.complaintsText) + '</textarea></div>' +
        navButtons(true);
    } else if (onboardStep === 3) {
      body =
        '<h2>Welches Material hast du?</h2>' +
        '<p class="muted small">Mehrfachauswahl möglich. Übungen, für die dir das Gerät fehlt, ' +
        'werden automatisch ersetzt.</p>' +
        equipTogglesHTML() +
        customEquipHTML('ob') +
        navButtons(true);
    } else {
      body =
        '<h2>Deine Trainingsfrequenz</h2>' +
        '<p class="muted small">Wie oft möchtest du pro Woche trainieren? Später jederzeit änderbar.</p>' +
        frequencyFieldsHTML() +
        '<div class="btn-row">' +
        '<button class="btn btn--ghost" data-action="onb-back">Zurück</button>' +
        '<button class="btn" data-action="onb-finish">Fertig – zum Dashboard</button></div>';
    }

    return '<div class="view view--noflow">' +
      '<p class="eyebrow">Einrichtung · Schritt ' + onboardStep + ' von 4</p>' +
      dots +
      '<div class="card">' + body + '</div>' +
      '</div>';
  }

  function navButtons(withBack) {
    return '<div class="btn-row">' +
      (withBack ? '<button class="btn btn--ghost" data-action="onb-back">Zurück</button>' : '') +
      '<button class="btn" data-action="onb-next">Weiter</button></div>';
  }

  function complaintTogglesHTML() {
    return Object.keys(COMPLAINT_LABELS).map(function (key) {
      var on = !!state.complaints[key];
      return toggleHTML('toggle-complaint', key, COMPLAINT_LABELS[key], '', on);
    }).join('');
  }

  function equipTogglesHTML() {
    return Object.keys(EQUIP_LABELS).map(function (key) {
      var on = state.equipment.indexOf(key) !== -1;
      return toggleHTML('toggle-equip', key, EQUIP_LABELS[key], '', on);
    }).join('');
  }

  function toggleHTML(action, key, label, sub, on) {
    return '<div class="toggle" role="checkbox" tabindex="0" aria-checked="' + (on ? 'true' : 'false') +
      '" data-action="' + action + '" data-key="' + esc(key) + '">' +
      '<span class="box" aria-hidden="true"></span>' +
      '<span class="label">' + esc(label) +
      (sub ? '<span class="sub">' + esc(sub) + '</span>' : '') + '</span></div>';
  }

  function customEquipHTML(prefix) {
    var list = state.customEquipment.map(function (name, i) {
      return '<div class="toggle" aria-checked="true" role="checkbox">' +
        '<span class="box" aria-hidden="true"></span>' +
        '<span class="label">' + esc(name) + '</span>' +
        '<button class="remove-x" data-action="remove-equip" data-index="' + i +
        '" aria-label="' + esc(name) + ' entfernen">✕</button></div>';
    }).join('');
    return list +
      '<div class="inline-fields" style="margin-top:6px">' +
      '<div class="field" style="flex:1"><input type="text" id="newEquipInput" ' +
      'placeholder="Eigenes Gerät hinzufügen"></div>' +
      '<button class="btn btn--soft" data-action="add-equip" style="flex:0 0 auto">Hinzufügen</button></div>';
  }

  function frequencyFieldsHTML() {
    function opts(from, to, val) {
      var o = '';
      for (var i = from; i <= to; i++) {
        o += '<option value="' + i + '"' + (i === val ? ' selected' : '') + '>' + i + '</option>';
      }
      return o;
    }
    return '<div class="field"><label for="freqS">Krafteinheiten pro Woche</label>' +
      '<select id="freqS" data-field="freqStrength">' + opts(2, 5, state.frequency.strength) + '</select></div>' +
      '<div class="field"><label for="freqE">Ausdauereinheiten pro Woche</label>' +
      '<select id="freqE" data-field="freqEndurance">' + opts(0, 3, state.frequency.endurance) + '</select></div>';
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    var week = currentWeek();
    var goal = totalGoal();
    var done = Math.min(strengthCount(), goal);
    var pct = goal > 0 ? Math.round((done / goal) * 100) : 0;

    var completedBlock = '';
    if (isCompleted()) {
      completedBlock =
        '<div class="card card--green stack">' +
        '<div class="hero" style="background:rgba(255,255,255,.15);color:#fff">🎉</div>' +
        '<h2 style="color:#fff">Programm geschafft!</h2>' +
        '<p>Du hast alle 4 Wochen abgeschlossen – stark! Du kannst weitertrainieren ' +
        'oder ein frisches Programm starten.</p>' +
        '<button class="btn btn--soft" data-action="restart">Neues Programm starten</button></div>';
    }

    var nextId = nextWorkoutId();
    var nextCard =
      '<div class="card card--green stack">' +
      '<p class="eyebrow" style="color:#cfeee0">Nächstes Training</p>' +
      '<h2 style="color:#fff;margin:0">' + esc(WORKOUTS[nextId].name) + '</h2>' +
      (state.currentSession
        ? '<p class="small">Du hast ein Training im Gange (' +
          esc(WORKOUTS[state.currentSession.workoutId].name) + ').</p>'
        : '') +
      '<a class="btn btn--soft btn--lg" href="#/workout/' + nextId + '">Training starten ▸</a></div>';

    // Fortschrittsbalken
    var progressCard =
      '<div class="card stack">' +
      '<div class="row-between"><h3 style="margin:0">Fortschritt · 4 Wochen</h3>' +
      '<span class="small muted">' + done + ' / ' + goal + ' Einheiten</span></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + goal +
      '" aria-valuenow="' + done + '" aria-label="Programmfortschritt: ' + done + ' von ' + goal +
      ' Krafteinheiten (' + pct + ' Prozent)">' +
      '<div class="fill" style="width:' + pct + '%"></div></div></div>';

    // Deine Woche
    var idx = nextIndex();
    var slots = '';
    for (var i = 0; i < state.frequency.strength; i++) {
      var wid = ORDER[(idx + i) % 3];
      slots += weekSlot(wid, i === 0);
    }
    for (var e = 0; e < state.frequency.endurance; e++) {
      slots += weekSlot('D', false);
    }
    var weekCard =
      '<div class="card"><h3>Deine Woche</h3>' +
      '<p class="small muted" style="margin-bottom:6px">' + state.frequency.strength +
      '× Kraft (A→B→C rotierend)' +
      (state.frequency.endurance > 0 ? ' · ' + state.frequency.endurance + '× Ausdauer' : '') +
      '</p>' + slots + '</div>';

    // Beschwerden-Hinweis
    var complaintHint = '';
    var ac = activeComplaints();
    if (ac.length || state.complaintsText.trim()) {
      var parts = ac.map(function (k) { return COMPLAINT_LABELS[k]; });
      if (state.complaintsText.trim()) parts.push(esc(state.complaintsText.trim()));
      complaintHint =
        '<div class="notice notice--warn" style="margin-bottom:14px">🩹 Aktive Beschwerden: ' +
        parts.join(', ') + '. Übungen werden entsprechend angepasst.</div>';
    }

    // Aufwärm- & Sicherheitshinweise
    var safetyCard =
      '<div class="card card--flat stack">' +
      '<h3>Immer dabei</h3>' +
      '<p class="small"><strong>Aufwärmen:</strong> ' + WARMUP_TEXT + '</p>' +
      '<hr class="sep">' +
      '<p class="small"><strong>Sicherheit:</strong> Sauber vor schwer – Technik geht vor Gewicht. ' +
      'Bei echtem Schmerz (nicht nur Muskelkater) abbrechen. Ruhig weiteratmen.</p></div>';

    return '<div class="view">' +
      '<div class="topbar"><div><p class="eyebrow">Woche ' + week + ' von 4</p>' +
      '<h1>Fit wieder starten</h1></div></div>' +
      complaintHint +
      (isCompleted() ? completedBlock : nextCard) +
      progressCard +
      weekCard +
      safetyCard +
      '</div>';
  }

  function weekSlot(wid, highlight) {
    var w = WORKOUTS[wid];
    var badge = wid;
    return '<div class="slot">' +
      '<span class="badge">' + badge + '</span>' +
      '<span class="grow"><span class="name">' + esc(w.name.replace(/^Workout . · /, '')) +
      '</span><br><span class="small muted">' +
      (wid === 'D' ? 'Ausdauer' : 'Krafttraining') + '</span></span>' +
      '<a class="btn btn--soft btn--sm" href="#/workout/' + wid + '">Start</a>' +
      '</div>';
  }

  /* ---------- Workout-Session ---------- */
  function renderWorkout(id) {
    var w = WORKOUTS[id];
    if (!w) return renderNotFound(id);

    // Session sicherstellen (Live-Zwischenspeicher)
    if (!state.currentSession || state.currentSession.workoutId !== id) {
      state.currentSession = newSession(id);
      save();
    }
    var s = state.currentSession;

    var header =
      '<div class="topbar">' +
      '<a class="iconbtn" href="#/" aria-label="Zurück zur Übersicht">‹</a>' +
      '<div><p class="eyebrow">Training · Woche ' + currentWeek() + '</p>' +
      '<h1>' + esc(w.name) + '</h1></div></div>';

    var warmup =
      stepCardHTML('Aufwärmen', '5 Min', WARMUP_TEXT, s.warmup, 'toggle-warmup');

    var middle = '';
    if (id === 'D') {
      var plan = endurancePlan(currentWeek(), state.complaints.knie);
      var enDone = s.entries.endurance.done;
      middle =
        '<div class="exercise ' + (enDone ? 'done' : '') + '">' +
        '<div class="head"><div class="grow"><h3>' + esc(plan.title) + '</h3>' +
        '<div class="scheme">Ausdauer</div></div>' +
        checkHTML(enDone, 'Ausdauer erledigt', 'toggle-endurance', '') + '</div>' +
        '<p class="small" style="margin-top:8px">' + esc(plan.detail) + '</p>' +
        (state.complaints.knie
          ? '<div class="notice notice--info">Wegen Knie-Beschwerde: reines Gehen statt Joggen.</div>'
          : '') +
        '</div>';
    } else {
      middle = w.exercises.map(function (pid) {
        return exerciseCardHTML(resolveExercise(pid), s.entries[pid]);
      }).join('');
    }

    var cooldown =
      stepCardHTML('Abwärmen', '3–5 Min', COOLDOWN_TEXT, s.cooldown, 'toggle-cooldown');

    var complaintHint = '';
    if (state.complaintsText.trim()) {
      complaintHint = '<div class="notice notice--warn" style="margin-bottom:12px">🩹 Dein Hinweis: ' +
        esc(state.complaintsText.trim()) + ' – achte besonders darauf.</div>';
    }

    var finish =
      '<button class="btn btn--lg btn--block" data-action="finish" style="margin-top:6px">' +
      'Training abschließen ✓</button>' +
      '<p class="small muted center" style="margin-top:8px">Alle Eingaben werden automatisch gespeichert.</p>';

    return '<div class="view view--noflow">' +
      header + complaintHint + warmup + middle + cooldown + finish +
      '</div>';
  }

  function stepCardHTML(title, scheme, text, done, action) {
    return '<div class="exercise ' + (done ? 'done' : '') + '">' +
      '<div class="head"><div class="grow"><h3>' + esc(title) + '</h3>' +
      '<div class="scheme">' + esc(scheme) + '</div></div>' +
      checkHTML(done, title + ' erledigt', action, '') + '</div>' +
      '<p class="small muted" style="margin-top:8px">' + esc(text) + '</p></div>';
  }

  function checkHTML(done, label, action, dataId) {
    return '<div class="check" role="checkbox" tabindex="0" aria-checked="' + (done ? 'true' : 'false') +
      '" aria-label="' + esc(label) + '" data-action="' + action + '"' +
      (dataId ? ' data-id="' + esc(dataId) + '"' : '') + '></div>';
  }

  function exerciseCardHTML(res, entry) {
    var ex = res.exercise;
    entry = entry || { done: false, weight: '', reps: '' };
    var notice = '';
    if (res.warning) notice = '<div class="notice notice--warn">⚠️ ' + esc(res.warning) + '</div>';
    else if (res.reason) notice = '<div class="notice notice--info">↺ ' + esc(res.reason) + '</div>';

    return '<div class="exercise ' + (entry.done ? 'done' : '') + '">' +
      '<div class="head"><div class="grow"><h3>' + esc(ex.name) + '</h3>' +
      '<div class="scheme">' + ex.sets + ' Sätze × ' + esc(ex.reps) + '</div></div>' +
      checkHTML(entry.done, ex.name + ' als erledigt markieren', 'toggle-exercise', res.plannedId) +
      '</div>' +
      notice +
      '<div class="io-fields">' +
      '<div class="field"><label for="w-' + res.plannedId + '">Gewicht (kg)</label>' +
      '<input id="w-' + res.plannedId + '" type="number" inputmode="decimal" min="0" step="0.5" ' +
      'value="' + esc(entry.weight) + '" data-field="weight" data-id="' + res.plannedId + '" placeholder="–"></div>' +
      '<div class="field"><label for="r-' + res.plannedId + '">Wiederholungen</label>' +
      '<input id="r-' + res.plannedId + '" type="number" inputmode="numeric" min="0" step="1" ' +
      'value="' + esc(entry.reps) + '" data-field="reps" data-id="' + res.plannedId + '" placeholder="–"></div>' +
      '</div>' +
      '<div class="actions">' +
      '<a class="btn btn--soft btn--sm" href="#/uebung/' + ex.id + '">Übung ansehen</a>' +
      '<button class="btn btn--muted btn--sm" data-action="swap" data-id="' + res.plannedId + '">Übung tauschen</button>' +
      '</div></div>';
  }

  function renderNotFound(id) {
    return '<div class="view view--noflow">' +
      '<div class="topbar"><a class="iconbtn" href="#/" aria-label="Zurück">‹</a>' +
      '<h1>Nicht gefunden</h1></div>' +
      '<div class="card center stack">' +
      '<div class="hero">🧭</div>' +
      '<h2>Dieses Training gibt es nicht</h2>' +
      '<p class="muted">Die angeforderte Workout-ID „' + esc(id) + '“ ist unbekannt.</p>' +
      '<a class="btn btn--block" href="#/">Zur Übersicht</a></div></div>';
  }

  /* ---------- Verlauf ---------- */
  function renderVerlauf() {
    var header = '<div class="topbar"><h1>Verlauf</h1></div>';

    if (state.history.length === 0) {
      return '<div class="view">' + header +
        '<div class="card empty"><span class="emoji">📈</span>' +
        '<p>Noch keine Trainings absolviert.</p>' +
        '<p class="small">Starte dein erstes Training über die Übersicht – ' +
        'danach erscheint hier dein Fortschritt.</p>' +
        '<a class="btn" href="#/">Zur Übersicht</a></div></div>';
    }

    // Chart-Karte
    var series = chartSeries();
    var chartAlt = series.length
      ? series.map(function (p) { return formatDate(p.date) + ': ' + p.max + ' kg'; }).join(' · ')
      : 'Noch keine Gewichtsangaben erfasst.';
    var chartCard =
      '<div class="card"><h3>Maximales Trainingsgewicht pro Session</h3>' +
      (series.length
        ? '<div class="chart-wrap"><canvas id="chart" width="520" height="200" role="img" ' +
          'aria-label="Liniendiagramm des maximalen Gewichts pro Session. ' + esc(chartAlt) + '"></canvas></div>'
        : '<p class="muted small">Noch keine Gewichtsangaben – trage bei Übungen ein Gewicht ein, ' +
          'dann erscheint hier die Kurve.</p>') +
      '<p class="small muted">' + esc(chartAlt) + '</p></div>';

    var items = state.history.map(function (h) {
      var lines;
      if (h.workoutId === 'D') {
        lines = '<ul><li>' + esc(h.endurance || 'Ausdauereinheit') + '</li></ul>';
      } else {
        lines = '<ul>' + h.exercises.map(function (e) {
          var detail = [];
          if (e.weight) detail.push(e.weight + ' kg');
          if (e.doneReps) detail.push(e.doneReps + ' Wdh.');
          var suffix = detail.length ? ' – ' + detail.join(', ') : ' – ' + e.sets + '×' + e.reps;
          return '<li>' + esc(e.name) + esc(suffix) + '</li>';
        }).join('') + '</ul>';
      }

      var editRow;
      if (editingHistoryId === h.id) {
        editRow =
          '<div class="inline-fields" style="margin-top:10px">' +
          '<div class="field" style="flex:1"><input type="date" id="hd-' + h.id + '" value="' + esc(h.date) + '"></div>' +
          '<button class="btn btn--sm" data-action="save-history-date" data-id="' + h.id + '">Speichern</button>' +
          '<button class="btn btn--muted btn--sm" data-action="cancel-edit">Abbrechen</button></div>';
      } else {
        editRow =
          '<div class="btn-row" style="margin-top:10px">' +
          '<button class="btn btn--soft btn--sm" data-action="edit-history" data-id="' + h.id + '">Datum ändern</button>' +
          '<button class="btn btn--danger btn--sm" data-action="delete-history" data-id="' + h.id + '">Löschen</button></div>';
      }

      return '<div class="card history-item">' +
        '<div class="meta"><h3 style="margin:0">' + esc(h.workoutName) + '</h3>' +
        '<span class="small muted">' + formatDate(h.date) + '</span></div>' +
        lines + editRow + '</div>';
    }).join('');

    return '<div class="view">' + header + chartCard + items + '</div>';
  }

  function chartSeries() {
    // älteste zuerst (links), nur Sessions mit numerischem Gewicht
    return state.history.slice().reverse().map(function (h) {
      var weights = (h.exercises || []).map(function (e) { return parseFloat(e.weight); })
        .filter(function (v) { return !isNaN(v) && v > 0; });
      return { date: h.date, max: weights.length ? Math.max.apply(null, weights) : 0 };
    }).filter(function (p) { return p.max > 0; });
  }

  function drawChart() {
    var canvas = document.getElementById('chart');
    if (!canvas) return;
    var series = chartSeries();
    if (!series.length) return;

    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 320;
    var cssH = 200;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    var padL = 38, padR = 14, padT = 14, padB = 26;
    var w = cssW - padL - padR;
    var h = cssH - padT - padB;

    var maxV = Math.max.apply(null, series.map(function (p) { return p.max; }));
    var niceMax = Math.max(5, Math.ceil(maxV / 5) * 5);

    // Achsen
    ctx.strokeStyle = '#d9d2c4';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + h); ctx.lineTo(padL + w, padT + h); ctx.stroke();

    // Gitter + Y-Beschriftung
    ctx.fillStyle = '#5c6b65';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var g = 0; g <= 2; g++) {
      var val = (niceMax / 2) * g;
      var yy = padT + h - (val / niceMax) * h;
      ctx.strokeStyle = '#efeadd';
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(padL + w, yy); ctx.stroke();
      ctx.fillText(String(val), padL - 6, yy);
    }

    function xAt(i) {
      return series.length === 1 ? padL + w / 2 : padL + (i / (series.length - 1)) * w;
    }
    function yAt(v) { return padT + h - (v / niceMax) * h; }

    // Linie
    ctx.strokeStyle = '#12805c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    series.forEach(function (p, i) {
      var x = xAt(i), y = yAt(p.max);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Punkte + X-Labels (nur erstes/letztes, um Überlappung zu vermeiden)
    ctx.fillStyle = '#12805c';
    series.forEach(function (p, i) {
      var x = xAt(i), y = yAt(p.max);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#5c6b65';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(formatDate(series[0].date).slice(0, 5), padL, padT + h + 6);
    if (series.length > 1) {
      ctx.textAlign = 'right';
      ctx.fillText(formatDate(series[series.length - 1].date).slice(0, 5), padL + w, padT + h + 6);
    }
  }

  /* ---------- Material ---------- */
  function renderMaterial() {
    return '<div class="view">' +
      '<div class="topbar"><h1>Material</h1></div>' +
      '<p class="muted small" style="margin-bottom:12px">Wähle aus, was dir zur Verfügung steht. ' +
      'Änderungen wirken sich sofort auf deinen Trainingsplan aus.</p>' +
      '<div class="card"><h3>Standard-Geräte</h3>' + equipTogglesHTML() + '</div>' +
      '<div class="card"><h3>Eigene Geräte</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Zusätzliche Geräte für deine Übersicht. ' +
      '(Bewusst manuell – keine Kamera/KI-Erkennung, damit die App kostenlos bleibt.)</p>' +
      customEquipHTML('mat') + '</div>' +
      '</div>';
  }

  /* ---------- Beschwerden & Einstellungen ---------- */
  function renderBeschwerden() {
    return '<div class="view">' +
      '<div class="topbar"><h1>Beschwerden</h1></div>' +
      '<div class="card"><h3>Aktuelle Beschwerden</h3>' +
      '<p class="small muted" style="margin-bottom:10px">Betroffene Übungen werden automatisch ' +
      'durch sichere Alternativen ersetzt.</p>' +
      complaintTogglesHTML() +
      '<div class="field"><label for="ctext">Sonstige Beschwerden</label>' +
      '<textarea id="ctext" data-field="complaintsText" placeholder="z. B. Nacken verspannt">' +
      esc(state.complaintsText) + '</textarea>' +
      '<p class="small muted">Wird im Training als Hinweis angezeigt (ohne automatische Anpassung).</p></div>' +
      '</div>' +
      '<div class="card"><h3>Einstellungen · Frequenz</h3>' +
      frequencyFieldsHTML() +
      '<p class="small muted">Bestimmt die Anzahl der Slots in „Deine Woche“ und den 4-Wochen-Fortschritt.</p>' +
      '</div>' +
      '</div>';
  }

  /* ---------- Übungsdetail ---------- */
  function renderUebung(id) {
    var ex = EXERCISES[id];
    if (!ex) return renderNotFound(id);

    var eqTags = ex.equipment.length
      ? ex.equipment.map(function (e) { return '<span class="tag">' + esc(EQUIP_LABELS[e] || e) + '</span>'; }).join('')
      : '<span class="tag">Kein Gerät nötig</span>';
    var loadTags = ex.loads.length
      ? ex.loads.map(function (l) { return '<span class="tag tag--load">belastet ' + esc(COMPLAINT_LABELS[l] || l) + '</span>'; }).join('')
      : '';

    var steps = '<ol class="steps">' + ex.steps.map(function (s) {
      return '<li>' + esc(s) + '</li>';
    }).join('') + '</ol>';

    return '<div class="view">' +
      '<div class="topbar"><a class="iconbtn" href="#/" aria-label="Zurück">‹</a>' +
      '<h1 style="font-size:1.2rem">' + esc(ex.name) + '</h1></div>' +
      '<div class="hero">' + (ex.emoji || '💪') + '</div>' +
      '<div class="card stack">' +
      '<div><h3>Zielmuskulatur</h3><p class="muted" style="margin:0">' + esc(ex.target) + '</p></div>' +
      '<div class="tags">' + eqTags + loadTags + '</div>' +
      '</div>' +
      '<div class="card"><h3>So geht’s</h3>' + steps + '</div>' +
      '<div class="card stack">' +
      '<p class="small muted">Kurzes Übungsvideo gesucht? Öffne eine YouTube-Suche ' +
      '(kein eigenes Video-Hosting).</p>' +
      '<a class="btn btn--ghost btn--block" href="' + ytLink(ex.name) + '" target="_blank" rel="noopener">' +
      '▶ Auf YouTube suchen</a></div>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Event-Handling (Delegation)
     ---------------------------------------------------------------------- */
  function onClick(ev) {
    var el = ev.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');

    switch (action) {
      case 'onb-next':
        onboardStep = Math.min(4, onboardStep + 1); render(); break;
      case 'onb-back':
        onboardStep = Math.max(1, onboardStep - 1); render(); break;
      case 'onb-finish':
        state.onboarded = true; save(); onboardStep = 1;
        location.hash = '#/'; render(); break;

      case 'toggle-complaint': {
        var ck = el.getAttribute('data-key');
        state.complaints[ck] = !state.complaints[ck]; save(); render(); break;
      }
      case 'toggle-equip': {
        var ek = el.getAttribute('data-key');
        var i = state.equipment.indexOf(ek);
        if (i === -1) state.equipment.push(ek); else state.equipment.splice(i, 1);
        save(); render(); break;
      }
      case 'add-equip': {
        var input = document.getElementById('newEquipInput');
        if (input && input.value.trim()) {
          state.customEquipment.push(input.value.trim()); save(); render();
        }
        break;
      }
      case 'remove-equip': {
        var idx = parseInt(el.getAttribute('data-index'), 10);
        state.customEquipment.splice(idx, 1); save(); render(); break;
      }

      case 'toggle-warmup':
        if (state.currentSession) { state.currentSession.warmup = !state.currentSession.warmup; save(); render(); }
        break;
      case 'toggle-cooldown':
        if (state.currentSession) { state.currentSession.cooldown = !state.currentSession.cooldown; save(); render(); }
        break;
      case 'toggle-endurance':
        if (state.currentSession && state.currentSession.entries.endurance) {
          var en = state.currentSession.entries.endurance;
          en.done = !en.done; save(); render();
        }
        break;
      case 'toggle-exercise': {
        var pid = el.getAttribute('data-id');
        if (state.currentSession && state.currentSession.entries[pid]) {
          var e2 = state.currentSession.entries[pid];
          e2.done = !e2.done; save(); render();
        }
        break;
      }
      case 'swap':
        swapExercise(el.getAttribute('data-id')); render(); break;
      case 'finish':
        finishWorkout(); break;

      case 'restart':
        if (confirm('Neues 4-Wochen-Programm starten? Dein bisheriger Verlauf bleibt erhalten.')) {
          state.programStartIndex = strengthTotal(); save(); render();
        }
        break;

      case 'edit-history':
        editingHistoryId = el.getAttribute('data-id'); render(); break;
      case 'cancel-edit':
        editingHistoryId = null; render(); break;
      case 'save-history-date': {
        var hid = el.getAttribute('data-id');
        var di = document.getElementById('hd-' + hid);
        if (di && di.value) {
          var entry = state.history.filter(function (x) { return x.id === hid; })[0];
          if (entry) entry.date = di.value;
          save();
        }
        editingHistoryId = null; render(); break;
      }
      case 'delete-history': {
        if (confirm('Diesen Eintrag wirklich löschen?')) {
          var did = el.getAttribute('data-id');
          state.history = state.history.filter(function (x) { return x.id !== did; });
          save(); render();
        }
        break;
      }
    }
  }

  // Live-Speicherung für Texteingaben ohne Re-Render (Fokus bleibt erhalten).
  function onInput(ev) {
    var t = ev.target;
    var field = t.getAttribute('data-field');
    if (!field) return;

    if (field === 'weight' || field === 'reps') {
      var id = t.getAttribute('data-id');
      if (state.currentSession && state.currentSession.entries[id]) {
        state.currentSession.entries[id][field] = t.value;
        save();
      }
    } else if (field === 'complaintsText') {
      state.complaintsText = t.value;
      save();
    }
  }

  // Änderungen an Dropdowns (Frequenz) – Re-Render zum Aktualisieren der Ansicht.
  function onChange(ev) {
    var t = ev.target;
    var field = t.getAttribute('data-field');
    if (field === 'freqStrength') {
      state.frequency.strength = parseInt(t.value, 10); save(); render();
    } else if (field === 'freqEndurance') {
      state.frequency.endurance = parseInt(t.value, 10); save(); render();
    }
  }

  // Tastatur: Enter/Leertaste auf role="checkbox" löst Klick aus (Barrierefreiheit).
  function onKey(ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
    var el = ev.target.closest('[role="checkbox"][data-action]');
    if (el) { ev.preventDefault(); el.click(); }
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */
  function init() {
    state = load();

    var app = document.getElementById('app');
    app.addEventListener('click', onClick);
    app.addEventListener('input', onInput);
    app.addEventListener('change', onChange);
    app.addEventListener('keydown', onKey);

    window.addEventListener('hashchange', render);
    render();

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* offline egal */ });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
