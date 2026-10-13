# EinsatzFit als echte iOS-App (Capacitor)

Die App ist mit **[Capacitor](https://capacitorjs.com/)** so eingerichtet, dass aus
der bestehenden Web-App eine **echte native iOS-App** wird – App-Icon auf dem
Home-Bildschirm, Vollbild, native Haptics/Status-Bar, App-Store-fähig.

> **Ehrlich & wichtig:** Den finalen iOS-Build kann **nur ein Mac mit Xcode**
> erzeugen und signieren (Apple-Vorgabe). Dieses Repo enthält das **komplette
> Projekt** – auf dem Mac sind es nur wenige Befehle.

## Was du brauchst

| | Zweck | Kosten |
|---|---|---|
| **Mac mit Xcode** | iOS-App bauen & signieren | kostenlos (App Store) |
| **Apple-ID** | App aufs eigene iPhone | kostenlos → läuft **7 Tage**, dann neu laden |
| **Apple Developer Program** | TestFlight + App Store, dauerhaft | **99 $/Jahr** |
| **Node.js ≥ 18** | Capacitor-CLI | kostenlos |

Für „nur selbst testen" reicht die **kostenlose Apple-ID** (7-Tage-Limit).
Für „dauerhaft / verteilen / App Store" brauchst du das **Developer-Programm**.

## Schritte auf dem Mac

```bash
git clone https://github.com/clementeb2001/fitness.git
cd fitness

npm install            # Capacitor installieren
npm run ios:add        # Web nach www/ kopieren + natives iOS-Projekt anlegen (einmalig)
npm run ios:open       # Projekt in Xcode öffnen
```

Nach jeder späteren Web-Änderung:

```bash
npm run ios:sync       # Web nach www/ kopieren + ins native Projekt übernehmen
```

## In Xcode

1. Projekt **App** → Reiter **Signing & Capabilities**.
2. Bei **Team** deine Apple-ID wählen (einmalig *Add an Account…*).
3. **Bundle Identifier** `com.einsatzfit.app` – falls belegt, eigene wählen
   (`com.deinname.einsatzfit`).
4. iPhone per Kabel anstecken und oben als Ziel wählen.
5. **▶ Run** – wird gebaut, signiert und aufs iPhone installiert.
6. Am iPhone einmalig: **Einstellungen → Allgemein → VPN & Geräteverwaltung →**
   dein Entwickler-Zertifikat **vertrauen**.

## Architektur

- Die **Web-Dateien im Repo-Root** sind die einzige Quelle. `npm run web:build`
  (läuft in `ios:add`/`ios:sync` automatisch) kopiert sie nach `www/` – dem
  Capacitor-Web-Ordner. `www/` und `ios/` sind absichtlich **nicht eingecheckt**
  (werden lokal erzeugt).
- Dieselben Dateien liefern die **GitHub-Pages-PWA**
  (`https://clementeb2001.github.io/fitness/`).
- Der Service Worker und der „Installieren"-Hinweis werden in der nativen App
  automatisch übersprungen; Vibration nutzt dort natives Haptik-Feedback.

## Vorbereitete native Plugins

In `package.json`: `@capacitor/haptics`, `@capacitor/status-bar`,
`@capacitor/splash-screen`, `@capacitor/app`, `@capacitor/preferences`.

Sinnvolle nächste native Schritte (eigener Ausbau):
- **Lokale Erinnerungen** (`@capacitor/local-notifications`) – Trainings-Reminder.
- **Herzfrequenz per Bluetooth** (`@capacitor-community/bluetooth-le`).
- **Apple Health** – Workouts/Schritte importieren.
