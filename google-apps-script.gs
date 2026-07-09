/**
 * =====================================================================
 * HORIZON FINANCE — Récepteur de leads du quiz (Google Apps Script)
 * ---------------------------------------------------------------------
 * Ce script transforme un Google Sheet en endpoint qui reçoit les leads
 * du quiz et ajoute une ligne par soumission.
 *
 * INSTALLATION (5 min) :
 *   1. Créez un Google Sheet vide.
 *   2. Menu Extensions > Apps Script.
 *   3. Collez TOUT ce fichier, remplacez le code par défaut.
 *   4. Cliquez sur "Déployer" > "Nouveau déploiement".
 *   5. Type : "Application Web".
 *      - Exécuter en tant que : Moi.
 *      - Qui a accès : "Tout le monde".
 *   6. Déployez, autorisez l'accès, COPIEZ l'URL /exec fournie.
 *   7. Collez cette URL dans la variable Vercel GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * À chaque nouveau déploiement (après modif), pensez à créer une
 * "nouvelle version" pour que l'URL reflète les changements.
 * =====================================================================
 */

// Onglet où écrire les leads (créé automatiquement s'il n'existe pas).
var SHEET_NAME = 'Leads';

// Ordre des colonnes (l'en-tête est créé automatiquement à la 1re exécution).
var HEADERS = [
  'Reçu le',
  'Prénom',
  'Email',
  'Téléphone',
  'Profil (axe dominant)',
  'Température',
  'Secteur',
  "Chiffre d'affaires",
  'Frein principal',
  'Marge nette connue',
  'État trésorerie',
  'Révision tarifs',
  'Décision repoussée',
  'Pilotage actuel',
  'Score rentabilité',
  'Score trésorerie',
  'Score visibilité',
  'Score pricing',
  'Score décision',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'Page',
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    var labels = data.labels || {};
    var scores = data.scores || {};
    var utm = data.utm || {};

    var row = [
      data.receivedAt || new Date().toISOString(),
      data.prenom || '',
      data.email || '',
      data.telephone || '',
      data.dominantAxis || '',
      data.temperature || '',
      labels.secteur || data.answers && data.answers.secteur || '',
      labels.ca || '',
      labels.frein || '',
      labels.marge_connue || '',
      labels.tresorerie_etat || '',
      labels.tarifs || '',
      labels.decision_repoussee || '',
      labels.pilotage || '',
      num_(scores.rentabilite),
      num_(scores.tresorerie),
      num_(scores.visibilite),
      num_(scores.pricing),
      num_(scores.decision),
      utm.utm_source || '',
      utm.utm_medium || '',
      utm.utm_campaign || '',
      utm.utm_content || '',
      utm.utm_term || '',
      data.page || '',
    ];

    sheet.appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Permet de vérifier rapidement que le déploiement répond (GET).
function doGet() {
  return json_({ ok: true, service: 'horizon-quiz-leads' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function num_(v) {
  return (typeof v === 'number') ? v : '';
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
