'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'
import type { Activity, Slot, Booking } from '@/lib/supabase/types'
import { BookingDrawer } from '@/components/admin/BookingDrawer'
import { Plus, Users, Check, Trash2, X, Pencil } from 'lucide-react'
import { useEvent } from '@/contexts/EventContext'

interface Props {
  activities?: Activity[]
  eventDays?: { saturday: string; sunday: string }
}

const PAYMENT_BADGES: Record<string, string> = {
  paid: 'badge-green',
  cash: 'badge-purple',
  terminal: 'badge-purple',
  free: 'badge-gray',
  pending: 'badge-yellow',
  cancelled: 'badge-red',
}

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'En ligne', cash: 'Cash', terminal: 'Terminal', free: 'Gratuit', pending: '⏳', cancelled: 'Annulé',
}

export function PlanningClient(_props: Props) {
  const { selectedEvent } = useEvent()
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)

  // Dériver les jours depuis l'event sélectionné
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

  // Charger les activités de l'event
  useEffect(() => {
    if (!selectedEvent) return
    fetch(`/api/admin/activities?event_id=${selectedEvent.id}`)
      .then(r => r.json())
      .then(d => setActivities(d.activities || []))
  }, [selectedEvent?.id])
  const [allSlots, setAllSlots] = useState<Record<string, (Slot & { bookings: Booking[] })[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Add slot modal
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [addTargetActivity, setAddTargetActivity] = useState<Activity | null>(null)
  const [addForm, setAddForm] = useState({ start_time: '', end_time: '', capacity: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Delete slot
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Edit price modal
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  function isSlotPast(slotDay: string, startTime: string) {
    const today = now.toISOString().split('T')[0]
    if (slotDay < today) return true
    if (slotDay > today) return false
    const [h, m] = startTime.split(':').map(Number)
    const slotDate = new Date(now)
    slotDate.setHours(h, m, 0, 0)
    return now > slotDate
  }

  const supabase = createClient()
  const currentDay = eventDays[selectedDayIdx] || ''

  const fetchAllSlots = useCallback(async () => {
    setLoading(true)
    const results = await Promise.all(
      activities.map(a =>
        fetch(`/api/admin/slots?activityId=${a.id}&day=${currentDay}`)
          .then(r => r.json())
          .then(d => ({ id: a.id, slots: d.slots || [] }))
          .catch(() => ({ id: a.id, slots: [] }))
      )
    )
    const map: Record<string, (Slot & { bookings: Booking[] })[]> = {}
    for (const r of results) map[r.id] = r.slots
    setAllSlots(map)
    setLoading(false)
  }, [activities, currentDay])

  useEffect(() => {
    fetchAllSlots()
    const channel = supabase
      .channel('planning-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchAllSlots)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, fetchAllSlots)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAllSlots])

  function handleCheckin(booking: Booking) {
    fetch('/api/bookings/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode: booking.ticket_code, agentName: 'Admin' }),
    }).then(fetchAllSlots)
  }

  async function handleDeleteSlot(slotId: string) {
    setDeleteError(null)
    setDeletingSlotId(slotId)
    const res = await fetch('/api/admin/slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    })
    const json = await res.json()
    setDeletingSlotId(null)
    setConfirmDeleteId(null)
    if (!res.ok) setDeleteError(json.error || 'Erreur lors de la suppression')
    else fetchAllSlots()
  }

  async function handleAddSlot() {
    setAddError('')
    if (!addForm.start_time || !addForm.end_time || !addForm.capacity) {
      setAddError('Tous les champs sont requis')
      return
    }
    if (!addTargetActivity) return
    setAddLoading(true)
    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: addTargetActivity.id,
        day: currentDay,
        start_time: addForm.start_time + ':00',
        end_time: addForm.end_time + ':00',
        capacity: parseInt(addForm.capacity),
      }),
    })
    const json = await res.json()
    setAddLoading(false)
    if (!res.ok) setAddError(json.error || 'Erreur')
    else {
      setShowAddSlot(false)
      setAddForm({ start_time: '', end_time: '', capacity: '' })
      fetchAllSlots()
    }
  }

  async function handleSavePrice() {
    if (!editingActivity) return
    setSaveError('')
    const euros = parseFloat(priceValue)
    if (isNaN(euros) || euros < 0) { setSaveError('Prix invalide'); return }
    const price = Math.round(euros * 100)
    setSaveLoading(true)
    const res = await fetch('/api/admin/activities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activityId: editingActivity.id, price }),
    })
    const json = await res.json()
    setSaveLoading(false)
    if (!res.ok) setSaveError(json.error || 'Erreur')
    else {
      setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, price } : a))
      setEditingActivity(null)
    }
  }

  return (
    <div className="md:ml-56 p-5 max-w-7xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-4">Planning Live</h1>

      {/* Day toggle */}
      {eventDays.length > 1 && (
        <div className="flex gap-2 mb-6">
          {eventDays.map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDayIdx(idx)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                selectedDayIdx === idx
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
              ].join(' ')}
            >
              {new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </button>
          ))}
        </div>
      )}

      {/* Error banner */}
      {deleteError && (
        <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{deleteError}</p>
          <button onClick={() => setDeleteError(null)}><X size={16} className="text-red-400" /></button>
        </div>
      )}

      {/* Vue fusionnée Baptême + Conduite — créneaux occupés uniquement */}
      {(() => {
        const bapteme = activities.find(a => a.name === 'bapteme')
        const conduite = activities.find(a => a.name === 'conduite')
        const merged = [
          ...(bapteme ? (allSlots[bapteme.id] || []).filter(s => !s.is_break).map(s => ({ ...s, activity: bapteme })) : []),
          ...(conduite ? (allSlots[conduite.id] || []).filter(s => !s.is_break).map(s => ({ ...s, activity: conduite })) : []),
        ]
          .filter(s => s.booked_count > 0 || (s as any).bookings.some((b: Booking) => b.payment_status !== 'cancelled'))
          .sort((a, b) => a.start_time.localeCompare(b.start_time))

        if (merged.length === 0) return null

        return (
          <div className="card overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="font-bebas text-lg text-[var(--text-primary)]">Créneaux occupés — Baptême & Conduite</span>
              <span className="text-[var(--text-secondary)] text-xs">{merged.length} créneau{merged.length > 1 ? 'x' : ''}</span>
            </div>
            <div className="divide-y divide-[var(--border)] max-h-64 overflow-y-auto">
              {merged.map(slot => {
                const bookings = (slot as any).bookings.filter((b: Booking) => b.payment_status !== 'cancelled')
                const checkedIn = bookings.filter((b: Booking) => b.checked_in).length
                return (
                  <div key={slot.id} className="px-4 py-2.5 flex items-center gap-3">
                    <div
                      className="w-1.5 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: (slot as any).activity.color }}
                    />
                    <span className="font-bebas text-base text-[var(--text-primary)] w-14 flex-shrink-0">{formatTime(slot.start_time)}</span>
                    <span className="text-[var(--text-secondary)] text-xs w-20 flex-shrink-0">{(slot as any).activity.label.replace('EASYDRIFT', '').replace('Session ', '').trim()}</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {bookings.map((b: Booking) => (
                        <span key={b.id} className={`text-[10px] px-1.5 py-0.5 rounded ${b.checked_in ? 'bg-green-500/20 text-green-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}>
                          {b.first_name} {b.last_name.charAt(0)}.{b.checked_in ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                    {checkedIn > 0 && (
                      <span className="text-green-400 text-xs flex-shrink-0">{checkedIn}/{bookings.length}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* 4 sections grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map(activity => {
          const slots = (allSlots[activity.id] || []).filter(s => !s.is_break)
          const totalBooked = slots.reduce((s, sl) => s + (sl as any).bookings.filter((b: Booking) => b.payment_status !== 'cancelled').length, 0)
          const totalCap = slots.reduce((s, sl) => s + sl.capacity, 0)

          return (
            <div key={activity.id} className="card overflow-hidden">
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]" style={{ borderLeft: `3px solid ${activity.color}` }}>
                <div className="flex items-center gap-2">
                  <span className="font-bebas text-lg text-[var(--text-primary)]">{activity.label}</span>
                  <span className="text-[var(--text-secondary)] text-xs">{totalBooked}/{totalCap}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingActivity(activity); setPriceValue(String(activity.price / 100)); setSaveError('') }}
                    className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
                    title="Modifier le prix"
                  >
                    <Pencil size={10} className="text-[var(--text-secondary)]" />
                  </button>
                  <button
                    onClick={() => { setAddTargetActivity(activity); setShowAddSlot(true); setAddError(''); setAddForm({ start_time: '', end_time: '', capacity: '' }) }}
                    className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
                    title="Ajouter un créneau"
                  >
                    <Plus size={12} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
              </div>

              {/* Slots list */}
              <div className="divide-y divide-[var(--border)] max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-8 rounded animate-pulse bg-[var(--bg-elevated)]" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-xs text-center py-6">Aucun créneau</p>
                ) : slots.map(slot => {
                  const bookings = (slot as any).bookings as Booking[]
                  const activeBookings = bookings.filter(b => b.payment_status !== 'cancelled')
                  const checkedIn = activeBookings.filter(b => b.checked_in).length
                  const fillPct = slot.capacity > 0 ? (activeBookings.length / slot.capacity) * 100 : 0
                  const isFull = activeBookings.length >= slot.capacity
                  const past = isSlotPast(currentDay, slot.start_time)

                  return (
                    <div key={slot.id} className={`px-4 py-3 ${past ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bebas text-base text-[var(--text-primary)]">{formatTime(slot.start_time)}</span>
                          <div className="flex items-center gap-1 text-[var(--text-secondary)] text-xs">
                            <Users size={11} />
                            <span style={isFull ? { color: activity.color, fontWeight: 600 } : {}}>
                              {activeBookings.length}/{slot.capacity}
                            </span>
                          </div>
                          {checkedIn > 0 && (
                            <div className="flex items-center gap-0.5 text-green-400 text-xs">
                              <Check size={10} />
                              {checkedIn}
                            </div>
                          )}
                        </div>
                        {confirmDeleteId === slot.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={deletingSlotId === slot.id}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white disabled:opacity-40"
                            >
                              {deletingSlotId === slot.id ? '...' : 'Supprimer'}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="px-1 py-0.5 rounded text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(slot.id)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={11} className="text-[var(--text-secondary)]" />
                          </button>
                        )}
                      </div>

                      {/* Fill bar */}
                      <div className="h-1 rounded-full bg-[var(--bg-elevated)] mb-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${fillPct}%`, backgroundColor: activity.color }} />
                      </div>

                      {/* Participants */}
                      {activeBookings.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {activeBookings.map(booking => (
                            <button
                              key={booking.id}
                              onClick={() => setSelectedBooking(booking)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-[10px]"
                            >
                              <span className="text-[var(--text-primary)]">{booking.first_name} {booking.last_name.charAt(0)}.</span>
                              {booking.checked_in
                                ? <span className="badge badge-green" style={{ fontSize: '9px', padding: '0 4px' }}>✓</span>
                                : <span className={`badge ${PAYMENT_BADGES[booking.payment_status]}`} style={{ fontSize: '9px', padding: '0 4px' }}>{PAYMENT_LABELS[booking.payment_status]}</span>
                              }
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Slot Modal */}
      <AnimatePresence>
        {showAddSlot && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5"
            onClick={e => { if (e.target === e.currentTarget) setShowAddSlot(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bebas text-xl text-[var(--text-primary)]">Nouveau créneau</h2>
                <button onClick={() => setShowAddSlot(false)}><X size={18} className="text-[var(--text-secondary)]" /></button>
              </div>
              <p className="text-[var(--text-secondary)] text-xs mb-4">
                {addTargetActivity?.label} · {selectedDay === 'saturday' ? 'Samedi' : 'Dimanche'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Heure de début</label>
                  <input type="time" value={addForm.start_time} onChange={e => setAddForm(f => ({ ...f, start_time: e.target.value }))} className="input-field w-full" />
                </div>
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Heure de fin</label>
                  <input type="time" value={addForm.end_time} onChange={e => setAddForm(f => ({ ...f, end_time: e.target.value }))} className="input-field w-full" />
                </div>
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Capacité</label>
                  <input type="number" min="1" placeholder="ex: 6" value={addForm.capacity} onChange={e => setAddForm(f => ({ ...f, capacity: e.target.value }))} className="input-field w-full" />
                </div>
                {addError && <p className="text-red-400 text-xs">{addError}</p>}
                <button onClick={handleAddSlot} disabled={addLoading} className="btn-cta w-full mt-2 disabled:opacity-50">
                  {addLoading ? 'Création...' : 'Créer le créneau'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Price Modal */}
      <AnimatePresence>
        {editingActivity && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5"
            onClick={e => { if (e.target === e.currentTarget) setEditingActivity(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-xs"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bebas text-xl text-[var(--text-primary)]">Modifier le tarif</h2>
                <button onClick={() => setEditingActivity(null)}><X size={18} className="text-[var(--text-secondary)]" /></button>
              </div>
              <p className="text-[var(--text-secondary)] text-xs mb-4">{editingActivity.label}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Prix en euros (€)</label>
                  <div className="relative">
                    <input type="number" min="0" step="1" value={priceValue} onChange={e => setPriceValue(e.target.value)} className="input-field w-full pr-8" autoFocus />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">€</span>
                  </div>
                </div>
                {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                <button onClick={handleSavePrice} disabled={saveLoading} className="btn-cta w-full mt-2 disabled:opacity-50">
                  {saveLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Drawer */}
      <BookingDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onCheckin={handleCheckin}
        onRefresh={fetchAllSlots}
      />
    </div>
  )
}
