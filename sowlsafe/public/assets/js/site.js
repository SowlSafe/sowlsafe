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
