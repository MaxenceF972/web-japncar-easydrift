const SUMUP_BASE_URL = 'https://api.sumup.com/v0.1'

function getAuthHeader() {
  return `Bearer ${process.env.SUMUP_API_KEY}`
}

interface CreateCheckoutParams {
  amount: number // en centimes -> sera converti en euros
  currency?: string
  description: string
  reference: string
  returnUrl: string
}

interface SumUpTransaction {
  id: string
  status: string
  payment_type?: string
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
  transactions?: SumUpTransaction[]
}

export async function createSumUpCheckout(params: CreateCheckoutParams): Promise<SumUpCheckout> {
  const resp = await fetch(`${SUMUP_BASE_URL}/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkout_reference: params.reference,
      amount: params.amount / 100,
      currency: params.currency || 'EUR',
      merchant_code: process.env.SUMUP_MERCHANT_CODE!,
      pay_to_email: process.env.SUMUP_MERCHANT_EMAIL!,
      description: params.description,
      return_url: params.returnUrl,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`SumUp checkout creation failed: ${err}`)
  }

  return resp.json()
}

export async function getSumUpCheckout(checkoutId: string): Promise<SumUpCheckout> {
  const resp = await fetch(`${SUMUP_BASE_URL}/checkouts/${checkoutId}`, {
    headers: { 'Authorization': getAuthHeader() },
  })

  if (!resp.ok) throw new Error('SumUp checkout fetch failed')
  return resp.json()
}

export function isSumUpPaymentSuccessful(checkout: SumUpCheckout): boolean {
  if (checkout.status === 'PAID') return true
  // Après 3DS, la transaction peut être SUCCESSFUL avant que le checkout soit marqué PAID
  if (checkout.transactions?.some(t => t.status === 'SUCCESSFUL')) return true
  return false
}
