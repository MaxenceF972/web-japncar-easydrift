import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any

  const { data: bookings } = await supabase
    .from('bookings')
    .select('activity_id, payment_status, activities(name)')
    .in('payment_status', ['paid', 'cash', 'terminal', 'free'])

  const counts: Record<string, number> = { bapteme: 0, conduite: 0, carbooling: 0 }
  for (const b of bookings || []) {
    const name = b.activities?.name
    if (name && name in counts) counts[name]++
  }

  return NextResponse.json({ counts, total: Object.values(counts).reduce((s, n) => s + n, 0) })
}
