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

const MEDALS = ['🥇', '🥈', '🥉']
const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

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
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-dvh bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border)] px-5 py-4 text-center flex-shrink-0">
        <img src="/logo-easydrift.png" alt="EASYDRIFT" className="h-10 w-auto mx-auto mb-2" />
        <div className="flex items-center justify-center gap-2">
          <Trophy size={16} className="text-yellow-400" />
          <h1 className="font-bebas text-2xl text-[var(--text-primary)] tracking-widest">Classement Session Conduite</h1>
        </div>
        {lastUpdate && (
          <div className="flex items-center justify-center gap-1.5 mt-1 text-[var(--text-secondary)] text-xs">
            <RefreshCw size={10} />
            {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        )}
      </div>

      {/* Liste scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
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
          <div className="space-y-2">
            {leaderboard.map((entry: any, i: number) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={i < 3 ? {
                  borderColor: `${MEDAL_COLORS[i]}40`,
                  backgroundColor: `${MEDAL_COLORS[i]}08`,
                } : {
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="font-bebas text-lg text-[var(--text-secondary)]">{i + 1}</span>}
                </span>
                <span className="flex-1 font-medium text-[var(--text-primary)] truncate">{entry.participant_name}</span>
                <span
                  className="font-mono font-bold text-lg flex-shrink-0"
                  style={{ color: i < 3 ? MEDAL_COLORS[i] : 'var(--accent)' }}
                >
                  {formatTime(entry.time_ms)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-3 text-[var(--text-secondary)] text-xs flex-shrink-0">
        Le meilleur temps remporte une journée EASYDRIFT EXPERIENCE sur circuit
      </div>
    </main>
  )
}
