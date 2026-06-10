import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('date_start', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ events })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient() as any
  const body = await req.json()
  const { name, slug, date_start, date_end, location, config, site_content } = body

  if (!name || !slug) return NextResponse.json({ error: 'name et slug requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('events')
    .insert({ name, slug, date_start: date_start || null, date_end: date_end || null, location: location || null, config, site_content, status: 'draft' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceClient() as any
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  // Si on passe cet event en 'active', archiver les autres
  if (updates.status === 'active') {
    await supabase.from('events').update({ status: 'archived' }).eq('status', 'active')
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ event: data })
}
