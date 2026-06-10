import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient() as any
  const eventId = req.nextUrl.searchParams.get('event_id')

  let activitiesQuery = supabase.from('activities').select('*').order('label')
  if (eventId) activitiesQuery = activitiesQuery.eq('event_id', eventId)
  const { data: activities } = await activitiesQuery

  const activityIds = (activities || []).map((a: any) => a.id)

  let bookings: any[] = []
  let slots: any[] = []

  if (activityIds.length) {
    const { data: b } = await supabase
      .from('bookings')
      .select('*, slot:slots(*)')
      .in('activity_id', activityIds)
      .neq('payment_status', 'cancelled')
    bookings = b || []

    const { data: s } = await supabase
      .from('slots')
      .select('*')
      .in('activity_id', activityIds)
      .eq('is_break', false)
    slots = s || []
  }

  return NextResponse.json({ bookings, activities: activities || [], slots })
}
