import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any
  const { data } = await supabase
    .from('team_members')
    .select('*')
    .order('position')
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
