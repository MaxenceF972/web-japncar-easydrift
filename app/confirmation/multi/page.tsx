import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { Ticket } from '@/components/client/Ticket'
import { CheckCircle } from 'lucide-react'

interface Props {
  searchParams: { ids?: string }
}

export default async function MultiConfirmationPage({ searchParams }: Props) {
  const ids = searchParams.ids?.split(',').filter(Boolean) || []
  if (!ids.length) notFound()

  const supabase = createServiceClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, slot:slots(*), activity:activities(*)')
    .in('id', ids) as { data: any[] | null }

  if (!bookings?.length) notFound()

  return (
    <main className="min-h-dvh pb-10">
      {/* Header */}
      <div className="bg-[var(--bg-primary)] border-b border-[var(--border)] px-5 py-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">
          {bookings.length} réservation{bookings.length > 1 ? 's' : ''} confirmée{bookings.length > 1 ? 's' : ''} !
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          {bookings.length} ticket{bookings.length > 1 ? 's' : ''} envoyé{bookings.length > 1 ? 's' : ''} par email
        </p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-4">
        {bookings.map((booking, i) => (
          <div key={booking.id}>
            {bookings.length > 1 && (
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                Ticket {i + 1}
              </p>
            )}
            <Ticket booking={booking as any} />
          </div>
        ))}

        <div className="card p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-3">Informations pratiques</h3>
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>📍 Circuit de Montlhéry, 91310 Linas</p>
            <p>🚗 Parking gratuit sur place</p>
            <p>⏰ Présentez-vous 20 min avant votre créneau</p>
            <p>📱 Votre QR code sera scanné à l'entrée</p>
          </div>
        </div>

        <a href="/" className="btn-secondary w-full block text-center">
          Retour à l'accueil
        </a>
      </div>
    </main>
  )
}
