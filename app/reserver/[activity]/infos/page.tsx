'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { formatTime, formatPrice, getDayLabel } from '@/lib/utils'

interface SlotDraft {
  slotId: string
  day: string
  startTime: string
  endTime: string
  activityId?: string
  activityName?: string
  activityLabel?: string
  price?: number
  firstName: string
  lastName: string
}

interface Draft {
  activityId?: string
  activityName?: string
  activityLabel?: string
  price?: number
  slots: SlotDraft[]
}

export default function InfosPage() {
  const router = useRouter()
  const params = useParams()
  const activityName = params.activity as string

  const [draft, setDraft] = useState<Draft | null>(null)
  const [names, setNames] = useState<{ firstName: string; lastName: string }[]>([])
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('easydrift_booking_draft')
    if (!raw) { router.replace(`/reserver/${activityName}`); return }
    const d: Draft = JSON.parse(raw)
    if (!d.slots?.length) { router.replace(`/reserver/${activityName}`); return }
    setDraft(d)
    setNames(d.slots.map(s => ({ firstName: s.firstName || '', lastName: s.lastName || '' })))
  }, [activityName, router])

  function validate() {
    const e: Record<string, string> = {}
    names.forEach((n, i) => {
      if (!n.firstName.trim()) e[`firstName_${i}`] = 'Prénom requis'
      if (!n.lastName.trim()) e[`lastName_${i}`] = 'Nom requis'
    })
    if (!email.trim()) e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide'
    if (email !== emailConfirm) e.emailConfirm = 'Les emails ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate() || !draft) return
    const updatedDraft: Draft = {
      ...draft,
      slots: draft.slots.map((s, i) => ({
        ...s,
        firstName: names[i].firstName.trim(),
        lastName: names[i].lastName.trim(),
      })),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
    } as any
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify(updatedDraft))
    router.push(`/reserver/${activityName}/paiement`)
  }

  if (!draft) return null

  const totalPrice = draft.slots.reduce((s, slot) => s + (slot.price ?? draft.price ?? 0), 0)
  const multiSlot = draft.slots.length > 1

  return (
    <main className="min-h-dvh pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bebas text-xl text-[var(--text-primary)]">Vos informations</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-4">
        {/* Récap */}
        <div className="card p-4 flex items-center justify-between mb-6">
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">{draft.activityLabel}</p>
            <p className="text-[var(--text-secondary)] text-xs">
              {draft.slots.length} créneau{draft.slots.length > 1 ? 'x' : ''}
            </p>
          </div>
          <span className="font-bebas text-2xl text-[var(--accent)]">{formatPrice(totalPrice)}</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Un nom par créneau */}
          {draft.slots.map((slot, i) => (
            <div key={slot.slotId} className="card p-4">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                {multiSlot ? `Créneau ${i + 1} — ` : ''}{getDayLabel(slot.day)} · {formatTime(slot.startTime)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Prénom *</label>
                  <input
                    className={`input-field ${errors[`firstName_${i}`] ? 'border-red-500' : ''}`}
                    placeholder="Jean"
                    value={names[i]?.firstName || ''}
                    onChange={e => setNames(prev => prev.map((n, j) => j === i ? { ...n, firstName: e.target.value } : n))}
                    autoComplete="given-name"
                  />
                  {errors[`firstName_${i}`] && <p className="text-red-400 text-xs mt-1">{errors[`firstName_${i}`]}</p>}
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Nom *</label>
                  <input
                    className={`input-field ${errors[`lastName_${i}`] ? 'border-red-500' : ''}`}
                    placeholder="Dupont"
                    value={names[i]?.lastName || ''}
                    onChange={e => setNames(prev => prev.map((n, j) => j === i ? { ...n, lastName: e.target.value } : n))}
                    autoComplete="family-name"
                  />
                  {errors[`lastName_${i}`] && <p className="text-red-400 text-xs mt-1">{errors[`lastName_${i}`]}</p>}
                </div>
              </div>
            </div>
          ))}

          {/* Email + Tel (partagés) */}
          <div className="card p-4 space-y-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">
              Coordonnées {multiSlot ? '(contact principal)' : ''}
            </p>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Email *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="jean.dupont@email.com"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Confirmer l'email *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  className={`input-field pl-9 ${errors.emailConfirm ? 'border-red-500' : ''}`}
                  placeholder="jean.dupont@email.com"
                  type="email"
                  inputMode="email"
                  value={emailConfirm}
                  onChange={e => setEmailConfirm(e.target.value)}
                  autoComplete="off"
                  onPaste={e => e.preventDefault()}
                />
              </div>
              {errors.emailConfirm && <p className="text-red-400 text-xs mt-1">{errors.emailConfirm}</p>}
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Téléphone <span className="opacity-60">(optionnel)</span></label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  className="input-field pl-9"
                  placeholder="06 12 34 56 78"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] text-xs">
            {multiSlot
              ? `${draft.slots.length} tickets seront envoyés à cette adresse email.`
              : 'Votre ticket sera envoyé à cette adresse email.'
            }
          </p>

          <button onClick={handleSubmit} className="btn-cta w-full font-bebas text-lg tracking-widest mt-2">
            PROCÉDER AU PAIEMENT — {formatPrice(totalPrice)}
          </button>
        </motion.div>
      </div>
    </main>
  )
}
