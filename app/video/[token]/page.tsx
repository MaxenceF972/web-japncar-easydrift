import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { VideoClient } from './VideoClient'

export default async function VideoPage({ params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: order } = await supabase
    .from('video_orders')
    .select('*, booking:bookings(first_name, last_name)')
    .eq('download_token', params.token)
    .single() as any

  if (!order || !order.preview_url) notFound()

  return <VideoClient order={order} />
}
