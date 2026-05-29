import { createServiceClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServiceClient()

  const [bookingsResult, slotsResult, activitiesResult] = await Promise.all([
    supabase.from('bookings').select('*, slot:slots(*), activity:activities(*)').order('created_at', { ascending: false }),
    supabase.from('slots').select('*').eq('is_break', false),
    supabase.from('activities').select('*'),
  ])

  if (bookingsResult.error) console.error('Dashboard bookings error:', bookingsResult.error)
  if (slotsResult.error) console.error('Dashboard slots error:', slotsResult.error)

  const bookings = (bookingsResult.data || []) as any[]
  const slots = (slotsResult.data || []) as any[]
  const activities = (activitiesResult.data || []) as any[]

  const totalRevenue = bookings
    .filter(b => b.payment_status !== 'cancelled')
    .reduce((sum, b) => sum + (b.amount_paid || 0), 0)

  const totalSlots = slots.reduce((sum, s) => sum + s.capacity, 0)
  const totalBooked = slots.reduce((sum, s) => sum + s.booked_count, 0)

  const kpis = {
    totalBookings: bookings.filter(b => b.payment_status !== 'cancelled').length,
    revenue: totalRevenue,
    availableSlots: totalSlots - totalBooked,
    checkins: bookings.filter(b => b.checked_in).length,
    fillRate: totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100) : 0,
  }

  return (
    <DashboardClient
      kpis={kpis}
      recentBookings={bookings.slice(0, 10)}
      bookings={bookings}
      activities={activities}
    />
  )
}
