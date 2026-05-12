import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, type, message } = await req.json()

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Utilise la clé anon — suffisant grâce à la politique public_insert
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.from('contacts').insert({
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      phone: phone || null,
      type,
      message,
    })

    if (error) {
      console.error('Contact insert error:', error)
      return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Contact form error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
