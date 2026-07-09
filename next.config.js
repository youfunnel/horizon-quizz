/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Les polices sont chargées au runtime via <link> dans app/layout.jsx.
  // On désactive l'optimisation des polices au build pour ne dépendre
  // d'aucun fetch réseau pendant la compilation (build 100 % autonome).
  optimizeFonts: false,
};

module.exports = nextConfig;
