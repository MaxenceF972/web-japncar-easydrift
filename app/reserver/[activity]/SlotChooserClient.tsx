'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingCart, X } from 'lucide-react'
import type { Activity, Slot } from '@/lib/supabase/types'
import { SlotPicker } from '@/components/client/SlotPicker'
import { formatTime, formatDate, formatPrice, getDayLabel } from '@/lib/utils'

interface Props {
  activity: Activity
  eventDays: { saturday: string; sunday: string }
}

export function SlotChooserClient({ activity, eventDays }: Props) {
  const router = useRouter()

  const isDayPast = (date: string) => {
    const today = new Date().toISOString().split('T')[0]
    return date < today
  }

  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>(
    isDayPast(eventDays.saturday) ? 'sunday' : 'saturday'
  )
  const [basket, setBasket] = useState<Slot[]>([])

  const days = [
    { key: 'saturday' as const, label: 'Samedi', date: eventDays.saturday },
    { key: 'sunday' as const, label: 'Dimanche', date: eventDays.sunday },
  ]

  function toggleSlot(slot: Slot) {
    setBasket(prev =>
      prev.some(s => s.id === slot.id)
        ? prev.filter(s => s.id !== slot.id)
        : [...prev, slot]
    )
  }

  function handleContinue() {
    if (basket.length === 0) return
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify({
      activityId: activity.id,
      activityName: activity.name,
      activityLabel: activity.label,
      price: activity.price,
      slots: basket.map(s => ({
        slotId: s.id,
        day: s.day,
        startTime: s.start_time,
        endTime: s.end_time,
        firstName: '',
        lastName: '',
      })),
    }))
    router.push(`/reserver/${activity.name}/infos`)
  }

  const totalPrice = basket.length * activity.price

  return (
    <main className="min-h-dvh pb-40">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-bebas text-xl text-[var(--text-primary)] leading-none">{activity.label}</h1>
            <p className="text-[var(--text-secondary)] text-xs">{formatPrice(activity.price)} / personne</p>
          </div>
          {basket.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40">
              <ShoppingCart size={13} className="text-[var(--accent)]" />
              <span className="text-[var(--accent)] text-xs font-bold">{basket.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Vidéo de présentation */}
        {(activity.name === 'bapteme' || activity.name === 'carbooling') && (
          <video
            src={activity.name === 'bapteme'
              ? "https://qsffevqpozlmjpfbqiib.supabase.co/storage/v1/object/public/media/bapteme-easydrift.mp4"
              : "https://qsffevqpozlmjpfbqiib.supabase.co/storage/v1/object/public/media/car-booling.mp4"}
            autoPlay muted loop playsInline
            className="w-full rounded-2xl object-cover"
            style={{ maxHeight: '220px' }}
          />
        )}

        {/* Classement Live — Session Conduite uniquement */}
        {activity.name === 'conduite' && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
            <p className="text-yellow-400 text-sm font-semibold mb-1">🏆 Meilleur temps du weekend</p>
            <p className="text-yellow-300/80 text-xs mb-3">Celui qui réalise le meilleur chrono sur l'ensemble du weekend remporte une journée EASYDRIFT EXPERIENCE sur circuit.</p>
            <a href="/classement" className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/30 transition-colors">
              Voir le classement live →
            </a>
          </div>
        )}

        {/* Panier actuel */}
        <AnimatePresence>
          {basket.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card p-4 border-[var(--accent)]/30"
            >
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                Panier — {basket.length} créneau{basket.length > 1 ? 'x' : ''}
              </p>
              <div className="space-y-2">
                {basket.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-primary)]">
                      {getDayLabel(slot.day)} · {formatTime(slot.start_time)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--accent)]">{formatPrice(activity.price)}</span>
                      <button onClick={() => toggleSlot(slot)} className="w-5 h-5 rounded flex items-center justify-center hover:text-red-400 transition-colors">
                        <X size={12} className="text-[var(--text-secondary)]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choix du jour */}
        <div>
          <h2 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">
            Choisissez votre jour
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {days.map(({ key, label, date }) => {
              const past = isDayPast(date)
              return (
                <button
                  key={key}
                  onClick={() => !past && setSelectedDay(key)}
                  disabled={past}
                  className={[
                    'p-4 rounded-xl border transition-all duration-200 text-left',
                    past
                      ? 'opacity-40 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border)]'
                      : selectedDay === key
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]',
                  ].join(' ')}
                >
                  <p className="font-bebas text-xl leading-none">{label}</p>
                  <p className="text-xs mt-1 opacity-70">{past ? 'Journée terminée' : formatDate(date)}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Choix du créneau */}
        <div>
          <h2 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">
            Ajoutez vos créneaux
          </h2>
          <SlotPicker
            activity={activity}
            day={days.find(d => d.key === selectedDay)!.date}
            onToggle={toggleSlot}
            selectedSlotIds={basket.map(s => s.id)}
          />
        </div>
      </div>

      {/* Sticky footer CTA */}
      <AnimatePresence>
        {basket.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--bg-primary)]/95 backdrop-blur border-t border-[var(--border)] pb-safe"
          >
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    {basket.length} créneau{basket.length > 1 ? 'x' : ''} sélectionné{basket.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[var(--text-secondary)] text-xs">{activity.label}</p>
                </div>
                <span className="font-bebas text-2xl text-[var(--accent)]">{formatPrice(totalPrice)}</span>
              </div>
              <button onClick={handleContinue} className="btn-cta w-full font-bebas text-lg tracking-widest">
                CONTINUER
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
