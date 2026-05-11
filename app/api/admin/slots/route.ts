import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Créer un créneau
export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
  if (!await checkAuth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

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
