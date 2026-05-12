'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, AlertCircle, Loader2 } from 'lucide-react'
import { formatTime, formatPrice, getDayLabel } from '@/lib/utils'
import type { ActivityName } from '@/lib/supabase/types'

const ACTIVITY_LABELS: Record<ActivityName, string> = {
  bapteme: 'Baptême EASYDRIFT',
  conduite: 'Session Conduite',
  carbooling: 'Car Booling',
}

const ACTIVITY_PRICES: Record<ActivityName, number> = {
  bapteme: 4000,
  conduite: 5000,
  carbooling: 100,
}

export default function PaiementPage() {
  const router = useRouter()
  const params = useParams()
  const activityName = params.activity as ActivityName

  const [draft, setDraft] = useState<any>(null)
  const [checkoutId, setCheckoutId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const sumupContainerRef = useRef<HTMLDivElement>(null)
  const widgetMountedRef = useRef(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('easydrift_booking_draft')
    if (!raw) { router.replace(`/reserver/${activityName}`); return }
    const d = JSON.parse(raw)
    if (!d.firstName) { router.replace(`/reserver/${activityName}/infos`); return }
    setDraft(d)
    createCheckout(d)
  }, [])

  // Monter le widget uniquement après que le div soit rendu dans le DOM
  useEffect(() => {
    if (!checkoutId || loading || widgetMountedRef.current) return
    widgetMountedRef.current = true
    loadSumUpWidget(checkoutId)
  }, [checkoutId, loading])

  async function createCheckout(d: any) {
    setLoading(true)
    setError(null)
    widgetMountedRef.current = false
    try {
      const resp = await fetch('/api/sumup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName: d.activityName,
          slotId: d.slotId,
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Erreur lors de la création du paiement')
      setCheckoutId(data.checkoutId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function loadSumUpWidget(id: string) {
    // Supprimer l'ancien script si présent (retry)
    const existing = document.getElementById('sumup-sdk')
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = 'sumup-sdk'
    script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.SumUpCard) {
        // @ts-ignore
        window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId: id,
          onResponse: handleSumUpResponse,
          locale: 'fr-FR',
        })
      }
    }
    document.body.appendChild(script)
  }

  async function handleSumUpResponse(type: string, _body: any) {
    if (type === 'success') {
      // Confirmer la réservation côté serveur
      try {
        const resp = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...draft, checkoutId }),
        })
        const data = await resp.json()
        if (!resp.ok) throw new Error(data.error)
        sessionStorage.removeItem('easydrift_booking_draft')
        router.push(`/confirmation/${data.bookingId}`)
      } catch (e: any) {
        setError(`Paiement reçu mais erreur : ${e.message || 'inconnue'}. Contactez-nous.`)
      }
    } else if (type === 'error') {
      setError('Le paiement a échoué. Veuillez réessayer.')
    }
  }

  if (!draft) return null

  const price = ACTIVITY_PRICES[draft.activityName as ActivityName]

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
          <h1 className="font-bebas text-xl text-[var(--text-primary)]">Paiement sécurisé</h1>
          <Lock size={16} className="text-green-500 ml-auto" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Récap */}
        <div className="card p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {ACTIVITY_LABELS[draft.activityName as ActivityName]}
              </p>
              <p className="text-[var(--text-secondary)] text-sm">
                {getDayLabel(draft.day)} · {formatTime(draft.startTime)}
              </p>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                {draft.firstName} {draft.lastName}
              </p>
            </div>
            <div className="text-right">
              <span className="font-bebas text-3xl text-[var(--accent)]">{formatPrice(price)}</span>
              <p className="text-[var(--text-secondary)] text-xs">TTC</p>
            </div>
          </div>
        </div>

        {/* Widget SumUp */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
            <p className="text-[var(--text-secondary)] text-sm">Chargement du paiement...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-5 border-red-500/30"
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-400">Erreur</p>
                <p className="text-[var(--text-secondary)] text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => draft && createCheckout(draft)}
              className="btn-cta w-full mt-4"
            >
              Réessayer
            </button>
          </motion.div>
        ) : (
          <div
            ref={sumupContainerRef}
            id="sumup-card"
            className="min-h-[300px]"
            style={{ colorScheme: 'dark' }}
          />
        )}

        <p className="text-[var(--text-secondary)] text-xs text-center flex items-center justify-center gap-1.5">
          <Lock size={12} />
          Paiement sécurisé par SumUp · Vos données bancaires ne sont jamais stockées
        </p>
      </div>
    </main>
  )
}
