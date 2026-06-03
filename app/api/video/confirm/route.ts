import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getSumUpCheckout, isSumUpPaymentSuccessful } from '@/lib/sumup'

export async function POST(req: NextRequest) {
  try {
    const { token, checkoutId } = await req.json()
    const supabase = createServiceClient() as any

    await new Promise(r => setTimeout(r, 3000))
    let checkout = null
    for (let i = 0; i < 6; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 3000))
      checkout = await getSumUpCheckout(checkoutId)
      if (isSumUpPaymentSuccessful(checkout)) break
    }

    if (!isSumUpPaymentSuccessful(checkout)) {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 })
    }

    await supabase
      .from('video_orders')
      .update({ payment_status: 'paid' })
      .eq('download_token', token)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
