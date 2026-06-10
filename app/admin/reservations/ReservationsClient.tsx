'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Download, RefreshCw, Loader2 } from 'lucide-react'
import type { Booking } from '@/lib/supabase/types'
import { formatTime, getDayLabel } from '@/lib/utils'
import { BookingDrawer } from '@/components/admin/BookingDrawer'
import { useEvent } from '@/contexts/EventContext'

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'En ligne', cash: 'Cash', terminal: 'Terminal', free: 'Gratuit', pending: 'En attente', cancelled: 'Annulé',
}
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'badge-green', cash: 'badge-purple', terminal: 'badge-yellow', free: 'badge-gray', pending: 'badge-red', cancelled: 'badge-red',
}

interface Props { bookings?: Booking[] }

export function ReservationsClient(_: Props) {
  const { selectedEvent } = useEvent()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterActivity, setFilterActivity] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterCheckin, setFilterCheckin] = useState('all')
  const [filterDay, setFilterDay] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!selectedEvent) return
    const res = await fetch(`/api/admin/reservations?event_id=${selectedEvent.id}`)
    const data = await res.json()
    setBookings(data.bookings || [])
    setLoading(false)
    setRefreshing(false)
  }, [selectedEvent?.id])

  useEffect(() => {
    setLoading(true)
    fetchBookings()
  }, [fetchBookings])

  // Compute event days dynamically
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
      if (filterDay !== 'all' && (b as any).slot?.day !== filterDay) return false
      return true
    })
  }, [bookings, search, filterActivity, filterPayment, filterCheckin, filterDay])

  function handleExportCSV() {
    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Activité', 'Jour', 'Heure', 'Paiement', 'Check-in', 'Ticket', 'Créé le']
    const rows = filtered.map(b => [
      b.first_name, b.last_name, b.email, b.phone || '',
      (b as any).activity?.label || '', (b as any).slot?.day || '', (b as any).slot?.start_time || '',
      b.payment_status, b.checked_in ? 'Oui' : 'Non', b.ticket_code || '', b.created_at,
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reservations-${selectedEvent?.slug || 'export'}.csv`
    link.click()
  }

  if (loading) return (
    <div className="md:ml-56 p-5 flex items-center justify-center py-20">
      <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
    </div>
  )

  return (
    <div className="md:ml-56 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Réservations</h1>
          {selectedEvent && <p className="text-[var(--text-secondary)] text-xs">{selectedEvent.name}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setRefreshing(true); fetchBookings() }} className="btn-secondary text-sm py-2 px-3">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExportCSV} className="btn-secondary text-sm py-2 px-3">
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="space-y-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input className="input-field pl-9" placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <select className="input-field text-sm py-2 flex-shrink-0" style={{ width: 'auto', minWidth: 120 }} value={filterActivity} onChange={e => setFilterActivity(e.target.value)}>
            <option value="all">Toutes activités</option>
            {activities.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          {eventDays.length > 1 && (
            <select className="input-field text-sm py-2 flex-shrink-0" style={{ width: 'auto', minWidth: 110 }} value={filterDay} onChange={e => setFilterDay(e.target.value)}>
              <option value="all">Tous les jours</option>
              {eventDays.map(d => <option key={d} value={d}>{getDayLabel(d)}</option>)}
            </select>
          )}
          <select className="input-field text-sm py-2 flex-shrink-0" style={{ width: 'auto', minWidth: 130 }} value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option value="all">Tout statut</option>
            <option value="paid">En ligne</option>
            <option value="cash">Cash</option>
            <option value="terminal">Terminal</option>
            <option value="free">Gratuit</option>
            <option value="pending">En attente</option>
            <option value="cancelled">Annulé</option>
          </select>
          <select className="input-field text-sm py-2 flex-shrink-0" style={{ width: 'auto', minWidth: 120 }} value={filterCheckin} onChange={e => setFilterCheckin(e.target.value)}>
            <option value="all">Tous check-ins</option>
            <option value="yes">Check-in fait</option>
            <option value="no">Pas encore</option>
          </select>
        </div>
      </div>

      <p className="text-[var(--text-secondary)] text-xs mb-3">{filtered.length} réservation{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-2">
        {filtered.map(booking => {
          const slot = (booking as any).slot
          const activity = (booking as any).activity
          return (
            <button key={booking.id} onClick={() => setSelectedBooking(booking)}
              className="w-full card p-4 text-left hover:border-[var(--accent)] transition-colors"
              style={activity?.color ? { borderLeft: `3px solid ${activity.color}` } : {}}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{booking.first_name} {booking.last_name.toUpperCase()}</p>
                    {booking.checked_in && <span className="badge badge-green text-[10px] py-0">✓ Scanné</span>}
                  </div>
                  <p className="font-semibold text-[var(--accent)] text-sm">{activity?.label || '—'}</p>
                  <p className="text-[var(--text-primary)] text-xs mt-0.5">
                    {slot ? `${getDayLabel(slot.day)} · ${formatTime(slot.start_time)} — ${formatTime(slot.end_time)}` : 'Walk-in'}
                  </p>
                  <p className="text-[var(--text-secondary)] text-xs mt-0.5 truncate">{booking.email}</p>
                </div>
                <span className={`badge ${PAYMENT_COLORS[booking.payment_status]} flex-shrink-0 mt-0.5`}>{PAYMENT_LABELS[booking.payment_status]}</span>
              </div>
            </button>
          )
        })}
        {filtered.length === 0 && <p className="text-[var(--text-secondary)] text-sm text-center py-12">Aucune réservation trouvée</p>}
      </div>

      <BookingDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCheckin={async (booking) => {
          await fetch('/api/bookings/checkin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketCode: booking.ticket_code, agentName: 'Admin' }) })
          fetchBookings()
        }}
        onRefresh={fetchBookings}
      />
    </div>
  )
}
