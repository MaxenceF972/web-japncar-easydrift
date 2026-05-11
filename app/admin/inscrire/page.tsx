import { createServiceClient } from '@/lib/supabase/server'
import { InscrireClient } from './InscrireClient'

export const dynamic = 'force-dynamic'

export default async function InscrirePage() {
  const supabase = createServiceClient()

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .order('price')

  return <InscrireClient activities={activities || []} />
}
