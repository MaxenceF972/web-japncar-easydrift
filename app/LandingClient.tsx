'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, MapPin, Clock, Shield, Ticket } from 'lucide-react'
import type { Activity } from '@/lib/supabase/types'
import { ActivityCard } from '@/components/client/ActivityCard'

// Date de l'événement — à adapter
const EVENT_DATE = new Date('2026-05-30T09:00:00')

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function compute() {
      const diff = EVENT_DATE.getTime() - Date.now()
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    compute()
    const t = setInterval(compute, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex items-center gap-3 justify-center">
      {[
        { v: timeLeft.days, label: 'Jours' },
        { v: timeLeft.hours, label: 'Heures' },
        { v: timeLeft.minutes, label: 'Min' },
        { v: timeLeft.seconds, label: 'Sec' },
      ].map(({ v, label }, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="card w-14 h-14 flex items-center justify-center">
            <span className="font-bebas text-2xl text-[var(--accent)]">
              {String(v).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[var(--text-secondary)] text-[10px] mt-1 uppercase tracking-widest">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

const HOW_STEPS = [
  { icon: Ticket, n: '01', title: 'Choisissez', desc: 'Sélectionnez votre activité et votre créneau' },
  { icon: Shield, n: '02', title: 'Payez', desc: 'Paiement sécurisé en ligne via SumUp' },
  { icon: Clock, n: '03', title: 'Recevez', desc: 'Votre ticket avec QR code par email instantanément' },
  { icon: MapPin, n: '04', title: 'Profitez', desc: 'Présentez votre QR code à l\'entrée et vivez l\'expérience' },
]

interface Props {
  activities: Activity[]
}

export function LandingClient({ activities }: Props) {
  const activitiesRef = useRef<HTMLDivElement>(null)

  return (
    <main className="min-h-dvh">
      {/* HERO */}
      <section
        className="relative min-h-dvh flex flex-col items-center justify-center px-5 py-20 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(192,57,43,0.08) 0%, var(--bg-primary) 60%)',
        }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-md mx-auto"
        >
          {/* Badge événement */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent)] mb-6">
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[var(--accent)] text-xs font-semibold uppercase tracking-widest">
              Samedi & Dimanche
            </span>
          </div>

          <img
            src="/logo-easydrift.png"
            alt="EasyDrift"
            className="mx-auto mb-2"
            style={{ width: 'auto', height: 'auto', maxWidth: '260px', maxHeight: '70px', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(244,123,32,0.4))' }}
          />
          <p className="font-bebas text-2xl text-[var(--text-secondary)] mb-2 tracking-widest">
            JAPN CAR
          </p>
          <p className="flex items-center justify-center gap-1.5 text-[var(--text-secondary)] text-sm mb-8">
            <MapPin size={14} />
            Circuit de Montlhéry
          </p>

          <Countdown />

          <motion.button
            onClick={() => activitiesRef.current?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-cta w-full mt-8 text-base font-bebas tracking-widest text-lg"
          >
            RÉSERVER MA PLACE
          </motion.button>

          <p className="text-[var(--text-secondary)] text-xs mt-4">
            Places limitées — paiement sécurisé en ligne
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown size={20} className="text-[var(--text-secondary)]" />
        </motion.div>
      </section>

      {/* ACTIVITÉS */}
      <section ref={activitiesRef} className="px-5 py-12 max-w-lg mx-auto">
        <div className="mb-8">
          <h2 className="font-bebas text-4xl text-[var(--text-primary)]">
            Choisissez votre <span className="text-[var(--accent)]">expérience</span>
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            3 activités disponibles pour vivre l'adrénaline de la dérive
          </p>
        </div>

        <div className="space-y-4">
          {activities.map((activity, i) => (
            <ActivityCard key={activity.id} activity={activity} index={i} />
          ))}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="px-5 py-12 max-w-lg mx-auto border-t border-[var(--border)]">
        <h2 className="font-bebas text-4xl text-[var(--text-primary)] mb-8">
          Comment ça <span className="text-[var(--accent)]">marche</span>
        </h2>

        <div className="space-y-4">
          {HOW_STEPS.map(({ icon: Icon, n, title, desc }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                <Icon size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[var(--text-secondary)] text-xs font-bebas">{n}</span>
                  <h3 className="font-semibold text-[var(--text-primary)]">{title}</h3>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] px-5 py-8 text-center">
        <img src="/logo-easydrift.png" alt="EasyDrift" className="h-7 w-auto mx-auto mb-1" />
        <p className="text-[var(--text-secondary)] text-xs">JAPN Car • Circuit de Montlhéry</p>
        <p className="text-[var(--text-secondary)] text-xs mt-3">
          Questions ? <a href="mailto:maxence.fortier@easydriftdts.com" className="text-[var(--accent)]">maxence.fortier@easydriftdts.com</a>
        </p>
      </footer>
    </main>
  )
}
