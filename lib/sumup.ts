const SUMUP_BASE_URL = 'https://api.sumup.com/v0.1'

interface CreateCheckoutParams {
  amount: number // en centimes -> sera converti en euros
  currency?: string
  description: string
  reference: string // unique, ex: ticket_code
  returnUrl: string
}

interface SumUpCheckout {
  id: string
  checkout_reference: string
  amount: number
  currency: string
  status: string
  payment_type?: string
  merchant_code: string
  description: string
  redirect_url?: string
}

async function getSumUpToken(): Promise<string> {
  const resp = await fetch('https://api.sumup.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SUMUP_CLIENT_ID || '',
      client_secret: process.env.SUMUP_API_KEY || '',
    }),
  })
  if (!resp.ok) throw new Error('SumUp auth failed')
  const data = await resp.json()
  return data.access_token
}

export async function createSumUpCheckout(params: CreateCheckoutParams): Promise<SumUpCheckout> {
  const token = await getSumUpToken()

  const body = {
    checkout_reference: params.reference,
    amount: params.amount / 100, // centimes -> euros
    currency: params.currency || 'EUR',
    merchant_code: process.env.SUMUP_MERCHANT_CODE!,
    description: params.description,
    return_url: params.returnUrl,
  }

  const resp = await fetch(`${SUMUP_BASE_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`SumUp checkout creation failed: ${err}`)
  }

  return resp.json()
}

export async function getSumUpCheckout(checkoutId: string): Promise<SumUpCheckout> {
  const token = await getSumUpToken()

  const resp = await fetch(`${SUMUP_BASE_URL}/checkouts/${checkoutId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  if (!resp.ok) throw new Error('SumUp checkout fetch failed')
  return resp.json()
}

export function isSumUpPaymentSuccessful(checkout: SumUpCheckout): boolean {
  return checkout.status === 'PAID'
}
