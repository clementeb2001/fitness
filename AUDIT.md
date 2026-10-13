# EinsatzFit – Produktvergleich und App-Check

Stand: 13. Oktober 2026. Ausgangspunkt: Commit `7d48ccf`.

## Vergleich und Umsetzung

„Beste App“ hängt vom Trainingsziel ab. Als Referenzen dienen fünf etablierte Angebote mit unterschiedlichen Stärken. Der Vergleich beruht auf ihren aktuellen offiziellen Produkt- und Hilfeseiten, nicht auf einem eigenen vollständigen Praxistest sämtlicher kostenpflichtiger Apps. Funktionen wurden eigenständig für EinsatzFit umgesetzt; fremde Videos, Designs und Trainingsprogramme wurden nicht übernommen.

| Referenz | Relevante Stärke | Umsetzung in EinsatzFit |
|---|---|---|
| [Hevy](https://www.hevyapp.com/features/track-workouts/) | Schnelles Satzprotokoll, RPE und automatische Pausen | Einzelne Sätze mit kg, Wiederholungen/Zeit/Distanz, optionalem RPE und eigener Bestätigung; Satz hinzufügen/entfernen; Timer nach jedem Satz |
| [Fitbod](https://help.fitbod.me/hc/en-us/sections/360001078993-Understanding-Fitbod-How-It-Works) | Progression anhand protokollierter Leistung | Erklärbare lokale Regeln: Steigerung erst nach allen Zielsätzen am oberen Wiederholungsziel mit RPE ≤ 8; Reduktion bei sehr hoher Anstrengung oder schlechter Tagesform. Kein behaupteter KI-Coach |
| [Freeletics](https://help.freeletics.com/hc/en-us/articles/360003933780-Adapt-your-Bodyweight-training-session) | Training an die verfügbare Zeit und Ausstattung anpassen | Direkte Dauerwahl auf der Startseite; korrigiertes Zeitbudget inklusive Auf-/Abwärmen; vorhandene Orts- und Tagesformsteuerung verbessert |
| [Strong](https://help.strongapp.io/article/237-about-exercise-detail) und [Trainingsnotizen](https://help.strongapp.io/article/134-adding-notes) | Übungsbezogener Verlauf und Notizen | Fortschrittskurve für eine ausgewählte Übung, letzte Sätze in der Trainingsansicht, Verlauf je Übung, Trainingsnotizen und CSV-Satzexport |
| [Nike Training Club](https://www.nike.com/gb/ntc-app?redirect=true&vst=nike+training+club) | Visuelle Anleitung innerhalb des Trainingsangebots | Eigene schematische Vorschauen für alle 56 Übungen, direkt in der App, mit Abspielen/Pause, Einzelschritten und langsamem Tempo. Keine Nike-Videos |

Zusätzlich: durchsuchbare Übungsbibliothek, Favoriten und Filter für Eigengewicht oder vorhandenes Material. Alle Kernfunktionen bleiben ohne Konto, Abo oder externen Dienst nutzbar.

## Gefundene und behobene Probleme

- **Erfassung:** Die alte Oberfläche speicherte einen Wert pro Übung, obwohl sie mehrere Sätze vorgab. Nun wird jeder absolvierte Satz getrennt gespeichert. Historische Einträge bleiben erhalten; daraus werden keine nicht belegten Sätze erzeugt.
- **Falsche Leistungsdaten:** Nicht erledigte Übungen konnten in Verlauf und Rekorde eingehen. Neue Einheiten zählen ausschließlich bestätigte Sätze; leere Einheiten werden nicht gespeichert. Das Volumen summiert tatsächliche kg × Wiederholungen, ohne Zeit- und Distanzwerte als Wiederholungen zu behandeln.
- **Progression:** Eine einzelne Wiederholungszahl konnte ungeachtet der Anstrengung eine pauschale Erhöhung um 2,5 oder 5 kg auslösen. Neue Vorschläge berücksichtigen alle Zielsätze und RPE; fehlende Angaben lösen keine automatische Erhöhung aus.
- **Statistik:** Der alte Chart verglich das höchste Gewicht verschiedener Übungen. Jetzt lässt sich eine konkrete Übung auswählen. Die 1RM-Schätzung wird auf Wiederholungsübungen mit 1–12 Wiederholungen begrenzt. Eine noch unvollständige aktuelle Woche setzt die vergangene Wochenserie nicht sofort auf null.
- **Zeitplanung:** 20-Minuten-Einheiten konnten schon vor Aufwärmen über dem Zeitbudget liegen. Der Plan reserviert nun zehn Minuten für Auf-/Abwärmen. Dauerangaben bleiben Schätzungen; zusätzliche manuelle Sätze können die Zeit verlängern.
- **Sitzungsschutz:** Ein anderer Trainingslink konnte die laufende Einheit still ersetzen. Jetzt muss sie fortgesetzt oder ausdrücklich verworfen werden. Nach absolvierten Sätzen werden planverändernde Orts-/Beschwerdewechsel gesperrt; ein bewusster Übungstausch fragt vor dem Zurücksetzen der zugehörigen Sätze nach.
- **Timer:** Der Countdown arbeitete mit Intervall-Aufrufen statt echter vergangener Zeit. Jetzt verwendet er Zeitpunkte und holt nach Hintergrundpausen auf. Der Besuch einer Übungsvorschau beendet die Pause nicht mehr. Browser/iOS können Alarme im gesperrten Zustand weiterhin unterdrücken.
- **Belastungsfilter:** Mehrere vermeintlich schonende Alternativen hatten leere Belastungslisten. Fehlende Zuordnungen und zusätzliche Bank-/Box-Anforderungen wurden ergänzt. Ohne passende Alternative wird die Übung nicht zur Satzerfassung angeboten. Die Oberfläche verspricht keine medizinisch „sichere“ Ersatzübung.
- **Import:** Struktur, bekannte IDs, Wertebereiche und Einstellungen werden normalisiert. Freitext wird bei der Anzeige maskiert; sehr große Dateien abgewiesen. Unlesbare lokale Daten werden nach Möglichkeit vor einem Neustart als Wiederherstellungskopie aufbewahrt.
- **Offline/Updates:** Neue Vorschauen und Berechnungsmodule werden lokal gecacht. Updates warten auf Bestätigung, statt ein laufendes Training ungefragt neu zu laden. Der Service Worker löscht nur EinsatzFit-Caches.

## Prüfung und Grenzen

- Automatisierte Tests für Berechnungen, Einheiten, Vorschau-Vollständigkeit, Progression, ungültige Eingaben, Migration, Beschwerden, Timer und Zeitbudget.
- Browserprüfung: Onboarding, komplette Satz-Erfassung, leere/teilweise Einheit, Notizen, Wiederaufnahme nach Neuladen, alle 56 Vorschauen, Suche/Favoriten, Export, Seitenwechsel, Offline-Betrieb und Breiten 320/390/768/1280 px.
- Die Vorschauen sind vereinfachte, eigenständig erstellte Bewegungsillustrationen. Sie sind keine gefilmten Trainer-Demos und keine individuelle Technikkontrolle. Eine fachliche Prüfung der gesamten Übungsbibliothek und ein Test auf einem echten iPhone stehen aus.
- Historische Leistungsdaten aus der alten Version können nicht rückwirkend als tatsächlich absolvierte Sätze verifiziert werden. Sie bleiben für Kompatibilität im Verlauf.
- Cloud-Synchronisierung, HealthKit/Watch, soziale Funktionen, Ernährungsdatenbank und fremde Premium-Video-Bibliotheken wurden nicht vorgetäuscht. Sie benötigen andere Architektur, Konten oder Lizenzen. EinsatzFit bleibt eine lokale Offline-PWA.

## Tests ausführen

`node --test tests/training.test.cjs`

Für die zusätzliche Browserprüfung: Playwright installieren, `python3 -m http.server 8765 --bind 127.0.0.1` im Projekt starten, dann `node tests/browser.cjs`. Optional `PLAYWRIGHT_EXECUTABLE_PATH` für einen vorhandenen Chromium-Browser setzen. Screenshots gehen standardmäßig in ein temporäres Verzeichnis oder in `SCREENSHOT_DIR`.
