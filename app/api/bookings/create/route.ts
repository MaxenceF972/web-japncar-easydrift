import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export const maxDuration = 60
import { createServiceClient } from '@/lib/supabase/server'
import { getSumUpCheckout, isSumUpPaymentSuccessful } from '@/lib/sumup'
import { generateTicketCode } from '@/lib/utils'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { BookingConfirmationEmail } from '@/emails/BookingConfirmation'
import type { ActivityName } from '@/lib/supabase/types'

const PRICES: Record<ActivityName, number> = {
  bapteme: 5000,
  conduite: 5000,
  carbooling: 2500,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = createServiceClient() as any

    // ── Admin single-slot flow (inscrire page) ──────────────────────────────
    if (body.slotId && !body.slots) {
      const {
        activityId, activityName, slotId, day, startTime, endTime,
        firstName, lastName, email, phone, sessionId,
        paymentMode, booked_by_admin, event_id,
      } = body

      let paymentStatus: 'paid' | 'cash' | 'terminal' | 'free' | 'pending' = 'pending'
      let amountPaid: number | null = null

      if (paymentMode === 'cash' || paymentMode === 'terminal') {
        paymentStatus = paymentMode
        amountPaid = PRICES[activityName as ActivityName]
      } else if (paymentMode === 'free') {
        paymentStatus = 'free'
        amountPaid = 0
      }

      const { data: slot } = await supabase.from('slots').select('*').eq('id', slotId).single()
      if (!slot || slot.booked_count >= slot.capacity) {
        return NextResponse.json({ error: 'Ce créneau est complet' }, { status: 409 })
      }

      const ticketCode = generateTicketCode()
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          event_id: event_id || null,
          slot_id: slotId, activity_id: activityId,
          first_name: firstName, last_name: lastName,
          email: email?.toLowerCase() || '', phone: phone || null,
          payment_status: paymentStatus, sumup_checkout_id: null,
          amount_paid: amountPaid, ticket_code: ticketCode,
          booked_by_admin: booked_by_admin || false,
        })
        .select().single()

      if (bookingError) return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })

      await supabase.from('slots').update({ booked_count: slot.booked_count + 1 }).eq('id', slotId)
      if (sessionId) await supabase.from('slot_locks').delete().eq('session_id', sessionId)

      revalidatePath('/admin/dashboard')
      revalidatePath('/admin/stats')
      revalidatePath('/admin/reservations')

      if (email && paymentStatus !== 'pending') {
        try {
          const { data: activity } = await supabase.from('activities').select('*').eq('id', activityId).single()
          await getResend().emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Votre ticket EASYDRIFT - ${activity?.label}`,
            react: BookingConfirmationEmail({
              firstName, lastName, activityLabel: activity?.label || '',
              day, startTime, endTime, ticketCode,
              appUrl: process.env.NEXT_PUBLIC_APP_URL!,
              bookingId: booking.id,
            }),
          })
          await supabase.from('bookings').update({ ticket_sent_at: new Date().toISOString() }).eq('id', booking.id)
        } catch (err) {
          console.error('Email send error:', err)
        }
      }

      return NextResponse.json({ bookingId: booking.id, bookingIds: [booking.id], ticketCode })
    }

    // ── Public multi-slot flow ───────────────────────────────────────────────
    const { activityId, activityName, slots, email, phone, checkoutId, sessionId } = body

    if (!slots?.length || !activityName || !email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier le paiement SumUp
    let paymentStatus: 'paid' | 'pending' = 'pending'
    let amountPaid: number | null = null

    if (checkoutId) {
      await new Promise(r => setTimeout(r, 4000))
      let checkout = null
      for (let attempt = 0; attempt < 8; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 4000))
        checkout = await getSumUpCheckout(checkoutId)
        if (isSumUpPaymentSuccessful(checkout)) break
        const isFailed = checkout?.status === 'FAILED' || checkout?.transactions?.some((t: any) => t.status === 'FAILED')
        if (isFailed) break
      }
      if (!checkout || !isSumUpPaymentSuccessful(checkout)) {
        const isFailed = checkout?.status === 'FAILED' || checkout?.transactions?.some((t: any) => t.status === 'FAILED')
        return NextResponse.json({ error: isFailed ? 'Paiement refusé par la banque' : 'Paiement non confirmé' }, { status: 402 })
      }
      paymentStatus = 'paid'
      amountPaid = null // will be set per slot
    }

    // Créer un booking par créneau
    const bookingIds: string[] = []

    for (const s of slots) {
      const slotActivityId = s.activityId || activityId
      const slotActivityName = s.activityName || activityName
      const slotPrice = s.price ?? PRICES[slotActivityName as ActivityName]

      // Récupérer l'activité pour l'email
      const { data: activity } = await supabase.from('activities').select('*').eq('id', slotActivityId).single()

      const { data: slot } = await supabase.from('slots').select('*').eq('id', s.slotId).single()
      if (!slot || slot.booked_count >= slot.capacity) {
        console.error(`Slot ${s.slotId} full or not found`)
        continue
      }

      const ticketCode = generateTicketCode()
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          slot_id: s.slotId, activity_id: slotActivityId,
          first_name: s.firstName, last_name: s.lastName,
          email: email.toLowerCase(), phone: phone || null,
          payment_status: paymentStatus,
          sumup_checkout_id: checkoutId || null,
          amount_paid: paymentStatus === 'paid' ? slotPrice : amountPaid,
          ticket_code: ticketCode,
          booked_by_admin: false,
        })
        .select().single()

      if (bookingError) { console.error('Booking insert error:', bookingError); continue }

      await supabase.from('slots').update({ booked_count: slot.booked_count + 1 }).eq('id', s.slotId)
      bookingIds.push(booking.id)

      // Email par ticket
      if (paymentStatus === 'paid') {
        try {
          await getResend().emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `Votre ticket EASYDRIFT - ${activity?.label}`,
            react: BookingConfirmationEmail({
              firstName: s.firstName, lastName: s.lastName,
              activityLabel: activity?.label || '',
              day: s.day, startTime: s.startTime, endTime: s.endTime,
              ticketCode, appUrl: process.env.NEXT_PUBLIC_APP_URL!,
              bookingId: booking.id,
            }),
          })
          await supabase.from('bookings').update({ ticket_sent_at: new Date().toISOString() }).eq('id', booking.id)
        } catch (err) {
          console.error('Email send error:', err)
        }
      }
    }

    if (sessionId) await supabase.from('slot_locks').delete().eq('session_id', sessionId)

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/stats')
    revalidatePath('/admin/reservations')

    return NextResponse.json({ bookingIds, bookingId: bookingIds[0] })
  } catch (e: any) {
    console.error('Booking create error:', e)
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
