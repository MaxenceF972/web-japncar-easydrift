import { NextRequest, NextResponse } from 'next/server'
import { createSumUpCheckout } from '@/lib/sumup'
import { createServiceClient } from '@/lib/supabase/server'
import { generateTicketCode } from '@/lib/utils'
import type { ActivityName } from '@/lib/supabase/types'

const PRICES: Record<ActivityName, number> = {
  bapteme: 4000,
  conduite: 5000,
  carbooling: 50,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { activityName, slotId, firstName, lastName, email } = body

    if (!activityName || !slotId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const supabase = createServiceClient() as any

    // Vérifier disponibilité du slot
    const { data: slot } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .single()

    if (!slot) return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 })
    if (slot.booked_count >= slot.capacity) {
      return NextResponse.json({ error: 'Ce créneau est complet' }, { status: 409 })
    }

    const price = PRICES[activityName as ActivityName]
    const reference = generateTicketCode()

    // Créer le checkout SumUp
    const checkout = await createSumUpCheckout({
      amount: price,
      description: `EasyDrift ${activityName} - ${firstName} ${lastName}`,
      reference,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/sumup/webhook`,
    })

    // Verrou temporaire sur le slot
    const sessionId = `${email}-${Date.now()}`
    await supabase.from('slot_locks').insert({
      slot_id: slotId,
      session_id: sessionId,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({
      checkoutId: checkout.id,
      reference,
      sessionId,
    })
  } catch (e: any) {
    console.error('SumUp checkout error:', e)
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
