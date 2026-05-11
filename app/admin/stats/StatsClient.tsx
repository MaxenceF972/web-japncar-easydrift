'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import type { Booking, Activity, Slot } from '@/lib/supabase/types'
import { formatPrice } from '@/lib/utils'

interface Props {
  bookings: Booking[]
  activities: Activity[]
  slots: Slot[]
}

export function StatsClient({ bookings, activities, slots }: Props) {
  const totalRevenue = useMemo(() =>
    bookings.reduce((sum, b) => sum + (b.amount_paid || 0), 0), [bookings])

  const myShare = Math.round(totalRevenue * 0.2)

  const byActivity = useMemo(() =>
    activities.map(a => {
      const abs = bookings.filter(b => b.activity_id === a.id)
      const rev = abs.reduce((sum, b) => sum + (b.amount_paid || 0), 0)
      return { name: a.label, count: abs.length, revenue: rev / 100, color: a.color }
    }), [bookings, activities])

  const bySatSun = useMemo(() => {
    const sat = bookings.filter(b => (b as any).slot?.day === '2025-09-13').length
    const sun = bookings.filter(b => (b as any).slot?.day === '2025-09-14').length
    return [
      { name: 'Samedi', value: sat },
      { name: 'Dimanche', value: sun },
    ]
  }, [bookings])

  const byPaymentMode = useMemo(() => {
    const online = bookings.filter(b => b.payment_status === 'paid').length
    const cash = bookings.filter(b => b.payment_status === 'cash').length
    const free = bookings.filter(b => b.payment_status === 'free').length
    return [
      { name: 'En ligne', value: online, color: '#27AE60' },
      { name: 'Cash', value: cash, color: '#8E44AD' },
      { name: 'Gratuit', value: free, color: '#888888' },
    ]
  }, [bookings])

  const fillRate = useMemo(() => {
    const totalCap = slots.reduce((sum, s) => sum + s.capacity, 0)
    const totalBooked = slots.reduce((sum, s) => sum + s.booked_count, 0)
    return totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0
  }, [slots])

  return (
    <div className="md:ml-56 p-5 max-w-3xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-6">Statistiques</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'CA Total', value: formatPrice(totalRevenue), sub: 'TTC' },
          { label: 'Ta part (20%)', value: formatPrice(myShare), sub: 'Net estimé' },
          { label: 'Taux de remplissage', value: `${fillRate}%`, sub: 'Global' },
          { label: 'Total réservations', value: bookings.length, sub: 'Confirmées' },
        ].map(({ label, value, sub }, i) => (
          <div key={i} className="card p-4">
            <p className="text-[var(--text-secondary)] text-xs mb-1">{label}</p>
            <p className="font-bebas text-2xl text-[var(--accent)]">{value}</p>
            <p className="text-[var(--text-secondary)] text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* CA par activité */}
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

      {/* Samedi vs Dimanche */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <h2 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Samedi vs Dimanche</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={bySatSun} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, value }) => `${name}: ${value}`}>
                <Cell fill="#F47B20" />
                <Cell fill="#E74C3C" />
              </Pie>
              <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #222', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

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
      </div>

      {/* Détail par activité */}
      <div className="card p-4">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Détail par activité</h2>
        <div className="space-y-3">
          {byActivity.map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--text-primary)]">{a.name}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{a.count} rés.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (a.count / bookings.length) * 100)}%`, backgroundColor: a.color }}
                    />
                  </div>
                  <span className="text-[var(--text-secondary)] text-xs w-16 text-right">{a.revenue}€</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
