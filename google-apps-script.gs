/**
 * =====================================================================
 * HORIZON FINANCE - Recepteur de leads du quiz (Google Apps Script)
 * ---------------------------------------------------------------------
 * Ce script transforme un Google Sheet en endpoint qui recoit les leads
 * du quiz et ajoute une ligne par soumission, au format 30 colonnes
 * (plage A:AD).
 *
 * INSTALLATION (5 min) :
 *   1. Ouvrez le Google Sheet cible (voir SPREADSHEET_ID ci-dessous).
 *   2. Menu Extensions > Apps Script.
 *   3. Collez TOUT ce fichier, remplacez le code par defaut.
 *   4. Cliquez sur "Deployer" > "Nouveau deploiement".
 *   5. Type : "Application Web".
 *      - Executer en tant que : Moi.
 *      - Qui a acces : "Tout le monde".
 *   6. Deployez, autorisez l'acces (le script doit pouvoir ecrire dans
 *      le fichier cible), COPIEZ l'URL /exec fournie.
 *   7. Collez cette URL dans la variable Vercel GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * A chaque nouveau deploiement (apres modif), pensez a creer une
 * "nouvelle version" pour que l'URL reflete les changements.
 * =====================================================================
 */

// Fichier cible (le script ecrit dans CE fichier, par son ID, quel que
// soit le fichier auquel le script est rattache).
var SPREADSHEET_ID = '10t4yJeED8WuwOOr9woiXXb688Eq6LkYvxcUcBGEeAco';

// Onglet ou ecrire les leads. IMPORTANT : on cible par NOM. Si cet onglet
// est introuvable, on s'arrete proprement (on n'ecrit JAMAIS ailleurs).
var SHEET_NAME = 'Leads';

// gid attendu de l'onglet Leads (fourni par le client). Sert uniquement de
// repere de diagnostic dans les logs, la cible reste le NOM ci-dessus.
var EXPECTED_GID = 1530684739;

// Nombre exact de colonnes attendu (plage A:AD).
var EXPECTED_COLS = 30;

// En-tetes (crees uniquement si l'onglet est vide, pour ne pas ecraser
// un en-tete deja pose par le client). Les colonnes reservees restent
// presentes mais vides cote donnees ; renommez librement ces libelles.
var HEADERS = [
  'Date',            // A  0
  'Reserve B',       // B  1
  'Prenom',          // C  2
  'Reserve D',       // D  3
  'Email',           // E  4
  'Telephone',       // F  5
  'Reserve G',       // G  6
  'Secteur',         // H  7
  "Chiffre d'affaires", // I 8
  'Frein principal', // J  9
  'Profil (axe dominant)', // K 10
  'Temperature',     // L  11
  'Marge nette connue', // M 12
  'Etat tresorerie', // N  13
  'Revision tarifs', // O  14
  'Decision repoussee', // P 15
  'Pilotage actuel', // Q  16
  'Score rentabilite', // R 17
  'Score tresorerie', // S 18
  'Score visibilite', // T 19
  'Score pricing',   // U  20
  'Score decision',  // V  21
  'Reserve W',       // W  22
  'utm_source',      // X  23
  'utm_medium',      // Y  24
  'utm_campaign',    // Z  25
  'utm_content',     // AA 26
  'utm_term',        // AB 27
  'Reserve AC',      // AC 28
  'Page',            // AD 29
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Le front (ou la route API) envoie normalement { row: [...30 valeurs] }.
    // Retrocompatibilite : si un ancien client envoie l'objet structure,
    // on reconstruit la ligne ici plutot que d'echouer.
    var row = data.row;
    if (!isArray_(row)) {
      row = buildRowFromLegacy_(data);
    }

    // Controle de longueur : on complete par des vides ou on tronque a 30,
    // et on logge l'ecart au lieu d'echouer silencieusement.
    row = ensureLength_(row, EXPECTED_COLS);

    var sheet = getSheet_();
    sheet.appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Permet de verifier rapidement que le deploiement repond (GET).
function doGet() {
  return json_({ ok: true, service: 'horizon-quiz-leads' });
}

// Garantit un tableau de `expected` entrees. Logge tout ecart.
function ensureLength_(row, expected) {
  if (!isArray_(row)) row = [];
  if (row.length !== expected) {
    Logger.log(
      'Ligne lead de longueur inattendue : ' + row.length + ' au lieu de ' +
        expected + '. Normalisation appliquee.'
    );
  }
  var out = row.slice(0, expected);
  while (out.length < expected) out.push('');
  return out;
}

// Reconstruit la ligne 30 colonnes depuis l'ancien objet structure.
// Meme ordre exact que lib/leadRow.mjs cote application.
function buildRowFromLegacy_(data) {
  var labels = data.labels || {};
  var scores = data.scores || {};
  var utm = data.utm || {};

  return [
    data.receivedAt || new Date().toISOString(), // 0  date
    '',                                           // 1  reserve
    data.prenom || '',                            // 2  prenom
    '',                                           // 3  reserve
    data.email || '',                             // 4  email
    data.telephone || '',                         // 5  telephone
    '',                                           // 6  reserve
    labels.secteur || (data.answers && data.answers.secteur) || '', // 7 secteur
    labels.ca || '',                              // 8  chiffre d'affaires
    labels.frein || '',                           // 9  frein
    data.dominantAxis || '',                      // 10 profil
    data.temperature || '',                       // 11 temperature
    labels.marge_connue || '',                    // 12 marge nette
    labels.tresorerie_etat || '',                 // 13 etat tresorerie
    labels.tarifs || '',                          // 14 revision tarifs
    labels.decision_repoussee || '',              // 15 decision repoussee
    labels.pilotage || '',                        // 16 pilotage
    num_(scores.rentabilite),                     // 17 score rentabilite
    num_(scores.tresorerie),                      // 18 score tresorerie
    num_(scores.visibilite),                      // 19 score visibilite
    num_(scores.pricing),                         // 20 score pricing
    num_(scores.decision),                        // 21 score decision
    '',                                           // 22 reserve
    utm.utm_source || '',                         // 23 utm_source
    utm.utm_medium || '',                         // 24 utm_medium
    utm.utm_campaign || '',                       // 25 utm_campaign
    utm.utm_content || '',                        // 26 utm_content
    utm.utm_term || '',                           // 27 utm_term
    '',                                           // 28 reserve
    data.page || '',                              // 29 page
  ];
}

function getSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  // Verification au demarrage : si l'onglet cible est introuvable, on logge
  // la liste des onglets existants avec leur gid et on s'arrete proprement,
  // plutot que de creer un onglet fantome ou d'ecrire au mauvais endroit.
  if (!sheet) {
    var existants = ss.getSheets().map(function (s) {
      return '"' + s.getName() + '" (gid=' + s.getSheetId() + ')';
    });
    var msg =
      'Onglet "' + SHEET_NAME + '" introuvable dans le fichier ' +
      SPREADSHEET_ID + ' (gid attendu ' + EXPECTED_GID + '). ' +
      'Onglets presents : ' + existants.join(', ') + '. ' +
      'Aucune ecriture effectuee.';
    Logger.log(msg);
    throw new Error(msg);
  }

  // Repere de diagnostic : on signale si le gid ne correspond pas a l'attendu
  // (l'onglet a peut-etre ete recree). On ecrit quand meme, la cible est le nom.
  if (sheet.getSheetId() !== EXPECTED_GID) {
    Logger.log(
      'Attention : onglet "' + SHEET_NAME + '" trouve avec gid ' +
        sheet.getSheetId() + ' au lieu de ' + EXPECTED_GID + '.'
    );
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isArray_(v) {
  return Object.prototype.toString.call(v) === '[object Array]';
}

function num_(v) {
  return (typeof v === 'number') ? v : '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
