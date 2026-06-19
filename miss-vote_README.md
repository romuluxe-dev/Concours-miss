# Miss Vote — Site de vote pour concours Miss

Site complet : page publique de vote (200 FCFA/vote, votes multiples), paiement
mobile money via CinetPay, et tableau de bord admin avec résultats en direct.

## ⚠️ Avant de commencer

Ce site ne pourra **pas encaisser de vrai argent** jusqu'à ce que tu aies :
1. Un compte validé sur [cinetpay.com](https://cinetpay.com)
2. Tes clés API CinetPay (`CINETPAY_API_KEY` et `CINETPAY_SITE_ID`)
3. Le site déployé en ligne (le paiement mobile money a besoin d'une URL publique)

Sans ça, tout fonctionne sauf le bouton "Payer" qui affichera un message
d'erreur clair plutôt que de planter.

---

## 1. Installation en local (sur ton ordinateur, pour tester)

Il te faut [Node.js](https://nodejs.org) installé (version 18 ou plus).

```bash
# Dans le dossier du projet
npm install

# Copier le fichier d'exemple de configuration
cp .env.example .env

# Créer la base de données et y insérer les 15 candidates + le compte admin
npm run db:push
npm run db:seed

# Lancer le site en local
npm run dev
```

Le site est maintenant visible sur **http://localhost:3000**

- Page publique : http://localhost:3000
- Connexion admin : http://localhost:3000/admin
  - Email : `admin@missvote.com`
  - Mot de passe : `ChangeMoi123!` (à changer absolument avant la mise en ligne réelle)

**Note** : tant que tu n'as pas mis tes clés CinetPay dans `.env`, le paiement
affichera une erreur. C'est normal et volontaire — pas de simulation de paiement réel.

---

## 2. Remplacer les candidates placeholder

Deux options :

**Option A — directement dans la base** : ouvre `npm run db:studio`, une
interface visuelle s'ouvre dans ton navigateur, tu peux modifier les 15
candidates (nom, bio, photo) directement.

**Option B — je peux te créer une page admin "Gestion des candidates"** avec
formulaire d'upload de photo si tu préfères une interface plus simple. Dis-le-moi.

Pour les photos : place les fichiers images dans `public/images/` et mets le
chemin (ex: `/images/candidate1.jpg`) dans le champ `imageUrl` de chaque candidate.

---

## 3. Obtenir tes clés CinetPay

1. Va sur [cinetpay.com](https://cinetpay.com) et crée un compte
2. Fournis les documents demandés (pièce d'identité, infos sur l'activité)
3. Une fois validé, va dans **Tableau de bord > Intégration**
4. Récupère `API_KEY` et `SITE_ID`
5. Mets-les dans ton fichier `.env` (en local) ou dans les "Environment
   Variables" de ton hébergeur (en production)

Le paiement mobile money (MTN, Moov...) et carte bancaire sont gérés
automatiquement par CinetPay une fois ces clés actives.

---

## 4. Mettre le site en ligne

### Étape 1 — Mettre le code sur GitHub
1. Crée un compte sur [github.com](https://github.com) si tu n'en as pas
2. Crée un nouveau repository (dépôt), par exemple `miss-vote`
3. Mets-y tout ce dossier de code (GitHub Desktop est l'outil le plus simple
   si tu n'es pas habitué à la ligne de commande)

### Étape 2 — Déployer sur Railway (recommandé, simple)
1. Va sur [railway.app](https://railway.app), connecte-toi avec GitHub
2. "New Project" → "Deploy from GitHub repo" → choisis `miss-vote`
3. Railway détecte automatiquement Next.js
4. Ajoute une base de données : "New" → "Database" → "PostgreSQL"
5. Dans les variables d'environnement du service web, ajoute :
   - `DATABASE_URL` = (copie l'URL fournie par le service PostgreSQL que tu viens de créer)
   - `CINETPAY_API_KEY` = ta clé
   - `CINETPAY_SITE_ID` = ton ID
   - `NEXT_PUBLIC_BASE_URL` = l'URL que Railway te donne (ex: `https://miss-vote.up.railway.app`)
   - `JWT_SECRET` = une longue chaîne aléatoire que tu inventes
6. **Important** : dans `prisma/schema.prisma`, change `provider = "sqlite"`
   en `provider = "postgresql"` avant de déployer en production
7. Railway relance automatiquement le site à chaque modification

### Étape 3 — Nom de domaine (optionnel mais recommandé)
1. Achète un nom de domaine sur Namecheap ou OVH (~7000-10000 FCFA/an)
2. Dans Railway, va dans "Settings" → "Domains" → ajoute ton domaine
3. Suis les instructions pour configurer les DNS chez ton fournisseur de domaine

---

## 5. Sécurité — à ne jamais oublier

- Change le mot de passe admin (`ChangeMoi123!`) immédiatement après le premier déploiement
- Ne mets **jamais** le fichier `.env` sur GitHub (le `.gitignore` l'empêche déjà, ne le force pas)
- Le webhook de paiement revérifie toujours auprès de CinetPay avant de valider
  un vote — ne modifie pas cette logique, elle empêche la fraude

---

## Structure du projet

```
src/app/
  page.tsx                    → Page d'accueil (liste des candidates)
  vote/[candidateId]/         → Page de vote pour une candidate
  vote/merci/                 → Page de confirmation après paiement
  admin/                      → Connexion admin
  admin/dashboard/            → Résultats en direct
  api/candidates/             → Liste des candidates (API)
  api/payment/init/           → Démarre un paiement CinetPay
  api/payment/webhook/        → Reçoit la confirmation de CinetPay
  api/payment/status/         → Vérifie le statut d'un paiement
  api/admin/login/            → Connexion admin (API)
  api/admin/stats/            → Statistiques (API)
prisma/
  schema.prisma                → Structure de la base de données
  seed.js                       → Données de départ (15 candidates + admin)
```

---

## Et après ?

Dis-moi si tu veux que j'ajoute :
- Une page admin pour modifier les candidates (nom/photo/bio) sans passer par Prisma Studio
- Un export Excel/CSV de tous les paiements
- Un système de notification (email/SMS) quand un vote est confirmé
- Une protection anti-bot supplémentaire sur le formulaire de vote
