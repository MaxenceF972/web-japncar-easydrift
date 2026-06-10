'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, Zap, Car, Wind } from 'lucide-react'
import type { Activity } from '@/lib/supabase/types'
import { formatPrice } from '@/lib/utils'

const ACTIVITY_ICONS = {
  bapteme: Zap,
  conduite: Car,
  carbooling: Wind,
}

interface ActivityCardProps {
  activity: Activity
  index?: number
}

export function ActivityCard({ activity, index = 0 }: ActivityCardProps) {
  const router = useRouter()
  const Icon = ACTIVITY_ICONS[activity.name as keyof typeof ACTIVITY_ICONS] ?? Zap

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      onClick={() => router.push(`/reserver/${activity.name}`)}
      className="card p-5 cursor-pointer group active:scale-[0.98] transition-transform duration-200"
      style={{ borderLeft: `3px solid ${activity.color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${activity.color}20` }}
            >
              <Icon size={20} style={{ color: activity.color }} />
            </div>
            <div>
              <h3 className="font-bebas text-xl text-[var(--text-primary)] leading-none">
                {activity.label}
              </h3>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
            {activity.description}
          </p>

          {activity.name === 'conduite' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-1">
              <span className="text-base">🏆</span>
              <p className="text-yellow-400 text-xs font-semibold">Meilleur temps du weekend = 1 journée EASYDRIFT EXPERIENCE sur circuit</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm"></div>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="text-right">
            <span className="font-bebas text-3xl" style={{ color: activity.color }}>
              {formatPrice(activity.price)}
            </span>
            <span className="text-[var(--text-secondary)] text-xs block">/ pers.</span>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 group-hover:bg-[var(--accent)]"
            style={{ background: `${activity.color}20` }}
          >
            <ChevronRight size={16} style={{ color: activity.color }} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
