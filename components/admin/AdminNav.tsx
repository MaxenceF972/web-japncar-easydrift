'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, QrCode, List, UserPlus, BarChart3, LogOut, MessageSquare, TrendingUp, Timer, MoreHorizontal, X, Video, CalendarDays, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useEvent } from '@/contexts/EventContext'
import type { Event } from '@/lib/supabase/types'

const NAV_ITEMS = [
  { href: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/events',         icon: CalendarDays,    label: 'Événements' },
  { href: '/admin/planning',       icon: Calendar,        label: 'Planning' },
  { href: '/admin/scanner',        icon: QrCode,          label: 'Scanner' },
  { href: '/admin/reservations',   icon: List,            label: 'Réservations' },
  { href: '/admin/inscrire',       icon: UserPlus,        label: 'Inscrire' },
  { href: '/admin/chrono',         icon: Timer,           label: 'Chrono' },
  { href: '/admin/contacts',       icon: MessageSquare,   label: 'Contacts' },
  { href: '/admin/videos',         icon: Video,           label: 'Vidéos' },
  { href: '/admin/stats',          icon: BarChart3,       label: 'Stats' },
  { href: '/admin/previsionnel',   icon: TrendingUp,      label: 'Prévisionnel' },
]

const MOBILE_PRIMARY = NAV_ITEMS.slice(2, 7) // Planning, Scanner, Réservations, Inscrire, Chrono
const MOBILE_MORE    = [NAV_ITEMS[0], NAV_ITEMS[1], ...NAV_ITEMS.slice(7)]

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-500',
  draft:    'bg-yellow-500',
  archived: 'bg-[var(--border)]',
}

const STATUS_LABELS: Record<string, string> = {
  active:   'Actif',
  draft:    'Brouillon',
  archived: 'Archivé',
}

function EventSwitcher() {
  const { events, selectedEvent, setSelectedEvent } = useEvent()
  const [open, setOpen] = useState(false)

  if (!selectedEvent) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors text-left"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[selectedEvent.status]}`} />
        <span className="flex-1 text-xs font-semibold text-[var(--text-primary)] truncate">{selectedEvent.name}</span>
        <ChevronDown size={12} className="text-[var(--text-secondary)] flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => { setSelectedEvent(event); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--bg-elevated)] transition-colors ${event.id === selectedEvent.id ? 'bg-[var(--bg-elevated)]' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[event.status]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{event.name}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{STATUS_LABELS[event.status]}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [showMore, setShowMore] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const isMoreActive = MOBILE_MORE.some(i => i.href === pathname)

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-[var(--bg-card)] border-r border-[var(--border)] flex-col z-40">
        <div className="p-4 border-b border-[var(--border)]">
          <img src="/logo-easydrift.png" alt="EASYDRIFT" className="h-14 w-auto" />
          <p className="text-[var(--text-secondary)] text-xs mt-1 mb-3">Admin</p>
          <EventSwitcher />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 text-sm',
                pathname === href
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              <Icon size={16} />
              {label}
            </a>
          ))}
        </nav>
        <div className="p-3 border-t border-[var(--border)]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:text-red-400 transition-colors text-sm w-full"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden md:block w-56 flex-shrink-0" />

      {/* Mobile — drawer "Plus" */}
      {showMore && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border)] px-4 pt-4 pb-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">Plus</span>
              <button onClick={() => setShowMore(false)}><X size={18} className="text-[var(--text-secondary)]" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MOBILE_MORE.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors"
                  >
                    <Icon size={20} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                    <span className={`text-[10px] text-center leading-tight ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>{label}</span>
                  </a>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} className="text-[var(--text-secondary)]" />
                <span className="text-[10px] text-[var(--text-secondary)]">Déco.</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border)] pb-safe">
        <div className="flex items-center justify-around px-1 py-1">
          {MOBILE_PRIMARY.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <a
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl"
              >
                <Icon size={22} className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                <span className={`text-[10px] ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>{label}</span>
              </a>
            )
          })}
          <button
            onClick={() => setShowMore(v => !v)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl"
          >
            <MoreHorizontal size={22} className={isMoreActive || showMore ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
            <span className={`text-[10px] ${isMoreActive || showMore ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>Plus</span>
          </button>
        </div>
      </nav>
    </>
  )
}
