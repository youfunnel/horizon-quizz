// Génère un aperçu autonome (1 seul fichier HTML) à partir des fichiers
// réels du projet : CSS verbatim + données/scoring/audits verbatim (on
// retire seulement import/export) + glue d'affichage en JS vanilla.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// Retire les lignes `import ...` et transforme `export const/function` en
// déclarations simples, pour exécuter le code des modules dans une portée unique.
function strip(src) {
  return src
    .replace(/^\s*import[^\n]*\n/gm, '')
    .replace(/^\s*export\s+/gm, '');
}

const css = read('app/globals.css');
const libData = strip(read('lib/quizData.js'));
const libScoring = strip(read('lib/scoring.js'));
const libAudits = strip(read('lib/audits.js'));
const glue = read('preview-src/glue.js');

const previewCss = `
/* --- habillage aperçu (hors application) --- */
.pv-badge{position:fixed;left:12px;bottom:12px;z-index:60;font:600 11px/1 'Open Sans',system-ui,sans-serif;letter-spacing:.04em;color:#fff;background:rgba(19,32,77,.82);border:1px solid rgba(255,255,255,.2);padding:7px 12px;border-radius:999px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.pv-reset{position:fixed;right:12px;bottom:12px;z-index:60;font:600 12px/1 'Open Sans',system-ui,sans-serif;color:#13204D;background:#fff;border:1px solid rgba(19,32,77,.18);padding:9px 14px;border-radius:999px;box-shadow:0 6px 18px -8px rgba(19,32,77,.5);cursor:pointer}
.pv-reset:hover{background:#F4F5F7}
@media (max-width:520px){.pv-badge{display:none}}
`;

const parts = [
  '<!doctype html>\n',
  '<html lang="fr">\n<head>\n',
  '<meta charset="utf-8" />\n',
  '<meta name="viewport" content="width=device-width, initial-scale=1" />\n',
  '<title>Aperçu - Diagnostic financier | Horizon Finance</title>\n',
  '<link rel="preconnect" href="https://fonts.googleapis.com" />\n',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n',
  '<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />\n',
  '<style>\n',
  css,
  '\n',
  previewCss,
  '\n</style>\n</head>\n<body>\n',
  '<div id="app" class="app"></div>\n',
  '<div class="pv-badge">Aperçu · aucune donnée n\u2019est envoyée</div>\n',
  '<button class="pv-reset" id="pv-reset" type="button">\u21bb Recommencer</button>\n',
  '<script>\n',
  libData,
  '\n',
  libScoring,
  '\n',
  libAudits,
  '\n',
  glue,
  '\n</script>\n</body>\n</html>\n',
];

const out = parts.join('');
const outPath = path.join(ROOT, 'horizon-finance-quiz-preview.html');
fs.writeFileSync(outPath, out, 'utf8');
console.log('OK ->', outPath, '(' + out.length + ' octets)');
