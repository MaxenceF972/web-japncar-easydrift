'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatTime } from '@/lib/utils'
import type { Activity, Slot, Booking } from '@/lib/supabase/types'
import { BookingDrawer } from '@/components/admin/BookingDrawer'
import { Plus, Users, Check, Trash2, X, Pencil } from 'lucide-react'

interface Props {
  activities: Activity[]
  eventDays: { saturday: string; sunday: string }
}

const PAYMENT_BADGES: Record<string, string> = {
  paid: 'badge-green',
  cash: 'badge-purple',
  terminal: 'badge-purple',
  free: 'badge-gray',
  pending: 'badge-yellow',
  cancelled: 'badge-red',
}

export function PlanningClient({ activities: initialActivities, eventDays }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [selectedDay, setSelectedDay] = useState<'saturday' | 'sunday'>('saturday')
  const [activeActivity, setActiveActivity] = useState(initialActivities[0]?.name || 'bapteme')
  const [slots, setSlots] = useState<(Slot & { bookings: Booking[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  // Add slot modal
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [addForm, setAddForm] = useState({ start_time: '', end_time: '', capacity: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Delete slot
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null)

  // Edit price modal
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  const supabase = createClient()
  const currentDay = eventDays[selectedDay]
  const currentActivity = activities.find(a => a.name === activeActivity)

  const fetchSlots = useCallback(async () => {
    if (!currentActivity) return
    setLoading(true)
    const resp = await fetch(`/api/admin/slots?activityId=${currentActivity.id}&day=${currentDay}`)
    const json = await resp.json()
    setSlots(json.slots || [])
    setLoading(false)
  }, [currentActivity, currentDay])

  useEffect(() => {
    fetchSlots()

    const channel = supabase
      .channel('planning-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchSlots)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, fetchSlots)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchSlots])

  function handleCheckin(booking: Booking) {
    fetch('/api/bookings/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode: booking.ticket_code, agentName: 'Admin' }),
    }).then(fetchSlots)
  }

  async function handleDeleteSlot(slotId: string) {
    if (!confirm('Supprimer ce créneau ?')) return
    setDeletingSlotId(slotId)
    const res = await fetch('/api/admin/slots', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId }),
    })
    const json = await res.json()
    setDeletingSlotId(null)
    if (!res.ok) {
      alert(json.error || 'Erreur lors de la suppression')
    } else {
      fetchSlots()
    }
  }

  async function handleAddSlot() {
    setAddError('')
    if (!addForm.start_time || !addForm.end_time || !addForm.capacity) {
      setAddError('Tous les champs sont requis')
      return
    }
    if (!currentActivity) return
    setAddLoading(true)
    const res = await fetch('/api/admin/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: currentActivity.id,
        day: currentDay,
        start_time: addForm.start_time + ':00',
        end_time: addForm.end_time + ':00',
        capacity: parseInt(addForm.capacity),
      }),
    })
    const json = await res.json()
    setAddLoading(false)
    if (!res.ok) {
      setAddError(json.error || 'Erreur')
    } else {
      setShowAddSlot(false)
      setAddForm({ start_time: '', end_time: '', capacity: '' })
      fetchSlots()
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
    if (!res.ok) {
      setSaveError(json.error || 'Erreur')
    } else {
      setActivities(prev => prev.map(a => a.id === editingActivity.id ? { ...a, price } : a))
      setEditingActivity(null)
    }
  }

  return (
    <div className="md:ml-56 p-5 max-w-5xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-4">Planning Live</h1>

      {/* Day toggle */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'saturday', label: 'Samedi' },
          { key: 'sunday', label: 'Dimanche' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedDay(key)}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              selectedDay === key
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Activity tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {activities.map(activity => (
          <div key={activity.id} className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={() => setActiveActivity(activity.name)}
              className={[
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeActivity === activity.name
                  ? 'text-white'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]',
              ].join(' ')}
              style={activeActivity === activity.name ? { backgroundColor: activity.color } : {}}
            >
              {activity.label}
            </button>
            <button
              onClick={() => { setEditingActivity(activity); setPriceValue(String(activity.price / 100)); setSaveError('') }}
              className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
              title={`Modifier le prix (${activity.price}€)`}
            >
              <Pencil size={10} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        ))}
      </div>

      {/* Slots */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {slots.filter(s => !s.is_break).map(slot => {
            const bookings = (slot as any).bookings as Booking[]
            const activeBookings = bookings.filter(b => b.payment_status !== 'cancelled')
            const checkedIn = activeBookings.filter(b => b.checked_in).length
            const fillPct = slot.capacity > 0 ? (activeBookings.length / slot.capacity) * 100 : 0

            return (
              <motion.div
                key={slot.id}
                layout
                className="card p-4"
              >
                {/* Slot header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bebas text-lg text-[var(--text-primary)]">
                      {formatTime(slot.start_time)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-sm">
                      <Users size={13} />
                      {activeBookings.length}/{slot.capacity}
                    </div>
                    {checkedIn > 0 && (
                      <div className="flex items-center gap-1 text-green-400 text-xs">
                        <Check size={12} />
                        {checkedIn} check-in{checkedIn > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/admin/inscrire?slotId=${slot.id}&activityId=${currentActivity?.id}`}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-colors"
                      title="Inscrire manuellement"
                    >
                      <Plus size={14} className="text-[var(--text-secondary)]" />
                    </a>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={deletingSlotId === slot.id}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:border-red-500 transition-colors disabled:opacity-40"
                      title="Supprimer le créneau"
                    >
                      <Trash2 size={13} className="text-[var(--text-secondary)]" />
                    </button>
                  </div>
                </div>

                {/* Barre de remplissage */}
                <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${fillPct}%`,
                      backgroundColor: currentActivity?.color,
                    }}
                  />
                </div>

                {/* Noms des inscrits */}
                {activeBookings.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeBookings.map(booking => (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-xs"
                      >
                        <span className="text-[var(--text-primary)]">
                          {booking.first_name} {booking.last_name.charAt(0)}.
                        </span>
                        {booking.checked_in ? (
                          <span className="badge badge-green" style={{ fontSize: '10px', padding: '1px 6px' }}>✓ Scanné</span>
                        ) : (
                          <span className={`badge ${PAYMENT_BADGES[booking.payment_status]}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                            {booking.payment_status === 'paid' ? 'En ligne' : booking.payment_status === 'cash' ? 'Cash' : booking.payment_status === 'terminal' ? 'Terminal' : booking.payment_status === 'free' ? 'Gratuit' : '⏳'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {activeBookings.length === 0 && (
                  <p className="text-[var(--text-secondary)] text-xs">Aucune réservation</p>
                )}
              </motion.div>
            )
          })}

          {/* Add slot button */}
          <button
            onClick={() => { setShowAddSlot(true); setAddError(''); setAddForm({ start_time: '', end_time: '', capacity: '' }) }}
            className="w-full py-3 rounded-xl border border-dashed border-[var(--border)] text-[var(--text-secondary)] text-sm flex items-center justify-center gap-2 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            <Plus size={16} />
            Ajouter un créneau
          </button>
        </div>
      )}

      {/* Add Slot Modal */}
      <AnimatePresence>
        {showAddSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5"
            onClick={e => { if (e.target === e.currentTarget) setShowAddSlot(false) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bebas text-xl text-[var(--text-primary)]">Nouveau créneau</h2>
                <button onClick={() => setShowAddSlot(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-xs mb-4">
                {currentActivity?.label} · {selectedDay === 'saturday' ? 'Samedi' : 'Dimanche'} {currentDay}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Heure de début</label>
                  <input
                    type="time"
                    value={addForm.start_time}
                    onChange={e => setAddForm(f => ({ ...f, start_time: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Heure de fin</label>
                  <input
                    type="time"
                    value={addForm.end_time}
                    onChange={e => setAddForm(f => ({ ...f, end_time: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Capacité</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="ex: 8"
                    value={addForm.capacity}
                    onChange={e => setAddForm(f => ({ ...f, capacity: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
                {addError && <p className="text-red-400 text-xs">{addError}</p>}
                <button
                  onClick={handleAddSlot}
                  disabled={addLoading}
                  className="btn-cta w-full mt-2 disabled:opacity-50"
                >
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-5"
            onClick={e => { if (e.target === e.currentTarget) setEditingActivity(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-xs"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bebas text-xl text-[var(--text-primary)]">Modifier le tarif</h2>
                <button onClick={() => setEditingActivity(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X size={18} />
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-xs mb-4">{editingActivity.label}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider block mb-1">Prix en euros (€)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={priceValue}
                      onChange={e => setPriceValue(e.target.value)}
                      className="input-field w-full pr-8"
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">€</span>
                  </div>
                </div>
                {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                <button
                  onClick={handleSavePrice}
                  disabled={saveLoading}
                  className="btn-cta w-full mt-2 disabled:opacity-50"
                >
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
        onRefresh={fetchSlots}
      />
    </div>
  )
}
