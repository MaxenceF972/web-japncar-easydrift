import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/emails/BookingConfirmation'

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json()

    const supabase = createServiceClient()

    const { data: booking } = await supabase
      .from('bookings')
      .select(`*, slot:slots(*), activity:activities(*)`)
      .eq('id', bookingId)
      .single()

    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })

    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      subject: `Votre ticket EasyDrift - ${booking.activity?.label}`,
      react: BookingConfirmationEmail({
        firstName: booking.first_name,
        lastName: booking.last_name,
        activityLabel: booking.activity?.label || '',
        day: booking.slot?.day || '',
        startTime: booking.slot?.start_time || '',
        endTime: booking.slot?.end_time || '',
        ticketCode: booking.ticket_code!,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        bookingId: booking.id,
      }),
    })

    await supabase
      .from('bookings')
      .update({ ticket_sent_at: new Date().toISOString() })
      .eq('id', bookingId)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
