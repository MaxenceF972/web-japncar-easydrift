'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (pathname === '/admin/login') {
      setChecked(true)
      return
    }

    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/admin/login'
      } else {
        setChecked(true)
      }
    })
  }, [pathname])

  // Page login : afficher directement sans attendre
  if (pathname === '/admin/login') return <>{children}</>

  // Autres pages : attendre la vérification
  if (!checked) return null

  return <>{children}</>
}
