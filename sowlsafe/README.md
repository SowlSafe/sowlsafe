# SowlSafe

**Comprendre l'humain pour mieux prévenir les risques.**
Sécurité · Bien-être · Productivité

Site statique sans dépendance : un petit générateur (`build.mjs`) assemble les pages avec l'en-tête et le pied de page communs.

## Structure

| Dossier | Contenu |
|---|---|
| `src/pages/` | Pages fixes du site (accueil, particuliers, entreprises, inclusion…). Chaque fichier commence par un bloc `<!--meta {...} -->`. |
| `src/content/articles/` | **Un fichier Markdown par article** (en-tête : titre, module, date, résumé, image, L'essentiel, sources). Modifiable depuis l'administration. |
| `src/content/tests/` | **Un fichier JSON par test** (dimensions, questions, conseils). Une page est créée automatiquement pour chaque test. |
| `src/templates/` | Gabarits d'un article et d'un test. |
| `public/` | Fichiers copiés tels quels : CSS, JavaScript, images, documents. |
| `site.json` | Nom, signature et description du site. |

Dans les pages, `{{pre}}` est remplacé automatiquement par le bon chemin relatif (`''`, `'../'`…).

## Construire le site

```bash
npm run build     # génère dist/ et vérifie tous les liens internes
```

Pour tester en local : `python3 -m http.server -d dist` puis ouvrir http://localhost:8000.

## Mise en ligne : GitHub + Cloudflare Pages (gratuit)

1. Créez un dépôt GitHub `sowlsafe` et envoyez-y ce dossier.
2. Sur https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**, choisissez le dépôt.
3. Réglages de build :
   - Framework preset : **None**
   - Build command : `npm run build`
   - Build output directory : `dist`
4. **Save and Deploy**. Le site est en ligne sur `sowlsafe.pages.dev`, puis à chaque envoi sur GitHub.
5. Plus tard : **Custom domains** pour brancher `sowlsafe.fr` ou `sowlsafe.com`.

## Administration (Pages CMS, gratuit)

1. Le fichier `.pages.yml` doit se trouver **à la racine** du dépôt GitHub.
2. Aller sur https://app.pagescms.org, **Sign in with GitHub**, autoriser l'accès au dépôt `sowlsafe`.
3. Deux rubriques apparaissent : **Articles** et **Tests**. Ajouter, modifier, publier ou dépublier (case « Publié sur le site »).
4. Chaque enregistrement est envoyé sur GitHub ; Cloudflare remet le site à jour en une minute environ.

Dans le texte d'un article, écrire `[1]`, `[2]`… renvoie automatiquement vers la source correspondante.

## Étapes suivantes

- [ ] Compléter `src/pages/mentions-legales.html` (éditeur, SIREN, contact).
- [ ] Relier les formulaires (contact, audit, lettre d'information) à **Supabase** : renseigner `FORMS_ENDPOINT` dans `public/assets/js/site.js`. Tant qu'il est vide, les formulaires n'envoient rien et l'indiquent.
- [ ] Espace personnel (Supabase Auth) pour enregistrer les résultats et suivre leur évolution.
- [ ] Calibrer les pondérations du moteur de risque contextuel (`public/assets/js/evaluateur.js`).
