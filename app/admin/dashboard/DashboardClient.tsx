'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, CheckSquare, AlertTriangle, BarChart3, Calendar, MapPin, Settings2, Loader2, Euro } from 'lucide-react'
import { formatTime } from '@/lib/utils'
import { useEvent } from '@/contexts/EventContext'
import type { Booking, Activity } from '@/lib/supabase/types'

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Payé', cash: 'Cash', terminal: 'Terminal', free: 'Gratuit', pending: 'En attente', cancelled: 'Annulé',
}
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'badge-green', cash: 'badge-purple', terminal: 'badge-purple', free: 'badge-gray', pending: 'badge-yellow', cancelled: 'badge-red',
}
const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400 bg-green-400/10 border-green-400/20',
  draft: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  archived: 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border)]',
}
const STATUS_LABELS: Record<string, string> = { active: 'Actif', draft: 'Brouillon', archived: 'Archivé' }

interface DashboardData {
  kpis: {
    totalBookings: number
    pendingCount: number
    revenue: number
    availableSlots: number
    checkins: number
    fillRate: number
  }
  recentBookings: Booking[]
  bookings: Booking[]
  activities: Activity[]
}

export function DashboardClient() {
  const { selectedEvent } = useEvent()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedEvent) return
    setLoading(true)
    fetch(`/api/admin/dashboard?event_id=${selectedEvent.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [selectedEvent?.id])

  if (!selectedEvent || loading) return (
    <div className="md:ml-56 p-5 flex items-center justify-center py-20">
      <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
    </div>
  )

  if (!data) return null
  const { kpis, recentBookings, bookings, activities } = data

  const chartData = activities.map(a => ({
    name: a.label.replace('Session ', '').replace('Baptême ', 'Baptême'),
    reservations: bookings.filter(b => b.activity_id === a.id && b.payment_status !== 'cancelled').length,
  }))

  return (
    <div className="md:ml-56 p-5 max-w-4xl">

      {/* Event header */}
      <div className="card p-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[selectedEvent.status]}`}>
                {STATUS_LABELS[selectedEvent.status]}
              </span>
            </div>
            <h1 className="font-bebas text-2xl text-[var(--text-primary)]">{selectedEvent.name}</h1>
            <div className="flex items-center gap-4 mt-1">
              {selectedEvent.date_start && (
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(selectedEvent.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {selectedEvent.date_end && selectedEvent.date_end !== selectedEvent.date_start &&
                    ` → ${new Date(selectedEvent.date_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
                </span>
              )}
              {selectedEvent.location && (
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <MapPin size={11} />{selectedEvent.location}
                </span>
              )}
            </div>
          </div>
          <a href="/admin/events" className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
            <Settings2 size={16} className="text-[var(--text-secondary)]" />
          </a>
        </div>
      </div>

      {/* Alert paiements en attente */}
      {kpis.pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            {kpis.pendingCount} paiement{kpis.pendingCount > 1 ? 's' : ''} en attente de confirmation
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Users,      label: 'Réservations',    value: kpis.totalBookings,            color: 'text-blue-400' },
          { icon: Euro,       label: 'Revenus',          value: `${(kpis.revenue / 100).toFixed(0)} €`, color: 'text-green-400' },
          { icon: TrendingUp, label: 'Places restantes', value: kpis.availableSlots,           color: 'text-orange-400' },
          { icon: CheckSquare,label: 'Check-ins',        value: kpis.checkins,                 color: 'text-purple-400' },
          { icon: BarChart3,  label: 'Remplissage',      value: `${kpis.fillRate}%`,           color: 'text-yellow-400' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="card p-4">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="font-bebas text-2xl text-[var(--text-primary)]">{value}</p>
            <p className="text-[var(--text-secondary)] text-xs">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Graphique */}
      {chartData.length > 0 && (
        <div className="card p-4 mb-6">
          <h2 className="font-semibold text-[var(--text-primary)] mb-4">Réservations par activité</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 8, color: '#F5F5F5' }} />
              <Bar dataKey="reservations" fill="#F47B20" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Flux récent */}
      <div className="card p-4">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Dernières réservations</h2>
        <div className="space-y-3">
          {recentBookings.length === 0 && (
            <p className="text-[var(--text-secondary)] text-sm text-center py-4">Aucune réservation pour cet événement</p>
          )}
          {recentBookings.map(booking => (
            <div key={booking.id} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                  {booking.first_name} {booking.last_name}
                </p>
                <p className="text-[var(--text-secondary)] text-xs">
                  {(booking as any).activity?.label}
                  {(booking as any).slot ? ` · ${formatTime((booking as any).slot.start_time)}` : ''}
                </p>
              </div>
              <span className={`badge ${PAYMENT_COLORS[booking.payment_status]} flex-shrink-0`}>
                {PAYMENT_LABELS[booking.payment_status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
