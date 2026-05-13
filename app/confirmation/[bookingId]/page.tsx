import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Ticket } from '@/components/client/Ticket'
import { CheckCircle } from 'lucide-react'

interface Props {
  params: { bookingId: string }
}

export default async function ConfirmationPage({ params }: Props) {
  const supabase = createServiceClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      slot:slots(*),
      activity:activities(*)
    `)
    .eq('id', params.bookingId)
    .single()

  if (!booking) notFound()

  return (
    <main className="min-h-dvh pb-10">
      {/* Header succès */}
      <div className="bg-[var(--bg-primary)] border-b border-[var(--border)] px-5 py-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Réservation confirmée !</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Votre ticket a été envoyé par email
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        <Ticket booking={booking as any} />

        <div className="mt-6 card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Informations pratiques</h3>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>📍 Circuit de Montlhéry, 91310 Linas</p>
            <p>🚗 Parking gratuit sur place</p>
            <p>⏰ Présentez-vous 20 min avant votre créneau</p>
            <p>📱 Votre QR code sera scanné à l'entrée</p>
          </div>
        </div>

        <a href="/" className="btn-secondary w-full mt-4 block text-center">
          Retour à l'accueil
        </a>
      </div>
    </main>
  )
}
