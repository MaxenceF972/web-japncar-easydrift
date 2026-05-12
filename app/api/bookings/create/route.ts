import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { getSumUpCheckout, isSumUpPaymentSuccessful } from '@/lib/sumup'
import { generateTicketCode } from '@/lib/utils'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/emails/BookingConfirmation'
import type { ActivityName } from '@/lib/supabase/types'

const PRICES: Record<ActivityName, number> = {
  bapteme: 4000,
  conduite: 5000,
  carbooling: 2000,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      activityId, activityName, slotId, day, startTime, endTime,
      firstName, lastName, email, phone,
      checkoutId, sessionId,
      paymentMode, // 'sumup_online' | 'cash' | 'free' (admin only)
      booked_by_admin,
    } = body

    const supabase = createServiceClient() as any

    let paymentStatus: 'paid' | 'cash' | 'terminal' | 'free' | 'pending' = 'pending'
    let amountPaid: number | null = null

    if (paymentMode === 'cash' || paymentMode === 'terminal') {
      paymentStatus = paymentMode
      amountPaid = PRICES[activityName as ActivityName]
    } else if (paymentMode === 'free') {
      paymentStatus = 'free'
      amountPaid = 0
    } else if (checkoutId) {
      // Vérifier le paiement SumUp
      const checkout = await getSumUpCheckout(checkoutId)
      if (!isSumUpPaymentSuccessful(checkout)) {
        return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 402 })
      }
      paymentStatus = 'paid'
      amountPaid = PRICES[activityName as ActivityName]
    }

    // Vérifier à nouveau la disponibilité (race condition protection)
    const { data: slot } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .single()

    if (!slot || slot.booked_count >= slot.capacity) {
      return NextResponse.json({ error: 'Ce créneau est complet' }, { status: 409 })
    }

    const ticketCode = generateTicketCode()

    // Créer la réservation
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id: slotId,
        activity_id: activityId,
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        phone: phone || null,
        payment_status: paymentStatus,
        sumup_checkout_id: checkoutId || null,
        amount_paid: amountPaid,
        ticket_code: ticketCode,
        booked_by_admin: booked_by_admin || false,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking insert error:', bookingError)
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    // Incrémenter le compteur du slot de manière atomique
    const { error: slotUpdateError } = await supabase
      .from('slots')
      .update({ booked_count: slot.booked_count + 1 })
      .eq('id', slotId)
    if (slotUpdateError) console.error('Slot booked_count update error:', slotUpdateError)

    // Supprimer le lock temporaire
    if (sessionId) {
      await supabase.from('slot_locks').delete().eq('session_id', sessionId)
    }

    // Invalider le cache Next.js pour que le dashboard et les stats soient à jour
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/stats')
    revalidatePath('/admin/reservations')

    // Envoyer l'email de confirmation
    if (email && (paymentStatus === 'paid' || paymentStatus === 'cash' || paymentStatus === 'terminal' || paymentStatus === 'free')) {
      try {
        const { data: activity } = await supabase
          .from('activities')
          .select('*')
          .eq('id', activityId)
          .single()

        await getResend().emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `Votre ticket EasyDrift - ${activity?.label}`,
          react: BookingConfirmationEmail({
            firstName,
            lastName,
            activityLabel: activity?.label || '',
            day,
            startTime,
            endTime,
            ticketCode,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
            bookingId: booking.id,
          }),
        })

        await supabase
          .from('bookings')
          .update({ ticket_sent_at: new Date().toISOString() })
          .eq('id', booking.id)
      } catch (emailErr) {
        console.error('Email send error:', emailErr)
        // Ne pas faire échouer la réservation pour une erreur email
      }
    }

    return NextResponse.json({ bookingId: booking.id, ticketCode })
  } catch (e: any) {
    console.error('Booking create error:', e)
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
