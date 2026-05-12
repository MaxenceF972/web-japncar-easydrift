import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.SUMUP_API_KEY
  const merchant = process.env.SUMUP_MERCHANT_CODE
  const email = process.env.SUMUP_MERCHANT_EMAIL

  // Test checkout creation avec les vraies valeurs
  const checkoutBody: any = {
    checkout_reference: 'TEST-DEBUG-001',
    amount: 1,
    currency: 'EUR',
    description: 'Test debug',
    return_url: 'https://web-japncar-easydrift.vercel.app',
  }
  if (merchant) checkoutBody.merchant_code = merchant
  if (email) checkoutBody.pay_to_email = email

  const checkoutResp = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(checkoutBody),
  })
  const checkoutData = await checkoutResp.json()

  return NextResponse.json({
    env: {
      key: key ? key.slice(0, 15) + '...' : 'MANQUANT',
      merchant_code: merchant || 'MANQUANT',
      merchant_email: email || 'MANQUANT',
    },
    checkout_status: checkoutResp.status,
    checkout_result: checkoutData,
  })
}
