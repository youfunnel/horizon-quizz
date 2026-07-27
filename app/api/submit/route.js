// =====================================================================
// API /api/submit : reception d'un lead + ecriture Google Sheets
// ---------------------------------------------------------------------
// Le front envoie ici toutes les reponses + email + scoring + UTM.
// On relaie vers le Web App Google Apps Script (GOOGLE_SHEETS_WEBHOOK_URL)
// qui ajoute une ligne au Google Sheet.
//
// Principe UX : on ne bloque jamais l'affichage de l'audit cote front.
// MAIS on ne ment plus sur le resultat : si la persistance echoue, on
// renvoie une vraie erreur (502) et on ecrit le lead complet dans les
// logs (canal de secours JSON) pour qu'aucun lead ne soit perdu en
// silence. Un webhook de secours optionnel peut aussi etre configure.
// =====================================================================

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
async function postToWebhook(url, record, label) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      // Apps Script peut etre un peu lent : on borne le temps d'attente.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[submit] Webhook ${label} a repondu`, res.status);
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

  // Enrichissement serveur (horodatage fiable).
  const record = {
    ...payload,
    receivedAt: new Date().toISOString(),
  };

  if (!webhook) {
    // Variable manquante en prod = cause la plus frequente de rupture.
    // On logge le lead complet (canal de secours) et on renvoie une vraie
    // erreur pour que la panne soit visible cote monitoring.
    console.error('[submit] GOOGLE_SHEETS_WEBHOOK_URL non defini : lead non persiste.');
    logLeadFallback(record, 'missing_webhook_url');
    return Response.json({ ok: false, persisted: false, error: 'no_webhook' }, { status: 502 });
  }

  // 1) Ecriture principale.
  const ok = await postToWebhook(webhook, record, 'principal');
  if (ok) {
    return Response.json({ ok: true, persisted: true });
  }

  // 2) Ecriture de secours vers un second webhook si configure.
  if (webhookFallback) {
    const okFallback = await postToWebhook(webhookFallback, record, 'secours');
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
