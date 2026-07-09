import './globals.css';
import MetaPixel from '../components/MetaPixel';

export const metadata = {
  title: 'Diagnostic financier | Horizon Finance',
  description:
    "En 2 minutes, découvrez où fuit votre marge. Un diagnostic personnalisé de votre pilotage financier, réservé aux dirigeants à +500K€ de CA.",
  robots: 'noindex', // funnel de pub : pas d'indexation
  openGraph: {
    title: 'Découvrez où fuit votre marge | Horizon Finance',
    description:
      'Un diagnostic personnalisé de votre pilotage financier, en 8 questions. Résultat immédiat.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#13204D',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
