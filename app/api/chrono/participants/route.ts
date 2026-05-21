import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient() as any

    // Récupère toutes les réservations conduite via jointure slots → activities
    const { data, error } = await supabase
      .from('bookings')
      .select('id, first_name, last_name, day, slots(activity_id, activities(name))')
      .in('payment_status', ['paid', 'cash', 'terminal', 'free'])
      .order('last_name')

    if (error) {
      console.error('Participants query error:', error)
      return NextResponse.json({ participants: [], error: error.message })
    }

    const conduite = (data || []).filter(
      (b: any) => b.slots?.activities?.name === 'conduite'
    )

    return NextResponse.json({ participants: conduite })
  } catch (e: any) {
    console.error('Participants route error:', e)
    return NextResponse.json({ participants: [] })
  }
}
