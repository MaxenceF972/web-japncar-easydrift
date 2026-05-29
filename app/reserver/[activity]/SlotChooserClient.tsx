'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import type { Activity, Slot } from '@/lib/supabase/types'
import { SlotPicker } from '@/components/client/SlotPicker'
import { formatTime, formatDate, formatPrice, getDayLabel } from '@/lib/utils'

interface Props {
  activity: Activity
  eventDays: { saturday: string; sunday: string }
}

export function SlotChooserClient({ activity, eventDays }: Props) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('saturday')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const days = [
    { key: 'saturday' as const, label: 'Samedi', date: eventDays.saturday },
    { key: 'sunday' as const, label: 'Dimanche', date: eventDays.sunday },
  ]

  function handleContinue() {
    if (!selectedSlot) return
    // Stocker la sélection en sessionStorage pour la suite du flow
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify({
      activityId: activity.id,
      activityName: activity.name,
      slotId: selectedSlot.id,
      day: selectedSlot.day,
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
    }))
    router.push(`/reserver/${activity.name}/infos`)
  }

  return (
    <main className="min-h-dvh pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-bebas text-xl text-[var(--text-primary)] leading-none">
              {activity.label}
            </h1>
            <p className="text-[var(--text-secondary)] text-xs">{formatPrice(activity.price)} / personne</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Vidéo de présentation */}
        {(activity.name === 'bapteme' || activity.name === 'carbooling') && (
          <video
            src={activity.name === 'bapteme'
              ? "https://qsffevqpozlmjpfbqiib.supabase.co/storage/v1/object/public/media/bapteme-easydrift.mp4"
              : "https://qsffevqpozlmjpfbqiib.supabase.co/storage/v1/object/public/media/car-booling.mp4"}
            autoPlay
            muted
            loop
            playsInline
            className="w-full rounded-2xl object-cover"
            style={{ maxHeight: '220px' }}
          />
        )}

        {/* Classement Live — Session Conduite uniquement */}
        {activity.name === 'conduite' && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
            <p className="text-yellow-400 text-sm font-semibold mb-1">🏆 Meilleur temps du weekend</p>
            <p className="text-yellow-300/80 text-xs mb-3">Celui qui réalise le meilleur chrono sur l'ensemble du weekend remporte une journée EASYDRIFT EXPERIENCE sur circuit.</p>
            <a
              href="/classement"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/30 transition-colors"
            >
              Voir le classement live →
            </a>
          </div>
        )}

        {/* Choix du jour */}
        <div>
          <h2 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">
            Choisissez votre jour
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {days.map(({ key, label, date }) => (
              <button
                key={key}
                onClick={() => { setSelectedDay(key); setSelectedSlot(null) }}
                className={[
                  'p-4 rounded-xl border transition-all duration-200 text-left',
                  selectedDay === key
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]',
                ].join(' ')}
              >
                <p className="font-bebas text-xl leading-none">{label}</p>
                <p className="text-xs mt-1 opacity-70">{formatDate(date)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Choix du créneau */}
        <div className={selectedSlot ? 'pb-36' : ''}>
          <h2 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">
            Choisissez votre créneau
          </h2>
          <SlotPicker
            activity={activity}
            day={days.find(d => d.key === selectedDay)!.date}
            onSelect={setSelectedSlot}
            selectedSlotId={selectedSlot?.id}
          />
        </div>
      </div>

      {/* Sticky footer CTA */}
      {selectedSlot && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--bg-primary)]/95 backdrop-blur border-t border-[var(--border)] pb-safe"
        >
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">
                  {getDayLabel(selectedSlot.day)} — {formatTime(selectedSlot.start_time)}
                </p>
                <p className="text-[var(--text-secondary)] text-xs">{activity.label}</p>
              </div>
              <span className="font-bebas text-2xl text-[var(--accent)]">
                {formatPrice(activity.price)}
              </span>
            </div>
            <button onClick={handleContinue} className="btn-cta w-full font-bebas text-lg tracking-widest">
              CONTINUER
            </button>
          </div>
        </motion.div>
      )}
    </main>
  )
}
