import { createClient } from '@/lib/supabase/server'
import { LandingClient } from './LandingClient'

export default async function HomePage() {
  const supabase = createClient()
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('price')

  return <LandingClient activities={activities || []} />
}
