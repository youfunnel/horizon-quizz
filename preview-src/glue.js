/* =====================================================================
   GLUE D'AFFICHAGE (aperçu autonome)
   ---------------------------------------------------------------------
   Reproduit le comportement des composants React en JS vanilla, en
   réutilisant les MÊMES données, le MÊME scoring et les MÊMES audits
   (injectés depuis lib/) et le MÊME CSS. Aucune donnée n'est envoyée.
   ===================================================================== */
(function () {
  const root = document.getElementById('app');
  const body = document.body;

  const BOOKING_URL =
    'https://go.faites-parler-vos-chiffres.com/derniere-etape';

  const ARROW =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  function inlineCta() {
    return `
      <div class="cta-inline">
        <a class="btn btn--copper" href="${BOOKING_URL}" target="_blank" rel="noopener noreferrer">Réserver mon échange stratégique ${ARROW}</a>
        <div class="cta-sub">GRATUIT et SANS ENGAGEMENT</div>
      </div>`;
  }

  let state = { step: 0, answers: {}, lead: { prenom: '', email: '', tel: '' }, gateTouched: false };
  let advTimer = null;
  let loadTimers = [];

  function clearLoad() {
    loadTimers.forEach(clearTimeout);
    loadTimers = [];
  }

  function questionNumber() {
    return FLOW.slice(0, state.step + 1).filter((s) => s.kind === 'question').length;
  }

  function go(delta) {
    clearTimeout(advTimer);
    clearLoad();
    state.step = Math.max(0, Math.min(state.step + delta, FLOW.length - 1));
    state.gateTouched = false;
    window.scrollTo({ top: 0 });
    render();
  }

  function reset() {
    clearTimeout(advTimer);
    clearLoad();
    state = { step: 0, answers: {}, lead: { prenom: '', email: '', tel: '' }, gateTouched: false };
    window.scrollTo({ top: 0 });
    render();
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function validPhone(v) {
    const digits = (String(v).match(/\d/g) || []).length;
    return digits >= 9 && digits <= 15;
  }

  // ----------------------------- vues -----------------------------
  function welcomeHTML() {
    return `
      <div class="welcome">
        <p class="eyebrow welcome__eyebrow">Le copilote financier des dirigeants de PME</p>
        <h1 class="welcome__title">Découvrez comment récupérer les <em>fuites de marge cachées</em> dans votre chiffre d'affaires</h1>
        <p class="welcome__sub">
          Identifiez en quelques minutes les points de marge qui vous échappent.
        </p>
        <div class="welcome__cta">
          <button class="btn btn--copper" type="button" data-act="start">
            Commencer ${ARROW}
          </button>
          <div class="meta-line">
            <span>2 min</span><span class="dot"></span>
            <span>8 questions</span><span class="dot"></span>
            <span>Réservé aux +500K€</span><span class="dot"></span>
            <span>Résultat immédiat</span>
          </div>
          <div class="figaro">Vu dans <strong>Le Figaro</strong></div>
        </div>
      </div>`;
  }

  function questionHTML(q) {
    const opts = q.options
      .map((opt) => {
        const sel = state.answers[q.id] === opt.id ? ' option--selected' : '';
        return `
          <button type="button" class="option${sel}" data-qid="${q.id}" data-oid="${opt.id}">
            ${opt.emoji ? `<span class="option__emoji" aria-hidden="true">${opt.emoji}</span>` : ''}
            <span class="option__label">${opt.label}</span>
            <span class="option__tick" aria-hidden="true"></span>
          </button>`;
      })
      .join('');
    const help = q.help ? `<p class="q-help">${q.help}</p>` : '';
    const back =
      state.step > 1
        ? `<div style="margin-top:22px"><button class="btn-ghost" type="button" data-act="back"><span aria-hidden="true">&larr;</span> Retour</button></div>`
        : '';
    return `
      <div>
        <div class="eyebrow">${q.eyebrow}</div>
        <h2 class="q-title">${q.title}</h2>
        ${help}
        <div class="options" role="list">${opts}</div>
        ${back}
      </div>`;
  }

  function gateHTML() {
    const t = state.gateTouched;
    const prenomOk = state.lead.prenom.trim().length >= 2;
    const emailOk = validEmail(state.lead.email.trim());
    const telOk = validPhone(state.lead.tel);
    const errP = t && !prenomOk ? `<div class="field__error">Indiquez votre prénom.</div>` : '';
    const errE = t && !emailOk ? `<div class="field__error">Indiquez un email valide.</div>` : '';
    const errT = t && !telOk ? `<div class="field__error">Indiquez un numéro de téléphone valide.</div>` : '';
    return `
      <div class="gate">
        <div class="eyebrow">Dernière étape</div>
        <h2 class="gate__title">Votre diagnostic personnalisé est prêt.</h2>
        <p class="gate__sub">Renseignez vos coordonnées pour accéder à votre diagnostic complet. Résultat immédiat, affiché à l'écran.</p>
        <div class="form">
          <div class="field">
            <label for="prenom">Votre prénom</label>
            <input id="prenom" type="text" autocomplete="given-name" placeholder="Prénom" value="${state.lead.prenom.replace(/"/g, '&quot;')}" />
            ${errP}
          </div>
          <div class="field">
            <label for="email">Votre email professionnel</label>
            <input id="email" type="email" inputmode="email" autocomplete="email" placeholder="vous@votre-entreprise.fr" value="${state.lead.email.replace(/"/g, '&quot;')}" />
            ${errE}
          </div>
          <div class="field">
            <label for="tel">Votre téléphone</label>
            <input id="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 12 34 56 78" value="${state.lead.tel.replace(/"/g, '&quot;')}" />
            ${errT}
          </div>
          <button class="btn btn--copper btn--block" type="button" data-act="submit">
            Découvrir mon diagnostic <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </button>
        </div>
        <div class="gate__privacy">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2" fill="currentColor"></rect>
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"></path>
          </svg>
          Vos réponses restent confidentielles. Aucun spam.
        </div>
      </div>`;
  }

  function loadingHTML() {
    const secteur = SECTEURS[state.answers.secteur] || 'votre activité';
    const ca = (CA_BANDS[state.answers.ca] && CA_BANDS[state.answers.ca].label) || 'votre tranche de CA';
    const steps = [
      `Lecture de votre profil ${secteur}`,
      'Identification de votre fuite de marge principale',
      `Comparaison avec les dirigeants à ${ca}`,
      'Génération de votre plan personnalisé',
    ];
    const items = steps
      .map(
        (label) => `
        <div class="steps__item">
          <span class="steps__check">
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6.5 L4.5 10 L11 2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
          </span>
          <span>${label}</span>
        </div>`
      )
      .join('');
    return `
      <div class="loading">
        <div class="scanner">
          <svg viewBox="0 0 100 100">
            <circle class="scanner__track" cx="50" cy="50" r="40"></circle>
            <circle class="scanner__arc" cx="50" cy="50" r="40"></circle>
          </svg>
        </div>
        <h2 class="loading__title">Analyse de vos réponses</h2>
        <p class="loading__sub">Nous construisons votre diagnostic personnalisé.</p>
        <div class="steps">${items}</div>
      </div>`;
  }

  function scissorHTML() {
    return `
      <div class="scissor">
        <svg viewBox="0 0 600 300" role="img" aria-label="Le chiffre d'affaires progresse pendant que la marge stagne : l'effet ciseau.">
          <polygon class="gap-fill" points="40,215 175,175 310,140 445,100 560,65 560,240 445,236 310,232 175,228 40,222"></polygon>
          <polyline class="path-ca" points="40,215 175,175 310,140 445,100 560,65"></polyline>
          <polyline class="path-marge" points="40,222 175,228 310,232 445,236 560,240"></polyline>
          <text x="556" y="52" text-anchor="end" font-size="18" font-weight="700" fill="#13204D" font-family="'Open Sans', sans-serif">CA</text>
          <text x="556" y="262" text-anchor="end" font-size="18" font-weight="700" fill="#ec3e2d" font-family="'Open Sans', sans-serif">Marge</text>
        </svg>
        <div class="scissor__legend">
          <span class="scissor__key"><span class="scissor__swatch" style="background:#13204D"></span>Chiffre d'affaires</span>
          <span class="scissor__key"><span class="scissor__swatch" style="background:#ec3e2d"></span>Marge</span>
        </div>
      </div>`;
  }

  function auditHTML() {
    const scores = computeScores(state.answers);
    const dominant = dominantAxis(scores, state.answers);
    const a = buildAudit(state.answers, dominant);

    const obs =
      a.observations.length > 0
        ? `<section class="section">
             <div class="section__label">Vos points d'attention</div>
             <div class="obs">${a.observations
               .map(
                 (o) =>
                   `<div class="obs__item"><span class="obs__dot" aria-hidden="true"></span><span class="obs__text">${o}</span></div>`
               )
               .join('')}</div>
           </section>`
        : '';

    const piliers = a.methode.piliers
      .map(
        (p, i) => `
        <div class="pillar">
          <div class="pillar__no">${String(i + 1).padStart(2, '0')}</div>
          <div>
            <div class="pillar__title">${p.titre}</div>
            <div class="pillar__text">${p.texte}</div>
          </div>
        </div>`
      )
      .join('');

    return `
      <div class="audit">
        <header class="audit__head">
          <div class="audit__head-inner step-in">
            <div class="audit__meta">
              <span>DIAGNOSTIC PERSONNALISÉ</span><span>·</span><span>${a.secteurLabel}</span><span>·</span><span>${a.caLabel}</span>
            </div>
            <div class="eyebrow" style="color:var(--red);margin-bottom:10px">Votre profil</div>
            <h1 class="audit__profil">${a.profil}</h1>
            <p class="audit__tagline">${a.tagline}</p>
          </div>
        </header>
        <div class="audit__body">
          <section class="section">
            <div class="section__label">Le constat</div>
            <p class="prose">${a.constat}</p>
            <p class="prose">${a.secteurTouch}</p>
          </section>
          <section class="section">
            <div class="section__label">Ce qui se passe vraiment</div>
            <p class="prose">${a.mecanisme}</p>
            ${scissorHTML()}
          </section>
          <section class="section">
            <div class="section__label">Ce que ça représente</div>
            <div class="figure-card">
              <div><span class="figure-card__num">${a.chiffrageMontant}</span><span class="figure-card__unit">/ an</span></div>
              <p class="figure-card__text">${a.chiffragePhrase}</p>
            </div>
            ${inlineCta()}
          </section>
          ${obs}
          <section class="section">
            <div class="section__label">Comment on récupère ces points</div>
            <p class="method__accroche">${a.methode.accroche}</p>
            <div class="pillars">${piliers}</div>
            ${inlineCta()}
          </section>
          <div class="cta">
            <div class="cta__label">La suite</div>
            <h2 class="cta__title">Échangeons 30 minutes sur votre pilotage</h2>
            <p class="cta__text">Un échange stratégique pour transformer ce diagnostic en plan concret : où sont vos points de marge, combien vous pouvez en récupérer, et par où commencer.</p>
            <a class="btn btn--copper" href="${BOOKING_URL}" target="_blank" rel="noopener noreferrer">Réserver mon échange stratégique ${ARROW}</a>
            <div class="cta-sub cta-sub--light">GRATUIT et SANS ENGAGEMENT</div>
            <div class="cta__reassure"><span aria-hidden="true">•</span> Nombre de dirigeants accompagnés simultanément limité.</div>
          </div>
        </div>
        <footer class="foot">
          Faites Parler Vos Chiffres · Intervenant cité dans Le Figaro<br />
          <a href="#">Mentions légales</a> · <a href="#">Politique de confidentialité</a>
        </footer>
      </div>`;
  }

  // --------------------------- rendu ------------------------------
  function render() {
    const step = FLOW[state.step];
    const dark = step.kind === 'welcome' || step.kind === 'loading';

    if (step.kind === 'audit') {
      root.className = 'app';
      body.style.background = 'var(--paper)';
      root.innerHTML = auditHTML();
      return;
    }

    root.className = 'app' + (dark ? ' app--dark' : '');
    body.style.background = dark ? 'var(--navy)' : 'var(--paper)';

    let inner = '';
    if (step.kind === 'welcome') inner = welcomeHTML();
    else if (step.kind === 'question') inner = questionHTML(QUESTIONS[step.q]);
    else if (step.kind === 'gate') inner = gateHTML();
    else if (step.kind === 'loading') inner = loadingHTML();

    const progress =
      step.kind === 'question'
        ? `<div class="progress">
             <div class="progress__row">
               <span class="progress__brand">Faites Parler Vos Chiffres</span>
               <span class="progress__count">Question ${questionNumber()} / ${TOTAL_QUESTIONS}</span>
             </div>
             <div class="progress__track">
               <div class="progress__fill" style="width:${(questionNumber() / TOTAL_QUESTIONS) * 100}%"></div>
             </div>
           </div>`
        : '';

    root.innerHTML = `${progress}<div class="stage"><div class="panel"><div class="step-in">${inner}</div></div></div>`;
    wire(step);
  }

  function wire(step) {
    if (step.kind === 'welcome') {
      root.querySelector('[data-act="start"]').addEventListener('click', () => go(1));
    } else if (step.kind === 'question') {
      root.querySelectorAll('.option').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qid = btn.getAttribute('data-qid');
          const oid = btn.getAttribute('data-oid');
          state.answers[qid] = oid;
          root.querySelectorAll('.option').forEach((o) => o.classList.remove('option--selected'));
          btn.classList.add('option--selected');
          clearTimeout(advTimer);
          advTimer = setTimeout(() => go(1), 220);
        });
      });
      const back = root.querySelector('[data-act="back"]');
      if (back) back.addEventListener('click', () => go(-1));
    } else if (step.kind === 'gate') {
      const p = root.querySelector('#prenom');
      const e = root.querySelector('#email');
      const tel = root.querySelector('#tel');
      p.addEventListener('input', () => { state.lead.prenom = p.value; });
      e.addEventListener('input', () => { state.lead.email = e.value; });
      tel.addEventListener('input', () => { state.lead.tel = tel.value; });
      const submit = () => {
        state.lead.prenom = p.value;
        state.lead.email = e.value;
        state.lead.tel = tel.value;
        const ok = p.value.trim().length >= 2 && validEmail(e.value.trim()) && validPhone(tel.value);
        if (ok) { go(1); } else { state.gateTouched = true; render(); }
      };
      root.querySelector('[data-act="submit"]').addEventListener('click', submit);
      [p, e, tel].forEach((inp) =>
        inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') submit(); })
      );
    } else if (step.kind === 'loading') {
      const items = root.querySelectorAll('.steps__item');
      const BASE = 550;
      const STEP = 650;
      items.forEach((el, i) => {
        loadTimers.push(setTimeout(() => el.classList.add('steps__item--active'), BASE + i * STEP));
      });
      loadTimers.push(setTimeout(() => go(1), BASE + items.length * STEP + 350));
    }
  }

  const resetBtn = document.getElementById('pv-reset');
  if (resetBtn) resetBtn.addEventListener('click', reset);

  render();
})();
