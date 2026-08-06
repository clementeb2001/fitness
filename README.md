# Fit wieder starten

Eine kostenlose, eigenständige **Progressive Web App (PWA)** für den Wiedereinstieg
ins Training nach einer Pause – zuhause mit **Kurzhanteln** und **Widerstandsband**.

- **Keine Anmeldung, kein Backend, kein Server** – alles läuft clientseitig im Browser.
- Persistenz ausschließlich über `localStorage` (ein einziger JSON-State).
- Sprache: **Deutsch**. Zielgerät: primär iPhone (Home-Bildschirm-Installation), mobile-first.
- Reines **HTML/CSS/Vanilla-JS**, keine Frameworks, keine Build-Tools, keine externen
  Laufzeit-Abhängigkeiten.

## Funktionen

- **Onboarding** (mehrstufig): Begrüßung → Beschwerden → Material → Trainingsfrequenz.
- **Dashboard**: Programmwoche (1–4), nächstes Training (A → B → C rotierend),
  Fortschrittsbalken, „Deine Woche“, Aufwärm- & Sicherheitshinweise, Abschluss-Zustand.
- **Trainings-Session**: Aufwärmen → Übungen → Abwärmen, Live-Speicherung jeder Eingabe,
  Gewicht/Wiederholungen erfassen, Übung tauschen, Detaillink.
- **Adaptions-Logik**: Übungen tragen Tags für benötigtes Material (`equipment`) und
  belastete Körperregionen (`loads`). Fehlt Material oder belastet eine Übung eine aktive
  Beschwerde, wird über eine kaskadierende Alternativen-Kette automatisch eine sichere
  Übung eingesetzt – mit sichtbarem Hinweis „Ersetzt wegen: …“. Die Prüfung greift auch
  nach einem manuellen Tausch.
- **Verlauf**: alle Sessions, Datum bearbeiten/löschen, abhängigkeitsfreier Canvas-Chart
  (max. Gewicht pro Session) mit textueller Alternative.
- **Material** und **Beschwerden & Einstellungen**: jederzeit änderbar; wirkt sofort.
- **Übungsdetail**: Zielmuskulatur, Schritt-für-Schritt-Anleitung, Bild, YouTube-Suchlink.

## Trainingsplan

4-Wochen-Programm mit Workouts **A** (Unterkörper), **B** (Oberkörper, schulterschonend),
**C** (Kraft & Stabilität) und **D** (Ausdauer). Ausdauer nutzt einen Gehen/Joggen-
Intervallaufbau (Woche 1: 5× 3 Min gehen + 1 Min joggen … Woche 4: 20 Min durchgehend
joggen) und schaltet bei aktivem Knie-Problem automatisch auf reines Gehen um.

## Barrierefreiheit

Abhak-Elemente mit `role="checkbox"`/`aria-checked` (per Enter/Leertaste bedienbar),
Fortschrittsbalken mit `role="progressbar"`, Chart mit textueller Alternative,
Navigation mit `aria-label`.

## PWA / Installation

`manifest.json` (installierbar, `standalone`), `sw.js` (Service Worker, Cache-first für
Offline-Nutzung), Icons in 192px und 512px. Auf dem iPhone in Safari öffnen →
Teilen → „Zum Home-Bildschirm“.

## Deployment (GitHub Pages)

Rein statisches Hosting – kein Server nötig. Dateien:
`index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`.

1. Repository-Einstellungen → **Pages** → Branch auswählen, Ordner `/root`.
2. Die App ist danach unter der GitHub-Pages-URL erreichbar.

Da die App relative Pfade nutzt, funktioniert sie auch in einem Unterverzeichnis
(z. B. `https://<user>.github.io/<repo>/`).

## Lokal testen

Einen einfachen statischen Server starten, z. B.:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Bewusste Auslassungen

Keine Kamera-/KI-Materialerkennung (bräuchte bezahlte Vision-API + Server) – Material wird
manuell gepflegt. Kein Backend, keine Datenbank, kein Login. So bleibt die App **100 %
kostenlos** und offline-fähig.
