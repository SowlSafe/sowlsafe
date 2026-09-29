// Moteur de risque contextuel — version 0.1 (règles pondérées, à visée de sensibilisation).
// Personne + tâche + environnement + système + contexte -> niveau de vigilance, facteurs, actions.
// Les pondérations sont des choix de conception, pas des valeurs validées : elles seront calibrées.
(() => {
  const KSS = {
    1: 'Extrêmement éveillé', 2: 'Très éveillé', 3: 'Éveillé', 4: 'Plutôt éveillé',
    5: 'Ni éveillé ni somnolent', 6: 'Quelques signes de somnolence',
    7: 'Somnolent, sans effort pour rester éveillé', 8: 'Somnolent, effort pour rester éveillé',
    9: 'Très somnolent, je lutte contre le sommeil',
  };
  const RISKY = ['conduite', 'machine', 'mobilite'];

  function factors(v) {
    const f = [];
    const sit = v.situation || 'conduite';
    const kss = Number(v.kss || 3);
    const add = (id, points, label, why, action) => points > 0 && f.push({ id, points, label, why, action });

    const kssPts = { 1: 0, 2: 0, 3: 0, 4: 2, 5: 5, 6: 10, 7: 20, 8: 32, 9: 45 }[kss];
    add('kss', kssPts, `Somnolence : ${kss}/9 sur l'échelle de Karolinska`,
      "Au-delà de 7 sur cette échelle, les études en simulateur de conduite montrent une nette hausse des écarts de trajectoire et des micro-sommeils.",
      kss >= 8 && RISKY.includes(sit)
        ? (sit === 'machine' ? "Ne démarrez pas la machine maintenant : faites une sieste de 15 à 20 minutes ou passez la main, puis réévaluez."
                             : "Ne prenez pas le volant maintenant : une sieste de 15 à 20 minutes, puis réévaluez votre état.")
        : kss >= 6 ? "Prévoyez une pause dès que possible. Une sieste courte (10 à 20 min) est la mesure la plus efficace ; le café aide, mais son effet met une vingtaine de minutes à apparaître." : '');

    const sleepPts = { plus7: 0, '6-7': 4, '5-6': 10, moins5: 18 }[v.sommeil || 'plus7'];
    add('sommeil', sleepPts, 'Sommeil insuffisant la nuit dernière',
      "Le manque de sommeil ralentit les réactions : après 17 à 19 heures sans dormir, les performances sont comparables à celles observées avec 0,5 g/L d'alcool dans le sang.",
      "Réduisez l'exposition : raccourcissez la tâche, alternez avec quelqu'un et faites une pause au moins toutes les deux heures.");

    const timePts = { jour: 0, soiree: 3, 'apres-repas': 5, nuit: 14 }[v.moment || 'jour'];
    add('moment', timePts, v.moment === 'nuit' ? 'Horaire de nuit (2 h – 6 h)' : v.moment === 'apres-repas' ? 'Creux du début d\'après-midi' : 'Fin de journée',
      v.moment === 'nuit' ? "Entre 2 h et 6 h, l'horloge biologique est au plus bas : la vigilance baisse même chez une personne reposée."
                          : "La vigilance suit un rythme de 24 heures, avec un creux naturel en début d'après-midi et une baisse en soirée.",
      v.moment === 'nuit' ? "Si possible, reportez la tâche. Sinon, doublez les vérifications et rapprochez les pauses." : "Placez les tâches les plus exigeantes en dehors de ce créneau quand vous le pouvez.");

    const pressPts = { aucune: 0, moderee: 6, forte: 14 }[v.pression || 'aucune'];
    add('pression', pressPts, `Pression temporelle ${v.pression === 'forte' ? 'forte' : 'modérée'}`,
      "Sous la contrainte du temps, on raccourcit les vérifications et on accepte des marges plus faibles : c'est le compromis entre efficacité et rigueur.",
      "Décidez à l'avance de ce qui n'est pas négociable (vitesse, étape de contrôle). Prévenez d'un retard plutôt que de rattraper le temps.");

    const dis = [].concat(v.distractions || []);
    if (dis.includes('telephone')) add('telephone', 10, 'Téléphone à portée ou notifications actives',
      "Même en mains libres, une conversation téléphonique capte l'attention et réduit la perception de l'environnement : on regarde sans voir.",
      sit === 'conduite' ? "Activez le mode conduite et rangez le téléphone hors de portée avant de démarrer." : "Coupez les notifications pendant la tâche et regardez-les à la pause.");
    if (dis.includes('conversation')) add('conversation', 6, 'Conversation en cours',
      "Une conversation absorbante consomme les mêmes ressources d'attention que la tâche.",
      "Gardez les échanges pour les moments calmes. En situation complexe, un simple « attends deux minutes » suffit.");
    if (dis.includes('preoccupation')) add('preoccupation', 8, 'Préoccupations personnelles',
      "Les soucis favorisent le vagabondage de la pensée : le regard reste sur la tâche, l'esprit est ailleurs.",
      "Notez ce qui vous préoccupe avant de commencer : l'écrire libère de la charge mentale.");

    const exp = v.experience || 'confirme';
    const task = v.tache || 'routine';
    if (task === 'nouvelle') add('nouveaute', exp === 'debutant' ? 14 : 8, 'Tâche nouvelle ou inhabituelle',
      "Face à une tâche nouvelle, tout passe par un contrôle conscient, lent et coûteux : la charge mentale monte vite et les imprévus sont plus difficiles à gérer.",
      "Préparez la tâche : découpez-la en étapes, relisez la consigne ou demandez une démonstration.");
    if (task === 'variable') add('variable', 3, 'Tâche habituelle mais avec des imprévus',
      "Les imprévus obligent à sortir des automatismes au moment où on s'y attend le moins.",
      "Repérez à l'avance les deux ou trois imprévus les plus probables et ce que vous ferez s'ils arrivent.");
    if (task === 'routine' && exp === 'expert') add('automatismes', 6, 'Tâche très maîtrisée : pilote automatique',
      "Sur une tâche très maîtrisée, les automatismes libèrent l'attention, qui part ailleurs. C'est le terrain des ratés et des oublis.",
      "Ajoutez un point de contrôle volontaire aux étapes clés : une check-list courte, ou annoncer l'étape à voix haute.");
    if (exp === 'debutant' && task !== 'nouvelle') add('experience', 8, 'Peu d\'expérience de cette activité',
      "Avec peu d'expérience, on repère moins vite les signaux qui annoncent un danger.",
      "Donnez-vous plus de marge (temps, distance, vitesse) et demandez l'avis d'une personne expérimentée.");

    const env = [].concat(v.environnement || []);
    if (env.includes('obscurite')) add('obscurite', 6, 'Obscurité ou faible luminosité',
      "La nuit, la perception des distances, des contrastes et des mouvements se dégrade.",
      "Augmentez les distances, réduisez la vitesse et vérifiez l'éclairage.");
    if (env.includes('meteo')) add('meteo', 7, 'Météo ou sol difficile',
      "Des conditions dégradées réduisent les marges : une petite erreur habituellement sans conséquence peut devenir grave.",
      "Adaptez l'équipement et les marges ; reportez si les conditions sont extrêmes.");
    if (env.includes('bruit')) add('bruit', 5, 'Bruit ou chaleur',
      "Le bruit et la chaleur accélèrent la fatigue et dégradent la concentration.",
      "Protections auditives, hydratation et pauses au frais.");
    if (env.includes('monotonie')) add('monotonie', kss >= 6 ? 10 : 6, 'Environnement monotone',
      "Un environnement monotone endort la vigilance, surtout quand on est déjà fatigué : c'est le paradoxe de la sous-charge.",
      "Variez l'activité et faites des pauses régulières ; sur la route, arrêtez-vous toutes les deux heures.");

    return f.sort((a, b) => b.points - a.points);
  }

  function evaluate(v) {
    const list = factors(v);
    let score = Math.min(100, list.reduce((s, x) => s + x.points, 0));
    let level = score >= 50 ? 3 : score >= 25 ? 2 : 1;
    if (Number(v.kss) >= 8 && RISKY.includes(v.situation || 'conduite')) { level = 3; score = Math.max(score, 60); }
    const labels = { 1: 'Vigilance normale', 2: 'Vigilance à renforcer', 3: 'Risque élevé : agir maintenant' };
    return { score, level, label: labels[level], factors: list };
  }

  function readForm(form) {
    const v = {};
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') { if (el.checked) (v[el.name] = v[el.name] || []).push(el.value); }
      else if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; }
      else v[el.name] = el.value;
    }
    return v;
  }

  const sev = (p) => (p >= 14 ? 3 : p >= 7 ? 2 : 1);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function resultHTML(v, full) {
    const r = evaluate(v);
    const max = full ? 99 : 3;
    const shown = r.factors.slice(0, max);
    const actions = [...new Set(shown.map((x) => x.action).filter(Boolean))].slice(0, full ? 6 : 3);
    return `
      <div class="gauge">
        <div class="gauge-row"><span class="level" data-level="${r.level}">${r.label}</span><span class="score">indice ${r.score}/100</span></div>
        <div class="meter" role="img" aria-label="Indice de risque ${r.score} sur 100"><i style="left:${Math.max(2, Math.min(98, r.score))}%"></i></div>
        <div class="meter-scale" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>100</span></div>
      </div>
      ${actions.length ? `<div class="field"><p class="field-label">Ce que vous pouvez faire</p><ul class="actions">${actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>` : ''}
      ${shown.length ? `<div class="field"><p class="field-label">Pourquoi</p><ul class="factors">${shown.map((x) =>
        `<li data-sev="${sev(x.points)}"><span>${esc(x.label)}</span>${full ? `<span class="why">${esc(x.why)}</span>` : ''}</li>`).join('')}</ul></div>`
      : `<p class="muted">Aucun facteur de risque marquant dans ce contexte. Restez attentif aux changements : fatigue, imprévus, pression.</p>`}`;
  }

  function render(root) {
    const form = root.querySelector('form');
    const out = root.querySelector('[data-result]');
    const kssRead = root.querySelector('[data-kss-read]');
    const syncKss = () => { const k = form.elements.kss; if (kssRead && k) kssRead.innerHTML = `<b>${k.value}/9</b> · ${KSS[k.value]}`; };
    form.addEventListener('input', syncKss); syncKss();
    form.addEventListener('submit', (e) => e.preventDefault());

    if (!root.hasAttribute('data-wizard')) {
      const update = () => { out.innerHTML = resultHTML(readForm(form), root.dataset.max !== '3'); };
      form.addEventListener('input', update); form.addEventListener('change', update); update();
      return;
    }

    // Mode assistant : une étape à la fois
    const steps = [...form.querySelectorAll('.wiz-step')];
    const count = root.querySelector('[data-wiz-count]');
    const bar = root.querySelector('[data-wiz-bar]');
    const back = root.querySelector('[data-wiz-back]');
    const next = root.querySelector('[data-wiz-next]');
    const top = root.querySelector('.wiz-top');
    const done = root.querySelector('[data-wiz-done]');
    let i = 0;
    const show = (n) => {
      i = n;
      steps.forEach((s, k) => { s.hidden = k !== i; });
      count.textContent = `Étape ${i + 1} sur ${steps.length}`;
      bar.style.width = `${((i + 1) / steps.length) * 100}%`;
      back.hidden = i === 0;
      next.textContent = i === steps.length - 1 ? 'Voir mon résultat' : 'Continuer';
    };
    const finish = () => {
      form.hidden = true; top.hidden = true;
      out.innerHTML = resultHTML(readForm(form), true);
      done.hidden = false;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    next.addEventListener('click', () => (i < steps.length - 1 ? show(i + 1) : finish()));
    back.addEventListener('click', () => show(i - 1));
    // Passage automatique à l'étape suivante pour les étapes à choix unique
    steps.forEach((s, k) => s.hasAttribute('data-auto') && s.addEventListener('change', () => setTimeout(() => k === i && show(i + 1), 220)));
    root.querySelector('[data-wiz-edit]').addEventListener('click', () => { form.hidden = false; top.hidden = false; out.innerHTML = ''; done.hidden = true; show(0); });
    root.querySelector('[data-wiz-restart]').addEventListener('click', () => { form.reset(); syncKss(); form.hidden = false; top.hidden = false; out.innerHTML = ''; done.hidden = true; show(0); });
    show(0);
  }

  document.querySelectorAll('[data-evaluator]').forEach(render);
  window.SowlSafeEngine = { evaluate };
})();
