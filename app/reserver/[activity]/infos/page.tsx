'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Phone } from 'lucide-react'
import { formatTime, formatPrice, getDayLabel } from '@/lib/utils'
import type { ActivityName } from '@/lib/supabase/types'

interface Draft {
  activityId: string
  activityName: ActivityName
  slotId: string
  day: string
  startTime: string
  endTime: string
}

const ACTIVITY_LABELS: Record<ActivityName, string> = {
  bapteme: 'Baptême EASYDRIFT',
  conduite: 'Session Conduite',
  carbooling: 'Car Booling CLIO',
}

const ACTIVITY_PRICES: Record<ActivityName, number> = {
  bapteme: 4000,
  conduite: 5000,
  carbooling: 2000,
}

export default function InfosPage() {
  const router = useRouter()
  const params = useParams()
  const activityName = params.activity as ActivityName

  const [draft, setDraft] = useState<Draft | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailConfirm: '',
    phone: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('easydrift_booking_draft')
    if (!raw) { router.replace(`/reserver/${activityName}`); return }
    setDraft(JSON.parse(raw))
  }, [activityName, router])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Prénom requis'
    if (!form.lastName.trim()) e.lastName = 'Nom requis'
    if (!form.email.trim()) e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    if (form.email !== form.emailConfirm) e.emailConfirm = 'Les emails ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate() || !draft) return
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify({
      ...draft,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || null,
    }))
    router.push(`/reserver/${activityName}/paiement`)
  }

  if (!draft) return null

  const price = ACTIVITY_PRICES[draft.activityName]

  return (
    <main className="min-h-dvh pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-bebas text-xl text-[var(--text-primary)]">Vos informations</h1>
        </div>
      </div>

      {/* Récap sticky */}
      <div className="max-w-lg mx-auto px-5 py-4">
        <div className="card p-4 flex items-center justify-between mb-6">
          <div>
            <p className="font-semibold text-sm text-[var(--text-primary)]">
              {ACTIVITY_LABELS[draft.activityName]}
            </p>
            <p className="text-[var(--text-secondary)] text-xs">
              {getDayLabel(draft.day)} · {formatTime(draft.startTime)}
            </p>
          </div>
          <span className="font-bebas text-2xl text-[var(--accent)]">{formatPrice(price)}</span>
        </div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Prénom / Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Prénom *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  className={`input-field pl-9 ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Jean"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  autoComplete="given-name"
                />
              </div>
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Nom *</label>
              <input
                className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Dupont"
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                autoComplete="family-name"
              />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Email *</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                className={`input-field pl-9 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="jean.dupont@email.com"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Email confirmation */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Confirmer l'email *</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                className={`input-field pl-9 ${errors.emailConfirm ? 'border-red-500' : ''}`}
                placeholder="jean.dupont@email.com"
                type="email"
                inputMode="email"
                value={form.emailConfirm}
                onChange={e => setForm(f => ({ ...f, emailConfirm: e.target.value }))}
                autoComplete="off"
                onPaste={e => e.preventDefault()}
              />
            </div>
            {errors.emailConfirm && <p className="text-red-400 text-xs mt-1">{errors.emailConfirm}</p>}
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">
              Téléphone <span className="text-[var(--text-secondary)]">(optionnel)</span>
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                className="input-field pl-9"
                placeholder="06 12 34 56 78"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                autoComplete="tel"
              />
            </div>
          </div>

          <p className="text-[var(--text-secondary)] text-xs">
            Votre ticket sera envoyé à l'adresse email renseignée.
          </p>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-cta w-full font-bebas text-lg tracking-widest mt-2"
          >
            PROCÉDER AU PAIEMENT
          </button>
        </motion.div>
      </div>
    </main>
  )
}
