'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, CheckSquare, AlertTriangle } from 'lucide-react'
import { formatPrice, formatTime, getDayLabel } from '@/lib/utils'
import type { Booking, Activity } from '@/lib/supabase/types'

interface KPIs {
  totalBookings: number
  revenue: number
  availableSlots: number
  checkins: number
}

interface Props {
  kpis: KPIs
  recentBookings: Booking[]
  bookings: Booking[]
  activities: Activity[]
}

const PAYMENT_LABELS: Record<string, string> = {
  paid: 'Payé', cash: 'Cash', free: 'Gratuit', pending: 'En attente', cancelled: 'Annulé',
}
const PAYMENT_COLORS: Record<string, string> = {
  paid: 'badge-green', cash: 'badge-purple', free: 'badge-gray', pending: 'badge-yellow', cancelled: 'badge-red',
}

export function DashboardClient({ kpis, recentBookings, bookings, activities }: Props) {
  const chartData = activities.map(a => ({
    name: a.label.replace('Session ', '').replace('Baptême ', 'Baptême'),
    reservations: bookings.filter(b => b.activity_id === a.id && b.payment_status !== 'cancelled').length,
    color: a.color,
  }))

  const pendingAlerts = bookings.filter(b => b.payment_status === 'pending').length

  return (
    <div className="md:ml-56 p-5 max-w-4xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-6">Dashboard</h1>

      {/* Alert */}
      {pendingAlerts > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            {pendingAlerts} paiement{pendingAlerts > 1 ? 's' : ''} en attente de confirmation
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: Users, label: 'Réservations', value: kpis.totalBookings, color: 'text-blue-400' },
          { icon: DollarSign, label: 'CA encaissé', value: formatPrice(kpis.revenue), color: 'text-green-400' },
          { icon: TrendingUp, label: 'Places restantes', value: kpis.availableSlots, color: 'text-orange-400' },
          { icon: CheckSquare, label: 'Check-ins', value: kpis.checkins, color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-4"
          >
            <Icon size={16} className={`${color} mb-2`} />
            <p className="font-bebas text-2xl text-[var(--text-primary)]">{value}</p>
            <p className="text-[var(--text-secondary)] text-xs">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Graphique */}
      <div className="card p-4 mb-6">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Réservations par activité</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 8, color: '#F5F5F5' }}
            />
            <Bar dataKey="reservations" fill="#F47B20" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Flux récent */}
      <div className="card p-4">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Dernières réservations</h2>
        <div className="space-y-3">
          {recentBookings.length === 0 && (
            <p className="text-[var(--text-secondary)] text-sm text-center py-4">Aucune réservation</p>
          )}
          {recentBookings.map(booking => (
            <div key={booking.id} className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                  {booking.first_name} {booking.last_name}
                </p>
                <p className="text-[var(--text-secondary)] text-xs">
                  {(booking as any).activity?.label} · {(booking as any).slot ? formatTime((booking as any).slot.start_time) : ''}
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
