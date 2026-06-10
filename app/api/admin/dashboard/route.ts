import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id requis' }, { status: 400 })

  const supabase = createServiceClient() as any

  const [bookingsResult, slotsResult, activitiesResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, slot:slots(*), activity:activities(*)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false }),
    supabase
      .from('slots')
      .select('*, activity:activities!inner(event_id)')
      .eq('is_break', false)
      .eq('activity.event_id', eventId),
    supabase
      .from('activities')
      .select('*')
      .eq('event_id', eventId)
      .order('label'),
  ])

  const bookings = (bookingsResult.data || []) as any[]
  const slots = (slotsResult.data || []) as any[]
  const activities = (activitiesResult.data || []) as any[]

  const active = bookings.filter(b => b.payment_status !== 'cancelled' && b.payment_status !== 'pending')
  const totalRevenue = active.reduce((sum: number, b: any) => sum + (b.amount_paid || 0), 0)
  const totalSlots = slots.reduce((sum: number, s: any) => sum + s.capacity, 0)
  const totalBooked = slots.reduce((sum: number, s: any) => sum + s.booked_count, 0)

  return NextResponse.json({
    kpis: {
      totalBookings: active.length,
      pendingCount: bookings.filter(b => b.payment_status === 'pending').length,
      revenue: totalRevenue,
      availableSlots: totalSlots - totalBooked,
      checkins: bookings.filter((b: any) => b.checked_in).length,
      fillRate: totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100) : 0,
    },
    recentBookings: bookings.slice(0, 10),
    bookings,
    activities,
  })
}
