'use client'

import { useState, useEffect } from 'react'
import { Trophy, Timer, RefreshCw } from 'lucide-react'

function formatTime(ms: number) {
  const min = Math.floor(ms / 60000)
  const sec = Math.floor((ms % 60000) / 1000)
  const cs  = Math.floor((ms % 1000) / 10)
  if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
  return `${sec}.${cs.toString().padStart(2, '0')}s`
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const MEDAL_LABELS = ['🥇', '🥈', '🥉']

export default function ClassementPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [lastUpdate, setLastUpdate]   = useState<Date | null>(null)

  async function load() {
    const d = await fetch('/api/chrono/leaderboard').then(r => r.json())
    setLeaderboard(d.leaderboard || [])
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const podium = leaderboard.slice(0, 3)
  const rest   = leaderboard.slice(3)

  return (
    <main className="min-h-dvh bg-[var(--bg-primary)] pb-10">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-5 py-5 text-center">
        <img src="/logo-easydrift.png" alt="EASYDRIFT" className="h-12 w-auto mx-auto mb-3" />
        <h1 className="font-bebas text-3xl text-[var(--text-primary)] tracking-widest">Classement Session Conduite</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Weekend JAPN CAR — Montlhéry</p>
        {lastUpdate && (
          <div className="flex items-center justify-center gap-1.5 mt-2 text-[var(--text-secondary)] text-xs">
            <RefreshCw size={10} />
            Mis à jour à {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Timer size={32} className="text-[var(--accent)] animate-pulse" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <Timer size={48} className="text-[var(--text-secondary)] mx-auto mb-4" />
            <p className="font-bebas text-2xl text-[var(--text-primary)]">Aucun temps enregistré</p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Les chronos apparaîtront ici en temps réel</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy size={18} className="text-yellow-400" />
                  <h2 className="font-bebas text-xl text-[var(--text-primary)]">Podium</h2>
                </div>
                <div className="space-y-3">
                  {podium.map((entry: any, i: number) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-4 rounded-2xl border"
                      style={{
                        borderColor: `${MEDAL_COLORS[i]}40`,
                        backgroundColor: `${MEDAL_COLORS[i]}08`,
                      }}
                    >
                      <span className="text-3xl">{MEDAL_LABELS[i]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bebas text-xl text-[var(--text-primary)] truncate">{entry.participant_name}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className="font-mono font-bold text-xl"
                          style={{ color: MEDAL_COLORS[i] }}
                        >
                          {formatTime(entry.time_ms)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reste du classement */}
            {rest.length > 0 && (
              <div className="card p-5">
                <h2 className="font-bebas text-lg text-[var(--text-primary)] mb-3">Classement complet</h2>
                <div className="space-y-2">
                  {leaderboard.map((entry: any, i: number) => (
                    <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)]/50 last:border-0">
                      <span className={`font-bebas text-lg w-7 text-center ${i < 3 ? 'text-yellow-400' : 'text-[var(--text-secondary)]'}`}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-[var(--text-primary)] text-sm">{entry.participant_name}</span>
                      <span className="font-mono text-sm font-semibold text-[var(--accent)]">{formatTime(entry.time_ms)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-center text-[var(--text-secondary)] text-xs mt-6">
              Le meilleur temps du weekend remporte une journée EASYDRIFT EXPERIENCE sur circuit
            </p>
          </>
        )}
      </div>
    </main>
  )
}
