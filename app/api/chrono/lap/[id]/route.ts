import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceClient() as any
  const { error } = await supabase.from('lap_times').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
