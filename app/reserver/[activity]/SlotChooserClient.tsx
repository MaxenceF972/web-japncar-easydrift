'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Minus, Plus } from 'lucide-react'
import type { Activity, Slot } from '@/lib/supabase/types'
import { SlotPicker } from '@/components/client/SlotPicker'
import { formatTime, formatDate, formatPrice, getDayLabel } from '@/lib/utils'

interface BasketEntry { slot: Slot; qty: number }

interface Props {
  activity: Activity
  eventDays: { saturday: string; sunday: string }
}

export function SlotChooserClient({ activity, eventDays }: Props) {
  const router = useRouter()

  const isDayPast = (date: string) => new Date().toISOString().split('T')[0] > date

  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>(
    isDayPast(eventDays.saturday) ? 'sunday' : 'saturday'
  )
  const [basket, setBasket] = useState<Record<string, BasketEntry>>({})

  const days = [
    { key: 'saturday' as const, label: 'Samedi', date: eventDays.saturday },
    { key: 'sunday' as const, label: 'Dimanche', date: eventDays.sunday },
  ]

  function addSlot(slot: Slot) {
    const available = slot.capacity - slot.booked_count
    setBasket(prev => {
      const current = prev[slot.id]?.qty || 0
      if (current >= available) return prev
      return { ...prev, [slot.id]: { slot, qty: current + 1 } }
    })
  }

  function removeOne(slotId: string) {
    setBasket(prev => {
      const current = prev[slotId]?.qty || 0
      if (current <= 1) {
        const { [slotId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [slotId]: { ...prev[slotId], qty: current - 1 } }
    })
  }

  const basketEntries = Object.values(basket)
  const totalQty = basketEntries.reduce((s, e) => s + e.qty, 0)
  const totalPrice = totalQty * activity.price
  const basketQtys = Object.fromEntries(basketEntries.map(e => [e.slot.id, e.qty]))

  function handleContinue() {
    if (totalQty === 0) return
    const slots = basketEntries.flatMap(({ slot, qty }) =>
      Array(qty).fill(null).map(() => ({
        slotId: slot.id,
        day: slot.day,
        startTime: slot.start_time,
        endTime: slot.end_time,
        firstName: '',
        lastName: '',
      }))
    )
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify({
      activityId: activity.id,
      activityName: activity.name,
      activityLabel: activity.label,
      price: activity.price,
      slots,
    }))
    router.push(`/reserver/${activity.name}/infos`)
  }

  return (
    <main className="min-h-dvh pb-40">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-bebas text-xl text-[var(--text-primary)] leading-none">{activity.label}</h1>
            <p className="text-[var(--text-secondary)] text-xs">{formatPrice(activity.price)} / personne</p>
          </div>
          {totalQty > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40">
              <ShoppingCart size={13} className="text-[var(--accent)]" />
              <span className="text-[var(--accent)] text-xs font-bold">{totalQty}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Vidéo */}
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

        {/* Classement Live */}
        {activity.name === 'conduite' && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
            <p className="text-yellow-400 text-sm font-semibold mb-1">🏆 Meilleur temps du weekend</p>
            <p className="text-yellow-300/80 text-xs mb-3">Celui qui réalise le meilleur chrono sur l'ensemble du weekend remporte une journée EASYDRIFT EXPERIENCE sur circuit.</p>
            <a href="/classement" className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/30 transition-colors">
              Voir le classement live →
            </a>
          </div>
        )}

        {/* Panier */}
        <AnimatePresence>
          {basketEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card p-4"
              style={{ borderColor: `${activity.color}40` }}
            >
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                Panier — {totalQty} place{totalQty > 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {basketEntries.map(({ slot, qty }) => (
                  <div key={slot.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[var(--text-primary)] flex-1">
                      {getDayLabel(slot.day)} · {formatTime(slot.start_time)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeOne(slot.id)}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-red-400 transition-colors"
                      >
                        <Minus size={12} className="text-[var(--text-secondary)]" />
                      </button>
                      <span className="font-bebas text-lg w-4 text-center text-[var(--text-primary)]">{qty}</span>
                      <button
                        onClick={() => addSlot(slot)}
                        disabled={(basket[slot.id]?.qty || 0) >= slot.capacity - slot.booked_count}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors disabled:opacity-30"
                      >
                        <Plus size={12} className="text-[var(--text-secondary)]" />
                      </button>
                      <span className="text-sm font-semibold text-[var(--accent)] w-14 text-right">
                        {formatPrice(qty * activity.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choix du jour */}
        <div>
          <h2 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">Choisissez votre jour</h2>
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
                    past ? 'opacity-40 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border)]'
                      : selectedDay === key ? 'bg-[var(--accent)] border-[var(--accent)]'
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

        {/* Créneaux */}
        <div>
          <h2 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">Ajoutez vos créneaux</h2>
          <SlotPicker
            activity={activity}
            day={days.find(d => d.key === selectedDay)!.date}
            onAdd={addSlot}
            basketQtys={basketQtys}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <AnimatePresence>
        {totalQty > 0 && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--bg-primary)]/95 backdrop-blur border-t border-[var(--border)] pb-safe"
          >
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    {totalQty} place{totalQty > 1 ? 's' : ''} sélectionnée{totalQty > 1 ? 's' : ''}
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
