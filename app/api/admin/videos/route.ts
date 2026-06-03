import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { VideoEmail } from '@/emails/VideoEmail'

export async function GET() {
  const supabase = createServiceClient() as any

  const { data: activities } = await supabase.from('activities').select('id').eq('name', 'bapteme')
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
    .in('booking_id', bookingIds)

  const ordersByBooking = Object.fromEntries((orders || []).map((o: any) => [o.booking_id, o]))

  return NextResponse.json({
    bookings: (bookings || []).map((b: any) => ({
      ...b,
      video_order: ordersByBooking[b.id] || null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient() as any
  const { bookingId, previewUrl, fullVideoUrl, sendEmail } = await req.json()

  if (!bookingId) return NextResponse.json({ error: 'bookingId requis' }, { status: 400 })

  // Upsert video_order
  const { data: order, error } = await supabase
    .from('video_orders')
    .upsert(
      { booking_id: bookingId, preview_url: previewUrl, full_video_url: fullVideoUrl },
      { onConflict: 'booking_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (sendEmail) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('first_name, email')
      .eq('id', bookingId)
      .single()

    if (booking?.email) {
      try {
        const previewPageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/video/${order.download_token}`
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: booking.email,
          subject: '🎬 Ta vidéo EASYDRIFT est disponible !',
          react: VideoEmail({
            firstName: booking.first_name,
            previewPageUrl,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
        })
        await supabase
          .from('video_orders')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', order.id)
      } catch (err) {
        console.error('Email error:', err)
      }
    }
  }

  return NextResponse.json({ order })
}
