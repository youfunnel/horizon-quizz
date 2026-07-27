// =====================================================================
// API /api/submit : reception d'un lead + ecriture Google Sheets
// ---------------------------------------------------------------------
// Le front envoie ici toutes les reponses + email + scoring + UTM.
// On relaie vers le Web App Google Apps Script (GOOGLE_SHEETS_WEBHOOK_URL)
// qui ajoute une ligne au Google Sheet (format tableau de 30 colonnes,
// plage A:AD).
//
// Principe UX : on ne bloque jamais l'affichage de l'audit cote front.
// MAIS on ne ment plus sur le resultat : si la persistance echoue, on
// renvoie une vraie erreur (502) et on ecrit le lead complet dans les
// logs (canal de secours JSON) pour qu'aucun lead ne soit perdu en
// silence. Un webhook de secours optionnel peut aussi etre configure.
// =====================================================================

import { buildLeadRow, ensureRowLength, LEAD_ROW_LENGTH } from '../../../lib/leadRow.mjs';

export const runtime = 'nodejs';

// Ecrit le lead complet sur une ligne JSON dans les logs serveur.
// C'est le canal de secours recuperable en serverless (le disque y est
// ephemere) : ces lignes restent lisibles dans les logs Vercel / un log
// drain, ce qui permet de reconstituer les coordonnees si le Sheet tombe.
function logLeadFallback(record, cause) {
  try {
    console.error(
      '[LEAD_FALLBACK] ' +
        JSON.stringify({ cause: cause || 'unknown', lead: record })
    );
  } catch (e) {
    // En dernier recours, on logge au moins l'email pour ne rien perdre.
    console.error('[LEAD_FALLBACK] serialisation impossible, email=', record?.email);
  }
}

// Tente une ecriture vers un webhook Apps Script. Renvoie true si l'ecriture
// a bien ete acceptee (HTTP 2xx), false sinon. Ne jette jamais.
async function postToWebhook(url, body, label) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Apps Script peut etre un peu lent : on borne le temps d'attente.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[submit] Webhook ${label} a repondu`, res.status);
      return false;
    }

    // Un statut 200 ne suffit pas : Apps Script renvoie 200 meme en cas
    // d'echec logique ({ok:false}) ou de page de login Google (HTML). On
    // exige donc un corps JSON avec ok===true pour valider l'ecriture.
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.error(
        `[submit] Webhook ${label} : reponse non JSON (page de login ?), extrait :`,
        text.slice(0, 120)
      );
      return false;
    }
    if (!body || body.ok !== true) {
      console.error(`[submit] Webhook ${label} a renvoye ok=false :`, body && body.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[submit] Echec de l'envoi au webhook ${label} :`, err?.message || err);
    return false;
  }
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const webhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const webhookFallback = process.env.GOOGLE_SHEETS_WEBHOOK_URL_FALLBACK;

  // Le front peut envoyer soit { record, row } (nouveau client), soit
  // directement l'objet structure (ancien client encore en cache pendant
  // que la pub tourne). On accepte les deux pour ne jamais casser un lead.
  const record = payload.record || payload;

  // Horodatage fiable cote serveur (autorite sur la colonne date).
  record.receivedAt = new Date().toISOString();

  // Reconstruction de la ligne 30 colonnes depuis l'objet structure.
  // On reconstruit systematiquement pour appliquer l'horodatage serveur,
  // sauf si l'on ne recoit qu'un tableau brut sans objet structure.
  let row;
  if (Array.isArray(payload.row) && !payload.record && !record.labels) {
    row = payload.row;
    row[0] = record.receivedAt;
  } else {
    row = buildLeadRow(record);
  }

  // Controle de longueur : on complete / tronque a 30 et on logge tout ecart.
  const { row: safeRow, delta } = ensureRowLength(row, LEAD_ROW_LENGTH);
  if (delta !== 0) {
    console.error(
      `[submit] Ligne lead de longueur inattendue (ecart ${delta}), normalisee a ${LEAD_ROW_LENGTH}.`
    );
  }

  if (!webhook) {
    // Variable manquante en prod = cause la plus frequente de rupture.
    // On logge le lead complet (canal de secours) et on renvoie une vraie
    // erreur pour que la panne soit visible cote monitoring.
    console.error('[submit] GOOGLE_SHEETS_WEBHOOK_URL non defini : lead non persiste.');
    logLeadFallback(record, 'missing_webhook_url');
    return Response.json({ ok: false, persisted: false, error: 'no_webhook' }, { status: 502 });
  }

  // 1) Ecriture principale (on transmet la ligne 30 colonnes).
  const ok = await postToWebhook(webhook, { row: safeRow }, 'principal');
  if (ok) {
    return Response.json({ ok: true, persisted: true });
  }

  // 2) Ecriture de secours vers un second webhook si configure.
  if (webhookFallback) {
    const okFallback = await postToWebhook(webhookFallback, { row: safeRow }, 'secours');
    if (okFallback) {
      console.warn('[submit] Ecriture principale KO, lead persiste via le webhook de secours.');
      return Response.json({ ok: true, persisted: true, viaFallback: true });
    }
  }

  // 3) Tout a echoue : on ecrit le lead complet dans les logs (recuperable)
  // et on renvoie une vraie erreur au lieu d'un faux succes.
  logLeadFallback(record, 'webhook_write_failed');
  return Response.json({ ok: false, persisted: false, error: 'webhook_failed' }, { status: 502 });
}
