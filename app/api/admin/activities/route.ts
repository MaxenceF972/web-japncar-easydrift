import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAuth() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

// Lister les activités d'un événement
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const supabase = createServiceClient() as any

  let query = supabase.from('activities').select('*').order('label')
  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activities: data })
}

// Créer une activité pour un événement
export async function POST(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const supabase = createServiceClient() as any
  const body = await req.json()
  const { event_id, name, label, price, duration, color, description, capacity, type } = body
  if (!event_id || !name || !label) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  const { data, error } = await supabase.from('activities')
    .insert({ event_id, name, label, price: price || 0, duration: duration || 30, color: color || '#F47B20', description: description || null, capacity: capacity || 1, type: type || 'scheduled' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data })
}

// Mettre à jour une activité (tarif, label, etc.)
export async function PATCH(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { activityId, price } = await req.json() as { activityId: string; price: number }
  if (!activityId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
  if (price === undefined || price < 0) return NextResponse.json({ error: 'Prix invalide' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const { data, error } = await supabase
    .from('activities')
    .update({ price })
    .eq('id', activityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data })
}
