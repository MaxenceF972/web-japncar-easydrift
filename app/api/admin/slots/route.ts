import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Récupérer les créneaux avec leurs réservations (service role pour bypasser RLS)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const activityId = searchParams.get('activityId')
  const day = searchParams.get('day')

  if (!activityId || !day) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const supabase = createServiceClient() as any

  const { data: slots, error: slotsError } = await supabase
    .from('slots')
    .select('*')
    .eq('activity_id', activityId)
    .eq('day', day)
    .order('start_time')

  if (slotsError) return NextResponse.json({ error: slotsError.message }, { status: 500 })

  const slotIds = (slots || []).map((s: any) => s.id)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .in('slot_id', slotIds)

  const bookingsBySlot: Record<string, any[]> = {}
  for (const b of bookings || []) {
    if (!bookingsBySlot[b.slot_id]) bookingsBySlot[b.slot_id] = []
    bookingsBySlot[b.slot_id].push(b)
  }

  const result = (slots || []).map((s: any) => ({ ...s, bookings: bookingsBySlot[s.id] || [] }))
  return NextResponse.json({ slots: result })
}

// Créer un créneau
export async function POST(req: NextRequest) {

  const body = await req.json()
  const { activity_id, day, start_time, end_time, capacity } = body

  if (!activity_id || !day || !start_time || !end_time || !capacity) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const supabase = createServiceClient() as any
  const { data, error } = await supabase
    .from('slots')
    .insert({ activity_id, day, start_time, end_time, capacity, is_break: false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ slot: data })
}

// Supprimer un créneau
export async function DELETE(req: NextRequest) {

  const { slotId } = await req.json()
  if (!slotId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const supabase = createServiceClient() as any

  // Vérifier qu'il n'y a pas de réservations actives
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('slot_id', slotId)
    .neq('payment_status', 'cancelled')

  if (bookings && bookings.length > 0) {
    return NextResponse.json({ error: `Impossible : ${bookings.length} réservation(s) active(s) sur ce créneau` }, { status: 409 })
  }

  const { error } = await supabase.from('slots').delete().eq('id', slotId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
