#!/usr/bin/env node
// =====================================================================
// Propagation de l'URL /exec vers Vercel (Production) + redeploiement
// ---------------------------------------------------------------------
// Enchaine :
//   1. recupere l'URL /exec (argument > env GOOGLE_SHEETS_WEBHOOK_URL >
//      fichier .webhook-url produit par deploy:apps-script)
//   2. la pousse dans GOOGLE_SHEETS_WEBHOOK_URL sur l'environnement
//      Production (remplace la valeur existante)
//   3. declenche vercel --prod et attend que le deploiement soit Ready
//
// Echoue bruyamment si Vercel n'est pas authentifie / le projet non lie /
// l'URL absente. Ne commite jamais de token.
//
// Prerequis (une seule fois, cote poste) :
//   npm i -g vercel && vercel login && vercel link
//   (ou export VERCEL_TOKEN=... pour un usage non interactif)
// =====================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_FILE = join(ROOT, '.webhook-url');
const ENV_KEY = 'GOOGLE_SHEETS_WEBHOOK_URL';
const TARGET = 'production';

function fail(msg) {
  console.error('\n[sync:webhook] ECHEC : ' + msg + '\n');
  process.exit(1);
}
function log(msg) {
  console.log('[sync:webhook] ' + msg);
}

// Ajoute --token si un VERCEL_TOKEN est fourni (usage non interactif).
function withToken(args) {
  return process.env.VERCEL_TOKEN ? args.concat(['--token', process.env.VERCEL_TOKEN]) : args;
}

function vercel(args, opts = {}) {
  return execFileSync('vercel', withToken(args), {
    cwd: ROOT,
    encoding: 'utf8',
    input: opts.input,
    stdio: opts.inherit ? 'inherit' : ['pipe', 'pipe', 'pipe'],
  });
}

// URL depuis argument, sinon env, sinon fichier .webhook-url.
function resolveUrl() {
  const fromArg = process.argv[2];
  if (fromArg) return fromArg.trim();
  if (process.env[ENV_KEY]) return process.env[ENV_KEY].trim();
  if (existsSync(URL_FILE)) return readFileSync(URL_FILE, 'utf8').trim();
  return null;
}

function assertVercelAuth() {
  try {
    const who = vercel(['whoami']);
    log('Vercel authentifie : ' + who.trim());
  } catch (e) {
    fail(
      'Vercel n est pas authentifie.\n' +
        '  Lance sur ton poste :  vercel login\n' +
        '  (ou export VERCEL_TOKEN=xxxx pour un usage non interactif)'
    );
  }
}

function assertLinked() {
  if (existsSync(join(ROOT, '.vercel', 'project.json'))) return;
  if (process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID) return;
  fail(
    'Projet Vercel non lie a ce dossier.\n' +
      '  Lance une fois :  vercel link\n' +
      '  (ou exporte VERCEL_ORG_ID et VERCEL_PROJECT_ID)'
  );
}

function main() {
  const url = resolveUrl();
  if (!url) {
    fail(
      'Aucune URL /exec.\n' +
        '  Passe-la en argument :  npm run sync:webhook -- "https://script.google.com/.../exec"\n' +
        '  ou lance d abord :       npm run deploy:apps-script'
    );
  }
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(url)) {
    log('Attention : l URL ne ressemble pas a une URL /exec Apps Script standard.');
    log('URL fournie : ' + url);
  }

  assertVercelAuth();
  assertLinked();

  // 1. Remplacement de la variable en Production (retrait puis ajout, car
  // vercel env n ecrase pas une valeur existante).
  log('Mise a jour de ' + ENV_KEY + ' (Production)...');
  try {
    vercel(['env', 'rm', ENV_KEY, TARGET, '--yes']);
    log('Ancienne valeur retiree.');
  } catch (e) {
    log('Pas de valeur existante a retirer (ou deja absente), on continue.');
  }
  try {
    vercel(['env', 'add', ENV_KEY, TARGET], { input: url + '\n' });
  } catch (e) {
    fail('Echec de l ajout de la variable. Sortie : ' + ((e.stdout || '') + (e.stderr || '')));
  }
  log('Variable ' + ENV_KEY + ' = ' + url + ' (Production).');

  // 2. Redeploiement en production (bloque jusqu a Ready).
  log('Redeploiement en production (attente Ready)...');
  try {
    vercel(['deploy', '--prod', '--yes'], { inherit: true });
  } catch (e) {
    fail('vercel --prod a echoue. Voir la sortie ci-dessus.');
  }

  log('Deploiement Production Ready. Variable webhook synchronisee.');
}

main();
