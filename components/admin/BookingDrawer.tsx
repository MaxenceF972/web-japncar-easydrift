'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Mail, Phone, Banknote, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { Booking } from '@/lib/supabase/types'
import { formatTime, formatDate, formatPrice } from '@/lib/utils'

interface Props {
  booking: Booking | null
  onClose: () => void
  onCheckin: (booking: Booking) => void
  onRefresh: () => void
}

export function BookingDrawer({ booking, onClose, onCheckin, onRefresh }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckin() {
    if (!booking) return
    setLoading('checkin')
    onCheckin(booking)
    await new Promise(r => setTimeout(r, 500))
    setLoading(null)
    onClose()
  }

  async function handleMarkCash() {
    if (!booking) return
    setLoading('cash')
    await fetch('/api/admin/booking-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, payment_status: 'cash', amount_paid: booking.amount_paid }),
    })
    onRefresh()
    setLoading(null)
  }

  async function handleSendEmail() {
    if (!booking) return
    setLoading('email')
    await fetch('/api/tickets/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id }),
    })
    setLoading(null)
  }

  async function handleCancel() {
    if (!booking || !confirm('Annuler cette réservation ?')) return
    setLoading('cancel')
    await fetch('/api/admin/booking-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, payment_status: 'cancelled' }),
    })
    onRefresh()
    setLoading(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {booking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--bg-card)] border-l border-[var(--border)] z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)]">
              <h2 className="font-bebas text-xl text-[var(--text-primary)]">Détail réservation</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Infos client */}
              <div className="card p-4">
                <p className="text-[var(--text-secondary)] text-xs uppercase tracking-widest mb-2">Client</p>
                <p className="font-semibold text-[var(--text-primary)] text-lg">
                  {booking.first_name} {booking.last_name.toUpperCase()}
                </p>
                {booking.email && (
                  <div className="flex items-center gap-2 mt-2 text-[var(--text-secondary)] text-sm">
                    <Mail size={13} />
                    {booking.email}
                  </div>
                )}
                {booking.phone && (
                  <div className="flex items-center gap-2 mt-1 text-[var(--text-secondary)] text-sm">
                    <Phone size={13} />
                    {booking.phone}
                  </div>
                )}
              </div>

              {/* Ticket */}
              <div className="card p-4">
                <p className="text-[var(--text-secondary)] text-xs uppercase tracking-widest mb-2">Ticket</p>
                <p className="font-bebas text-xl tracking-widest text-[var(--text-primary)]">
                  {booking.ticket_code}
                </p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[var(--text-secondary)] text-xs">Statut paiement</p>
                    <span className={`badge mt-1 ${
                      booking.payment_status === 'paid' ? 'badge-green' :
                      booking.payment_status === 'cash' ? 'badge-purple' :
                      booking.payment_status === 'pending' ? 'badge-yellow' : 'badge-red'
                    }`}>
                      {booking.payment_status}
                    </span>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] text-xs">Check-in</p>
                    <span className={`badge mt-1 ${booking.checked_in ? 'badge-green' : 'badge-gray'}`}>
                      {booking.checked_in ? `✓ ${booking.checked_in_at ? new Date(booking.checked_in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}` : 'À venir'}
                    </span>
                  </div>
                </div>
                {booking.amount_paid !== null && (
                  <p className="text-[var(--text-secondary)] text-sm mt-3">
                    Montant : <span className="text-[var(--text-primary)] font-semibold">{formatPrice(booking.amount_paid)}</span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {!booking.checked_in && booking.payment_status !== 'cancelled' && (
                  <button
                    onClick={handleCheckin}
                    disabled={loading === 'checkin'}
                    className="btn-cta w-full bg-green-600 hover:bg-green-500"
                    style={{ background: '#27AE60' }}
                  >
                    {loading === 'checkin' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Valider le check-in
                  </button>
                )}

                {booking.payment_status === 'pending' && (
                  <button
                    onClick={handleMarkCash}
                    disabled={loading === 'cash'}
                    className="btn-secondary w-full"
                  >
                    {loading === 'cash' ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                    Marquer payé en cash
                  </button>
                )}

                <button
                  onClick={handleSendEmail}
                  disabled={loading === 'email'}
                  className="btn-secondary w-full"
                >
                  {loading === 'email' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Renvoyer le ticket par email
                </button>

                {booking.payment_status !== 'cancelled' && (
                  <button
                    onClick={handleCancel}
                    disabled={loading === 'cancel'}
                    className="btn-secondary w-full text-red-400 border-red-900/50 hover:border-red-500"
                  >
                    {loading === 'cancel' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Annuler la réservation
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
