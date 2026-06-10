import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { VideoEmail } from '@/emails/VideoEmail'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient() as any
  const eventId = req.nextUrl.searchParams.get('event_id')

  let activitiesQuery = supabase.from('activities').select('id').eq('name', 'bapteme')
  if (eventId) activitiesQuery = activitiesQuery.eq('event_id', eventId)

  const { data: activities } = await activitiesQuery
  if (!activities?.length) return NextResponse.json({ bookings: [] })

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, first_name, last_name, email, slot:slots(day, start_time)')
    .eq('activity_id', activities[0].id)
    .in('payment_status', ['paid', 'cash', 'terminal', 'free'])
    .order('last_name')

  const bookingIds = (bookings || []).map((b: any) => b.id)
  const { data: orders } = await supabase
    .from('video_orders')
    .select('*')
    .or(`booking_id.in.(${bookingIds.join(',')}),booking_id.is.null`)

  const ordersByBooking = Object.fromEntries(
    (orders || []).filter((o: any) => o.booking_id).map((o: any) => [o.booking_id, o])
  )
  const customOrders = (orders || []).filter((o: any) => !o.booking_id)

  // Custom entries (no booking)
  const customEntries = customOrders.map((o: any) => ({
    id: `custom_${o.id}`,
    first_name: o.custom_first_name || '',
    last_name: o.custom_last_name || '',
    email: o.custom_email || '',
    slot: null,
    video_order: o,
    is_custom: true,
  }))

  return NextResponse.json({
    bookings: [
      ...(bookings || []).map((b: any) => ({ ...b, video_order: ordersByBooking[b.id] || null })),
      ...customEntries,
    ],
  })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient() as any
  const { bookingId, previewUrl, fullVideoUrl, sendEmail, customFirstName, customLastName, customEmail } = await req.json()

  const isCustom = !bookingId

  let order: any
  let error: any

  if (isCustom) {
    // Entrée manuelle sans booking
    const { data, error: e } = await supabase
      .from('video_orders')
      .insert({
        booking_id: null,
        preview_url: previewUrl,
        full_video_url: fullVideoUrl,
        custom_first_name: customFirstName,
        custom_last_name: customLastName,
        custom_email: customEmail,
      })
      .select().single()
    order = data; error = e
  } else {
    const { data, error: e } = await supabase
      .from('video_orders')
      .upsert(
        { booking_id: bookingId, preview_url: previewUrl, full_video_url: fullVideoUrl },
        { onConflict: 'booking_id' }
      )
      .select().single()
    order = data; error = e
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (sendEmail) {
    const firstName = isCustom ? customFirstName : null
    const email = isCustom ? customEmail : null

    let resolvedFirstName = firstName
    let resolvedEmail = email

    if (!isCustom && bookingId) {
      const { data: booking } = await supabase.from('bookings').select('first_name, email').eq('id', bookingId).single()
      resolvedFirstName = booking?.first_name
      resolvedEmail = booking?.email
    }

    if (resolvedEmail) {
      try {
        const previewPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/video/${order.download_token}`
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: resolvedEmail,
          subject: '🎬 Ta vidéo EASYDRIFT est disponible !',
          react: VideoEmail({ firstName: resolvedFirstName || 'toi', previewPageUrl, appUrl: process.env.NEXT_PUBLIC_APP_URL! }),
        })
        await supabase.from('video_orders').update({ email_sent_at: new Date().toISOString() }).eq('id', order.id)
      } catch (err) {
        console.error('Email error:', err)
      }
    }
  }

  return NextResponse.json({ order })
}
