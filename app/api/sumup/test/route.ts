import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.SUMUP_API_KEY
  const merchant = process.env.SUMUP_MERCHANT_CODE

  if (!key || key === 'your-sumup-api-key') {
    return NextResponse.json({ error: 'SUMUP_API_KEY non définie ou placeholder', key: key?.slice(0, 10) })
  }

  // Test : récupérer le profil du compte
  const resp = await fetch('https://api.sumup.com/v0.1/me', {
    headers: { 'Authorization': `Bearer ${key}` },
  })

  const data = await resp.json()

  return NextResponse.json({
    status: resp.status,
    keyPrefix: key.slice(0, 15) + '...',
    merchant_code_env: merchant,
    sumup_response: data,
  })
}
