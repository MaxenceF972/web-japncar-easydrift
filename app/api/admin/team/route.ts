import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient() as any
  const eventId = req.nextUrl.searchParams.get('event_id')
  let query = supabase.from('team_members').select('*').order('position')
  if (eventId) query = query.eq('event_id', eventId)
  else query = query.is('event_id', null)
  const { data } = await query
  return NextResponse.json({ members: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient() as any
  const body = await req.json()
  const { data, error } = await supabase
    .from('team_members')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data })
}
