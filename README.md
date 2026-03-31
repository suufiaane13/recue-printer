# وصل الأداء الإلكتروني

Application web statique (HTML / CSS / JavaScript) pour générer un **reçu de paiement** avec **signature numérique**, aperçu en direct et export **PDF**. Interface en **arabe (RTL)**.

## Fonctionnalités

- Saisie : téléphone, montants, date/heure, calcul du reste
- **Signature numérique** (Signature Pad), verrouillage optionnel de la zone
- Aperçu du reçu aligné sur les données saisies
- Export PDF (html2canvas + jsPDF) ; logo inclus en contexte HTTP
- Thème clair / sombre mémorisé
- Persistance locale du formulaire et de la signature (`localStorage`)

## Prérequis

- Navigateur récent (Chrome, Edge, Firefox, Safari)
- Pour le serveur local optionnel : [Node.js](https://nodejs.org/) (aucune dépendance npm requise pour ce dépôt)

## Utilisation locale

### Option A — Fichiers ouverts directement

Vous pouvez ouvrir `index.html` dans le navigateur. Certaines fonctions (export PDF, chargement du logo pour le PDF) sont plus fiables **via HTTP**.

### Option B — Petit serveur HTTP (recommandé)

```bash
node server.js
```

Puis ouvrir [http://localhost:5500](http://localhost:5500) (ou le port défini par la variable d’environnement `PORT`).

## Déploiement

Hébergement **statique** suffisant (GitHub Pages, Netlify, Cloudflare Pages, etc.) : déployer la racine du projet (`index.html`, `styles.css`, `app.js`, `assets/`, etc.). Le fichier `server.js` n’est pas nécessaire en production.

## Structure du dépôt

| Élément | Rôle |
|--------|------|
| `index.html` | Structure de la page |
| `styles.css` | Styles et thème |
| `app.js` | Logique métier, signature, PDF, stockage |
| `server.js` | Serveur HTTP local optionnel (Node) |
| `assets/` | Ressources (ex. logo) |

## Bibliothèques (CDN)

- [Signature Pad](https://github.com/szimek/signature_pad)
- [html2canvas](https://html2canvas.hertzen.com/)
- [jsPDF](https://github.com/parallax/jsPDF)

## Licence

Précisez ici la licence du projet (ex. MIT) si vous en choisissez une.
