import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any
  const { data } = await supabase
    .from('lap_times')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ laps: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient() as any
  const body = await req.json()
  const { participant_name, booking_id, time_ms, day } = body
  if (!participant_name || !time_ms || !day) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('lap_times')
    .insert({ participant_name, booking_id: booking_id || null, time_ms, day })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lap: data })
}
