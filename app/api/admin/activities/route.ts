import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function checkAuth() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Mettre à jour une activité (tarif, label, etc.)
export async function PATCH(req: NextRequest) {
  if (!await checkAuth()) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { activityId, ...updates } = await req.json()
  if (!activityId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', activityId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ activity: data })
}
