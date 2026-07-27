# Quiz de diagnostic financier — Horizon Finance

Funnel quiz « Faites Parler Vos Chiffres ». En 8 questions, le dirigeant
obtient un **audit personnalisé** de son pilotage financier. Pensé pour
faire baisser le CPL par rapport au funnel VSL, sans friction.

- **Stack** : Next.js 14 (App Router), JavaScript, CSS pur. Aucune dépendance superflue.
- **Hébergement** : Vercel.
- **Collecte des leads** : Google Sheet via un Web App Google Apps Script.
- **Parcours** : accueil → 8 questions (+ social proof à mi-parcours) → capture email → écran d'analyse → audit personnalisé.

---

## 1. Déploiement sur Vercel (5 min)

1. Poussez ce dossier sur un dépôt GitHub (ou importez-le directement dans Vercel).
2. Sur [vercel.com](https://vercel.com) : **Add New → Project**, sélectionnez le dépôt.
3. Framework détecté automatiquement : **Next.js**. Laissez les réglages par défaut.
4. Ajoutez les variables d'environnement (étape 2 et 3 ci-dessous), puis **Deploy**.

C'est tout. Vercel build et met en ligne. Le quiz est sur l'URL fournie.

---

## 2. Brancher le Google Sheet (5 min)

Le formulaire envoie chaque lead à un Google Sheet via un petit script.

1. Créez un **Google Sheet vide**.
2. Menu **Extensions → Apps Script**.
3. Collez tout le contenu de `google-apps-script.gs` (remplacez le code par défaut).
4. **Déployer → Nouveau déploiement → Type : Application Web**.
   - *Exécuter en tant que* : **Moi**.
   - *Qui a accès* : **Tout le monde**.
5. Déployez, autorisez l'accès, puis **copiez l'URL `/exec`** fournie.

> À chaque modification du script, créez une **nouvelle version** du déploiement pour que l'URL reflète les changements.

L'onglet `Leads` et les en-têtes (prénom, email, profil, température, secteur, CA, réponses, scores, UTM…) se créent automatiquement à la première soumission.

---

## 3. Variables d'environnement

À renseigner dans Vercel (**Settings → Environment Variables**) ou en local dans un fichier `.env.local`. Voir `.env.example`.

| Variable | Rôle |
| --- | --- |
| `GOOGLE_SHEETS_WEBHOOK_URL` | L'URL `/exec` du Web App Apps Script (étape 2). |
| `GOOGLE_SHEETS_WEBHOOK_URL_FALLBACK` | (Optionnel) Second webhook de secours si l'écriture principale échoue. |
| `NEXT_PUBLIC_BOOKING_URL` | La page de prise de RDV System.io (boutons « Réserver » de l'audit). |

> Si `GOOGLE_SHEETS_WEBHOOK_URL` n'est pas défini, le quiz **fonctionne quand même** : l'audit s'affiche, mais le lead n'est **pas** enregistré. Dans ce cas l'API renvoie une vraie erreur (502) et logge le lead complet en JSON (marqueur `[LEAD_FALLBACK]`) pour qu'il reste récupérable dans les logs. On ne bloque jamais l'utilisateur.

---

## 3 bis. Vérifier le pipeline de leads

Un script autonome teste de bout en bout le webhook Apps Script (sonde `GET`
puis `POST` d'un lead de test marqué `VERIF-<timestamp>` au format 30 colonnes).
Il affiche l'alignement des 30 valeurs (index + colonne attendue) et un
diagnostic actionnable (page de login Google, 302, 401, 403, timeout, succès).

```bash
# Via la variable d'environnement
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/.../exec" npm run verify:leads

# ou en passant l'URL en argument
node scripts/verify-leads-pipeline.mjs "https://script.google.com/.../exec"
```

Sortie en code `0` si tout est bon, `1` sinon. Après un passage réussi, une
ligne `VERIF-<timestamp>` doit apparaître dans l'onglet `Leads` : comparez-la
aux en-têtes grâce au tableau d'alignement affiché par le script.

---

## 4. Tout est éditable au même endroit

| Fichier | Ce qu'on y modifie |
| --- | --- |
| `lib/quizData.js` | Questions, réponses, ordre du parcours, scoring. |
| `lib/scoring.js` | Calcul de l'axe dominant et de la température du lead. |
| `lib/audits.js` | Contenu des 5 audits (constat, mécanisme, chiffrage, méthode). |
| `components/SocialProof.jsx` | Témoignage + stat à mi-parcours. |
| `app/globals.css` | Design system (couleurs, typo, composants). |

---

## 5. En local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de production
npm start        # sert le build
```

---

## À valider avant mise en ligne (conformité)

- **Témoignage** (`components/SocialProof.jsx`) : actuellement un placeholder paraphrasé. Le remplacer par un **verbatim exact validé par écrit**. Ne pas réutiliser les noms inventés du funnel VSL.
- **Mention « Le Figaro »** : confirmer la formulation et, idéalement, ajouter un lien vers la prise de parole.
- **Mentions légales / politique de confidentialité** : les liens du footer (`components/Audit.jsx`) pointent vers `#`. À remplacer par les vraies URLs.
- **RGPD** : ajouter la mention de consentement / finalité au niveau de la capture email si le lead alimente une séquence de nurturing.

---

## 6. Meta Ads : suivi et attribution

Le quiz embarque le **Pixel Meta** (piloté par `NEXT_PUBLIC_META_PIXEL_ID`) et envoie les événements suivants :

| Événement | Déclenchement | Type |
| --- | --- | --- |
| `PageView` | Chargement de la page | standard |
| `QuizStart` | Clic sur « Lancer mon diagnostic » | custom |
| `Lead` | Validation de l'email (fin du quiz) | standard |
| `QuizComplete` | Affichage de l'audit | custom |
| `BookingClick` | Clic sur « Réserver mon échange stratégique » | custom |

La conversion à optimiser dans Meta est **`Lead`** (email capturé). `BookingClick` sert de signal secondaire.

À faire côté Meta Business / setup (une fois) :

1. **Renseigner `NEXT_PUBLIC_META_PIXEL_ID`** dans Vercel, puis redéployer.
2. **Domaine personnalisé** : brancher un sous-domaine (ex. `diagnostic.faites-parler-vos-chiffres.com`) sur le projet Vercel plutôt que l'URL `*.vercel.app`. Meilleure délivrabilité et confiance.
3. **Vérifier le domaine** dans Meta Business Manager (Paramètres de l'entreprise > Sécurité de la marque > Domaines), puis configurer les **événements agrégés (AEM)** en plaçant `Lead` en priorité 1.
4. **Pixel sur la page de RDV** : poser le **même** Pixel sur `go.faites-parler-vos-chiffres.com/derniere-etape` (System.io) et y envoyer un événement de réservation effective (ex. `Schedule`). Les paramètres d'attribution (`utm_*`, `fbclid`) sont automatiquement transmis depuis le quiz vers cette page par les boutons, ce qui permet de relier le RDV à la campagne.
5. **Consentement (RGPD)** : pour une diffusion en France, ajouter un bandeau de consentement (CMP) et ne charger le Pixel qu'après acceptation. Point à traiter avant la mise à l'échelle du budget.

> Évolution recommandée plus tard : la **Conversions API (CAPI)** côté serveur, pour fiabiliser le suivi malgré iOS et les bloqueurs. Le `fbclid` et les UTM sont déjà disponibles dans le payload pour ça.
