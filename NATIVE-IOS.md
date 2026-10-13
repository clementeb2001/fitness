# iOS-Vorbereitung mit Capacitor

Das Repository enthält die Web-App, die Capacitor-Konfiguration und einen geprüften Build für die native JavaScript-Anbindung. **Ein signiertes iOS-Paket und ein auf einem iPhone getestetes Xcode-Projekt sind damit noch nicht erstellt.** `ios/` wird lokal erzeugt und ist nicht eingecheckt.

## Lokaler Build

Voraussetzungen: Node.js 22 oder neuer, pnpm 11.19.0, Mac mit eingerichtetem Xcode. Für Installation und Verteilung gelten Apples aktuelle Anforderungen an Gerät, Signierung und Entwicklerkonto.

```sh
git clone https://github.com/clementeb2001/fitness.git
cd fitness
pnpm install --frozen-lockfile
pnpm test
pnpm run web:build
pnpm run ios:add       # einmalig: Xcode-Projekt erzeugen
pnpm run ios:open
```

Nach Web-Änderungen: `pnpm run ios:sync`.

In Xcode Team und Bundle Identifier wählen, das eigene Gerät als Ziel einstellen und den Build signieren. Ein vorhandener Xcode-Lizenzdialog muss vom Benutzer selbst gelesen und akzeptiert werden.

## Was tatsächlich eingebunden ist

- `native/bridge.js` importiert und registriert Haptics, StatusBar und SplashScreen über die Capacitor-Pakete. Der Build bündelt diese Module und lädt sie **vor** `app.js` in `www/index.html`.
- Native Aufrufe behandeln Promise-Fehler, statt sie mit einem synchronen `try/catch` zu verlieren. Der Statusleistenstil folgt dem hellen/dunklen App-Design; der auf iOS nicht unterstützte Hintergrundfarben-Aufruf wird dort vermieden.
- Die PWA bleibt unabhängig von nativen Modulen. Installationstipps und Service Worker werden innerhalb von Capacitor übersprungen.
- `www/` und `_site/` werden aus derselben Dateiliste erstellt. Der Web-Build erzeugt eine Cache-Kennung aus dem Dateiinhalt.

## Daten und noch offene native Arbeit

Die App verwendet weiterhin `localStorage`. Das bereits deklarierte Preferences-Paket ist **noch nicht als Datenspeicher integriert**. Vor einer nativen Veröffentlichung muss eine migrationssichere native Speicherung implementiert und auf einem Gerät getestet werden. Capacitor weist auf mögliche Bereinigung von Web-Storage durch mobile Betriebssysteme hin: [Preferences-Dokumentation](https://capacitorjs.com/docs/v6/apis/preferences).

Die native App und die Browser-PWA haben getrennte Speicherbereiche. Browserdaten erscheinen nicht automatisch in der iOS-App. JSON-Export/Import ist die vorhandene Übertragungsmöglichkeit; Datei-Export und Import müssen im echten iOS-WebView geprüft werden.

Die von Claude gewählte Capacitor-6-Version bleibt bewusst erhalten. Vor App-Store-Einreichung stehen die Prüfung der aktuellen Apple-/SDK-Anforderungen, ein gegebenenfalls nötiges Capacitor-Upgrade, Datenschutzmanifest, native Icons, Signierung und Gerätetests aus. Dieser Buildtest ersetzt das nicht.

Offizielle Referenzen: [Plugins verwenden](https://capacitorjs.com/docs/v6/basics/using-plugins), [StatusBar](https://capacitorjs.com/docs/v6/apis/status-bar).
