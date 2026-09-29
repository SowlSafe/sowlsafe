# SowlSafe

**Comprendre l'humain pour mieux prévenir les risques.**
Sécurité · Sûreté · Santé · Sciences

Site statique sans dépendance : un petit générateur (`build.mjs`) assemble les pages avec l'en-tête et le pied de page communs.

## Structure

| Dossier | Contenu |
|---|---|
| `src/pages/` | Pages du site (accueil, approche, modules, outils, audit…). Chaque fichier commence par un bloc `<!--meta {...} -->`. |
| `src/articles/` | Un fichier HTML par article (métadonnées : titre, module, date, résumé, image, sources). La liste des articles se met à jour toute seule. |
| `src/data/outils.json` | Liste des outils affichés sur le site. |
| `src/templates/article.html` | Gabarit d'un article. |
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

## Étapes suivantes

- [ ] Compléter `src/pages/mentions-legales.html` (éditeur, SIREN, contact).
- [ ] Relier les formulaires (contact, audit, lettre d'information) à **Supabase** : renseigner `FORMS_ENDPOINT` dans `public/assets/js/site.js`. Tant qu'il est vide, les formulaires n'envoient rien et l'indiquent.
- [ ] Espace personnel (Supabase Auth) pour enregistrer les résultats et suivre leur évolution.
- [ ] Calibrer les pondérations du moteur de risque contextuel (`public/assets/js/evaluateur.js`).
