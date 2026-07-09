'use client';

import { useState } from 'react';

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validPhone(v) {
  const digits = (v.match(/\d/g) || []).length;
  return digits >= 9 && digits <= 15;
}

// Capture des coordonnées juste avant l'audit (point de conversion le
// plus élevé : le diagnostic est "prêt", il ne reste qu'à l'afficher).
export default function EmailGate({ onSubmit }) {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [tel, setTel] = useState('');
  const [touched, setTouched] = useState(false);

  const prenomOk = prenom.trim().length >= 2;
  const emailOk = validEmail(email.trim());
  const telOk = validPhone(tel);
  const canSubmit = prenomOk && emailOk && telOk;

  const submit = () => {
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ prenom: prenom.trim(), email: email.trim(), telephone: tel.trim() });
  };

  const onKey = (e) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="gate">
      <div className="eyebrow">Dernière étape</div>
      <h2 className="gate__title">Votre diagnostic personnalisé est prêt.</h2>
      <p className="gate__sub">
        Renseignez vos coordonnées pour accéder à votre diagnostic complet.
        Résultat immédiat, affiché à l&apos;écran.
      </p>

      <div className="form">
        <div className="field">
          <label htmlFor="prenom">Votre prénom</label>
          <input
            id="prenom"
            type="text"
            autoComplete="given-name"
            placeholder="Prénom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            onKeyDown={onKey}
          />
          {touched && !prenomOk && (
            <div className="field__error">Indiquez votre prénom.</div>
          )}
        </div>

        <div className="field">
          <label htmlFor="email">Votre email professionnel</label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="vous@votre-entreprise.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKey}
          />
          {touched && !emailOk && (
            <div className="field__error">Indiquez un email valide.</div>
          )}
        </div>

        <div className="field">
          <label htmlFor="tel">Votre téléphone</label>
          <input
            id="tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            onKeyDown={onKey}
          />
          {touched && !telOk && (
            <div className="field__error">Indiquez un numéro de téléphone valide.</div>
          )}
        </div>

        <button
          className="btn btn--copper btn--block"
          type="button"
          onClick={submit}
          disabled={!canSubmit}
        >
          Découvrir mon diagnostic
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="gate__privacy">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect x="4" y="11" width="16" height="9" rx="2" fill="currentColor" />
          <path
            d="M8 11V8a4 4 0 0 1 8 0v3"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        Vos réponses restent confidentielles. Aucun spam.
      </div>
    </div>
  );
}
