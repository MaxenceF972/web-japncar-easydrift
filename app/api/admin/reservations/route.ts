import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id requis' }, { status: 400 })

  const supabase = createServiceClient() as any

  const { data, error } = await supabase
    .from('bookings')
    .select('*, slot:slots(*), activity:activities(*)')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookings: data || [] })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const supabase = createServiceClient() as any

  // Décrémenter le compteur du créneau si applicable
  const { data: booking } = await supabase.from('bookings').select('slot_id').eq('id', id).single()
  if (booking?.slot_id) {
    const { data: slot } = await supabase.from('slots').select('booked_count').eq('id', booking.slot_id).single()
    if (slot && slot.booked_count > 0) {
      await supabase.from('slots').update({ booked_count: slot.booked_count - 1 }).eq('id', booking.slot_id)
    }
  }

  await supabase.from('bookings').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
