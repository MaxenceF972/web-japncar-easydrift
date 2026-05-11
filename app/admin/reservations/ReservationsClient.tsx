'use client'

import { useState, useMemo } from 'react'
import { Search, Download, Filter, Check } from 'lucide-react'
import type { Booking } from '@/lib/supabase/types'
import { formatTime, formatDate, formatPrice, getDayLabel } from '@/lib/utils'
import { BookingDrawer } from '@/components/admin/BookingDrawer'

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Payé', cash: 'Cash', free: 'Gratuit', pending: 'En attente', cancelled: 'Annulé',
}
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'badge-green', cash: 'badge-purple', free: 'badge-gray', pending: 'badge-yellow', cancelled: 'badge-red',
}

interface Props {
  bookings: Booking[]
}

export function ReservationsClient({ bookings: initialBookings }: Props) {
  const [search, setSearch] = useState('')
  const [filterActivity, setFilterActivity] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterCheckin, setFilterCheckin] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [bookings, setBookings] = useState(initialBookings)

  const activities = useMemo(() => {
    const acts = new Map<string, string>()
    bookings.forEach(b => {
      if ((b as any).activity) acts.set((b as any).activity.id, (b as any).activity.label)
    })
    return Array.from(acts.entries())
  }, [bookings])

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      const name = `${b.first_name} ${b.last_name} ${b.email}`.toLowerCase()
      if (search && !name.includes(search.toLowerCase())) return false
      if (filterActivity !== 'all' && b.activity_id !== filterActivity) return false
      if (filterPayment !== 'all' && b.payment_status !== filterPayment) return false
      if (filterCheckin === 'yes' && !b.checked_in) return false
      if (filterCheckin === 'no' && b.checked_in) return false
      return true
    })
  }, [bookings, search, filterActivity, filterPayment, filterCheckin])

  function handleExportCSV() {
    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Activité', 'Jour', 'Heure', 'Paiement', 'Check-in', 'Ticket', 'Créé le']
    const rows = filtered.map(b => [
      b.first_name,
      b.last_name,
      b.email,
      b.phone || '',
      (b as any).activity?.label || '',
      (b as any).slot?.day || '',
      (b as any).slot?.start_time || '',
      b.payment_status,
      b.checked_in ? 'Oui' : 'Non',
      b.ticket_code || '',
      b.created_at,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reservations-easydrift.csv`
    link.click()
  }

  return (
    <div className="md:ml-56 p-5">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Réservations</h1>
        <button onClick={handleExportCSV} className="btn-secondary text-sm py-2 px-3">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Filtres */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            className="input-field pl-9"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            className="input-field text-sm py-2 flex-shrink-0"
            style={{ width: 'auto', minWidth: 120 }}
            value={filterActivity}
            onChange={e => setFilterActivity(e.target.value)}
          >
            <option value="all">Toutes les activités</option>
            {activities.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          <select
            className="input-field text-sm py-2 flex-shrink-0"
            style={{ width: 'auto', minWidth: 130 }}
            value={filterPayment}
            onChange={e => setFilterPayment(e.target.value)}
          >
            <option value="all">Tout statut paiement</option>
            <option value="paid">Payé</option>
            <option value="cash">Cash</option>
            <option value="pending">En attente</option>
            <option value="cancelled">Annulé</option>
          </select>

          <select
            className="input-field text-sm py-2 flex-shrink-0"
            style={{ width: 'auto', minWidth: 120 }}
            value={filterCheckin}
            onChange={e => setFilterCheckin(e.target.value)}
          >
            <option value="all">Tous check-ins</option>
            <option value="yes">Check-in fait</option>
            <option value="no">Pas encore</option>
          </select>
        </div>
      </div>

      <p className="text-[var(--text-secondary)] text-xs mb-3">
        {filtered.length} réservation{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.map(booking => (
          <button
            key={booking.id}
            onClick={() => setSelectedBooking(booking)}
            className="w-full card p-4 text-left hover:border-[var(--accent)] transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-[var(--text-primary)] text-sm">
                    {booking.first_name} {booking.last_name}
                  </p>
                  {booking.checked_in && (
                    <span className="badge badge-green text-[10px] py-0">✓</span>
                  )}
                </div>
                <p className="text-[var(--text-secondary)] text-xs mt-0.5 truncate">
                  {(booking as any).activity?.label} ·{' '}
                  {(booking as any).slot ? getDayLabel((booking as any).slot.day) + ' ' + formatTime((booking as any).slot.start_time) : ''}
                </p>
                <p className="text-[var(--text-secondary)] text-xs truncate">{booking.email}</p>
              </div>
              <span className={`badge ${PAYMENT_COLORS[booking.payment_status]} flex-shrink-0`}>
                {PAYMENT_LABELS[booking.payment_status]}
              </span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-[var(--text-secondary)] text-sm text-center py-12">
            Aucune réservation trouvée
          </p>
        )}
      </div>

      <BookingDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCheckin={() => {}}
        onRefresh={() => window.location.reload()}
      />
    </div>
  )
}
