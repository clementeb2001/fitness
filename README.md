# EinsatzFit

Professionelle, installierbare **Trainings-App (PWA)** für **Einsatzkräfte** –
Schwerpunkt **Polizei & Feuerwehr**, mit **Ski-Vorbereitung** im Winter.

- **Keine Anmeldung, kein Backend, kein Server** – alles clientseitig im Browser.
- Persistenz ausschließlich über `localStorage` (ein JSON-State).
- Reines **HTML/CSS/Vanilla-JS**, keine Frameworks, keine Build-Tools, offline-fähig.
- Deutsch, mobile-first, installierbar auf dem iPhone-Home-Bildschirm.

Live: **https://clementeb2001.github.io/fitness/**

## Kernfunktionen

- **Orte mit eigenem Material** – Lege Orte an (z. B. *Wache*, *Zuhause*, *Unterwegs*)
  und hinterlege je Ort das verfügbare Gerät. Vor jeder Einheit wählst du, wo du bist –
  der Plan rechnet automatisch nur mit dem Material dieses Ortes.
- **Tägliches Tagesbefinden** – Beschwerden (Rücken, Schulter, Knie, Handgelenk,
  Ellenbogen, Sprunggelenk, Nacken) pro Tag antippbar. Betroffene Übungen werden über
  eine kaskadierende Alternativen-Kette automatisch durch andere Varianten ersetzt –
  mit sichtbarem Hinweis „Ersetzt wegen …". Die Prüfung greift auch nach manuellem Tausch.
- **Voll einstellbar** – Einheiten/Woche (2–6) **und** Dauer pro Einheit (20–75 Min).
  Der Plan skaliert die Übungsanzahl automatisch auf die verfügbare Zeit – ideal, wenn
  mal weniger Zeit ist.
- **Tactical-Programm** – Session-Typen: *Kraft Unterkörper & Tragen*, *Kraft Oberkörper
  & Zug*, *Work Capacity* (Konditionierung), *Ganzkörper*, *Ausdauer & Rucking* und im
  Winter *Ski-Prep* (Beine exzentrisch, Balance, Knie-Prävention). Fokus auf
  einsatzrelevante Fähigkeiten: Kraft, Arbeitskapazität, Tragen & Greifen, Kondition.
- **Dashboard „alles im Blick"** – empfohlene Einheit, Ort-Umschalter, Tagesbefinden,
  Wochen-Adhärenz, Serie, Wochenplan, Sicherheitshinweise.
- **Verlauf** – alle Einheiten, Bearbeiten/Löschen, abhängigkeitsfreier Canvas-Chart
  (Maximalgewicht über die Zeit) mit textueller Alternative.
- **Übungsdetails** – Zielmuskulatur, Schritt-für-Schritt, Coach-Tipp, eigene animierte Offline-Vorschau.
- **Design** – dunkel/hell/automatisch, tactical „Operations-Console"-Look.

## Barrierefreiheit

Abhak-Elemente mit `role="checkbox"`/`aria-checked` (Enter/Leertaste), Chart mit
textueller Alternative, Navigation mit `aria-label`, `prefers-reduced-motion` respektiert,
beide Farbthemen voll ausgearbeitet.

## PWA / Installation

`manifest.json` (installierbar, `standalone`), `sw.js` (Service Worker, Cache-first,
offline), Icons 192/512. Auf dem iPhone in Safari öffnen → Teilen → „Zum Home-Bildschirm".

## Dateien

`index.html`, `style.css`, `app.js`, `training.js`, `previews.js`, `manifest.json`, `sw.js`, `icon-192.png`,
`icon-512.png`. Deployment via GitHub Pages (Workflow `.github/workflows/pages.yml`,
automatischer Deploy bei Push auf `main`).

## Lokal testen

```bash
python3 -m http.server 8000   # dann http://localhost:8000
```

## Bewusste Auslassungen

Keine Kamera-/KI-Materialerkennung (bräuchte bezahlte Vision-API + Server) – Material
wird über Orte manuell gepflegt. Kein Backend, keine Datenbank, kein Login. So bleibt die
App **kostenlos** und offline-fähig.

## Update: Satzprotokoll und Offline-Vorschauen

- 56 interne schematische Bewegungsvorschauen mit Pause, Einzelschritten und Tempoauswahl.
- Übungsbibliothek mit Suche, Materialfilter und Favoriten.
- Satzweise Erfassung, RPE, automatische Satzpause, letzte Leistung und begründete Progression.
- Übungsbezogene Fortschrittskurve, Trainingsnotizen, CSV-Export und JSON-Backup.
- Schutz laufender Einheiten, geprüfte Datenmigration und Updates nach Bestätigung.

Der [Produktvergleich und App-Check](AUDIT.md) dokumentiert Quellen, behobene Fehler, Tests und Grenzen.

Tests: `node --test tests/training.test.cjs` (Node 20 oder neuer, keine Abhängigkeiten).

## Review der iOS-Vorbereitung und kompakter Trainingsmodus

[Review und Änderungen](REVIEW-CLAUDE.md): Inline-Vorschauen, Trainingsfortschritt, wiederherstellbarer kompakter Timer, barrierefreie Detail-Tabs und automatisch versionierte Offline-Updates. Die [iOS-Anleitung](NATIVE-IOS.md) beschreibt den Stand der nativen Vorbereitung und die offenen Gerätetests.

Web-Deployment: `node scripts/web-build.mjs` erzeugt `_site/` mit einer aus dem Inhalt berechneten Cache-Kennung. Native Vorbereitung: `pnpm install --frozen-lockfile && pnpm run web:build`. Tests: `node --test tests/*.test.cjs`.
