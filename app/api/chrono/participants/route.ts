import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any

  const { data: activity } = await supabase
    .from('activities')
    .select('id')
    .eq('name', 'conduite')
    .single()

  if (!activity) return NextResponse.json({ participants: [] })

  const { data: slots } = await supabase
    .from('slots')
    .select('id')
    .eq('activity_id', activity.id)

  const slotIds = (slots || []).map((s: any) => s.id)
  if (slotIds.length === 0) return NextResponse.json({ participants: [] })

  const { data } = await supabase
    .from('bookings')
    .select('id, first_name, last_name, day')
    .in('slot_id', slotIds)
    .in('payment_status', ['paid', 'cash', 'terminal', 'free'])
    .order('last_name')

  return NextResponse.json({ participants: data || [] })
}
