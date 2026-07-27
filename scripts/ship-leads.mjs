#!/usr/bin/env node
// =====================================================================
// Chaine complete : deploie le Web App, propage vers Vercel, verifie
// ---------------------------------------------------------------------
// Enchaine, en s'arretant au PREMIER echec avec un message explicite :
//   1. deploy:apps-script  (clasp push + deploy, recupere l'URL /exec)
//   2. sync:webhook        (pousse l'URL dans Vercel + redeploie prod)
//   3. verify:leads        (GET + POST de controle sur le pipeline)
//
// Prerequis authentifies une seule fois : clasp login, vercel login+link.
// =====================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_FILE = join(ROOT, '.webhook-url');

function step(titre, cmd, args) {
  console.log('\n==================================================');
  console.log('[ship:leads] ETAPE : ' + titre);
  console.log('==================================================');
  try {
    execFileSync(cmd, args, { cwd: ROOT, stdio: 'inherit' });
  } catch (e) {
    console.error('\n[ship:leads] ARRET : l etape "' + titre + '" a echoue.');
    console.error('[ship:leads] Corrige la cause ci-dessus puis relance : npm run ship:leads');
    process.exit(1);
  }
}

// 1. Deploiement du Web App Apps Script.
step('Deploiement Apps Script', 'node', ['scripts/deploy-apps-script.mjs']);

// 2. Propagation vers Vercel Production.
step('Synchronisation Vercel', 'node', ['scripts/sync-webhook.mjs']);

// 3. Verification de bout en bout (avec l URL fraichement deployee).
if (!existsSync(URL_FILE)) {
  console.error('\n[ship:leads] ARRET : .webhook-url introuvable apres deploiement.');
  process.exit(1);
}
const url = readFileSync(URL_FILE, 'utf8').trim();
step('Verification pipeline', 'node', ['scripts/verify-leads-pipeline.mjs', url]);

console.log('\n[ship:leads] SUCCES : pipeline operationnel de bout en bout.');
