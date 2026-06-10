'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Activity } from '@/lib/supabase/types'
import { formatPrice } from '@/lib/utils'

interface Props {
  activity: Activity
}

export function WalkinClient({ activity }: Props) {
  const router = useRouter()
  const [qty, setQty] = useState(1)

  function handleReserve() {
    const slots = Array.from({ length: qty }, () => ({
      walkin: true,
      activityId: activity.id,
      activityName: activity.name,
      activityLabel: activity.label,
      price: activity.price,
      firstName: '',
      lastName: '',
    }))
    sessionStorage.setItem('easydrift_booking_draft', JSON.stringify({
      walkin: true,
      activityId: activity.id,
      activityName: activity.name,
      activityLabel: activity.label,
      price: activity.price,
      slots,
    }))
    router.push(`/reserver/${activity.name}/infos`)
  }

  return (
    <main className="min-h-dvh pb-10">
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <button onClick={() => router.push('/')}
            className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="font-bebas text-xl text-[var(--text-primary)] leading-none">{activity.label}</h1>
            <p className="text-[var(--text-secondary)] text-xs">{formatPrice(activity.price)} / personne</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* Infos activité */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${activity.color}20` }}>
              <Zap size={18} style={{ color: activity.color }} />
            </div>
            <div>
              <h2 className="font-bebas text-xl text-[var(--text-primary)]">{activity.label}</h2>
              <p className="text-xs" style={{ color: activity.color }}>{formatPrice(activity.price)} / personne</p>
            </div>
          </div>
          {activity.description && (
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{activity.description}</p>
          )}
        </motion.div>

        {/* Sélecteur quantité */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }} className="card p-5">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">
            Nombre de personnes
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}
                className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors disabled:opacity-30">
                <Minus size={16} className="text-[var(--text-primary)]" />
              </button>
              <span className="font-bebas text-4xl text-[var(--text-primary)] w-8 text-center">{qty}</span>
              <button onClick={() => setQty(q => Math.min(10, q + 1))} disabled={qty >= 10}
                className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors disabled:opacity-30">
                <Plus size={16} className="text-[var(--text-primary)]" />
              </button>
            </div>
            <div className="text-right">
              <p className="font-bebas text-3xl" style={{ color: activity.color }}>
                {formatPrice(qty * activity.price)}
              </p>
              <p className="text-[var(--text-secondary)] text-xs">total</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button onClick={handleReserve} className="btn-cta w-full font-bebas text-lg tracking-widest">
            RÉSERVER — {qty} personne{qty > 1 ? 's' : ''}
          </button>
          <p className="text-[var(--text-secondary)] text-xs text-center mt-3">
            Paiement sécurisé en ligne · Ticket QR code envoyé par email
          </p>
        </motion.div>
      </div>
    </main>
  )
}
