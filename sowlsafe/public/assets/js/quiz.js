// Questionnaires SowlSafe : lit la configuration JSON de la page (#quiz-config) et affiche un profil.
(() => {
  const cfgEl = document.getElementById('quiz-config');
  const root = document.querySelector('[data-quiz]');
  if (!cfgEl || !root) return;
  const cfg = JSON.parse(cfgEl.textContent);
  cfg.dimensions = (cfg.dimensions || []).filter((d) => d && (d.items || []).length);
  cfg.lowActions = cfg.lowActions || [];
  cfg.lowThreshold = cfg.lowThreshold ?? 30;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Items intercalés (une question de chaque dimension à tour de rôle)
  const items = [];
  const maxLen = Math.max(...cfg.dimensions.map((d) => d.items.length));
  for (let i = 0; i < maxLen; i++) cfg.dimensions.forEach((d) => d.items[i] && items.push({ dim: d.id, text: d.items[i] }));

  const form = root.querySelector('form');
  // Assistant : une question à la fois, passage automatique à la suivante
  form.innerHTML = `
    <div class="wiz-top">
      <div class="wiz-count"><span data-count></span><span>${esc(cfg.intro || '')}</span></div>
      <div class="wiz-bar"><i data-bar></i></div>
    </div>
    ${items.map((it, i) => `
    <fieldset class="wiz-step" data-step="${i}" ${i ? 'hidden' : ''}>
      <legend>${esc(it.text)}</legend>
      <div class="answers">${cfg.scale.map((lab, v) => `
        <label><input type="radio" name="q${i}" value="${v}" id="q${i}-${v}" data-dim="${it.dim}"><span>${esc(lab)}</span></label>`).join('')}
      </div>
    </fieldset>`).join('')}
    <div class="wiz-nav"><button class="linkbtn" type="button" data-back hidden>Question précédente</button></div>`;
  form.classList.add('wizard');
  const steps = [...form.querySelectorAll('.wiz-step')];
  const back = form.querySelector('[data-back]');
  let cur = 0;
  const show = (n) => {
    cur = n;
    steps.forEach((s, k) => { s.hidden = k !== n; });
    form.querySelector('[data-count]').textContent = `Question ${n + 1} sur ${items.length}`;
    form.querySelector('[data-bar]').style.width = `${(n / items.length) * 100}%`;
    back.hidden = n === 0;
  };
  back.addEventListener('click', () => show(cur - 1));
  form.addEventListener('change', (e) => {
    const k = steps.indexOf(e.target.closest('.wiz-step'));
    if (k !== cur) return;
    setTimeout(() => (cur < items.length - 1 ? show(cur + 1) : form.requestSubmit()), 220);
  });
  show(0);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = steps.findIndex((s) => !s.querySelector('input:checked'));
    if (missing !== -1) { show(missing); return; }
    const maxV = cfg.scale.length - 1;
    const scores = cfg.dimensions.map((d) => {
      const vals = [...form.querySelectorAll(`input:checked[data-dim="${d.id}"]`)].map((x) => Number(x.value));
      const pct = Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * maxV)) * 100);
      return { ...d, pct };
    });
    const sorted = [...scores].sort((a, b) => b.pct - a.pct);
    const top = sorted[0];
    const out = root.querySelector('[data-quiz-result]');
    const lowAll = top.pct < cfg.lowThreshold;
    out.innerHTML = `
      <p class="eyebrow">Votre profil</p>
      <h2>${lowAll ? esc(cfg.lowTitle) : esc(top.title)}</h2>
      <p>${lowAll ? esc(cfg.lowText) : esc(top.explain)}</p>
      <div class="bars">${scores.map((s) => `
        <div class="bar${s.id === top.id && !lowAll ? ' top' : ''}">
          <div class="bar-head"><span>${esc(s.label)}</span><b>${s.pct} %</b></div>
          <div class="bar-track"><i style="width:${s.pct}%"></i></div>
        </div>`).join('')}
      </div>
      <div class="field"><p class="field-label">Pistes d'action${lowAll ? '' : ' prioritaires'}</p>
        <ul class="actions">${(lowAll ? cfg.lowActions : top.actions).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>
      ${!lowAll && sorted[1] && sorted[1].pct >= cfg.lowThreshold ? `<p class="muted">Deuxième point d'attention : <b>${esc(sorted[1].label.toLowerCase())}</b>. ${esc(sorted[1].actions[0])}</p>` : ''}
      <p class="disclaimer">${esc(cfg.disclaimer)}</p>
      <div class="btn-row"><button class="btn btn-ghost" type="button" data-restart>Recommencer</button><a class="btn" href="../outils/evaluateur.html">Évaluer ma situation du jour</a></div>`;
    out.hidden = false;
    form.hidden = true;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    out.querySelector('[data-restart]').addEventListener('click', () => {
      form.reset(); show(0); out.hidden = true; form.hidden = false;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
