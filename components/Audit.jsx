'use client';

import { buildAudit } from '../lib/audits';
import { track, appendCurrentParams } from '../lib/track';
import ScissorChart from './ScissorChart';

// Page de prise de RDV (System.io). Configurable par variable d'environnement,
// avec repli sur le lien connu pour que le bouton fonctionne toujours.
const BOOKING_URL =
  process.env.NEXT_PUBLIC_BOOKING_URL ||
  'https://go.faites-parler-vos-chiffres.com/derniere-etape';

function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// CTA réutilisé plusieurs fois dans la page de résultat.
function InlineCta() {
  return (
    <div className="cta-inline">
      <a
        className="btn btn--copper"
        href={appendCurrentParams(BOOKING_URL)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('BookingClick', {}, true)}
      >
        Réserver mon échange stratégique
        <Arrow />
      </a>
      <div className="cta-sub">GRATUIT et SANS ENGAGEMENT</div>
    </div>
  );
}

// Page d'audit personnalisé, construite à partir des réponses + axe dominant.
export default function Audit({ answers, dominant }) {
  const a = buildAudit(answers, dominant);

  return (
    <div className="audit">
      <header className="audit__head">
        <div className="audit__head-inner step-in">
          <div className="audit__meta">
            <span>DIAGNOSTIC PERSONNALISÉ</span>
            <span>·</span>
            <span>{a.secteurLabel}</span>
            <span>·</span>
            <span>{a.caLabel}</span>
          </div>
          <div className="eyebrow" style={{ color: 'var(--red)', marginBottom: 10 }}>
            Votre profil
          </div>
          <h1 className="audit__profil">{a.profil}</h1>
          <p className="audit__tagline">{a.tagline}</p>
        </div>
      </header>

      <div className="audit__body">
        {/* Le constat */}
        <section className="section">
          <div className="section__label">Le constat</div>
          <p className="prose">{a.constat}</p>
          <p className="prose">{a.secteurTouch}</p>
        </section>

        {/* Le mécanisme + effet ciseau */}
        <section className="section">
          <div className="section__label">Ce qui se passe vraiment</div>
          <p className="prose">{a.mecanisme}</p>
          <ScissorChart />
        </section>

        {/* Chiffrage + CTA au pic d'intérêt */}
        <section className="section">
          <div className="section__label">Ce que ça représente</div>
          <div className="figure-card">
            <div>
              <span className="figure-card__num">{a.chiffrageMontant}</span>
              <span className="figure-card__unit">/ an</span>
            </div>
            <p className="figure-card__text">{a.chiffragePhrase}</p>
          </div>
          <InlineCta />
        </section>

        {/* Observations spécifiques */}
        {a.observations.length > 0 && (
          <section className="section">
            <div className="section__label">Vos points d&apos;attention</div>
            <div className="obs">
              {a.observations.map((o, i) => (
                <div className="obs__item" key={i}>
                  <span className="obs__dot" aria-hidden="true" />
                  <span className="obs__text">{o}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* La méthode / 3 piliers + CTA */}
        <section className="section">
          <div className="section__label">Comment on récupère ces points</div>
          <p className="method__accroche">{a.methode.accroche}</p>
          <div className="pillars">
            {a.methode.piliers.map((p, i) => (
              <div className="pillar" key={i}>
                <div className="pillar__no">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="pillar__title">{p.titre}</div>
                  <div className="pillar__text">{p.texte}</div>
                </div>
              </div>
            ))}
          </div>
          <InlineCta />
        </section>

        {/* Bloc CTA final (climax) */}
        <div className="cta">
          <div className="cta__label">La suite</div>
          <h2 className="cta__title">Échangeons 30 minutes sur votre pilotage</h2>
          <p className="cta__text">
            Un échange stratégique pour transformer ce diagnostic en plan concret :
            où sont vos points de marge, combien vous pouvez en récupérer, et par où
            commencer.
          </p>
          <a
            className="btn btn--copper"
            href={appendCurrentParams(BOOKING_URL)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('BookingClick', {}, true)}
          >
            Réserver mon échange stratégique
            <Arrow />
          </a>
          <div className="cta-sub cta-sub--light">GRATUIT et SANS ENGAGEMENT</div>
          <div className="cta__reassure">
            <span aria-hidden="true">•</span>
            Nombre de dirigeants accompagnés simultanément limité.
          </div>
        </div>
      </div>

      <footer className="foot">
        Faites Parler Vos Chiffres · Intervenant cité dans Le Figaro
        <br />
        <a href="#">Mentions légales</a> · <a href="#">Politique de confidentialité</a>
      </footer>
    </div>
  );
}
