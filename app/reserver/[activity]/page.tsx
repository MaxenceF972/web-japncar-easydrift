import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SlotChooserClient } from './SlotChooserClient'
import type { ActivityName } from '@/lib/supabase/types'

interface Props {
  params: { activity: ActivityName }
}

// Dates de l'événement — à adapter
export const EVENT_DAYS = {
  saturday: '2026-05-30',
  sunday: '2026-05-31',
}

export default async function ReserverPage({ params }: Props) {
  const { activity: activityName } = params

  const supabase = createClient()
  const { data: activity } = await supabase
    .from('activities')
    .select('*')
    .eq('name', activityName)
    .single()

  if (!activity) notFound()

  return <SlotChooserClient activity={activity} eventDays={EVENT_DAYS} />
}
