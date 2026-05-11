import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SlotChooserClient } from './SlotChooserClient'
import type { ActivityName } from '@/lib/supabase/types'
import { EVENT_DAYS } from '@/lib/event-config'

interface Props {
  params: { activity: ActivityName }
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
