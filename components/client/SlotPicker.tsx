'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import type { Slot, Activity } from '@/lib/supabase/types'
import { formatTime, getAvailabilityStatus, getMorningAfternoon } from '@/lib/utils'
import { Users, Plus, Check } from 'lucide-react'

interface SlotPickerProps {
  activity: Activity
  day: string
  onToggle: (slot: Slot) => void
  selectedSlotIds?: string[]
}

export function SlotPicker({ activity, day, onToggle, selectedSlotIds = [] }: SlotPickerProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSlots()
    const channel = supabase
      .channel(`slots-${activity.id}-${day}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'slots', filter: `activity_id=eq.${activity.id}` }, () => fetchSlots())
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

  const isPast = (slot: Slot) => new Date(`${slot.day}T${slot.start_time}`) < new Date()

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

  const renderSlot = (slot: Slot) => {
    const available = slot.capacity - slot.booked_count
    const status = getAvailabilityStatus(available, slot.capacity)
    const past = isPast(slot)
    const isFull = available === 0 || past
    const isSelected = selectedSlotIds.includes(slot.id)
    const fillPct = ((slot.booked_count / slot.capacity) * 100).toFixed(0)

    return (
      <motion.button
        key={slot.id}
        onClick={() => !isFull && onToggle(slot)}
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
            ? 'border-[var(--accent)] cursor-pointer'
            : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)] cursor-pointer',
        ].join(' ')}
        style={isSelected ? { backgroundColor: `${activity.color}15`, borderColor: activity.color } : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              past ? 'bg-gray-600' : isFull ? 'bg-red-500' : status.variant === 'low' ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="font-semibold text-sm">{formatTime(slot.start_time)}</span>
            {past && <span className="text-[var(--text-secondary)] text-xs">Passé</span>}
          </div>
          <div className="flex items-center gap-2">
            {activity.name === 'bapteme' && (
              <span className={`text-xs flex items-center gap-1 ${status.color}`}>
                <Users size={12} />
                {isFull ? 'Complet' : `${available}/${slot.capacity}`}
              </span>
            )}
            {!isFull && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={isSelected
                  ? { backgroundColor: activity.color }
                  : { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }
                }
              >
                {isSelected
                  ? <Check size={14} className="text-white" />
                  : <Plus size={14} className="text-[var(--text-secondary)]" />
                }
              </div>
            )}
          </div>
        </div>
        {activity.name === 'bapteme' && !isFull && (
          <div className="mt-2 h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${fillPct}%`, backgroundColor: activity.color }}
            />
          </div>
        )}
      </motion.button>
    )
  }

  if (activity.name === 'carbooling') {
    return (
      <div>
        <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">Animation Midi</h3>
        <div className="space-y-2">
          {slots.filter(s => !s.is_break).map(renderSlot)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {morningSlots.length > 0 && (
        <div>
          <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">Matin</h3>
          <div className="space-y-2">{morningSlots.map(renderSlot)}</div>
        </div>
      )}
      {afternoonSlots.filter(s => s.start_time >= '13:00:00').length > 0 && (
        <div>
          <h3 className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-3">Après-midi</h3>
          <div className="space-y-2">{afternoonSlots.filter(s => s.start_time >= '13:00:00').map(renderSlot)}</div>
        </div>
      )}
    </div>
  )
}
