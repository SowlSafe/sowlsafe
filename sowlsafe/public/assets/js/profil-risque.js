// Profil de risque au quotidien — version 0.1
// Principe (neuroergonomie) : chaque activité sollicite des fonctions cognitives et motrices.
// Indice = Σ (exigence de l'activité pour la fonction × difficulté déclarée × effet du moment) / maximum possible.
// Les pondérations sont des choix d'expertise, appuyés sur la littérature citée ; elles restent à valider.
(() => {
  const root = document.querySelector('[data-profil]');
  if (!root) return;

  const F = {
    attention: 'Attention soutenue',
    distraction: 'Résistance aux distractions',
    impulsivite: 'Contrôle de l\'impulsivité',
    memoire: 'Mémoire et planification',
    visuo: 'Perception des distances et des vitesses',
    motricite: 'Coordination et précision des gestes',
    sensoriel: 'Tolérance sensorielle',
    fatigue: 'Énergie et sommeil',
  };

  // Exigence de chaque activité pour chaque fonction (0 = faible, 3 = très forte)
  const A = {
    conduite: { label: 'Conduire', w: { attention: 3, distraction: 3, impulsivite: 3, memoire: 1, visuo: 3, motricite: 1, sensoriel: 2, fatigue: 3 } },
    mobilite: { label: 'Vélo, trottinette, à pied', w: { attention: 2, distraction: 3, impulsivite: 3, memoire: 1, visuo: 3, motricite: 2, sensoriel: 2, fatigue: 2 } },
    cuisine: { label: 'Cuisiner', w: { attention: 2, distraction: 2, impulsivite: 2, memoire: 3, visuo: 1, motricite: 3, sensoriel: 1, fatigue: 2 } },
    bricolage: { label: 'Bricoler, travaux', w: { attention: 2, distraction: 2, impulsivite: 3, memoire: 2, visuo: 3, motricite: 3, sensoriel: 1, fatigue: 2 } },
    enfants: { label: 'Surveiller des enfants', w: { attention: 3, distraction: 3, impulsivite: 1, memoire: 2, visuo: 1, motricite: 1, sensoriel: 2, fatigue: 3 } },
    sport: { label: 'Sport, montagne', w: { attention: 2, distraction: 2, impulsivite: 3, memoire: 1, visuo: 3, motricite: 3, sensoriel: 1, fatigue: 3 } },
  };

  // Effet du moment sur les fonctions de vigilance
  const VIGIL = ['attention', 'distraction', 'memoire', 'fatigue'];
  function momentFactor(moment, f, v) {
    const vig = VIGIL.includes(f);
    const eveningType = (v.dx || []).includes('tdah') || Number(v.fatigue || 0) >= 2;
    switch (moment) {
      case 'nuit': return vig ? 1.4 : 1.2;
      case 'apres-midi': return vig ? 1.15 : 1;
      case 'soiree': return vig ? 1.15 : 1;
      case 'matin': return vig && eveningType ? 1.15 : 1;
      default: return 1;
    }
  }

  const REFS = {
    chang: 'Chang et al. (2014), JAMA Psychiatry : chez les adultes avec un TDAH, risque d\'accident de transport grave augmenté d\'environ 45 %.',
    galera: 'Galéra et al. (2012), BMJ : un vagabondage de la pensée intense au volant est associé à une responsabilité plus fréquente dans l\'accident.',
    brunk: 'Brunkhorst-Kanaan et al. (2021), Neuroscience & Biobehavioral Reviews : chez les jeunes avec un TDAH, 2 fois plus de brûlures, 3,7 fois plus d\'intoxications, 25 % de fractures en plus.',
    fuermaier: 'Fuermaier et al. (2013), PLOS ONE : chez les adultes avec un TDAH, la mémoire des intentions (penser à faire) est fragilisée surtout par la planification.',
    oliveira: 'de Oliveira et Wann (2012), Human Movement Science : chez les jeunes adultes dyspraxiques, difficultés dans les virages et 50 % de temps en plus pour réagir à un piéton.',
    curry: 'Curry et al. (2021), JAACAP : les jeunes conducteurs avec un TSA n\'ont pas plus d\'accidents, mais davantage lors des refus de priorité et des tourne-à-gauche.',
    mercier: 'Mercier et al. (2025), Journal of Autism and Developmental Disorders : chez les conducteurs avec un TSA, difficultés surtout dans les situations complexes et rapides.',
    stavrinos: 'Stavrinos et al. (2011), Pediatrics : les enfants avec un TDAH traversent la rue en laissant des marges de sécurité plus courtes.',
    coogan: 'Coogan et McGowan (2017), ADHD Attention Deficit and Hyperactivity Disorders : le TDAH est associé à une horloge biologique décalée vers le soir et à un endormissement plus tardif.',
  };
  const ACT_REFS = {
    conduite: { tdah: ['chang', 'galera'], tsa: ['curry', 'mercier'], dys: ['oliveira'], any: ['galera'] },
    mobilite: { tdah: ['stavrinos'], dys: ['oliveira'], any: ['stavrinos'] },
    cuisine: { tdah: ['brunk', 'fuermaier'], any: ['brunk'] },
    bricolage: { tdah: ['brunk'], dys: ['oliveira'], any: ['brunk'] },
    enfants: { tdah: ['fuermaier'], any: [] },
    sport: { tdah: ['brunk'], dys: ['oliveira'], any: ['brunk'] },
  };

  const TIPS = {
    attention: { conduite: 'Sur les longs trajets, faites une pause toutes les heures plutôt que toutes les deux heures, et préparez musique et itinéraire avant de partir.', cuisine: 'Dès qu\'un feu est allumé, lancez un minuteur et restez dans la cuisine.', enfants: 'Organisez des relais avec un autre adulte et sécurisez les espaces pour ne pas dépendre d\'une surveillance continue.', _: 'Découpez l\'activité en séquences courtes, entrecoupées de pauses.' },
    distraction: { conduite: 'Téléphone hors de portée, mode conduite activé, notifications coupées avant de démarrer.', mobilite: 'Pas d\'écouteurs ni de téléphone au moment de traverser ou dans la circulation.', cuisine: 'Pas d\'écran allumé pendant la cuisson.', enfants: 'Rangez le téléphone pendant les moments à risque : bain, repas, sorties.', _: 'Réduisez les sources de distraction avant de commencer : téléphone, écrans, conversations.' },
    impulsivite: { conduite: 'Utilisez le régulateur ou le limiteur de vitesse, et partez en avance pour ne pas être pressé.', mobilite: 'Fixez-vous une règle simple : arrêt complet avant chaque traversée.', bricolage: 'Enfilez les protections avant de commencer et vérifiez deux fois avant de couper ou de percer.', sport: 'Décidez à l\'avance de vos limites : itinéraire, horaire de demi-tour, niveau de difficulté.', _: 'Prenez l\'habitude d\'une courte pause avant chaque geste à risque.' },
    memoire: { cuisine: 'En quittant la cuisine, suivez une mini check-list : feux, four, casseroles.', conduite: 'Préparez l\'itinéraire à l\'avance et utilisez le guidage vocal.', enfants: 'Rangez produits ménagers et médicaments en hauteur dès le retour des courses.', bricolage: 'Affichez la liste des étapes ; coupez le courant avant d\'intervenir et notez-le.', _: 'Appuyez-vous sur des rappels : minuteurs, alarmes, listes visibles.' },
    visuo: { conduite: 'Gardez de grandes distances de sécurité et attendez un écart franc pour tourner ou vous insérer.', mobilite: 'Privilégiez les passages protégés avec feux.', bricolage: 'Mesurez et marquez avant de couper ; stabilisez toujours l\'échelle.', sport: 'Réduisez l\'allure en descente et sur terrain inconnu.', _: 'Donnez-vous plus de marge dans l\'espace et dans le temps.' },
    motricite: { cuisine: 'Planche stable, couteaux bien aiguisés, gants anti-coupure ; manches des casseroles tournés vers l\'intérieur.', bricolage: 'Serre-joints, gants et lunettes ; préférez un escabeau à plateforme à l\'échelle.', sport: 'Échauffez-vous et portez des protections adaptées.', conduite: 'Entraînez-vous sur des parcours connus ; une boîte automatique peut alléger la charge.', _: 'Choisissez des outils adaptés et prenez le temps de chaque geste.' },
    sensoriel: { conduite: 'Évitez si possible les heures de pointe ; lunettes de soleil et habitacle calme.', mobilite: 'Choisissez des itinéraires calmes.', enfants: 'Prévoyez des temps de retrait et des lieux moins bruyants.', cuisine: 'Ventilez et cuisinez au calme.', _: 'Réduisez le bruit et la lumière autour de vous quand l\'activité demande de la précision.' },
    fatigue: { conduite: 'Au premier bâillement, arrêtez-vous : une sieste de 15 à 20 minutes est la mesure la plus efficace.', _: 'Placez l\'activité la plus risquée à votre meilleur moment de la journée, et évitez-la après une mauvaise nuit.' },
  };

  const MOMENT_TIP = {
    nuit: 'Entre 2 h et 6 h, la vigilance est au plus bas pour tout le monde : reportez l\'activité si vous le pouvez.',
    'apres-midi': 'Le début d\'après-midi correspond à un creux naturel de vigilance : redoublez d\'attention ou décalez l\'activité.',
    soiree: 'En fin de journée, la fatigue accumulée pèse sur l\'attention : simplifiez l\'activité ou faites une pause avant.',
  };

  function read(form) {
    const v = { dx: [] };
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === 'checkbox') { if (el.checked) v[el.name] = [...(v[el.name] || []), el.value]; }
      else if (el.type === 'radio') { if (el.checked) v[el.name] = el.value; }
      else v[el.name] = el.value;
    }
    return v;
  }

  function score(actKey, v) {
    const w = A[actKey].w;
    let s = 0, max = 0;
    const parts = [];
    for (const f of Object.keys(F)) {
      const d = Number(v[f] || 0);
      const m = momentFactor(v.moment, f, v);
      s += w[f] * d * m;
      max += w[f] * 2;
      if (d > 0 && w[f] >= 2) parts.push({ f, weight: w[f] * d * m });
    }
    return { pct: Math.min(100, Math.round((s / max) * 100)), parts: parts.sort((a, b) => b.weight - a.weight) };
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (p) => (p >= 50 ? [3, 'Exposition élevée'] : p >= 25 ? [2, 'Exposition modérée'] : [1, 'Exposition faible']);

  function render(v) {
    const act = v.activite || 'conduite';
    const main = score(act, v);
    const [lv, lvLabel] = level(main.pct);
    const all = Object.keys(A).map((k) => ({ k, label: A[k].label, pct: score(k, v).pct })).sort((a, b) => b.pct - a.pct);
    const tips = [...new Set(main.parts.slice(0, 4).map((p) => TIPS[p.f][act] || TIPS[p.f]._))];
    if (MOMENT_TIP[v.moment]) tips.push(MOMENT_TIP[v.moment]);
    const dx = v.dxstatut === 'oui' || v.dxstatut === 'encours' ? v.dx : [];
    if (v.moment === 'matin' && dx.includes('tdah')) tips.push('Avec un TDAH, l\'horloge biologique est souvent décalée vers le soir : le début de matinée peut être un moment de moindre vigilance.');
    const refKeys = new Set([...(ACT_REFS[act].any || [])]);
    dx.forEach((d) => (ACT_REFS[act][d] || []).forEach((r) => refKeys.add(r)));
    if (v.moment === 'matin' || dx.includes('tdah')) refKeys.add('coogan');

    return `
      <p class="eyebrow">Votre profil · ${esc(A[act].label)}</p>
      <div class="gauge">
        <div class="gauge-row"><span class="level" data-level="${lv}">${lvLabel}</span><span class="score big-score">${main.pct} %</span></div>
        <div class="meter" role="img" aria-label="Indice d'exposition ${main.pct} %"><i style="left:${Math.max(2, Math.min(98, main.pct))}%"></i></div>
        <div class="meter-scale" aria-hidden="true"><span>0</span><span>25</span><span>50</span><span>100 %</span></div>
      </div>
      ${main.parts.length ? `<div class="field"><p class="field-label">Pourquoi cette activité vous demande plus de vigilance</p>
        <ul class="factors">${main.parts.slice(0, 4).map((p) => `<li data-sev="${Number(v[p.f]) === 2 ? 3 : 2}"><span>${esc(F[p.f])}</span><span class="why">${esc(A[act].label)} sollicite fortement cette fonction, que vous trouvez ${Number(v[p.f]) === 2 ? 'souvent' : 'parfois'} difficile.</span></li>`).join('')}</ul></div>`
      : '<p class="muted">Vous ne déclarez pas de difficulté sur les fonctions que cette activité sollicite le plus. Restez attentif aux moments de fatigue.</p>'}
      ${tips.length ? `<div class="field"><p class="field-label">Nos recommandations</p><ul class="actions">${tips.slice(0, 6).map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      <div class="field"><p class="field-label">Votre profil selon les activités</p>
        <div class="bars">${all.map((a) => `<div class="bar${a.k === act ? ' top' : ''}"><div class="bar-head"><span>${esc(a.label)}</span><b>${a.pct} %</b></div><div class="bar-track"><i style="width:${a.pct}%"></i></div></div>`).join('')}</div>
      </div>
      ${refKeys.size ? `<div class="field"><p class="field-label">Ce que dit la recherche</p><ul class="refs">${[...refKeys].map((r) => `<li>${esc(REFS[r])}</li>`).join('')}</ul></div>` : ''}
      ${v.dxstatut === 'question' ? '<p class="notice">Vous vous posez la question d\'un trouble du neurodéveloppement : seul un professionnel de santé peut poser un diagnostic. Votre médecin traitant peut vous orienter.</p>' : ''}
      <p class="disclaimer">L'indice (de 0 à 100 %) mesure l'écart entre ce que l'activité demande et les difficultés que vous déclarez, au moment choisi. Ce n'est pas une probabilité d'accident ni un diagnostic. Les pondérations reposent sur l'analyse des exigences de chaque activité et sur la littérature citée ; elles sont en cours de validation. Aucune réponse n'est enregistrée.</p>`;
  }

  // ---------- assistant pas à pas ----------
  const form = root.querySelector('form');
  const steps = [...form.querySelectorAll('.wiz-step')];
  const out = root.querySelector('[data-result]');
  const done = root.querySelector('[data-done]');
  const next = root.querySelector('[data-next]');
  const back = root.querySelector('[data-back]');
  const top = root.querySelector('.wiz-top');
  const dxBox = root.querySelector('[data-dx-types]');
  let i = 0;
  const show = (n) => {
    i = n;
    steps.forEach((s, k) => { s.hidden = k !== i; });
    root.querySelector('[data-count]').textContent = `Étape ${i + 1} sur ${steps.length}`;
    root.querySelector('[data-bar]').style.width = `${((i + 1) / steps.length) * 100}%`;
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Voir mon profil' : 'Continuer';
  };
  const syncDx = () => { const s = form.elements.dxstatut.value; dxBox.hidden = !(s === 'oui' || s === 'encours'); };
  form.addEventListener('change', syncDx);
  next.addEventListener('click', () => {
    if (i < steps.length - 1) return show(i + 1);
    form.hidden = true; top.hidden = true;
    out.innerHTML = render(read(form)); out.hidden = false; done.hidden = false;
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  back.addEventListener('click', () => show(i - 1));
  root.querySelector('[data-edit]').addEventListener('click', () => { form.hidden = false; top.hidden = false; out.hidden = true; done.hidden = true; show(0); });
  root.querySelector('[data-other]').addEventListener('click', () => { form.hidden = false; top.hidden = false; out.hidden = true; done.hidden = true; show(2); });
  form.addEventListener('submit', (e) => e.preventDefault());
  syncDx(); show(0);
  window.SowlSafeProfil = { score, A, F };
})();
