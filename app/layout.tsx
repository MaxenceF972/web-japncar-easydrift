import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EASYDRIFT | JAPN Car à Montlhéry',
  description: 'Réservez votre expérience EASYDRIFT et conduite sportive au circuit de Montlhéry. Baptême EASYDRIFT, session conduite, car booling.',
  keywords: 'dérive, conduite sportive, montlhéry, JAPN Car, EASYDRIFT, réservation',
  openGraph: {
    title: 'EASYDRIFT JAPN Car',
    description: 'Vivez l\'adrénaline de la dérive au circuit de Montlhéry',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
