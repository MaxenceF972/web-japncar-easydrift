'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Mail, Phone, Banknote, Trash2, Loader2, Printer } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
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
  const [emailSent, setEmailSent] = useState(false)

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
    setEmailSent(false)
    await fetch('/api/tickets/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id }),
    })
    setLoading(null)
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
  }

  function handlePrint() {
    if (!booking) return
    const slot = (booking as any).slot
    const activity = (booking as any).activity
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=H&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/admin/scanner?code=${booking.ticket_code}`)}`
    const slotLine = slot && activity
      ? `${activity.label} &nbsp;·&nbsp; ${slot.day === 'saturday' ? 'Samedi' : 'Dimanche'} ${formatTime(slot.start_time)}`
      : activity?.label || ''

    const win = window.open('', '_blank', 'width=400,height=560')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ticket EASYDRIFT</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .ticket { width: 340px; padding: 28px 24px 24px; border: 2px solid #111; border-radius: 16px; text-align: center; }
  .brand { font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: #888; margin-bottom: 4px; }
  .event { font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #111; margin-bottom: 2px; }
  .date { font-size: 11px; color: #888; letter-spacing: 2px; margin-bottom: 20px; }
  .divider { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
  .name { font-size: 26px; font-weight: 800; text-transform: uppercase; color: #111; margin-bottom: 4px; letter-spacing: 1px; }
  .activity { font-size: 13px; color: #F47B20; font-weight: 600; margin-bottom: 16px; }
  .qr { margin: 0 auto 16px; }
  .code { font-size: 13px; letter-spacing: 3px; color: #555; font-family: monospace; }
  @media print { body { margin: 0; } }
</style>
</head><body>
<div class="ticket">
  <p class="brand">EASYDRIFT</p>
  <p class="event">JAPN CAR</p>
  <p class="date">30 · 31 MAI 2026 — MONTLHÉRY</p>
  <hr class="divider">
  <p class="name">${booking.first_name} ${booking.last_name.toUpperCase()}</p>
  ${slotLine ? `<p class="activity">${slotLine}</p>` : ''}
  <img class="qr" src="${qrUrl}" width="200" height="200" alt="QR Code" />
  <p class="code">${booking.ticket_code}</p>
</div>
<script>window.onload = function() { window.print() }<\/script>
</body></html>`)
    win.document.close()
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

                {/* QR Code — client peut photographier si email non reçu */}
                {booking.ticket_code && (
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-xl">
                      <QRCodeSVG
                        value={`${process.env.NEXT_PUBLIC_APP_URL}/admin/scanner?code=${booking.ticket_code}`}
                        size={160}
                        level="H"
                      />
                    </div>
                    <p className="text-[var(--text-secondary)] text-xs">Le client peut photographier ce QR code</p>
                  </div>
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
                  onClick={handlePrint}
                  className="btn-secondary w-full"
                >
                  <Printer size={16} />
                  Imprimer le ticket
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={loading === 'email' || emailSent}
                  className={`btn-secondary w-full ${emailSent ? 'text-green-400 border-green-900/50' : ''}`}
                >
                  {loading === 'email' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  {emailSent ? 'Email envoyé ✓' : 'Renvoyer le ticket par email'}
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
