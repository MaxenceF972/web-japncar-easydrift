import { createServiceClient } from '@/lib/supabase/server'
import { ContactsClient } from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = createServiceClient() as any

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) console.error('Contacts fetch error:', error)

  return <ContactsClient contacts={data || []} />
}
