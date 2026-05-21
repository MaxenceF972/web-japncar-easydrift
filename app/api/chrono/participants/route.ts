import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient() as any

    const { data: activities } = await supabase
      .from('activities')
      .select('id')
      .eq('name', 'conduite')

    if (!activities?.length) return NextResponse.json({ participants: [] })
    const activityId = activities[0].id

    const { data: slots } = await supabase
      .from('slots')
      .select('id')
      .eq('activity_id', activityId)

    const slotIds = (slots || []).map((s: any) => s.id)
    if (!slotIds.length) return NextResponse.json({ participants: [] })

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, first_name, last_name, day')
      .in('slot_id', slotIds)
      .in('payment_status', ['paid', 'cash', 'terminal', 'free'])
      .order('last_name')

    return NextResponse.json({ participants: bookings || [] })
  } catch (e: any) {
    return NextResponse.json({ participants: [] })
  }
}
