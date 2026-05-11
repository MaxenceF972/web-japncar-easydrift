import { createServiceClient } from '@/lib/supabase/server'
import { ReservationsClient } from './ReservationsClient'

export const dynamic = 'force-dynamic'

export default async function ReservationsPage() {
  const supabase = createServiceClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`*, slot:slots(*), activity:activities(*)`)
    .order('created_at', { ascending: false })

  return <ReservationsClient bookings={(bookings || []) as any[]} />
}
