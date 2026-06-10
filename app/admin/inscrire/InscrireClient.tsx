'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2, Zap, Car, Wind, Users, ChevronRight, Minus, Plus } from 'lucide-react'
import type { Activity, Slot } from '@/lib/supabase/types'
import { SlotPicker } from '@/components/client/SlotPicker'
import { formatTime, formatPrice, getDayLabel } from '@/lib/utils'
import { QRCodeSVG } from 'qrcode.react'
import { useEvent } from '@/contexts/EventContext'

const ICONS: Record<string, any> = { bapteme: Zap, conduite: Car, carbooling: Wind, carbooling_passager: Users }

type Step = 1 | 2 | 3 | 'done'

interface Props { activities?: Activity[] }

export function InscrireClient(_props: Props) {
  const { selectedEvent } = useEvent()
  const [activities, setActivities] = useState<Activity[]>([])
  const [step, setStep] = useState<Step>(1)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)

  const eventDays = useMemo(() => {
    if (!selectedEvent?.date_start) return []
    const days: string[] = []
    const start = new Date(selectedEvent.date_start)
    const end = selectedEvent.date_end ? new Date(selectedEvent.date_end) : start
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }, [selectedEvent])

  useEffect(() => {
    if (!selectedEvent) return
    fetch(`/api/admin/activities?event_id=${selectedEvent.id}`)
      .then(r => r.json())
      .then(d => setActivities(d.activities || []))
  }, [selectedEvent?.id])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [qty, setQty] = useState(1)
  const [persons, setPersons] = useState([{ firstName: '', lastName: '' }])
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMode, setPaymentMode] = useState<'cash' | 'terminal' | 'free'>('cash')
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [results, setResults] = useState<{ bookingId: string; ticketCode: string }[]>([])

  function changeQty(n: number) {
    if (!selectedSlot) return
    const available = selectedSlot.capacity - selectedSlot.booked_count
    const next = Math.max(1, Math.min(n, available))
    setQty(next)
    setPersons(prev => {
      if (next > prev.length) return [...prev, ...Array(next - prev.length).fill({ firstName: '', lastName: '' })]
      return prev.slice(0, next)
    })
  }

  async function handleSubmit() {
    if (!selectedActivity || !selectedSlot) return
    if (persons.some(p => !p.firstName.trim() || !p.lastName.trim())) {
      setSubmitError('Tous les prénoms et noms sont requis')
      return
    }
    setLoading(true)
    setSubmitError(null)
    const createdResults: { bookingId: string; ticketCode: string }[] = []

    try {
      for (const person of persons) {
        const resp = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: selectedEvent?.id,
            activityId: selectedActivity.id,
            activityName: selectedActivity.name,
            slotId: selectedSlot.id,
            day: selectedSlot.day,
            startTime: selectedSlot.start_time,
            endTime: selectedSlot.end_time,
            firstName: person.firstName.trim(),
            lastName: person.lastName.trim(),
            email: email.trim().toLowerCase() || '',
            phone: phone.trim() || null,
            paymentMode,
            booked_by_admin: true,
          }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error)
        createdResults.push(data)
      }
      setResults(createdResults)
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
    setSelectedDayIdx(0)
    setSelectedSlot(null)
    setQty(1)
    setPersons([{ firstName: '', lastName: '' }])
    setEmail('')
    setPhone('')
    setSubmitError(null)
    setResults([])
  }

  const available = selectedSlot ? selectedSlot.capacity - selectedSlot.booked_count : 0

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

      {/* Step 1 */}
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

      {/* Step 2 */}
      {step === 2 && selectedActivity && (
        <div className="space-y-4">
          {eventDays.length > 1 && (
            <div className="flex gap-2">
              {eventDays.map((day, idx) => (
                <button key={day} onClick={() => { setSelectedDayIdx(idx); setSelectedSlot(null); setQty(1); setPersons([{ firstName: '', lastName: '' }]) }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${selectedDayIdx === idx ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}>
                  {getDayLabel(day)}
                </button>
              ))}
            </div>
          )}

          <SlotPicker
            activity={selectedActivity}
            day={eventDays[selectedDayIdx] || ''}
            onAdd={slot => {
              if (selectedSlot?.id === slot.id) {
                changeQty(qty + 1)
              } else {
                setSelectedSlot(slot)
                setQty(1)
                setPersons([{ firstName: '', lastName: '' }])
              }
            }}
            basketQtys={selectedSlot ? { [selectedSlot.id]: qty } : {}}
          />

          {selectedSlot && (
            <div className="card p-4 space-y-3">
              <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-widest">
                Nombre de personnes
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => changeQty(qty - 1)}
                  disabled={qty <= 1}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bebas text-2xl text-[var(--text-primary)] w-6 text-center">{qty}</span>
                <button
                  onClick={() => changeQty(qty + 1)}
                  disabled={qty >= available}
                  className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
                <span className="text-[var(--text-secondary)] text-xs">{available} place{available > 1 ? 's' : ''} dispo</span>
              </div>
              <p className="font-bebas text-xl text-[var(--accent)]">
                Total : {formatPrice(qty * selectedActivity.price)}
              </p>
            </div>
          )}

          {selectedSlot && (
            <button onClick={() => setStep(3)} className="btn-cta w-full font-bebas text-lg">
              CONTINUER — {qty} personne{qty > 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && selectedActivity && selectedSlot && (
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-[var(--text-secondary)] text-xs mb-1">Réservation</p>
            <p className="font-semibold text-[var(--text-primary)]">{selectedActivity.label}</p>
            <p className="text-[var(--text-secondary)] text-sm">
              {getDayLabel(selectedSlot.day)} · {formatTime(selectedSlot.start_time)} · {qty} personne{qty > 1 ? 's' : ''}
            </p>
          </div>

          {persons.map((p, i) => (
            <div key={i} className="card p-4">
              <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-3">
                {qty > 1 ? `Personne ${i + 1}` : 'Participant'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Prénom *</label>
                  <input
                    className="input-field"
                    placeholder="Jean"
                    value={p.firstName}
                    onChange={e => setPersons(prev => prev.map((x, j) => j === i ? { ...x, firstName: e.target.value } : x))}
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Nom *</label>
                  <input
                    className="input-field"
                    placeholder="Dupont"
                    value={p.lastName}
                    onChange={e => setPersons(prev => prev.map((x, j) => j === i ? { ...x, lastName: e.target.value } : x))}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="card p-4 space-y-3">
            <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-widest">Contact</p>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Email (optionnel)</label>
              <input className="input-field" type="email" placeholder="email@..." value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Téléphone (optionnel)</label>
              <input className="input-field" type="tel" placeholder="06..." value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-2">Mode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {([{ key: 'cash', label: '💵 Cash' }, { key: 'terminal', label: '💳 Terminal' }, { key: 'free', label: '🎁 Gratuit' }] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMode(key)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    paymentMode === key ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {submitError && <p className="text-red-400 text-sm p-3 rounded-xl bg-red-500/10 border border-red-500/20">{submitError}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || persons.some(p => !p.firstName || !p.lastName)}
            className="btn-cta w-full font-bebas text-lg"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : `INSCRIRE ${qty > 1 ? `${qty} PERSONNES` : ''}`}
          </button>
        </div>
      )}

      {/* Done */}
      {step === 'done' && results.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="font-bebas text-2xl text-[var(--text-primary)] mb-2">
            {results.length > 1 ? `${results.length} inscriptions réussies !` : 'Inscription réussie !'}
          </h2>

          <div className="space-y-4 mt-4">
            {results.map((result, i) => (
              <div key={result.bookingId} className="card p-6">
                {results.length > 1 && (
                  <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-widest mb-3">
                    {persons[i]?.firstName} {persons[i]?.lastName}
                  </p>
                )}
                <p className="font-bebas text-xl tracking-widest text-[var(--text-primary)] mb-4">{result.ticketCode}</p>
                <div className="flex justify-center mb-4">
                  <div className="p-2 bg-white rounded-xl">
                    <QRCodeSVG
                      value={`${process.env.NEXT_PUBLIC_APP_URL}/admin/scanner?code=${result.ticketCode}`}
                      size={140}
                      level="H"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[var(--text-secondary)] text-sm mt-4">Le client peut photographier le QR code</p>
          {email && <p className="text-green-400 text-sm mt-2">✓ Ticket{results.length > 1 ? 's' : ''} envoyé{results.length > 1 ? 's' : ''} à {email}</p>}

          <button onClick={reset} className="btn-cta w-full mt-5 font-bebas text-lg">NOUVELLE INSCRIPTION</button>
        </motion.div>
      )}
    </div>
  )
}
