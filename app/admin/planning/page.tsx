import { createServiceClient } from '@/lib/supabase/server'
import { PlanningClient } from './PlanningClient'
import { EVENT_DAYS } from '@/lib/event-config'

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
  const supabase = createServiceClient()

  const [activitiesResult] = await Promise.all([
    supabase.from('activities').select('*'),
  ])

  const ORDER = ['bapteme', 'conduite', 'carbooling', 'carbooling_passager']
  const activities = ((activitiesResult.data || []) as any[]).sort(
    (a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name)
  )

  return (
    <PlanningClient
      activities={activitiesResult.data || []}
      eventDays={EVENT_DAYS}
    />
  )
}
