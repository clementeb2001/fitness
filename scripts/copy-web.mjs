// Kopiert die statische Web-App (Repo-Root) in den Capacitor-Web-Ordner www/.
// Gleiche Dateiliste wie der GitHub-Pages-Deploy (_site) – eine Quelle der Wahrheit.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'index.html', 'style.css', 'app.js', 'training.js', 'previews.js',
  'manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png'
];
const out = path.join(root, 'www');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of files) {
  const src = path.join(root, f);
  if (!fs.existsSync(src)) { console.error('Fehlt:', f); process.exit(1); }
  fs.copyFileSync(src, path.join(out, f));
}
console.log('Web → www/ (' + files.length + ' Dateien kopiert)');
