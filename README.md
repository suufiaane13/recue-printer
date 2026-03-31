# وصل الأداء الإلكتروني

Application web statique (HTML / CSS / JavaScript) pour générer un **reçu de paiement** avec **signature numérique**, aperçu en direct et export **PDF**. Interface en **arabe (RTL)**.

## Fonctionnalités

- Saisie : téléphone, montants, date/heure, calcul du reste
- **Signature numérique** (Signature Pad), verrouillage optionnel de la zone
- Aperçu du reçu aligné sur les données saisies
- Export PDF (html2canvas + jsPDF) ; logo inclus en contexte HTTP
- Thème clair / sombre mémorisé
- Persistance locale du formulaire et de la signature (`localStorage`)
- **PWA** : installable sur Android (Chrome) et assimilable sur d’autres navigateurs (`manifest.webmanifest`, `sw.js`)

### Installer sur Android (Chrome)

1. Déployer le site en **HTTPS** (Netlify, etc.) ou tester en local avec `node server.js`.
2. Ouvrir le site dans **Chrome**.
3. Menu **⋮** → **Installer l’application** ou **Ajouter à l’écran d’accueil** (libellé selon la version).

> L’installation ne fonctionne pas en ouvrant le fichier en `file://` : il faut une origine **http(s)**.

#### Edge — « Tracking Prevention » / stockage

Les messages **Tracking Prevention blocked access to storage** concernent souvent les **domaines tiers** (Google Fonts, jsDelivr). Ce n’est en général **pas bloquant** pour l’app. Le service worker **n’intercepte plus** les requêtes externes pour éviter des **503** et des ressources cassées.

#### Si « Installer l’application » n’apparaît pas

- Vérifier **HTTPS** (ou `http://localhost` en dev).
- **`assets/logo.png`** doit exister et faire **au moins 512×512 px** (Chrome vérifie les tailles déclarées dans le manifeste). Sinon remplacez par un PNG carré ≥ 512 px.
- Chrome : **F12 → Application → Manifest** et **Service Workers** (erreurs en rouge).
- Le fichier **`netlify.toml`** fixe le type MIME du manifeste (important sur Netlify).

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
| `manifest.webmanifest` | Métadonnées PWA (nom, icônes, thème) |
| `sw.js` | Service worker (critère d’installation) |
| `netlify.toml` | En-têtes MIME pour le manifeste (Netlify) |
| `assets/` | Ressources (ex. logo) |

## Bibliothèques (CDN)

- [Signature Pad](https://github.com/szimek/signature_pad)
- [html2canvas](https://html2canvas.hertzen.com/)
- [jsPDF](https://github.com/parallax/jsPDF)

## Licence

Précisez ici la licence du projet (ex. MIT) si vous en choisissez une.
