import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SlotChooserClient } from './SlotChooserClient'
import { WalkinClient } from './WalkinClient'

export default async function ReserverPage({ params }: { params: { activity: string } }) {
  const supabase = createClient()
  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('name', params.activity)
    .eq('admin_only', false)
    .single()

  if (!activity) notFound()

  if ((activity as any).type === 'walkin') {
    return <WalkinClient activity={activity as any} />
  }

  // Fetch event dates for the slot chooser
  const { data: event } = await supabase
    .from('events')
    .select('date_start, date_end')
    .eq('id', (activity as any).event_id)
    .single()

  const e = event as { date_start: string | null; date_end: string | null } | null
  const eventDays = {
    saturday: e?.date_start || '2026-05-30',
    sunday: e?.date_end || e?.date_start || '2026-05-31',
  }

  return (
    <SlotChooserClient
      activity={activity as any}
      eventDays={eventDays}
    />
  )
}
