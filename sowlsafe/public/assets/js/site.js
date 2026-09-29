// Navigation mobile + formulaires (pas encore reliés à une base : voir README, étape Supabase)
(() => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Présélection du profil dans le formulaire de contact (#particulier ou #entreprise)
  const h = location.hash.slice(1);
  const pre = h && document.getElementById('c-' + h);
  if (pre && pre.type === 'radio') pre.checked = true;

  // Tant que FORMS_ENDPOINT est vide, les formulaires n'envoient rien et le disent clairement.
  const FORMS_ENDPOINT = '';
  document.querySelectorAll('form[data-form]').forEach((form) => {
    const msg = form.querySelector('[data-form-message]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!FORMS_ENDPOINT) {
        if (msg) { msg.hidden = false; msg.textContent = "Ce formulaire n'est pas encore relié : rien n'a été envoyé. Il sera activé lors de la mise en ligne officielle."; }
        return;
      }
      try {
        const data = Object.fromEntries(new FormData(form));
        const res = await fetch(FORMS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form: form.dataset.form, ...data }) });
        if (!res.ok) throw new Error(res.status);
        form.reset();
        if (msg) { msg.hidden = false; msg.textContent = form.dataset.success || 'Merci, votre message a bien été envoyé.'; }
      } catch {
        if (msg) { msg.hidden = false; msg.textContent = "L'envoi a échoué. Vérifiez votre connexion et réessayez."; }
      }
    });
  });
})();

// ---------- Accessibilité : réglages mémorisés dans ce navigateur ----------
(() => {
  const KEY = 'sowlsafe-a11y';
  const root = document.documentElement;
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { prefs = {}; }
  const loadFont = () => {
    if (document.getElementById('a11y-font-css')) return;
    const l = document.createElement('link');
    l.id = 'a11y-font-css'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap';
    document.head.appendChild(l);
  };
  const apply = () => {
    if (prefs.size) root.dataset.a11ySize = prefs.size; else delete root.dataset.a11ySize;
    ['font', 'spacing', 'motion', 'contrast'].forEach((k) => root.classList.toggle('a11y-' + k, !!prefs[k]));
    if (prefs.font) loadFont();
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* stockage indisponible : réglages valables pour cette page seulement */ }
  };
  const toggle = document.getElementById('a11y-toggle');
  const panel = document.getElementById('a11y-panel');
  if (!toggle || !panel) return;
  panel.querySelectorAll('input[name="a11y-size"]').forEach((r) => { r.checked = (prefs.size || '') === r.value; r.addEventListener('change', () => { prefs.size = r.value; apply(); }); });
  panel.querySelectorAll('input[data-a11y]').forEach((c) => { c.checked = !!prefs[c.dataset.a11y]; c.addEventListener('change', () => { prefs[c.dataset.a11y] = c.checked; apply(); }); });
  document.getElementById('a11y-reset').addEventListener('click', () => { prefs = {}; panel.querySelectorAll('input[data-a11y]').forEach((c) => { c.checked = false; }); panel.querySelector('#a11y-s0').checked = true; apply(); });
  const close = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { close(); toggle.focus(); } });
  document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('.a11y')) close(); });
  if (prefs.font) loadFont();
})();

// ---------- Lecture à voix haute des questions (tests et évaluateur) ----------
document.addEventListener('DOMContentLoaded', () => {
  if (!('speechSynthesis' in window)) return;
  const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  document.querySelectorAll('.wiz-step').forEach((step) => {
    const legend = step.querySelector(':scope > legend');
    if (!legend) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'speak'; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `${ICON}<span>Écouter</span>`;
    b.addEventListener('click', () => {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); b.setAttribute('aria-pressed', 'false'); return; }
      const options = [...step.querySelectorAll('.answers span, .tile b')].map((s) => s.textContent.trim());
      const text = legend.textContent.trim() + (options.length ? '. Réponses possibles : ' + options.join(', ') + '.' : '');
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fr-FR'; u.rate = 0.95;
      u.onend = u.onerror = () => b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-pressed', 'true');
      speechSynthesis.speak(u);
    });
    legend.after(b);
  });
});
