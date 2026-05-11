import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EasyDrift | JAPN Car à Montlhéry',
  description: 'Réservez votre expérience drift et conduite sportive au circuit de Montlhéry. Baptême drift, session conduite, car booling.',
  keywords: 'drift, conduite sportive, montlhéry, JAPN Car, EasyDrift, réservation',
  openGraph: {
    title: 'EasyDrift JAPN Car',
    description: 'Vivez l\'adrénaline du drift au circuit de Montlhéry',
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
