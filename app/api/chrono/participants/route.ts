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

  const { data } = await supabase
    .from('bookings')
    .select('id, first_name, last_name, day')
    .eq('activity_id', activity.id)
    .in('payment_status', ['paid', 'cash', 'terminal', 'free'])
    .order('last_name')

  return NextResponse.json({ participants: data || [] })
}
