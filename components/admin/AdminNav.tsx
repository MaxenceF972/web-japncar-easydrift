'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, QrCode, List, UserPlus, BarChart3, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/planning',     icon: Calendar,        label: 'Planning' },
  { href: '/admin/scanner',      icon: QrCode,          label: 'Scanner' },
  { href: '/admin/reservations', icon: List,            label: 'Réservations' },
  { href: '/admin/inscrire',     icon: UserPlus,        label: 'Inscrire' },
  { href: '/admin/stats',        icon: BarChart3,       label: 'Stats' },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-[var(--bg-card)] border-r border-[var(--border)] flex-col z-40">
        <div className="p-4 border-b border-[var(--border)]">
          <img src="/logo-easydrift.png" alt="EasyDrift" className="h-6 w-auto" />
          <p className="text-[var(--text-secondary)] text-xs mt-1">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border)] pb-safe">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <a
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[52px]"
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}
                />
                <span className={`text-[10px] ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                  {label}
                </span>
              </a>
            )
          })}
        </div>
      </nav>
    </>
  )
}
