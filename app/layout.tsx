import type { Metadata, Viewport } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase.from('events').select('name, location').eq('status', 'active').single()
  const event = data as { name: string; location: string | null } | null

  const title = event ? `EASYDRIFT | ${event.name}` : 'EASYDRIFT'
  const description = event
    ? `Réservez votre expérience EASYDRIFT — ${event.name}${event.location ? ` · ${event.location}` : ''}`
    : 'Réservez votre expérience EASYDRIFT'

  return {
    title,
    description,
    keywords: 'dérive, conduite sportive, EASYDRIFT, réservation',
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
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
