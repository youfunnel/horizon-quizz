'use client';

// Écran d'accueil : promesse claire, badge d'autorité, lancement du quiz.
export default function Welcome({ onStart }) {
  return (
    <div className="welcome">
      <p className="eyebrow welcome__eyebrow">
        Le copilote financier des dirigeants de PME
      </p>

      <h1 className="welcome__title">
        Découvrez comment récupérer les <em>fuites de marge cachées</em> dans
        votre chiffre d&apos;affaires
      </h1>

      <p className="welcome__sub">
        Identifiez en quelques minutes les points de marge qui vous échappent.
      </p>

      <div className="welcome__cta">
        <button className="btn btn--copper" type="button" onClick={onStart}>
          Commencer
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="meta-line">
          <span>2 min</span>
          <span className="dot" />
          <span>8 questions</span>
          <span className="dot" />
          <span>Réservé aux +500K€</span>
          <span className="dot" />
          <span>Résultat immédiat</span>
        </div>

        <div className="figaro">
          Vu dans <strong>Le Figaro</strong>
        </div>
      </div>
    </div>
  );
}
