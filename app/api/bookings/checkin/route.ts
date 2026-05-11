import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { ticketCode, agentName } = await req.json()

    if (!ticketCode) {
      return NextResponse.json({ error: 'Code ticket manquant' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: booking } = await supabase
      .from('bookings')
      .select(`*, slot:slots(*), activity:activities(*)`)
      .eq('ticket_code', ticketCode)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Ticket invalide', status: 'invalid' }, { status: 404 })
    }

    if (booking.payment_status === 'cancelled') {
      return NextResponse.json({ error: 'Réservation annulée', status: 'cancelled' }, { status: 400 })
    }

    if (booking.checked_in) {
      return NextResponse.json({
        status: 'already_checked',
        booking: {
          id: booking.id,
          firstName: booking.first_name,
          lastName: booking.last_name,
          activityLabel: booking.activity?.label,
          startTime: booking.slot?.start_time,
          day: booking.slot?.day,
          checkedInAt: booking.checked_in_at,
        },
      }, { status: 409 })
    }

    await supabase
      .from('bookings')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: agentName || 'Scanner',
      })
      .eq('id', booking.id)

    return NextResponse.json({
      status: 'success',
      booking: {
        id: booking.id,
        firstName: booking.first_name,
        lastName: booking.last_name,
        activityLabel: booking.activity?.label,
        activityColor: booking.activity?.color,
        startTime: booking.slot?.start_time,
        day: booking.slot?.day,
        paymentStatus: booking.payment_status,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
