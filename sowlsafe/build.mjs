// SowlSafe — générateur de site statique minimal (aucune dépendance).
// Usage : node build.mjs            -> dist/
//         node build.mjs --preview  -> dist-preview/ (page d'accueil sans squelette, pour l'aperçu Claude)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'dist-preview' : 'dist');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));

// ---------- utilitaires ----------
const read = (p) => fs.readFileSync(p, 'utf8');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]
  );
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const d of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, d.name), t = path.join(dst, d.name);
    d.isDirectory() ? copyDir(s, t) : fs.copyFileSync(s, t);
  }
}
// Métadonnées : commentaire <!--meta {...} --> en tête de fichier
function parse(file) {
  const src = read(file);
  const m = src.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Métadonnées manquantes : ${file}`);
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const frDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- contenu ----------
const articles = walk(path.join(ROOT, 'src/articles'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => ({ ...parse(f), slug: path.basename(f, '.html') }))
  .sort((a, b) => b.meta.date.localeCompare(a.meta.date));

const tools = JSON.parse(read(path.join(ROOT, 'src/data/outils.json')));

function articleCard(a, pre) {
  const m = a.meta;
  return `<a class="card-link article-card" href="${pre}articles/${a.slug}.html">
  ${m.image ? `<img src="${pre}assets/img/${m.image}" alt="" loading="lazy" width="640" height="400">` : ''}
  <div class="card-body">
    <p class="eyebrow">${esc(m.module)} · ${frDate(m.date)}</p>
    <h3>${esc(m.title)}</h3>
    <p>${esc(m.summary)}</p>
    <span class="more">Lire l'article · ${m.readingTime} min</span>
  </div>
</a>`;
}
function toolCard(t, pre) {
  return `<a class="card-link tool-card" href="${pre}${t.href}">
  <p class="eyebrow">${esc(t.module)} · ${esc(t.format)}</p>
  <h3>${esc(t.title)}</h3>
  <p>${esc(t.summary)}</p>
  <span class="more">${esc(t.cta)}</span>
</a>`;
}

// ---------- gabarit ----------
const OWL = `<svg class="owl" viewBox="0 0 40 40" aria-hidden="true"><path class="owl-head" d="M5 9 11.5 3.5 16 8.5h8l4.5-5L35 9v15.5C35 32.5 28.3 38 20 38S5 32.5 5 24.5Z"/><circle class="owl-eye" cx="13.6" cy="19" r="6.2"/><circle class="owl-eye" cx="26.4" cy="19" r="6.2"/><circle class="owl-iris" cx="13.6" cy="19" r="3"/><circle class="owl-iris" cx="26.4" cy="19" r="3"/><path class="owl-iris" d="m20 24 2.2 3.2h-4.4Z"/></svg>`;

const NAV = [
  ['approche', 'Approche', 'approche.html'],
  ['modules', 'Modules', 'modules.html'],
  ['outils', 'Outils', 'outils.html'],
  ['articles', 'Articles', 'articles.html'],
  ['a-propos', 'À propos', 'a-propos.html'],
];

function layout({ meta, body, rel, isEntry }) {
  const depth = rel.split('/').length - 1;
  const pre = '../'.repeat(depth);
  const title = meta.title === SITE.name ? `${SITE.name} · ${SITE.tagline}` : `${meta.title} · ${SITE.name}`;
  const nav = NAV.map(([k, label, href]) =>
    `<a href="${pre}${href}"${meta.nav === k ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const head = `<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description || SITE.description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(meta.description || SITE.description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#13233a">
<link rel="icon" href="${pre}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Unbounded:wght@500;700&display=swap">
<link rel="stylesheet" href="${pre}assets/css/style.css">`;
  const page = `<a class="skip" href="#contenu">Aller au contenu</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="${pre}index.html" aria-label="${SITE.name}, accueil">${OWL}<span>Sowl<b>Safe</b></span></a>
    <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Navigation principale">${nav}<a class="btn btn-small" href="${pre}audit.html"${meta.nav === 'audit' ? ' aria-current="page"' : ''}>Demander un audit</a></nav>
  </div>
</header>
<main id="contenu">
${body.replaceAll('{{pre}}', pre)}
</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a class="brand" href="${pre}index.html">${OWL}<span>Sowl<b>Safe</b></span></a>
      <p>${esc(SITE.tagline)}</p>
      <p class="signature">Sécurité · Sûreté · Santé · Sciences</p>
    </div>
    <div><p class="footer-title">Plateforme</p>${NAV.map(([, l, h]) => `<a href="${pre}${h}">${l}</a>`).join('')}</div>
    <div><p class="footer-title">Outils</p>${tools.map((t) => `<a href="${pre}${t.href}">${esc(t.short)}</a>`).join('')}</div>
    <div><p class="footer-title">Contact</p><a href="${pre}audit.html">Audit et accompagnement</a><a href="${pre}a-propos.html#contact">Nous écrire</a><a href="${pre}mentions-legales.html">Mentions légales et confidentialité</a></div>
  </div>
  <div class="wrap footer-bottom"><p>© ${new Date().getFullYear()} ${SITE.name}. Les outils proposés sont des aides à la réflexion, pas des diagnostics médicaux.</p></div>
</footer>
<script src="${pre}assets/js/site.js" defer></script>
${(meta.scripts || []).map((s) => `<script src="${pre}assets/js/${s}" defer></script>`).join('\n')}`;

  if (isEntry) return `${head.replace(/<title>[^<]*<\/title>/, '<title>' + SITE.name + '</title>')}\n${page}\n`; // l'aperçu Claude ajoute lui-même le squelette
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${page}
</body>
</html>
`;
}

// ---------- génération ----------
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'public'), OUT);

function render(meta, body, rel) {
  const pre = '../'.repeat(rel.split('/').length - 1);
  body = body
    .replaceAll('{{ARTICLES}}', articles.map((a) => articleCard(a, '{{pre}}')).join('\n'))
    .replaceAll('{{LATEST_ARTICLES}}', articles.slice(0, 3).map((a) => articleCard(a, '{{pre}}')).join('\n'))
    .replaceAll('{{TOOLS}}', tools.map((t) => toolCard(t, '{{pre}}')).join('\n'));
  const html = layout({ meta, body, rel, isEntry: PREVIEW && rel === 'index.html' });
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, html);
  return pre;
}

const pagesDir = path.join(ROOT, 'src/pages');
for (const f of walk(pagesDir).filter((f) => f.endsWith('.html'))) {
  const { meta, body } = parse(f);
  render(meta, body, path.relative(pagesDir, f).split(path.sep).join('/'));
}
const articleTpl = read(path.join(ROOT, 'src/templates/article.html'));
for (const a of articles) {
  const m = a.meta;
  const sources = (m.sources || []).map((s, i) =>
    `<li id="src-${i + 1}"><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('');
  const body = articleTpl
    .replaceAll('{{title}}', esc(m.title))
    .replaceAll('{{module}}', esc(m.module))
    .replaceAll('{{date}}', frDate(m.date))
    .replaceAll('{{readingTime}}', m.readingTime)
    .replaceAll('{{summary}}', esc(m.summary))
    .replaceAll('{{image}}', m.image || '')
    .replaceAll('{{imageAlt}}', esc(m.imageAlt || ''))
    .replaceAll('{{content}}', a.body)
    .replaceAll('{{sources}}', sources)
    .replaceAll('{{tool}}', m.tool ? toolCard(tools.find((t) => t.id === m.tool), '{{pre}}') : '');
  render({ title: m.title, description: m.summary, nav: 'articles', scripts: m.scripts }, body, `articles/${a.slug}.html`);
}
console.log(`✓ ${articles.length} article(s), ${tools.length} outil(s) → ${path.relative(ROOT, OUT)}/`);
