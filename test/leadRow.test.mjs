// =====================================================================
// Test de non regression sur la ligne lead (format 30 colonnes A:AD)
// ---------------------------------------------------------------------
// Verifie que buildLeadRow produit toujours 30 entrees, dans l'ordre
// exact de la spec, avec les colonnes reservees presentes et vides.
// Lancer avec : npm test  (ou : node --test)
// =====================================================================

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLeadRow, ensureRowLength, LEAD_ROW_LENGTH } from '../lib/leadRow.mjs';

// Un lead complet et realiste, tel que construit par le quiz.
function sampleRecord() {
  return {
    receivedAt: '2026-07-27T10:00:00.000Z',
    prenom: 'Marie',
    email: 'marie@exemple.fr',
    telephone: '0612345678',
    dominantAxis: 'rentabilite',
    temperature: 'Chaud',
    labels: {
      secteur: 'BTP / Construction',
      ca: '500K€ à 1M€',
      frein: 'Je fais du chiffre, mais il ne reste pas assez à la fin',
      marge_connue: 'À peu près, mais pas au point près',
      tresorerie_etat: "Ça passe, mais c'est tendu certains mois",
      tarifs: 'Il y a 1 à 2 ans',
      decision_repoussee: 'Oui, un recrutement',
      pilotage: 'J’ai un tableur que je tiens moi-même',
    },
    scores: {
      rentabilite: 4,
      tresorerie: 2,
      visibilite: 1,
      pricing: 1,
      decision: 2,
    },
    utm: {
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'diag-fin',
      utm_content: 'creative-a',
      utm_term: 'marge',
    },
    page: 'https://quiz.exemple.fr/?utm_source=facebook',
  };
}

test('la ligne fait toujours exactement 30 entrees', () => {
  assert.equal(LEAD_ROW_LENGTH, 30);
  assert.equal(buildLeadRow(sampleRecord()).length, 30);
  // Meme avec un record vide, la longueur reste 30.
  assert.equal(buildLeadRow({}).length, 30);
  assert.equal(buildLeadRow(undefined).length, 30);
});

test("l'ordre des colonnes correspond a la spec", () => {
  const r = sampleRecord();
  const row = buildLeadRow(r);

  assert.equal(row[0], r.receivedAt); // date
  assert.equal(row[1], ''); // reserve
  assert.equal(row[2], r.prenom);
  assert.equal(row[3], ''); // reserve
  assert.equal(row[4], r.email);
  assert.equal(row[5], r.telephone);
  assert.equal(row[6], ''); // reserve
  assert.equal(row[7], r.labels.secteur);
  assert.equal(row[8], r.labels.ca);
  assert.equal(row[9], r.labels.frein);
  assert.equal(row[10], r.dominantAxis); // profil
  assert.equal(row[11], r.temperature);
  assert.equal(row[12], r.labels.marge_connue);
  assert.equal(row[13], r.labels.tresorerie_etat);
  assert.equal(row[14], r.labels.tarifs);
  assert.equal(row[15], r.labels.decision_repoussee);
  assert.equal(row[16], r.labels.pilotage);
  assert.equal(row[17], r.scores.rentabilite);
  assert.equal(row[18], r.scores.tresorerie);
  assert.equal(row[19], r.scores.visibilite);
  assert.equal(row[20], r.scores.pricing);
  assert.equal(row[21], r.scores.decision);
  assert.equal(row[22], ''); // reserve
  assert.equal(row[23], r.utm.utm_source);
  assert.equal(row[24], r.utm.utm_medium);
  assert.equal(row[25], r.utm.utm_campaign);
  assert.equal(row[26], r.utm.utm_content);
  assert.equal(row[27], r.utm.utm_term);
  assert.equal(row[28], ''); // reserve
  assert.equal(row[29], r.page);
});

test('les colonnes reservees sont presentes et vides (jamais omises)', () => {
  const row = buildLeadRow(sampleRecord());
  for (const i of [1, 3, 6, 22, 28]) {
    assert.equal(row[i], '', `la colonne reservee ${i} doit etre une chaine vide`);
  }
});

test('les champs manquants deviennent des chaines vides, pas undefined', () => {
  const row = buildLeadRow({ prenom: 'Sol' });
  assert.equal(row.length, 30);
  assert.equal(row[2], 'Sol');
  // Aucune entree ne doit etre undefined / null.
  for (const v of row) {
    assert.ok(v !== undefined && v !== null, 'aucune entree ne doit etre undefined/null');
  }
});

test('ensureRowLength complete ou tronque a 30 et renvoie l ecart', () => {
  const court = ensureRowLength([1, 2, 3]);
  assert.equal(court.row.length, 30);
  assert.equal(court.delta, 3 - 30);

  const long = ensureRowLength(new Array(33).fill('x'));
  assert.equal(long.row.length, 30);
  assert.equal(long.delta, 33 - 30);

  const pile = ensureRowLength(new Array(30).fill('y'));
  assert.equal(pile.row.length, 30);
  assert.equal(pile.delta, 0);
});
