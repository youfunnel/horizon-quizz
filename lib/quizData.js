// =====================================================================
// CONFIGURATION DU QUIZ - Horizon Finance
// ---------------------------------------------------------------------
// Tout le contenu éditable du quiz est ici. Pour modifier une question,
// une réponse ou le scoring, il suffit d'éditer ce fichier.
//
// Les 5 axes de diagnostic correspondent aux 5 pain points :
//   rentabilite -> "Je fais du chiffre mais il ne reste pas assez"
//   tresorerie  -> "Ma trésorerie est trop tendue"
//   visibilite  -> "Je ne sais pas où part ma marge"
//   pricing     -> "Mes offres / mes prix ne sont pas assez rentables"
//   decision    -> "Je manque de visibilité pour décider"
//
// Chaque option ajoute des points (`scores`) à un ou plusieurs axes.
// L'axe le plus élevé en fin de quiz détermine le profil (archétype)
// et donc l'audit personnalisé affiché.
// =====================================================================

export const AXES = ['rentabilite', 'tresorerie', 'visibilite', 'pricing', 'decision'];

// Libellés des secteurs (Q1) - utilisés pour personnaliser l'audit.
export const SECTEURS = {
  btp: 'BTP / Construction',
  sante: 'Santé / Paramédical',
  cvc: 'Plomberie / Chauffage / CVC',
  signaletique: 'Signalétique / Industrie',
  chr: 'CHR (café, hôtel, restaurant)',
  autre: 'Prestation de services',
};

// Libellés + repères de chiffrage par tranche de CA (Q2).
// `gain` = fourchette de gain annuel pour 3 à 5 points de marge récupérés.
export const CA_BANDS = {
  moins500: { label: 'Moins de 500K€', gain: '10 000 à 25 000 €', fit: 'bas' },
  '500_1m': { label: '500K€ à 1M€', gain: '15 000 à 50 000 €', fit: 'ideal' },
  '1m_2m': { label: '1M€ à 2M€', gain: '30 000 à 100 000 €', fit: 'ideal' },
  plus2m: { label: 'Plus de 2M€', gain: '60 000 € et au-delà', fit: 'haut' },
};

// ---------------------------------------------------------------------
// LES QUESTIONS
// ---------------------------------------------------------------------
export const QUESTIONS = {
  secteur: {
    id: 'secteur',
    eyebrow: 'Pour calibrer votre diagnostic',
    title: 'Dans quel secteur évoluez-vous ?',
    options: [
      { id: 'btp', emoji: '🏗️', label: 'BTP / Construction' },
      { id: 'sante', emoji: '🩺', label: 'Santé / Paramédical' },
      { id: 'cvc', emoji: '🔧', label: 'Plomberie / Chauffage / CVC' },
      { id: 'signaletique', emoji: '🪧', label: 'Signalétique / Industrie' },
      { id: 'chr', emoji: '🍽️', label: 'Secteur CHR (Café, Hôtels, Restaurants)' },
      { id: 'autre', emoji: '💼', label: 'Autre prestation de services' },
    ],
  },

  ca: {
    id: 'ca',
    eyebrow: 'Pour calibrer votre diagnostic',
    title: "Quel est le chiffre d'affaires annuel de votre entreprise ?",
    help: 'Les fuites de marge ne se chiffrent pas de la même façon selon votre taille.',
    options: [
      { id: 'moins500', emoji: '🌱', label: 'Moins de 500K€' },
      { id: '500_1m', emoji: '📈', label: '500K€ à 1M€' },
      { id: '1m_2m', emoji: '🚀', label: '1M€ à 2M€' },
      { id: 'plus2m', emoji: '🏆', label: 'Plus de 2M€' },
    ],
  },

  frein: {
    id: 'frein',
    eyebrow: 'Le cœur du diagnostic',
    title: "Aujourd'hui, qu'est-ce qui vous freine le plus ?",
    help: 'Une seule réponse, celle qui pèse le plus.',
    options: [
      {
        id: 'rentabilite',
        emoji: '💸',
        label: 'Je fais du chiffre, mais il ne reste pas assez à la fin',
        scores: { rentabilite: 3 },
      },
      {
        id: 'tresorerie',
        emoji: '🌊',
        label: 'Ma trésorerie est tendue, je vis au rythme des encaissements',
        scores: { tresorerie: 3 },
      },
      {
        id: 'visibilite',
        emoji: '🔍',
        label: 'Je ne sais pas précisément où part ma marge',
        scores: { visibilite: 3 },
      },
      {
        id: 'pricing',
        emoji: '🏷️',
        label: 'Je doute que mes offres ou mes prix soient assez rentables',
        scores: { pricing: 3 },
      },
      {
        id: 'decision',
        emoji: '🧭',
        label: 'Je manque de visibilité pour décider sereinement',
        scores: { decision: 3 },
      },
    ],
  },

  marge_connue: {
    id: 'marge_connue',
    eyebrow: 'Lisibilité',
    title: 'Connaissez-vous votre marge nette réelle, à un point près, sans ouvrir un fichier ?',
    options: [
      { id: 'oui', emoji: '✅', label: 'Oui, je la connais précisément', scores: { visibilite: 0 } },
      { id: 'apeupres', emoji: '🤔', label: 'À peu près, mais pas au point près', scores: { visibilite: 1 } },
      { id: 'non', emoji: '🙈', label: 'Honnêtement, non', scores: { visibilite: 2, rentabilite: 1 } },
    ],
  },

  tresorerie_etat: {
    id: 'tresorerie_etat',
    eyebrow: 'Trésorerie',
    title: 'Comment décririez-vous votre trésorerie en ce moment ?',
    options: [
      { id: 'confortable', emoji: '😌', label: "Confortable, j'ai plusieurs mois d'avance", scores: { tresorerie: 0 } },
      { id: 'tendue', emoji: '😬', label: "Ça passe, mais c'est tendu certains mois", scores: { tresorerie: 2 } },
      { id: 'soustension', emoji: '😰', label: 'Sous tension quasi permanente', scores: { tresorerie: 3 } },
      { id: 'pasvisi', emoji: '🤷', label: "Je n'ai pas de visibilité claire dessus", scores: { tresorerie: 2, visibilite: 1 } },
    ],
  },

  tarifs: {
    id: 'tarifs',
    eyebrow: 'Tarification',
    title: 'À quand remonte votre dernière révision de tarifs ?',
    options: [
      { id: 'moins6', emoji: '🆕', label: 'Il y a moins de 6 mois', scores: { pricing: 0 } },
      { id: '1_2ans', emoji: '📅', label: 'Il y a 1 à 2 ans', scores: { pricing: 1 } },
      { id: 'plus2', emoji: '🕰️', label: 'Plus de 2 ans', scores: { pricing: 2 } },
      { id: 'jamais', emoji: '🚫', label: 'Je ne révise pas vraiment mes tarifs', scores: { pricing: 3, rentabilite: 1 } },
    ],
  },

  decision_repoussee: {
    id: 'decision_repoussee',
    eyebrow: 'Décision',
    title: 'Y a-t-il une décision que vous repoussez, faute de visibilité ?',
    options: [
      { id: 'recrutement', emoji: '👥', label: 'Oui, un recrutement', scores: { decision: 2 } },
      { id: 'investissement', emoji: '💰', label: 'Oui, un investissement', scores: { decision: 2 } },
      { id: 'restructuration', emoji: '🔄', label: 'Oui, une restructuration ou un changement de modèle', scores: { decision: 2 } },
      { id: 'plusieurs', emoji: '🗂️', label: 'Plusieurs, en fait', scores: { decision: 3 } },
      { id: 'non', emoji: '✋', label: 'Non, pas vraiment', scores: { decision: 0 } },
    ],
  },

  pilotage: {
    id: 'pilotage',
    eyebrow: 'Pilotage',
    title: 'Comment pilotez-vous vos chiffres aujourd\u2019hui ?',
    options: [
      { id: 'bilan', emoji: '📄', label: 'Mon comptable me donne un bilan une fois par an', scores: { visibilite: 2, decision: 1 } },
      { id: 'banque', emoji: '🏦', label: 'Je regarde mon compte en banque et mes relevés', scores: { visibilite: 2, tresorerie: 1 } },
      { id: 'tableur', emoji: '📊', label: 'J\u2019ai un tableur que je tiens moi-même', scores: { visibilite: 1 } },
      { id: 'outil', emoji: '🎛️', label: 'J\u2019ai un tableau de bord à jour en temps réel', scores: { visibilite: 0 } },
    ],
  },
};

// ---------------------------------------------------------------------
// L'ORDRE DU PARCOURS
// Le social proof (kind: 'proof') est inséré à mi-parcours, après la
// question sur la trésorerie. Welcome / proof / gate ne comptent pas
// dans la barre de progression (seules les questions comptent).
// ---------------------------------------------------------------------
export const FLOW = [
  { kind: 'welcome' },
  { kind: 'question', q: 'secteur' },
  { kind: 'question', q: 'ca' },
  { kind: 'question', q: 'frein' },
  { kind: 'question', q: 'marge_connue' },
  { kind: 'question', q: 'tresorerie_etat' },
  { kind: 'question', q: 'tarifs' },
  { kind: 'question', q: 'decision_repoussee' },
  { kind: 'question', q: 'pilotage' },
  { kind: 'gate' },
  { kind: 'loading' },
  { kind: 'audit' },
];

// Nombre total de questions (pour la barre de progression).
export const TOTAL_QUESTIONS = FLOW.filter((s) => s.kind === 'question').length;
