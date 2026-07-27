#!/usr/bin/env node
// =====================================================================
// Deploiement automatise du Web App Apps Script (via clasp)
// ---------------------------------------------------------------------
// Enchaine :
//   1. copie de la source unique google-apps-script.gs -> apps-script/Code.gs
//   2. (si besoin) creation d'un projet clasp lie au spreadsheet cible
//   3. clasp push -f
//   4. clasp deploy, puis extraction de l'URL /exec
//   5. ecriture de l'URL dans .webhook-url (ignore par git) + affichage
//
// Echoue BRUYAMMENT si clasp n'est pas authentifie ou si l'URL /exec
// n'est pas recuperable. Ne commite jamais d'identifiant.
//
// Prerequis (une seule fois, cote poste utilisateur) :
//   npm i -g @google/clasp && clasp login
// =====================================================================

import { execFileSync } from 'node:child_process';
import { existsSync, copyFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPREADSHEET_ID = '10t4yJeED8WuwOOr9woiXXb688Eq6LkYvxcUcBGEeAco';
const APPS_DIR = join(ROOT, 'apps-script');
const SRC = join(ROOT, 'google-apps-script.gs');
const DEST = join(APPS_DIR, 'Code.gs');
const CLASP_JSON = join(APPS_DIR, '.clasp.json');
const URL_FILE = join(ROOT, '.webhook-url');

function fail(msg) {
  console.error('\n[deploy:apps-script] ECHEC : ' + msg + '\n');
  process.exit(1);
}

function log(msg) {
  console.log('[deploy:apps-script] ' + msg);
}

// Execute clasp dans le dossier apps-script et renvoie la sortie texte.
function clasp(args, opts = {}) {
  return execFileSync('clasp', args, {
    cwd: APPS_DIR,
    encoding: 'utf8',
    stdio: opts.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
}

// Verifie que clasp est authentifie, sinon donne la commande exacte.
function assertClaspAuth() {
  try {
    const out = clasp(['show-authorized-user']);
    if (/not logged in|no authorized|aucun/i.test(out)) throw new Error(out);
    log('clasp authentifie : ' + out.trim().split('\n')[0]);
  } catch (e) {
    fail(
      'clasp n est pas authentifie.\n' +
        '  Lance sur ton poste :  clasp login\n' +
        '  (ou en headless :      clasp login --no-localhost )\n' +
        'Puis relance : npm run deploy:apps-script'
    );
  }
}

// Extrait le deploymentId d'une sortie clasp deploy (JSON ou texte).
function extractDeploymentId(output) {
  // Format JSON (--json) : on cherche un champ deploymentId.
  const jsonMatch = output.match(/"deploymentId"\s*:\s*"([^"]+)"/);
  if (jsonMatch) return jsonMatch[1];
  // Format texte : "- AKfycb... @1 - description"
  const textMatch = output.match(/\b(AKfyc[\w-]+)\b/);
  if (textMatch) return textMatch[1];
  return null;
}

function main() {
  if (!existsSync(SRC)) fail('Source introuvable : ' + SRC);
  if (!existsSync(APPS_DIR)) mkdirSync(APPS_DIR, { recursive: true });

  assertClaspAuth();

  // 1. Source unique -> Code.gs (on evite toute divergence de code).
  copyFileSync(SRC, DEST);
  log('Source copiee vers apps-script/Code.gs.');

  // 2. Creation du projet clasp lie au spreadsheet, si absent.
  if (!existsSync(CLASP_JSON)) {
    log('Aucun .clasp.json : creation d un projet lie au spreadsheet cible...');
    try {
      clasp(
        ['create-script', '--title', 'Horizon Quiz Leads', '--parentId', SPREADSHEET_ID],
        { inherit: true }
      );
    } catch (e) {
      fail(
        'Creation du projet clasp impossible. Verifie que ton compte Google a ' +
          'acces au fichier ' + SPREADSHEET_ID + '.\n' +
          'Alternative : clone un projet existant avec\n' +
          '  cd apps-script && clasp clone <scriptId>'
      );
    }
  } else {
    log('.clasp.json present : projet deja lie.');
  }

  // 3. Push du code + manifeste.
  log('Push du code vers Apps Script...');
  try {
    clasp(['push', '-f'], { inherit: true });
  } catch (e) {
    fail('clasp push a echoue. Voir la sortie ci-dessus.');
  }

  // 4. Deploiement + recuperation de l URL /exec.
  log('Deploiement du Web App...');
  let out = '';
  try {
    out = clasp(['deploy', '--description', 'ship:leads']);
    console.log(out);
  } catch (e) {
    // On tente quand meme de lire la sortie de l erreur.
    out = (e.stdout || '') + (e.stderr || '');
    console.log(out);
    if (!extractDeploymentId(out)) {
      fail('clasp deploy a echoue et aucun deploymentId trouve.');
    }
  }

  const deploymentId = extractDeploymentId(out);
  if (!deploymentId) {
    fail(
      'URL /exec non recuperable : aucun deploymentId dans la sortie clasp deploy.\n' +
        'Verifie le deploiement avec : cd apps-script && clasp deployments'
    );
  }

  const execUrl = 'https://script.google.com/macros/s/' + deploymentId + '/exec';
  writeFileSync(URL_FILE, execUrl + '\n', 'utf8');

  log('Deploiement OK.');
  log('URL /exec : ' + execUrl);
  log('URL ecrite dans .webhook-url (utilisee par npm run sync:webhook).');
}

main();
