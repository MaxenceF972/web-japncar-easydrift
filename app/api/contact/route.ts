import { NextRequest, NextResponse } from 'next/server'
import { getResend, FROM_EMAIL } from '@/lib/resend'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, type, message } = await req.json()

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: 'maxence.fortier@easydriftdts.com',
      reply_to: email,
      subject: `[Contact JAPN Car] ${type === 'professionnel' ? '🏢' : '👤'} ${firstName} ${lastName}`,
      html: `
        <h2>Nouveau message de contact — EasyDrift JAPN Car</h2>
        <table cellpadding="6">
          <tr><td><strong>Nom</strong></td><td>${firstName} ${lastName}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Téléphone</strong></td><td>${phone || '—'}</td></tr>
          <tr><td><strong>Type</strong></td><td>${type}</td></tr>
        </table>
        <hr/>
        <p><strong>Message :</strong></p>
        <p style="white-space:pre-wrap">${message}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Contact form error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
