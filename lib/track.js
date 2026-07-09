// =====================================================================
// SUIVI META + ATTRIBUTION
// ---------------------------------------------------------------------
// Petites aides pour envoyer des événements au Pixel Meta (s'il est
// chargé) et pour transmettre les paramètres d'attribution (utm_*,
// fbclid...) jusqu'à la page de prise de RDV.
// =====================================================================

// Envoie un événement au Pixel. `custom = true` pour un trackCustom.
export function track(event, params, custom = false) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    window.fbq(custom ? 'trackCustom' : 'track', event, params || {});
  } catch (e) {
    /* ne bloque jamais l'expérience */
  }
}

// Recopie la query string courante (utm_*, fbclid, gclid...) sur une URL
// de destination, pour conserver l'attribution jusqu'au RDV (System.io).
export function appendCurrentParams(url) {
  if (typeof window === 'undefined') return url;
  const qs = window.location.search;
  if (!qs || qs.length < 2) return url;
  return url + (url.includes('?') ? '&' : '?') + qs.slice(1);
}
