import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SlotChooserClient } from './SlotChooserClient'

export default async function ReserverPage({ params }: { params: { activity: string } }) {
  const supabase = createClient()
  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('name', params.activity)
    .single()

  if (!activity) notFound()

  return (
    <SlotChooserClient
      activity={activity}
      eventDays={{ saturday: '2026-05-30', sunday: '2026-05-31' }}
    />
  )
}
