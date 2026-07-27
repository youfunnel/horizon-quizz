'use client';

// =====================================================================
// ORCHESTRATEUR DU QUIZ - Horizon Finance
// ---------------------------------------------------------------------
// Composant client unique qui pilote tout le parcours :
//   welcome -> questions -> social proof -> email gate -> loading -> audit
//
// Tout est rendu sur la même page ("/"). Les vues loading et audit sont
// plein écran : elles donnent la sensation de "pages" sans avoir à
// jongler avec des paramètres d'URL pour transmettre l'audit personnalisé.
//
// L'envoi au Google Sheet (via /api/submit) ne bloque JAMAIS l'affichage
// de l'audit : on déclenche le POST, puis on enchaîne sur le chargement.
// =====================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { FLOW, QUESTIONS, TOTAL_QUESTIONS } from '../lib/quizData';
import { buildSummary } from '../lib/scoring';
import { track } from '../lib/track';

import Welcome from './Welcome';
import QuestionStep from './QuestionStep';
import EmailGate from './EmailGate';
import Loading from './Loading';
import Audit from './Audit';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Construit un objet { questionId: libellé de la réponse } lisible,
// pour alimenter les colonnes du Google Sheet.
function buildLabels(answers) {
  const labels = {};
  Object.entries(answers).forEach(([qid, oid]) => {
    const q = QUESTIONS[qid];
    if (!q) return;
    const opt = q.options.find((o) => o.id === oid);
    if (opt) labels[qid] = opt.label;
  });
  return labels;
}

export default function Quiz() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [, setLead] = useState({ prenom: '', email: '' });
  const [utm, setUtm] = useState({});
  const advanceTimer = useRef(null);

  // Capture des UTM présents dans l'URL au montage (attribution pub).
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const found = {};
      UTM_KEYS.forEach((k) => {
        const v = params.get(k);
        if (v) found[k] = v;
      });
      setUtm(found);
    } catch (e) {
      /* no-op */
    }
  }, []);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // Événement Meta de fin de funnel, quand l'audit s'affiche.
  useEffect(() => {
    if (FLOW[stepIndex] && FLOW[stepIndex].kind === 'audit') {
      track('QuizComplete', { content_name: 'quiz_diagnostic_financier' }, true);
    }
  }, [stepIndex]);

  const step = FLOW[stepIndex];

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, FLOW.length - 1));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, []);

  // Démarrage du quiz (clic sur l'accueil) : signal d'engagement pour Meta.
  const handleStart = () => {
    track('QuizStart', {}, true);
    goNext();
  };

  // Numéro de la question courante (parmi les questions uniquement).
  const questionNumber = FLOW.slice(0, stepIndex + 1).filter(
    (s) => s.kind === 'question'
  ).length;

  const handleAnswer = (qid, oid) => {
    setAnswers((prev) => ({ ...prev, [qid]: oid }));
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    // Court délai pour laisser apparaître la sélection avant d'avancer.
    advanceTimer.current = setTimeout(goNext, 220);
  };

  const handleGateSubmit = (data) => {
    setLead(data);

    const summary = buildSummary(answers);
    const payload = {
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      answers,
      labels: buildLabels(answers),
      scores: summary.scores,
      dominantAxis: summary.dominantAxis,
      temperature: summary.temperature,
      utm,
      page: typeof window !== 'undefined' ? window.location.href : '',
    };

    // Envoi non bloquant : on n'attend pas la réponse pour afficher l'audit,
    // mais on inspecte le résultat pour signaler un échec de persistance en
    // console (fini le faux succès silencieux). L'UX n'est jamais bloquée.
    try {
      fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then(async (res) => {
          if (!res.ok) {
            console.error('[quiz] Lead non persisté, statut', res.status);
            return;
          }
          const data = await res.json().catch(() => ({}));
          if (data && data.persisted === false) {
            console.error('[quiz] Lead non persisté (persisted=false).');
          }
        })
        .catch((e) => {
          console.error('[quiz] Échec de l’envoi du lead :', e?.message || e);
        });
    } catch (e) {
      /* on ne bloque jamais l'utilisateur */
    }

    // Conversion principale pour Meta : un lead qualifié (email capturé).
    track('Lead', { content_name: 'quiz_diagnostic_financier' });

    goNext(); // -> loading
  };

  // Calculé ici pour passer l'axe dominant à l'audit.
  const summary = buildSummary(answers);

  const dark =
    step.kind === 'welcome' || step.kind === 'loading';

  // L'audit a sa propre mise en page plein écran (en-tête navy + corps).
  if (step.kind === 'audit') {
    return (
      <div className="app">
        <Audit answers={answers} dominant={summary.dominantAxis} />
      </div>
    );
  }

  function renderStep() {
    switch (step.kind) {
      case 'welcome':
        return <Welcome onStart={handleStart} />;
      case 'question': {
        const q = QUESTIONS[step.q];
        return (
          <QuestionStep
            question={q}
            selected={answers[q.id]}
            onSelect={(oid) => handleAnswer(q.id, oid)}
            onBack={stepIndex > 1 ? goBack : null}
          />
        );
      }
      case 'proof':
        return null;
      case 'gate':
        return <EmailGate onSubmit={handleGateSubmit} />;
      case 'loading':
        return <Loading answers={answers} onComplete={goNext} />;
      default:
        return null;
    }
  }

  return (
    <div className={`app${dark ? ' app--dark' : ''}`}>
      {step.kind === 'question' && (
        <div className="progress">
          <div className="progress__row">
            <span className="progress__brand">Faites Parler Vos Chiffres</span>
            <span className="progress__count">
              Question {questionNumber} / {TOTAL_QUESTIONS}
            </span>
          </div>
          <div className="progress__track">
            <div
              className="progress__fill"
              style={{ width: `${(questionNumber / TOTAL_QUESTIONS) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="stage">
        <div className="panel">
          <div className="step-in" key={stepIndex}>
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
