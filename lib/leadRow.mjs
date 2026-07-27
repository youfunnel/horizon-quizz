// =====================================================================
// Construction de la ligne lead au format 30 colonnes (plage A:AD)
// ---------------------------------------------------------------------
// Source de verite UNIQUE de l'ordre des colonnes. Utilisee par :
//   - components/Quiz.jsx  (construction cote client)
//   - app/api/submit/route.js (construction / normalisation cote serveur)
//   - lib/leadRow.test.mjs (test de non regression sur l'ordre)
//
// Toute modification de l'ordre des colonnes se fait ICI et nulle part
// ailleurs, pour eviter les desynchronisations.
// =====================================================================

// Nombre exact de colonnes attendu par le Google Sheet (A jusqu'a AD).
export const LEAD_ROW_LENGTH = 30;

// Renvoie une chaine vide plutot que null / undefined.
function str(v) {
  return v === undefined || v === null ? '' : v;
}

// Renvoie un nombre tel quel, sinon une chaine vide (jamais undefined).
function num(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? v : '';
}

// Construit le tableau de 30 valeurs dans l'ordre exact de la spec.
// `record` est l'objet structure du lead (labels, scores, utm, etc.).
// Les colonnes reservees sont des chaines vides PRESENTES (jamais omises).
export function buildLeadRow(record) {
  const r = record || {};
  const labels = r.labels || {};
  const scores = r.scores || {};
  const utm = r.utm || {};

  const row = [
    str(r.receivedAt || r.date), // 0  date
    '', // 1  reserve
    str(r.prenom), // 2  prenom
    '', // 3  reserve
    str(r.email), // 4  email
    str(r.telephone), // 5  telephone
    '', // 6  reserve
    str(labels.secteur), // 7  secteur
    str(labels.ca), // 8  chiffre d'affaires
    str(labels.frein), // 9  frein principal
    str(r.dominantAxis), // 10 profil (axe dominant)
    str(r.temperature), // 11 temperature
    str(labels.marge_connue), // 12 marge nette connue
    str(labels.tresorerie_etat), // 13 etat tresorerie
    str(labels.tarifs), // 14 revision tarifs
    str(labels.decision_repoussee), // 15 decision repoussee
    str(labels.pilotage), // 16 pilotage actuel
    num(scores.rentabilite), // 17 score rentabilite
    num(scores.tresorerie), // 18 score tresorerie
    num(scores.visibilite), // 19 score visibilite
    num(scores.pricing), // 20 score pricing
    num(scores.decision), // 21 score decision
    '', // 22 reserve
    str(utm.utm_source), // 23 utm_source
    str(utm.utm_medium), // 24 utm_medium
    str(utm.utm_campaign), // 25 utm_campaign
    str(utm.utm_content), // 26 utm_content
    str(utm.utm_term), // 27 utm_term
    '', // 28 reserve
    str(r.page), // 29 page (URL)
  ];

  return row;
}

// Garantit que la ligne fait exactement LEAD_ROW_LENGTH entrees.
// Si ce n'est pas le cas, complete par des vides ou tronque, et renvoie
// l'ecart pour qu'il puisse etre logge (jamais d'echec silencieux).
export function ensureRowLength(row, expected = LEAD_ROW_LENGTH) {
  const input = Array.isArray(row) ? row.slice() : [];
  const delta = input.length - expected;

  if (delta < 0) {
    while (input.length < expected) input.push('');
  } else if (delta > 0) {
    input.length = expected;
  }

  return { row: input, delta };
}
