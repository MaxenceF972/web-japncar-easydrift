'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { Slot, Activity } from '@/lib/supabase/types'
import { formatTime, getAvailabilityStatus, getMorningAfternoon } from '@/lib/utils'
import { Users } from 'lucide-react'

interface SlotPickerProps {
  activity: Activity
  day: string
  onSelect: (slot: Slot) => void
  selectedSlotId?: string
}

export function SlotPicker({ activity, day, onSelect, selectedSlotId }: SlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSlots()

    // Realtime subscription
    const channel = supabase
      .channel(`slots-${activity.id}-${day}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'slots',
          filter: `activity_id=eq.${activity.id}`,
        },
        () => fetchSlots()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id, day])

  async function fetchSlots() {
    setLoading(true)
    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('activity_id', activity.id)
      .eq('day', day)
      .order('start_time')
    setSlots(data || [])
    setLoading(false)
  }

  const isPast = (slot: Slot) => {
    const slotDateTime = new Date(`${slot.day}T${slot.start_time}`)
    return slotDateTime < new Date()
  }

  const morningSlots = slots.filter(s => !s.is_break && getMorningAfternoon(s.start_time) === 'morning')
  const afternoonSlots = slots.filter(s => !s.is_break && getMorningAfternoon(s.start_time) === 'afternoon')

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse bg-[var(--bg-elevated)]" />
        ))}
      </div>
    )
  }

  const renderSlotGroup = (label: string, groupSlots: Slot[]) => {
    if (groupSlots.length === 0) return null
    return (
      <div>
        <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">
          {label}
        </h3>
        <div className="space-y-2">
          {groupSlots.map(slot => {
            const available = slot.capacity - slot.booked_count
            const status = getAvailabilityStatus(available, slot.capacity)
            const past = isPast(slot)
            const isFull = available === 0 || past
            const isSelected = slot.id === selectedSlotId
            const fillPct = ((slot.booked_count / slot.capacity) * 100).toFixed(0)

            return (
              <motion.button
                key={slot.id}
                onClick={() => !isFull && onSelect(slot)}
                disabled={isFull}
                whileHover={!isFull ? { scale: 1.01 } : {}}
                whileTap={!isFull ? { scale: 0.99 } : {}}
                className={[
                  'w-full text-left p-4 rounded-xl border transition-all duration-200',
                  past
                    ? 'opacity-30 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border)]'
                    : isFull
                    ? 'opacity-40 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border)]'
                    : isSelected
                    ? 'bg-[var(--accent)] border-[var(--accent)] cursor-pointer'
                    : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)] cursor-pointer',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      past ? 'bg-gray-600' : isFull ? 'bg-red-500' : status.variant === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="font-semibold text-sm">
                      {formatTime(slot.start_time)}
                    </span>
                    {past && <span className="text-[var(--text-secondary)] text-xs">Passé</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.name === 'bapteme' && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isSelected ? 'text-white' : status.color
                      }`}>
                        <Users size={12} />
                        {isFull ? 'Complet' : `${available}/${slot.capacity}`}
                      </span>
                    )}
                    {!isFull && !isSelected && (
                      <span className="text-[var(--text-secondary)] text-xs font-medium">
                        Choisir
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-white text-xs font-semibold">✓ Sélectionné</span>
                    )}
                  </div>
                </div>
                {activity.name === 'bapteme' && !isFull && (
                  <div className="mt-2 h-1 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${fillPct}%`,
                        background: isSelected ? 'rgba(255,255,255,0.5)' : activity.color,
                      }}
                    />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  if (activity.name === 'carbooling') {
    return (
      <div>
        <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">
          Animation Midi
        </h3>
        <div className="space-y-2">
          {slots.filter(s => !s.is_break).map(slot => {
            const available = slot.capacity - slot.booked_count
            const isFull = available === 0
            const isSelected = slot.id === selectedSlotId
            return (
              <motion.button
                key={slot.id}
                onClick={() => !isFull && onSelect(slot)}
                disabled={isFull}
                whileHover={!isFull ? { scale: 1.01 } : {}}
                className={[
                  'w-full text-left p-4 rounded-xl border transition-all duration-200',
                  isFull
                    ? 'opacity-40 cursor-not-allowed bg-[var(--bg-card)] border-[var(--border)]'
                    : isSelected
                    ? 'bg-[var(--accent)] border-[var(--accent)]'
                    : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`} />
                    <span className="font-semibold text-sm">{formatTime(slot.start_time)}</span>
                    <span className="text-[var(--text-secondary)] text-xs">4 min</span>
                  </div>
                  <span className={`text-xs ${isFull ? 'text-red-400' : isSelected ? 'text-white font-semibold' : 'text-green-400'}`}>
                    {isFull ? 'Pris' : isSelected ? '✓ Sélectionné' : 'Disponible'}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderSlotGroup('Matin', morningSlots)}
      {renderSlotGroup('Après-midi', afternoonSlots.filter(s => s.start_time >= '13:00:00'))}
    </div>
  )
}
