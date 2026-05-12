import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NON DÉFINI'
  const keyPreview = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').slice(-10)

  const supabase = createServiceClient()
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    supabase_url: url,
    key_end: keyPreview,
    booking_count: count,
    error: error?.message || null,
  })
}
