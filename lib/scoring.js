// =====================================================================
// MOTEUR DE SCORING - Horizon Finance
// ---------------------------------------------------------------------
// À partir des réponses, calcule :
//   - le score de chaque axe
//   - l'axe dominant (= archétype / profil affiché)
//   - la "température" du lead (pour priorisation côté commercial)
// =====================================================================

import { AXES, QUESTIONS, CA_BANDS } from './quizData';

// Additionne les points de chaque option choisie sur chaque axe.
export function computeScores(answers) {
  const scores = Object.fromEntries(AXES.map((a) => [a, 0]));

  Object.entries(answers).forEach(([questionId, optionId]) => {
    const question = QUESTIONS[questionId];
    if (!question) return;
    const option = question.options.find((o) => o.id === optionId);
    if (!option || !option.scores) return;
    Object.entries(option.scores).forEach(([axis, points]) => {
      if (scores[axis] !== undefined) scores[axis] += points;
    });
  });

  return scores;
}

// Détermine l'axe dominant. En cas d'égalité, l'axe choisi à la
// question "frein principal" tranche (c'est la priorité déclarée).
export function dominantAxis(scores, answers) {
  const max = Math.max(...AXES.map((a) => scores[a]));
  const leaders = AXES.filter((a) => scores[a] === max);

  if (leaders.length === 1) return leaders[0];

  const declared = answers.frein;
  if (declared && leaders.includes(declared)) return declared;

  // Ordre de priorité par défaut si l'égalité persiste.
  const priority = ['rentabilite', 'tresorerie', 'visibilite', 'pricing', 'decision'];
  return priority.find((a) => leaders.includes(a)) || leaders[0];
}

// Température du lead : Chaud / Tiède / À nurturer.
// Combine l'adéquation de la cible (CA) et l'intensité des signaux.
export function leadTemperature(answers, scores) {
  const totalPain = AXES.reduce((sum, a) => sum + scores[a], 0);
  const caFit = CA_BANDS[answers.ca]?.fit; // 'ideal' | 'haut' | 'bas'
  const decisionPending = answers.decision_repoussee && answers.decision_repoussee !== 'non';

  const targetFit = caFit === 'ideal' || caFit === 'haut';

  if (targetFit && (totalPain >= 7 || decisionPending)) return 'Chaud';
  if (targetFit) return 'Tiède';
  return 'À nurturer';
}

// Petit résumé exploitable (utile pour le Google Sheet et le debug).
export function buildSummary(answers) {
  const scores = computeScores(answers);
  const axis = dominantAxis(scores, answers);
  return {
    scores,
    dominantAxis: axis,
    temperature: leadTemperature(answers, scores),
  };
}
