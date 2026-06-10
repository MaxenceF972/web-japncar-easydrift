import { createClient } from '@/lib/supabase/server'
import { LandingClient } from './LandingClient'
import type { Event } from '@/lib/supabase/types'

export default async function HomePage() {
  const supabase = createClient()

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
