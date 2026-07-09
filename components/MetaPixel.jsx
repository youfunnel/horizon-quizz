'use client';

import { useEffect } from 'react';

// ID du Pixel Meta, renseigné via variable d'environnement Vercel.
// Sans ID, le composant ne charge rien (le quiz fonctionne normalement).
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Charge le Pixel Meta une seule fois et envoie l'événement PageView.
// Les autres événements (Lead, QuizStart, etc.) sont envoyés via lib/track.
export default function MetaPixel() {
  useEffect(() => {
    if (!PIXEL_ID || typeof window === 'undefined' || window.fbq) return;
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }, []);

  return null;
}
