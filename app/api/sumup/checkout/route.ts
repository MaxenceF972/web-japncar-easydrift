import { NextRequest, NextResponse } from 'next/server'
import { createSumUpCheckout } from '@/lib/sumup'
import { createServiceClient } from '@/lib/supabase/server'
import { generateTicketCode } from '@/lib/utils'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { activityName, slots, firstName, lastName, email } = body

    if (!activityName || !slots?.length || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createServiceClient() as any
    // Calcul du total : chaque slot peut avoir son propre prix (multi-activités)
    let totalAmount = 0
    for (const s of slots) {
      let pricePerSlot = s.price
      if (pricePerSlot == null && s.activityId) {
        const { data: act } = await supabase.from('activities').select('price').eq('id', s.activityId).single()
        pricePerSlot = act?.price ?? 0
      }
      totalAmount += pricePerSlot ?? 0
    }

    // Vérifier disponibilité des créneaux (sauf walk-in sans créneau)
    for (const s of slots) {
      if (s.walkin) continue
      const { data: slot } = await supabase.from('slots').select('*').eq('id', s.slotId).single()
      if (!slot) return NextResponse.json({ error: `Créneau introuvable` }, { status: 404 })
      if (slot.booked_count >= slot.capacity) {
        return NextResponse.json({ error: `Le créneau de ${slot.start_time} est complet` }, { status: 409 })
      }
    }

    const reference = generateTicketCode()
    const description = slots.length > 1
      ? `EASYDRIFT x${slots.length} - ${firstName} ${lastName}`
      : `EASYDRIFT ${activityName} - ${firstName} ${lastName}`

    const checkout = await createSumUpCheckout({
      amount: totalAmount,
      description,
      reference,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sumup/webhook`,
    })

    // Verrou temporaire sur les créneaux (pas pour walk-in)
    const sessionId = `${email}-${Date.now()}`
    for (const s of slots) {
      if (s.walkin || !s.slotId) continue
      await supabase.from('slot_locks').insert({
        slot_id: s.slotId,
        session_id: sessionId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
    }

    return NextResponse.json({ checkoutId: checkout.id, reference, sessionId })
  } catch (e: any) {
    console.error('SumUp checkout error:', e)
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
