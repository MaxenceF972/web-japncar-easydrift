'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Minus, Plus, ArrowRight } from 'lucide-react'
import type { Activity, Slot } from '@/lib/supabase/types'
import { SlotPicker } from '@/components/client/SlotPicker'
import { formatTime, formatDate, formatPrice, getDayLabel } from '@/lib/utils'

const CART_KEY = 'easydrift_cart'

interface SlotEntry {
  slotId: string; day: string; startTime: string; endTime: string
  activityId: string; activityName: string; activityLabel: string; price: number
  firstName: string; lastName: string
}

interface CartActivity {
  activityId: string; activityName: string; activityLabel: string; price: number
  basket: Record<string, { slot: Slot; qty: number }>
}

type Cart = Record<string, CartActivity>

function readCart(): Cart {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY) || '{}') } catch { return {} }
}
function writeCart(cart: Cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
}

interface Props {
  activity: Activity
  eventDays: { saturday: string; sunday: string }
}

export function SlotChooserClient({ activity, eventDays }: Props) {
  const router = useRouter()
  const isDayPast = (date: string) => new Date().toISOString().split('T')[0] > date

  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('sunday')
  const [basket, setBasket] = useState<Record<string, { slot: Slot; qty: number }>>({})
  const [otherActivities, setOtherActivities] = useState<CartActivity[]>([])

  const days = [
    { key: 'saturday' as const, label: 'Samedi', date: eventDays.saturday },
    { key: 'sunday' as const, label: 'Dimanche', date: eventDays.sunday },
  ]

  // Load current activity basket from global cart on mount
  useEffect(() => {
    const cart = readCart()
    const mine = cart[activity.name]
    if (mine?.basket) setBasket(mine.basket)
    setOtherActivities(Object.values(cart).filter(c => c.activityName !== activity.name && Object.keys(c.basket).length > 0))
  }, [activity.name])

  // Persist basket to global cart whenever it changes
  useEffect(() => {
    const cart = readCart()
    if (Object.keys(basket).length === 0) {
      delete cart[activity.name]
    } else {
      cart[activity.name] = {
        activityId: activity.id,
        activityName: activity.name,
        activityLabel: activity.label,
        price: activity.price,
        basket,
      }
    }
    writeCart(cart)
  }, [basket, activity])

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
      if (current <= 1) { const { [slotId]: _, ...rest } = prev; return rest }
      return { ...prev, [slotId]: { ...prev[slotId], qty: current - 1 } }
    })
  }

  const basketEntries = Object.values(basket)
  const myQty = basketEntries.reduce((s, e) => s + e.qty, 0)
  const myTotal = myQty * activity.price
  const basketQtys = Object.fromEntries(basketEntries.map(e => [e.slot.id, e.qty]))

  const otherQty = otherActivities.reduce((s, a) => s + Object.values(a.basket).reduce((ss, e) => ss + e.qty, 0), 0)
  const otherTotal = otherActivities.reduce((s, a) => s + Object.values(a.basket).reduce((ss, e) => ss + e.qty * a.price, 0), 0)
  const totalCartQty = myQty + otherQty
  const totalCartPrice = myTotal + otherTotal

  function handleCheckout() {
    const cart = readCart()
    // Update current activity in cart first
    if (Object.keys(basket).length > 0) {
      cart[activity.name] = { activityId: activity.id, activityName: activity.name, activityLabel: activity.label, price: activity.price, basket }
    }
    // Flatten all cart items to slots array
    const slots: SlotEntry[] = []
    for (const cartActivity of Object.values(cart)) {
      for (const { slot, qty } of Object.values(cartActivity.basket)) {
        for (let i = 0; i < qty; i++) {
          slots.push({
            slotId: slot.id, day: slot.day, startTime: slot.start_time, endTime: slot.end_time,
            activityId: cartActivity.activityId, activityName: cartActivity.activityName,
            activityLabel: cartActivity.activityLabel, price: cartActivity.price,
            firstName: '', lastName: '',
          })
        }
      }
    }
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify({ slots }))
    router.push(`/reserver/${activity.name}/infos`)
  }

  return (
    <main className="min-h-dvh pb-44">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-bebas text-xl text-[var(--text-primary)] leading-none">{activity.label}</h1>
            <p className="text-[var(--text-secondary)] text-xs">{formatPrice(activity.price)} / personne</p>
          </div>
          {totalCartQty > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40">
              <ShoppingCart size={13} className="text-[var(--accent)]" />
              <span className="text-[var(--accent)] text-xs font-bold">{totalCartQty}</span>
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
            autoPlay muted loop playsInline className="w-full rounded-2xl object-cover" style={{ maxHeight: '220px' }}
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

        {/* Autres activités dans le panier */}
        {otherActivities.length > 0 && (
          <div className="card p-4 border-green-500/20 bg-green-500/5">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">Déjà dans votre panier</p>
            {otherActivities.map(a => {
              const qty = Object.values(a.basket).reduce((s, e) => s + e.qty, 0)
              return (
                <p key={a.activityName} className="text-sm text-[var(--text-secondary)]">
                  {a.activityLabel} · {qty} place{qty > 1 ? 's' : ''} · {formatPrice(qty * a.price)}
                </p>
              )
            })}
          </div>
        )}

        {/* Panier activité courante */}
        <AnimatePresence>
          {basketEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="card p-4" style={{ borderColor: `${activity.color}40` }}
            >
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                {activity.label} — {myQty} place{myQty > 1 ? 's' : ''}
              </p>
              <div className="space-y-3">
                {basketEntries.map(({ slot, qty }) => (
                  <div key={slot.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-[var(--text-primary)] flex-1">
                      <span className="text-[var(--text-secondary)] text-xs block">{activity.label}</span>
                      {getDayLabel(slot.day)} · {formatTime(slot.start_time)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeOne(slot.id)} className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-red-400 transition-colors">
                        <Minus size={12} className="text-[var(--text-secondary)]" />
                      </button>
                      <span className="font-bebas text-lg w-4 text-center text-[var(--text-primary)]">{qty}</span>
                      <button onClick={() => addSlot(slot)} disabled={(basket[slot.id]?.qty || 0) >= slot.capacity - slot.booked_count}
                        className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors disabled:opacity-30">
                        <Plus size={12} className="text-[var(--text-secondary)]" />
                      </button>
                      <span className="text-sm font-semibold text-[var(--accent)] w-14 text-right">{formatPrice(qty * activity.price)}</span>
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
                <button key={key} onClick={() => !past && setSelectedDay(key)} disabled={past}
                  className={['p-4 rounded-xl border transition-all duration-200 text-left',
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
            onAdd={slot => {
              if (basket[slot.id]) addSlot(slot)
              else addSlot(slot)
            }}
            basketQtys={basketQtys}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <AnimatePresence>
        {totalCartQty > 0 && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-5 bg-[var(--bg-primary)]/95 backdrop-blur border-t border-[var(--border)] pb-safe"
          >
            <div className="max-w-lg mx-auto space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{totalCartQty} place{totalCartQty > 1 ? 's' : ''} au total</p>
                  <p className="text-[var(--text-secondary)] text-xs">
                    {[myQty > 0 && `${activity.label} (${myQty})`, ...otherActivities.filter(a => Object.keys(a.basket).length > 0).map(a => `${a.activityLabel} (${Object.values(a.basket).reduce((s, e) => s + e.qty, 0)})`)].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="font-bebas text-2xl text-[var(--accent)]">{formatPrice(totalCartPrice)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Autre activité
                </button>
                <button onClick={handleCheckout} className="btn-cta font-bebas text-lg flex items-center justify-center gap-2">
                  PAYER <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
