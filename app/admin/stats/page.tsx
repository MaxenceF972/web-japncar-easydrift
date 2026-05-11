import { createServiceClient } from '@/lib/supabase/server'
import { StatsClient } from './StatsClient'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const supabase = createServiceClient()

  const [bookingsResult, activitiesResult, slotsResult] = await Promise.all([
    supabase.from('bookings').select(`*, slot:slots(*), activity:activities(*)`).neq('payment_status', 'cancelled'),
    supabase.from('activities').select('*'),
    supabase.from('slots').select('*').eq('is_break', false),
  ])

  return (
    <StatsClient
      bookings={(bookingsResult.data || []) as any[]}
      activities={(activitiesResult.data || []) as any[]}
      slots={(slotsResult.data || []) as any[]}
    />
  )
}
