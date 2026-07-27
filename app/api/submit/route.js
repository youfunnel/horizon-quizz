// =====================================================================
// API /api/submit : reception d'un lead + ecriture Google Sheets
// =====================================================================
import { buildLeadRow, ensureRowLength, LEAD_ROW_LENGTH } from '../../../lib/leadRow.mjs';

export const runtime = 'nodejs';

function logLeadFallback(record, cause) {
  try {
    console.error('[LEAD_FALLBACK] ' + JSON.stringify({ cause: cause || 'unknown', lead: record }));
  } catch (e) {
    console.error('[LEAD_FALLBACK] serialisation impossible, email=', record?.email);
  }
}

// Tente une ecriture vers un webhook Apps Script. Renvoie true si l'ecriture
// a bien ete acceptee, false sinon. Ne jette jamais.
async function postToWebhook(url, payloadBody, label) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      // Apps Script recoit le corps de facon fiable en text/plain.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payloadBody),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[submit] Webhook ${label} a repondu`, res.status);
      return false;
    }

    // Un statut 200 ne suffit pas : on exige un corps JSON avec ok===true.
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error(
        `[submit] Webhook ${label} : reponse non JSON (page de login ?), extrait :`,
        text.slice(0, 120)
      );
      return false;
    }
    if (!json || json.ok !== true) {
      console.error(`[submit] Webhook ${label} a renvoye ok=false :`, json && json.error);
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

  const record = payload.record || payload;
  record.receivedAt = new Date().toISOString();

  let row;
  if (Array.isArray(payload.row) && !payload.record && !record.labels) {
    row = payload.row;
    row[0] = record.receivedAt;
  } else {
    row = buildLeadRow(record);
  }

  const { row: safeRow, delta } = ensureRowLength(row, LEAD_ROW_LENGTH);
  if (delta !== 0) {
    console.error(
      `[submit] Ligne lead de longueur inattendue (ecart ${delta}), normalisee a ${LEAD_ROW_LENGTH}.`
    );
  }

  if (!webhook) {
    console.error('[submit] GOOGLE_SHEETS_WEBHOOK_URL non defini : lead non persiste.');
    logLeadFallback(record, 'missing_webhook_url');
    return Response.json({ ok: false, persisted: false, error: 'no_webhook' }, { status: 502 });
  }

  const ok = await postToWebhook(webhook, { row: safeRow }, 'principal');
  if (ok) {
    return Response.json({ ok: true, persisted: true });
  }

  if (webhookFallback) {
    const okFallback = await postToWebhook(webhookFallback, { row: safeRow }, 'secours');
    if (okFallback) {
      console.warn('[submit] Ecriture principale KO, lead persiste via le webhook de secours.');
      return Response.json({ ok: true, persisted: true, viaFallback: true });
    }
  }

  logLeadFallback(record, 'webhook_write_failed');
  return Response.json({ ok: false, persisted: false, error: 'webhook_failed' }, { status: 502 });
}
