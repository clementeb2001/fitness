import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const assets = ['index.html', 'style.css', 'app.js', 'training.js', 'previews.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

// Every deployment gets a cache derived from its actual content. Source SW changes
// are hashed too, so update logic changes cannot be hidden by an unchanged version.
export async function buildWeb(out, source = root) {
  const inputs = await Promise.all([...assets, 'sw.js'].map(async file => [file, await fs.readFile(path.join(source, file))]));
  const hash = createHash('sha256');
  inputs.forEach(([file, data]) => { hash.update(file); hash.update(data); });
  const version = 'einsatzfit-' + hash.digest('hex').slice(0, 16);
  // Validate all inputs before touching the output. Only generated paths are accepted.
  if (!['_site', 'www'].includes(path.basename(out)) || path.resolve(out) === path.resolve(source)) throw new Error('Invalid generated output directory');
  const staging = out + '.staging';
  await fs.rm(staging, { recursive: true, force: true });
  await fs.mkdir(staging, { recursive: true });
  for (const [file, data] of inputs) {
    const content = file === 'sw.js' ? data.toString().replace(/const CACHE = '[^']+';/, `const CACHE = '${version}';`) : data;
    await fs.writeFile(path.join(staging, file), content);
  }
  await fs.rm(out, { recursive: true, force: true });
  await fs.rename(staging, out);
  return version;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const version = await buildWeb(path.join(root, '_site'));
  console.log('Web → _site/ · ' + version);
}
