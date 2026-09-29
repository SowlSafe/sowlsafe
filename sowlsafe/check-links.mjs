// Vérifie que tous les liens et ressources internes existent dans dist/
import fs from 'node:fs'; import path from 'node:path';
const OUT = process.argv[2] || 'dist'; let bad = 0;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const f of walk(OUT).filter((f) => f.endsWith('.html') && !f.endsWith('404.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|#|data:)/.test(url)) continue;
    const target = path.resolve(path.dirname(f), url.split('#')[0].split('?')[0]);
    if (!fs.existsSync(target)) { console.log(`✗ ${path.relative(OUT, f)} → ${url}`); bad++; }
  }
}
console.log(bad ? `${bad} lien(s) cassé(s)` : '✓ Tous les liens internes fonctionnent');
process.exit(bad ? 1 : 0);
