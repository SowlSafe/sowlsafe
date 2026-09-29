// SowlSafe — générateur de site statique.
// Usage : node build.mjs            -> dist/
//         node build.mjs --preview  -> dist-preview/ (page d'accueil sans squelette, pour l'aperçu Claude)
//
// Contenus éditables (aussi depuis l'interface Pages CMS) :
//   src/content/articles/*.md   -> un article par fichier (en-tête YAML + texte Markdown)
//   src/content/tests/*.json    -> un test par fichier (questions, dimensions, conseils)
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import yaml from 'js-yaml';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'dist-preview' : 'dist');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));

// ---------- utilitaires ----------
const read = (p) => fs.readFileSync(p, 'utf8');
const walk = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]) : []);
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const d of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, d.name), t = path.join(dst, d.name);
    d.isDirectory() ? copyDir(s, t) : fs.copyFileSync(s, t);
  }
}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isoDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d || '1970-01-01').slice(0, 10));
const frDate = (d) => new Date(isoDate(d) + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Chemins « /assets/... » (écrits par l'interface d'administration) -> chemins relatifs
const localUrl = (u) => (u && u.startsWith('/') && !u.startsWith('//') ? '{{pre}}' + u.slice(1) : u);
const imageUrl = (img) => {
  if (!img) return '';
  if (/^https?:/.test(img)) return img;
  const clean = img.replace(/^\/+/, '');
  return '{{pre}}' + (clean.startsWith('assets/') ? clean : 'assets/img/' + clean);
};

// Pages : commentaire <!--meta {...} --> en tête de fichier
function parsePage(file) {
  const src = read(file);
  const m = src.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Métadonnées manquantes : ${file}`);
  return { meta: JSON.parse(m[1]), body: src.slice(m[0].length) };
}
// Articles : en-tête YAML entre deux lignes « --- »
function parseArticle(file) {
  const src = read(file).replace(/^﻿/, '');
  const m = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) throw new Error(`En-tête YAML manquant : ${file}`);
  const meta = yaml.load(m[1]) || {};
  let html = marked.parse(src.slice(m[0].length));
  html = html
    .replace(/\[(\d{1,2})\](?!\()/g, '<sup><a href="#src-$1">$1</a></sup>')   // [1] -> renvoi vers la source n°1
    .replace(/(src|href)="\/(?!\/)/g, '$1="{{pre}}');
  return { meta, html };
}

// ---------- contenus ----------
const articles = walk(path.join(ROOT, 'src/content/articles'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ ...parseArticle(f), slug: slugify(path.basename(f, '.md')) }))
  .filter((a) => a.meta.published !== false)
  .sort((a, b) => isoDate(b.meta.date).localeCompare(isoDate(a.meta.date)));

const tests = walk(path.join(ROOT, 'src/content/tests'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ ...JSON.parse(read(f)), slug: slugify(path.basename(f, '.json')) }))
  .filter((t) => t.published !== false)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const tools = [
  { id: 'evaluateur', title: 'Évaluateur de contexte', module: 'Tous modules', format: '5 questions',
    summary: 'Fatigue, pression, distractions : estimez votre niveau de vigilance du moment.', cta: 'Évaluer ma situation', href: 'outils/evaluateur.html' },
  ...tests.map((t) => ({
    id: t.slug, title: t.title, module: t.module || 'Tous modules',
    format: `${t.dimensions.reduce((n, d) => n + (d.items || []).length, 0)} questions`,
    summary: t.summary, cta: 'Faire le test', href: `outils/${t.slug}.html`,
  })),
];

function articleCard(a) {
  const m = a.meta;
  return `<a class="card-link article-card" href="{{pre}}articles/${a.slug}.html">
  ${m.image ? `<img src="${imageUrl(m.image)}" alt="" loading="lazy" width="640" height="400">` : ''}
  <div class="card-body">
    <p class="eyebrow">${esc(m.module)} · ${frDate(m.date)}</p>
    <h3>${esc(m.title)}</h3>
    <p>${esc(m.summary)}</p>
    <span class="more">Lire l'article${m.readingTime ? ` · ${m.readingTime} min` : ''}</span>
  </div>
</a>`;
}
const toolCard = (t) => `<a class="card-link tool-card" href="{{pre}}${t.href}">
  <p class="eyebrow">${esc(t.module)} · ${esc(t.format)}</p>
  <h3>${esc(t.title)}</h3>
  <p>${esc(t.summary)}</p>
  <span class="more">${esc(t.cta)}</span>
</a>`;

// ---------- gabarit ----------
const OWL = `<svg class="owl" viewBox="0 0 40 40" aria-hidden="true"><path class="owl-head" d="M5 9 11.5 3.5 16 8.5h8l4.5-5L35 9v15.5C35 32.5 28.3 38 20 38S5 32.5 5 24.5Z"/><circle class="owl-eye" cx="13.6" cy="19" r="6.2"/><circle class="owl-eye" cx="26.4" cy="19" r="6.2"/><circle class="owl-iris" cx="13.6" cy="19" r="3"/><circle class="owl-iris" cx="26.4" cy="19" r="3"/><path class="owl-iris" d="m20 24 2.2 3.2h-4.4Z"/></svg>`;

const NAV = [
  ['particuliers', 'Particuliers', 'particuliers.html'],
  ['entreprises', 'Entreprises', 'entreprises.html'],
  ['inclusion', 'Inclusion', 'inclusion.html'],
  ['outils', 'Outils', 'outils.html'],
  ['articles', 'Articles', 'articles.html'],
];
const FOOTER_NAV = [...NAV, ['a-propos', 'À propos', 'a-propos.html'], ['approche', 'Notre approche', 'approche.html'], ['modules', 'Modules', 'modules.html']];

// Réglages d'accessibilité appliqués avant l'affichage (évite un « flash »)
const A11Y_BOOT = `<script>try{var a=JSON.parse(localStorage.getItem('sowlsafe-a11y')||'{}'),r=document.documentElement;if(a.size)r.dataset.a11ySize=a.size;['font','spacing','motion','contrast'].forEach(function(k){if(a[k])r.classList.add('a11y-'+k)})}catch(e){}</script>`;

const A11Y_PANEL = `<div class="a11y">
      <button class="a11y-toggle" id="a11y-toggle" type="button" aria-expanded="false" aria-controls="a11y-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4.5" r="2"/><path d="M4 8.5c2.7.9 5.3 1.3 8 1.3s5.3-.4 8-1.3M12 9.8v4.2m0 0-3 6.5m3-6.5 3 6.5"/></svg><span>Accessibilité</span></button>
      <div class="a11y-panel" id="a11y-panel" hidden>
        <p class="a11y-title">Adapter l'affichage</p>
        <fieldset class="field"><legend>Taille du texte</legend>
          <div class="chips">
            <label class="chip"><input type="radio" name="a11y-size" value="" id="a11y-s0" checked><span>Normale</span></label>
            <label class="chip"><input type="radio" name="a11y-size" value="lg" id="a11y-s1"><span>Grande</span></label>
            <label class="chip"><input type="radio" name="a11y-size" value="xl" id="a11y-s2"><span>Très grande</span></label>
          </div>
        </fieldset>
        <label class="switch" for="a11y-font"><input type="checkbox" id="a11y-font" data-a11y="font"><span>Police facile à lire</span></label>
        <label class="switch" for="a11y-spacing"><input type="checkbox" id="a11y-spacing" data-a11y="spacing"><span>Espacer les lignes et les lettres</span></label>
        <label class="switch" for="a11y-contrast"><input type="checkbox" id="a11y-contrast" data-a11y="contrast"><span>Contraste renforcé</span></label>
        <label class="switch" for="a11y-motion"><input type="checkbox" id="a11y-motion" data-a11y="motion"><span>Supprimer les animations</span></label>
        <button class="linkbtn" type="button" id="a11y-reset">Réinitialiser</button>
      </div>
    </div>`;

function layout({ meta, body, rel, isEntry }) {
  const pre = '../'.repeat(rel.split('/').length - 1);
  const title = meta.title === SITE.name ? `${SITE.name} · ${SITE.tagline}` : `${meta.title} · ${SITE.name}`;
  const nav = NAV.map(([k, label, href]) =>
    `<a href="${pre}${href}"${meta.nav === k ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const head = `<title>${esc(isEntry ? SITE.name : title)}</title>
<meta name="description" content="${esc(meta.description || SITE.description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(meta.description || SITE.description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#13233a">
${A11Y_BOOT}
<link rel="icon" href="${pre}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Unbounded:wght@500;700&display=swap">
<link rel="stylesheet" href="${pre}assets/css/style.css">`;
  const page = `<a class="skip" href="#contenu">Aller au contenu</a>
<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="${pre}index.html" aria-label="${SITE.name}, accueil">${OWL}<span>Sowl<b>Safe</b></span></a>
    <div class="header-tools">
      ${A11Y_PANEL}
      <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
    <nav class="site-nav" id="site-nav" aria-label="Navigation principale">${nav}<a class="btn btn-small" href="${pre}contact.html"${meta.nav === 'contact' ? ' aria-current="page"' : ''}>Nous contacter</a></nav>
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
      <p class="signature">${esc(SITE.signature)}</p>
    </div>
    <div><p class="footer-title">Plateforme</p>${FOOTER_NAV.map(([, l, h]) => `<a href="${pre}${h}">${l}</a>`).join('')}</div>
    <div><p class="footer-title">Outils</p>${tools.map((t) => `<a href="${pre}${t.href}">${esc(t.title)}</a>`).join('')}</div>
    <div><p class="footer-title">Contact</p><a href="${pre}entreprises.html">Audit entreprises</a><a href="${pre}particuliers.html#bilan">Bilan personnalisé</a><a href="${pre}contact.html">Nous écrire</a><a href="${pre}mentions-legales.html">Mentions légales et confidentialité</a></div>
  </div>
  <div class="wrap footer-bottom"><p>© ${new Date().getFullYear()} ${SITE.name}. Les outils proposés sont des aides à la réflexion, pas des diagnostics médicaux.</p></div>
</footer>
<script src="${pre}assets/js/site.js" defer></script>
${(meta.scripts || []).map((s) => `<script src="${pre}assets/js/${s}" defer></script>`).join('\n')}`;

  if (isEntry) return `${head}\n${page}\n`; // l'aperçu Claude ajoute lui-même le squelette
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
  body = body
    .replaceAll('{{ARTICLES}}', articles.map(articleCard).join('\n') || '<p class="muted">Les premiers articles arrivent bientôt.</p>')
    .replaceAll('{{LATEST_ARTICLES}}', articles.slice(0, 3).map(articleCard).join('\n'))
    .replaceAll('{{TOOLS}}', tools.map(toolCard).join('\n'))
    .replaceAll('{{SIGNATURE}}', esc(SITE.signature));
  const html = layout({ meta, body, rel, isEntry: PREVIEW && rel === 'index.html' });
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, html);
}

// Pages fixes
const pagesDir = path.join(ROOT, 'src/pages');
for (const f of walk(pagesDir).filter((f) => f.endsWith('.html'))) {
  const { meta, body } = parsePage(f);
  render(meta, body, path.relative(pagesDir, f).split(path.sep).join('/'));
}

// Articles
const fill = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v ?? ''), tpl);
const articleTpl = read(path.join(ROOT, 'src/templates/article.html'));
for (const a of articles) {
  const m = a.meta;
  const sources = (m.sources || []).map((s, i) =>
    `<li id="src-${i + 1}"><a href="${esc(localUrl(s.url))}" rel="noopener" target="_blank">${esc(s.label)}</a></li>`).join('');
  const tool = tools.find((t) => t.id === m.tool) || tools[0];
  const essentiel = (m.essentiel || []).filter(Boolean);
  const body = fill(articleTpl, {
    title: esc(m.title), module: esc(m.module), date: frDate(m.date), readingTime: m.readingTime ? `${m.readingTime} min de lecture` : '',
    summary: esc(m.summary),
    image: m.image ? `<img class="article-hero" src="${imageUrl(m.image)}" alt="${esc(m.imageAlt)}" width="1600" height="800">` : '',
    essentiel: essentiel.length ? `<div class="essentiel"><p class="aside-title">L'essentiel en ${essentiel.length} points</p><ul>${essentiel.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '',
    content: a.html, sources: sources || '<li>Aucune source indiquée.</li>', tool: toolCard(tool),
  });
  render({ title: m.title, description: m.summary, nav: 'articles' }, body, `articles/${a.slug}.html`);
}

// Tests
const testTpl = read(path.join(ROOT, 'src/templates/test.html'));
for (const t of tests) {
  const tool = tools.find((x) => x.id === t.slug);
  const cfg = JSON.stringify(t).replace(/</g, '\\u003c');
  const body = fill(testTpl, { title: esc(t.title), module: esc(t.module), format: esc(tool.format), lead: esc(t.lead || t.summary), config: cfg });
  render({ title: t.title, description: t.summary, nav: 'outils', scripts: ['quiz.js'] }, body, `outils/${t.slug}.html`);
}
console.log(`✓ ${articles.length} article(s), ${tests.length} test(s) → ${path.relative(ROOT, OUT)}/`);
