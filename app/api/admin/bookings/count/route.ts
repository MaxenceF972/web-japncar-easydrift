import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any

  const { data: bookings } = await supabase
    .from('bookings')
    .select('activity_id, payment_status, amount_paid, checked_in, activities(name)')
    .in('payment_status', ['paid', 'cash', 'terminal', 'free'])

  const counts: Record<string, number> = { bapteme: 0, conduite: 0, carbooling: 0 }
  let revenue = 0
  let checkins = 0

  for (const b of bookings || []) {
    const name = b.activities?.name
    if (name && name in counts) counts[name]++
    revenue += b.amount_paid || 0
    if (b.checked_in) checkins++
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)

  return NextResponse.json({ counts, total, revenue, checkins, totalBookings: (bookings || []).length })
}
