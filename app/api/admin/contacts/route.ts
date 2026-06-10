import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient() as any
  const dateStart = req.nextUrl.searchParams.get('date_start')
  const dateEnd = req.nextUrl.searchParams.get('date_end')

  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false })

  if (dateStart) {
    query = query.gte('created_at', dateStart)
  }
  if (dateEnd) {
    // Include up to end of the day after event ends
    const dayAfter = new Date(dateEnd)
    dayAfter.setDate(dayAfter.getDate() + 1)
    query = query.lt('created_at', dayAfter.toISOString().split('T')[0])
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ contacts: [] })
  return NextResponse.json({ contacts: data || [] })
}
