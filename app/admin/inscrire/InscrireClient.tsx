'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Loader2, User, Mail, Phone, Zap, Car, Wind, ChevronRight } from 'lucide-react'
import type { Activity, Slot } from '@/lib/supabase/types'
import { SlotPicker } from '@/components/client/SlotPicker'
import { formatTime, formatPrice, getDayLabel } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { EVENT_DAYS } from '@/lib/event-config'

const ICONS = { bapteme: Zap, conduite: Car, carbooling: Wind }

type Step = 1 | 2 | 3 | 'done'

interface Props {
  activities: Activity[]
}

export function InscrireClient({ activities }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('saturday')
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [paymentMode, setPaymentMode] = useState<'cash' | 'terminal' | 'free'>('cash')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<{ bookingId: string; ticketCode: string } | null>(null)

  async function handleSubmit() {
    if (!selectedActivity || !selectedSlot) return
    setLoading(true)

    try {
      const resp = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          activityName: selectedActivity.name,
          slotId: selectedSlot.id,
          day: selectedSlot.day,
          startTime: selectedSlot.start_time,
          endTime: selectedSlot.end_time,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          paymentMode,
          booked_by_admin: true,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error)
      setResult(data)
      setStep('done')
    } catch (e: any) {
      setSubmitError(e.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(1)
    setSelectedActivity(null)
    setSelectedDay('saturday')
    setSelectedSlot(null)
    setForm({ firstName: '', lastName: '', email: '', phone: '' })
    setSubmitError(null)
    setResult(null)
  }

  return (
    <div className="md:ml-56 p-5 max-w-lg">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-6">Inscription manuelle</h1>

      {/* Step indicators */}
      {step !== 'done' && (
        <div className="flex items-center gap-2 mb-6">
          {([1, 2, 3] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === s ? 'bg-[var(--accent)] text-white' :
                (step as number) > s ? 'bg-green-600 text-white' :
                'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
              }`}>
                {(step as number) > s ? '✓' : s}
              </div>
              {s < 3 && <div className="flex-1 h-px bg-[var(--border)]" style={{ width: 24 }} />}
            </div>
          ))}
          <span className="text-[var(--text-secondary)] text-xs ml-2">
            {step === 1 ? 'Activité' : step === 2 ? 'Créneau' : 'Infos'}
          </span>
        </div>
      )}

      {/* Step 1 : Activité */}
      {step === 1 && (
        <div className="space-y-3">
          {activities.map(activity => {
            const Icon = ICONS[activity.name]
            return (
              <button
                key={activity.id}
                onClick={() => { setSelectedActivity(activity); setStep(2) }}
                className="w-full card p-4 text-left hover:border-[var(--accent)] transition-colors flex items-center justify-between"
                style={{ borderLeft: `3px solid ${activity.color}` }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} style={{ color: activity.color }} />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{activity.label}</p>
                    <p className="text-[var(--text-secondary)] text-sm">{formatPrice(activity.price)}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-secondary)]" />
              </button>
            )
          })}
        </div>
      )}

      {/* Step 2 : Créneau */}
      {step === 2 && selectedActivity && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            {(['saturday', 'sunday'] as const).map(d => (
              <button
                key={d}
                onClick={() => { setSelectedDay(d); setSelectedSlot(null) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  selectedDay === d ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                }`}
              >
                {d === 'saturday' ? 'Samedi' : 'Dimanche'}
              </button>
            ))}
          </div>

          <SlotPicker
            activity={selectedActivity}
            day={EVENT_DAYS[selectedDay]}
            onSelect={setSelectedSlot}
            selectedSlotId={selectedSlot?.id}
          />

          {selectedSlot && (
            <button onClick={() => setStep(3)} className="btn-cta w-full font-bebas text-lg">
              CONTINUER
            </button>
          )}
        </div>
      )}

      {/* Step 3 : Infos */}
      {step === 3 && selectedActivity && selectedSlot && (
        <div className="space-y-4">
          {/* Récap */}
          <div className="card p-4">
            <p className="text-[var(--text-secondary)] text-xs mb-1">Réservation</p>
            <p className="font-semibold text-[var(--text-primary)]">{selectedActivity.label}</p>
            <p className="text-[var(--text-secondary)] text-sm">
              {getDayLabel(selectedSlot.day)} · {formatTime(selectedSlot.start_time)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Prénom *</label>
              <input className="input-field" placeholder="Jean" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Nom *</label>
              <input className="input-field" placeholder="Dupont" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Email (optionnel)</label>
            <input className="input-field" type="email" placeholder="email@..." value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Téléphone (optionnel)</label>
            <input className="input-field" type="tel" placeholder="06..." value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>

          {/* Mode paiement */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-2">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: 'cash',     label: '💵 Cash' },
                { key: 'terminal', label: '💳 Terminal' },
                { key: 'free',     label: '🎁 Gratuit' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMode(key)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    paymentMode === key
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                      : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {submitError && (
            <p className="text-red-400 text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20">{submitError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !form.firstName || !form.lastName}
            className="btn-cta w-full font-bebas text-lg"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'INSCRIRE'}
          </button>
        </div>
      )}

      {/* Done */}
      {step === 'done' && result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="font-bebas text-2xl text-[var(--text-primary)] mb-2">Inscription réussie !</h2>

          <div className="card p-6 mt-4">
            <p className="font-bebas text-xl tracking-widest text-[var(--text-primary)] mb-4">
              {result.ticketCode}
            </p>
            <div className="flex justify-center mb-4">
              <div className="p-2 bg-white rounded-xl">
                <QRCodeSVG
                  value={`${process.env.NEXT_PUBLIC_APP_URL}/admin/scanner?code=${result.ticketCode}`}
                  size={160}
                  level="H"
                />
              </div>
            </div>
            <p className="font-semibold text-[var(--text-primary)] text-sm mt-3">{selectedActivity?.label}</p>
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              {selectedSlot && `${formatTime(selectedSlot.start_time)} — ${formatTime(selectedSlot.end_time)}`}
            </p>
            <p className="text-[var(--text-secondary)] text-sm mt-3">
              Le client peut photographier ce QR code
            </p>
            {form.email && (
              <p className="text-green-400 text-sm mt-2">
                ✓ Ticket envoyé à {form.email}
              </p>
            )}
          </div>

          <button onClick={reset} className="btn-cta w-full mt-5 font-bebas text-lg">
            NOUVELLE INSCRIPTION
          </button>
        </motion.div>
      )}
    </div>
  )
}
