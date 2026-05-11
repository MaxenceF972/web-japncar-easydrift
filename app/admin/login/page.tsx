'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError(null)

    // Lire directement depuis le DOM pour capturer l'autofill Dashlane/browser
    const email = emailRef.current?.value?.trim() || ''
    const password = passwordRef.current?.value || ''

    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    window.location.href = '/admin/dashboard'
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 bg-[var(--bg-primary)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-easydrift.png" alt="EasyDrift" className="h-12 w-auto mx-auto mb-2" />
          <p className="text-[var(--text-secondary)] text-sm">Administration</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4">
          <h1 className="font-semibold text-[var(--text-primary)] text-lg mb-2">Connexion</h1>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                ref={emailRef}
                type="email"
                className="input-field pl-9"
                placeholder="maxence.fortier@gmail.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                ref={passwordRef}
                type="password"
                className="input-field pl-9"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => handleLogin()}
            disabled={loading}
            className="btn-cta w-full"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </main>
  )
}
