#!/usr/bin/env node
// =====================================================================
// Verification autonome du pipeline de leads (webhook Apps Script)
// ---------------------------------------------------------------------
// A partir de GOOGLE_SHEETS_WEBHOOK_URL :
//   1. GET sur l'URL /exec  -> attend {"ok":true,"service":"horizon-quiz-leads"}
//   2. POST d'un lead de test marque VERIF-<timestamp>, au format 30 valeurs
//   3. Diagnostic clair selon la reponse (login Google, 302, 401, 403,
//      timeout, JSON ok:false, ou succes)
//   4. Affiche les 30 valeurs envoyees (index + nom de colonne attendu)
//
// Sortie : code 0 si tout est bon, 1 sinon.
//
// Usage :
//   GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/.../exec" \
//     npm run verify:leads
// ou :
//   node scripts/verify-leads-pipeline.mjs "https://script.google.com/.../exec"
// =====================================================================

import { buildLeadRow, ensureRowLength, LEAD_ROW_LENGTH } from '../lib/leadRow.mjs';

// Noms de colonnes attendus, alignes sur lib/leadRow.mjs et sur les HEADERS
// du google-apps-script.gs. Sert au controle d'alignement visuel.
const COLONNES = [
  'A  Date',
  'B  Reserve',
  'C  Prenom',
  'D  Reserve',
  'E  Email',
  'F  Telephone',
  'G  Reserve',
  'H  Secteur',
  "I  Chiffre d'affaires",
  'J  Frein principal',
  'K  Profil (axe dominant)',
  'L  Temperature',
  'M  Marge nette connue',
  'N  Etat tresorerie',
  'O  Revision tarifs',
  'P  Decision repoussee',
  'Q  Pilotage actuel',
  'R  Score rentabilite',
  'S  Score tresorerie',
  'T  Score visibilite',
  'U  Score pricing',
  'V  Score decision',
  'W  Reserve',
  'X  utm_source',
  'Y  utm_medium',
  'Z  utm_campaign',
  'AA utm_content',
  'AB utm_term',
  'AC Reserve',
  'AD Page',
];

const TIMEOUT_MS = 10000;

function log(msg) {
  process.stdout.write(msg + '\n');
}

// Construit un lead de test complet et reconnaissable dans le Sheet.
function buildTestRecord(marqueur) {
  return {
    receivedAt: new Date().toISOString(),
    prenom: marqueur,
    email: marqueur.toLowerCase() + '@verif.horizon',
    telephone: '0600000000',
    dominantAxis: 'rentabilite',
    temperature: 'VERIF',
    labels: {
      secteur: 'BTP / Construction',
      ca: '500K a 1M',
      frein: 'Test de verification pipeline',
      marge_connue: 'A peu pres',
      tresorerie_etat: 'Tendu certains mois',
      tarifs: '1 a 2 ans',
      decision_repoussee: 'Un recrutement',
      pilotage: 'Un tableur',
    },
    scores: { rentabilite: 4, tresorerie: 2, visibilite: 1, pricing: 1, decision: 2 },
    utm: {
      utm_source: 'verif',
      utm_medium: 'script',
      utm_campaign: 'pipeline-check',
      utm_content: marqueur,
      utm_term: 'leads',
    },
    page: 'https://verif.horizon/pipeline-check',
  };
}

// Affiche les 30 valeurs envoyees, index par index, avec la colonne attendue.
function afficherAlignement(row) {
  log('');
  log('Controle d alignement (30 valeurs envoyees) :');
  log('  idx | colonne attendue         | valeur envoyee');
  log('  ----+--------------------------+---------------------------------');
  row.forEach((val, i) => {
    const idx = String(i).padStart(3, ' ');
    const col = (COLONNES[i] || '???').padEnd(24, ' ');
    const affichee = val === '' ? '(vide)' : String(val);
    log('  ' + idx + ' | ' + col + ' | ' + affichee);
  });
  log('');
}

// fetch borne dans le temps, pour distinguer un timeout d'une autre erreur.
async function fetchTimeout(url, options) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

// Interprete un corps de reponse et renvoie un diagnostic lisible.
function diagnostiquerCorps(status, text) {
  const extrait = text.slice(0, 200).replace(/\s+/g, ' ').trim();

  if (/<html|<!doctype|accounts\.google\.com|sign in|connexion/i.test(text)) {
    return {
      ok: false,
      diag:
        'La reponse est une page HTML de connexion Google. Le Web App n est ' +
        'pas accessible publiquement. Corrige : Deployer > acces "Tout le ' +
        'monde", puis nouvelle version, et recopie l URL /exec.',
      extrait,
    };
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch (e) {
    return {
      ok: false,
      diag:
        'Reponse ' + status + ' non JSON et non HTML de login. Verifie l URL ' +
        '/exec et le deploiement du script.',
      extrait,
    };
  }

  return { ok: body && body.ok === true, body, extrait };
}

// Traduit une erreur reseau / statut en message actionnable.
function diagnostiquerErreur(err) {
  const nom = err && err.name;
  if (nom === 'TimeoutError' || nom === 'AbortError') {
    return (
      'Timeout apres ' + TIMEOUT_MS + ' ms. Le Web App ne repond pas a temps ' +
      '(cold start, boucle, ou mauvaise URL). Reessaie, puis verifie le ' +
      'deploiement Apps Script.'
    );
  }
  return 'Erreur reseau : ' + (err && err.message ? err.message : String(err));
}

async function main() {
  const webhook = process.argv[2] || process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhook) {
    log('ECHEC : aucune URL de webhook.');
    log('Passe GOOGLE_SHEETS_WEBHOOK_URL en variable d env, ou en argument :');
    log('  node scripts/verify-leads-pipeline.mjs "https://script.google.com/.../exec"');
    return 1;
  }

  log('Pipeline leads : verification du webhook');
  log('URL : ' + webhook);
  log('');

  // -------------------------------------------------------------------
  // Etape 1 : GET (sonde de vie du deploiement)
  // -------------------------------------------------------------------
  log('1) GET ' + webhook);
  let getOk = false;
  try {
    const res = await fetchTimeout(webhook, { method: 'GET', redirect: 'follow' });
    const text = await res.text();
    const d = diagnostiquerCorps(res.status, text);
    if (d.ok && d.body && d.body.service === 'horizon-quiz-leads') {
      log('   OK : ' + JSON.stringify(d.body));
      getOk = true;
    } else if (d.ok) {
      log('   REPONSE JSON ok mais service inattendu : ' + JSON.stringify(d.body));
      log('   Diagnostic : le script repond mais n est pas celui du quiz. Verifie l URL.');
    } else {
      log('   ECHEC (statut ' + res.status + ').');
      log('   Diagnostic : ' + d.diag);
      log('   Extrait : ' + d.extrait);
    }
  } catch (err) {
    log('   ECHEC : ' + diagnostiquerErreur(err));
  }

  // -------------------------------------------------------------------
  // Etape 2 : POST d'un lead de test au format 30 valeurs
  // -------------------------------------------------------------------
  const marqueur = 'VERIF-' + Date.now();
  const record = buildTestRecord(marqueur);
  const { row, delta } = ensureRowLength(buildLeadRow(record), LEAD_ROW_LENGTH);

  log('');
  log('2) POST lead de test : ' + marqueur);
  log('   Longueur de la ligne : ' + row.length + ' (attendu ' + LEAD_ROW_LENGTH + ', ecart ' + delta + ')');

  // Controle d'alignement (tache 5) : toujours affiche, avant l'envoi.
  afficherAlignement(row);

  if (row.length !== LEAD_ROW_LENGTH) {
    log('ECHEC : la ligne ne fait pas ' + LEAD_ROW_LENGTH + ' valeurs. Anomalie de code, on n envoie pas.');
    return 1;
  }

  let postOk = false;
  try {
    const res = await fetchTimeout(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ row, record }),
      redirect: 'follow',
    });
    const text = await res.text();
    const d = diagnostiquerCorps(res.status, text);
    if (d.ok) {
      log('   OK : lead ecrit. Reponse : ' + JSON.stringify(d.body));
      log('   Verifie la derniere ligne de l onglet Leads : prenom = ' + marqueur);
      postOk = true;
    } else {
      log('   ECHEC (statut ' + res.status + ').');
      log('   Diagnostic : ' + d.diag);
      log('   Extrait : ' + d.extrait);
    }
  } catch (err) {
    log('   ECHEC : ' + diagnostiquerErreur(err));
  }

  // -------------------------------------------------------------------
  // Verdict
  // -------------------------------------------------------------------
  log('');
  log('Verdict : GET ' + (getOk ? 'OK' : 'KO') + ' | POST ' + (postOk ? 'OK' : 'KO'));
  if (getOk && postOk) {
    log('Pipeline operationnel. Un lead de test doit apparaitre dans l onglet Leads.');
    return 0;
  }
  log('Pipeline NON operationnel. Corrige selon les diagnostics ci-dessus.');
  return 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    log('Erreur inattendue : ' + (err && err.stack ? err.stack : String(err)));
    process.exit(1);
  });
