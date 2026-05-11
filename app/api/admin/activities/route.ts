import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAuth() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
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
