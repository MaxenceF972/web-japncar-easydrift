'use client'

import { useMemo, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Loader2 } from 'lucide-react'
import { useEvent } from '@/contexts/EventContext'
import type { Booking, Activity, Slot } from '@/lib/supabase/types'

export function StatsClient() {
  const { selectedEvent } = useEvent()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedEvent) return
    setLoading(true)
    const url = `/api/admin/stats?event_id=${selectedEvent.id}`
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setBookings(d.bookings || [])
        setActivities(d.activities || [])
        setSlots(d.slots || [])
      })
      .finally(() => setLoading(false))
  }, [selectedEvent?.id])

  const byActivity = useMemo(() =>
    activities.map(a => {
      const abs = bookings.filter(b => b.activity_id === a.id)
      const rev = abs.reduce((sum, b) => sum + (b.amount_paid || 0), 0)
      return { name: a.label, count: abs.length, revenue: rev / 100, color: a.color }
    }), [bookings, activities])

  // Répartition par jour dynamique (basée sur les dates de l'event)
  const byDay = useMemo(() => {
    if (!selectedEvent?.date_start) return []
    const days: string[] = []
    const start = new Date(selectedEvent.date_start)
    const end = selectedEvent.date_end ? new Date(selectedEvent.date_end) : start
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(d.toISOString().split('T')[0])
    }
    return days.map(day => ({
      name: new Date(day + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: bookings.filter(b => (b as any).slot?.day === day).length,
    })).filter(d => d.value > 0)
  }, [bookings, selectedEvent])

  const byPaymentMode = useMemo(() => {
    const online   = bookings.filter(b => b.payment_status === 'paid').length
    const cash     = bookings.filter(b => b.payment_status === 'cash').length
    const terminal = bookings.filter(b => b.payment_status === 'terminal').length
    const free     = bookings.filter(b => b.payment_status === 'free').length
    return [
      { name: 'En ligne',  value: online,   color: '#27AE60' },
      { name: 'Cash',      value: cash,     color: '#8E44AD' },
      { name: 'Terminal',  value: terminal, color: '#2980B9' },
      { name: 'Gratuit',   value: free,     color: '#888888' },
    ].filter(e => e.value > 0)
  }, [bookings])

  const fillRate = useMemo(() => {
    const totalCap = slots.reduce((sum, s) => sum + s.capacity, 0)
    const totalBooked = slots.reduce((sum, s) => sum + s.booked_count, 0)
    return totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0
  }, [slots])

  if (loading) return (
    <div className="md:ml-56 p-5 flex items-center justify-center py-20">
      <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
    </div>
  )

  if (!bookings.length && !activities.length) return (
    <div className="md:ml-56 p-5 max-w-3xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-2">Statistiques</h1>
      <p className="text-[var(--text-secondary)] text-sm">{selectedEvent?.name || 'Aucun événement'} — aucune donnée pour le moment.</p>
    </div>
  )

  return (
    <div className="md:ml-56 p-5 max-w-3xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-1">Statistiques</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">{selectedEvent?.name}</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Taux de remplissage', value: `${fillRate}%`, sub: 'Global' },
          { label: 'Total réservations',  value: bookings.length, sub: 'Confirmées' },
          { label: 'CA total',            value: `${(bookings.reduce((s, b) => s + (b.amount_paid || 0), 0) / 100).toFixed(0)} €`, sub: 'Encaissé' },
          { label: 'Activités',           value: activities.length, sub: 'Types' },
        ].map(({ label, value, sub }, i) => (
          <div key={i} className="card p-4">
            <p className="text-[var(--text-secondary)] text-xs mb-1">{label}</p>
            <p className="font-bebas text-2xl text-[var(--accent)]">{value}</p>
            <p className="text-[var(--text-secondary)] text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* CA par activité */}
      {byActivity.length > 0 && (
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">CA par activité (€)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byActivity} margin={{ left: -10 }}>
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
              <YAxis tick={{ fill: '#888', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 8, color: '#F5F5F5' }}
                formatter={(v: number) => [`${v}€`, 'CA']}
              />
              {byActivity.map((entry, i) => (
                <Bar key={i} dataKey="revenue" fill={entry.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Par jour */}
        {byDay.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Par jour</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={byDay} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, value }) => `${name}: ${value}`}>
                  {byDay.map((_, i) => <Cell key={i} fill={['#F47B20', '#E74C3C', '#3B82F6', '#22C55E'][i % 4]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mode de paiement */}
        {byPaymentMode.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Mode de paiement</h2>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={byPaymentMode} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55}>
                  {byPaymentMode.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Détail par activité */}
      {byActivity.length > 0 && (
        <div className="card p-4">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Détail par activité</h2>
          <div className="space-y-3">
            {byActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border)]/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="text-[var(--text-primary)] text-sm">{a.name}</span>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="font-bebas text-lg text-[var(--text-primary)]">{a.count}</p>
                    <p className="text-[var(--text-secondary)] text-xs">rés.</p>
                  </div>
                  <div>
                    <p className="font-bebas text-lg text-green-400">{a.revenue.toFixed(0)} €</p>
                    <p className="text-[var(--text-secondary)] text-xs">CA</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
