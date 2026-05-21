import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any

  const { data: activities, error: e1 } = await supabase
    .from('activities')
    .select('id')
    .eq('name', 'conduite')

  if (e1) return NextResponse.json({ participants: [], debug: 'activities error', error: e1.message })
  if (!activities?.length) return NextResponse.json({ participants: [], debug: 'no conduite activity' })

  const activityId = activities[0].id

  const { data: slots, error: e2 } = await supabase
    .from('slots')
    .select('id')
    .eq('activity_id', activityId)

  if (e2) return NextResponse.json({ participants: [], debug: 'slots error', error: e2.message })
  if (!slots?.length) return NextResponse.json({ participants: [], debug: 'no slots', activityId })

  const slotIds = slots.map((s: any) => s.id)

  const { data: bookings, error: e3 } = await supabase
    .from('bookings')
    .select('id, first_name, last_name, day')
    .in('slot_id', slotIds)
    .order('last_name')

  if (e3) return NextResponse.json({ participants: [], debug: 'bookings error', error: e3.message })

  return NextResponse.json({ participants: bookings || [], debug: 'ok', count: bookings?.length })
}
