import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { LandingClient } from './LandingClient'
import type { Event } from '@/lib/supabase/types'

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createServiceClient() as any
  const { data } = await supabase.from('events').select('name, location').eq('status', 'active').single()
  const event = data as { name: string; location: string | null } | null

  const title = event ? `EASYDRIFT | ${event.name}` : 'EASYDRIFT'
  const description = event
    ? `Réservez votre expérience EASYDRIFT — ${event.name}${event.location ? ` · ${event.location}` : ''}`
    : 'Réservez votre expérience EASYDRIFT'

  return { title, description, openGraph: { title, description, type: 'website' } }
}

export default async function HomePage() {
  const supabase = createServiceClient() as any

  const { data: rawEvent } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .single()

  const event = rawEvent as Event | null

  const activitiesBase = supabase.from('activities').select('*').eq('admin_only', false).order('price')
  const { data: activities } = await (event ? activitiesBase.eq('event_id', event.id) : activitiesBase)

  return <LandingClient activities={activities || []} event={event} />
}
