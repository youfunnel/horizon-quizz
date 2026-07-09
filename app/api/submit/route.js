// =====================================================================
// API /api/submit — réception d'un lead + écriture Google Sheets
// ---------------------------------------------------------------------
// Le front envoie ici toutes les réponses + email + scoring + UTM.
// On relaie vers le Web App Google Apps Script (GOOGLE_SHEETS_WEBHOOK_URL)
// qui ajoute une ligne au Google Sheet.
//
// Principe : on ne bloque JAMAIS l'utilisateur. Même si l'écriture
// échoue, on renvoie 200 pour que l'audit s'affiche. Les erreurs sont
// loggées côté serveur.
// =====================================================================

export const runtime = 'nodejs';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const webhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  // Enrichissement serveur (horodatage fiable).
  const record = {
    ...payload,
    receivedAt: new Date().toISOString(),
  };

  if (!webhook) {
    // Pas de webhook configuré (dev) : on logge et on laisse passer.
    console.warn('[submit] GOOGLE_SHEETS_WEBHOOK_URL non défini. Lead non persisté :', {
      email: record.email,
      profil: record.dominantAxis,
    });
    return Response.json({ ok: true, persisted: false });
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      // Apps Script peut être un peu lent : on borne le temps d'attente.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error('[submit] Webhook a répondu', res.status);
      return Response.json({ ok: true, persisted: false });
    }

    return Response.json({ ok: true, persisted: true });
  } catch (err) {
    console.error('[submit] Échec de l\u2019envoi au webhook :', err?.message || err);
    // On ne bloque pas l'utilisateur.
    return Response.json({ ok: true, persisted: false });
  }
}
