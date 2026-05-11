import { createServiceClient } from '@/lib/supabase/server'
import { PlanningClient } from './PlanningClient'

export const dynamic = 'force-dynamic'

// Dates de l'événement
const EVENT_DAYS = {
  saturday: '2026-05-30',
  sunday: '2026-05-31',
}

export default async function PlanningPage() {
  const supabase = createServiceClient()

  const [activitiesResult] = await Promise.all([
    supabase.from('activities').select('*').order('price'),
  ])

  return (
    <PlanningClient
      activities={activitiesResult.data || []}
      eventDays={EVENT_DAYS}
    />
  )
}
