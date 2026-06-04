import { NextRequest, NextResponse } from 'next/server'
import { createSumUpCheckout } from '@/lib/sumup'
import { createServiceClient } from '@/lib/supabase/server'
import { generateTicketCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    const supabase = createServiceClient() as any

    const { data: order } = await supabase
      .from('video_orders')
      .select('*, booking:bookings(first_name, last_name, email)')
      .eq('download_token', token)
      .single()

    if (!order) return NextResponse.json({ error: 'Vidéo introuvable' }, { status: 404 })
    if (order.payment_status === 'paid') return NextResponse.json({ error: 'Déjà payé' }, { status: 400 })

    const name = order.booking
      ? `${order.booking.first_name} ${order.booking.last_name}`
      : `${order.custom_first_name || ''} ${order.custom_last_name || ''}`.trim() || 'Client'

    const reference = generateTicketCode()
    const checkout = await createSumUpCheckout({
      amount: 100,
      description: `Vidéo EASYDRIFT - ${name}`,
      reference,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/video/${token}`,
    })

    await supabase
      .from('video_orders')
      .update({ sumup_checkout_id: checkout.id })
      .eq('id', order.id)

    return NextResponse.json({ checkoutId: checkout.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
