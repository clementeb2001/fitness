import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { root, buildWeb } from './web-build.mjs';

// Bundle plugin imports first: missing dependencies must not destroy the last build.
const bundle = await build({ entryPoints: [path.join(root, 'native/bridge.js')], bundle: true, write: false, format: 'iife', target: 'safari15', minify: true });
const out = path.join(root, 'www');
await buildWeb(out);
await fs.writeFile(path.join(out, 'native-bridge.js'), bundle.outputFiles[0].contents);
const html = await fs.readFile(path.join(out, 'index.html'), 'utf8');
await fs.writeFile(path.join(out, 'index.html'), html.replace('<script src="app.js">', '<script src="native-bridge.js"></script>\n  <script src="app.js">'));
console.log('Web + native Plugin-Bridge → www/');
