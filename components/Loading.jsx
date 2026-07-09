'use client';

import { useEffect, useState } from 'react';
import { SECTEURS, CA_BANDS } from '../lib/quizData';

// Écran de chargement / "analyse". Les étapes reprennent les réponses du
// dirigeant pour donner le sentiment d'un traitement réellement personnalisé.
export default function Loading({ answers, onComplete }) {
  const secteur = SECTEURS[answers.secteur] || 'votre activité';
  const ca = CA_BANDS[answers.ca]?.label || 'votre tranche de CA';

  const steps = [
    `Lecture de votre profil ${secteur}`,
    'Identification de votre fuite de marge principale',
    `Comparaison avec les dirigeants à ${ca}`,
    'Génération de votre plan personnalisé',
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const timers = [];
    const BASE = 550;
    const STEP = 650;
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setActive(i + 1), BASE + i * STEP));
    });
    timers.push(setTimeout(onComplete, BASE + steps.length * STEP + 350));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loading">
      <div className="scanner">
        <svg viewBox="0 0 100 100">
          <circle className="scanner__track" cx="50" cy="50" r="40" />
          <circle className="scanner__arc" cx="50" cy="50" r="40" />
        </svg>
      </div>

      <h2 className="loading__title">Analyse de vos réponses</h2>
      <p className="loading__sub">
        Nous construisons votre diagnostic personnalisé.
      </p>

      <div className="steps">
        {steps.map((label, i) => (
          <div
            key={i}
            className={`steps__item${i < active ? ' steps__item--active' : ''}`}
          >
            <span className="steps__check">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M1 6.5 L4.5 10 L11 2"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
