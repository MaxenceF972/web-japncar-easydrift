'use client'

import { useState, useEffect } from 'react'
import { Timer, Plus, Trash2, Trophy } from 'lucide-react'
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard'

function formatTime(ms: number) {
  const min = Math.floor(ms / 60000)
  const sec = Math.floor((ms % 60000) / 1000)
  const cs  = Math.floor((ms % 1000) / 10)
  return `${min}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`
}

function parseTime(str: string): number | null {
  const match = str.trim().match(/^(\d+):(\d{1,2})\.(\d{1,2})$/)
  if (!match) return null
  const [, min, sec, cs] = match.map(Number)
  if (sec >= 60) return null
  return (min * 60 + sec) * 1000 + cs * 10
}

const DAYS = [
  { label: 'Samedi 30 mai', value: '2026-05-30' },
  { label: 'Dimanche 31 mai', value: '2026-05-31' },
]

export default function ChronoPage() {
  return (
    <AdminAuthGuard>
      <ChronoContent />
    </AdminAuthGuard>
  )
}

function ChronoContent() {
  const [participants, setParticipants] = useState<any[]>([])
  const [laps, setLaps]                 = useState<any[]>([])
  const [leaderboard, setLeaderboard]   = useState<any[]>([])
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<any>(null)
  const [timeInput, setTimeInput]       = useState('')
  const [day, setDay]                   = useState(DAYS[0].value)
  const [error, setError]               = useState('')
  const [saving, setSaving]             = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetch('/api/chrono/participants').then(r => r.json()).then(d => setParticipants(d.participants || []))
    loadLaps()
    loadLeaderboard()
  }, [])

  async function loadLaps() {
    const d = await fetch('/api/chrono/lap').then(r => r.json())
    setLaps(d.laps || [])
  }

  async function loadLeaderboard() {
    const d = await fetch('/api/chrono/leaderboard').then(r => r.json())
    setLeaderboard(d.leaderboard || [])
  }

  const filtered = participants.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit() {
    setError('')
    const ms = parseTime(timeInput)
    if (!ms) { setError('Format invalide — utilisez M:SS.cc (ex: 1:23.45)'); return }
    if (!selected && !search.trim()) { setError('Sélectionnez ou tapez un participant'); return }

    setSaving(true)
    const name = selected ? `${selected.first_name} ${selected.last_name}` : search.trim()
    await fetch('/api/chrono/lap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_name: name, booking_id: selected?.id || null, time_ms: ms, day }),
    })
    setTimeInput('')
    setSelected(null)
    setSearch('')
    setSaving(false)
    loadLaps()
    loadLeaderboard()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/chrono/lap/${id}`, { method: 'DELETE' })
    loadLaps()
    loadLeaderboard()
  }

  return (
    <div className="md:ml-56 p-5 max-w-2xl pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
          <Timer size={20} className="text-[var(--accent)]" />
        </div>
        <div>
          <h1 className="font-bebas text-2xl text-[var(--text-primary)]">Chrono Session Conduite</h1>
          <p className="text-[var(--text-secondary)] text-xs">Format : M:SS.cc — ex: 1:23.45</p>
        </div>
      </div>

      {/* Formulaire saisie */}
      <div className="card p-5 mb-5 space-y-4">

        {/* Jour */}
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Jour</label>
          <div className="flex gap-2">
            {DAYS.map(d => (
              <button
                key={d.value}
                onClick={() => setDay(d.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${day === d.value ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Participant */}
        <div className="relative">
          <label className="text-xs text-[var(--text-secondary)] block mb-1.5">
            Nom du participant <span className="text-[var(--text-secondary)]/60">(tapez librement ou choisissez)</span>
          </label>
          <input
            className="input-field"
            placeholder="Ex : Jean Dupont"
            value={selected ? `${selected.first_name} ${selected.last_name}` : search}
            onChange={e => { setSearch(e.target.value); setSelected(null); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
          />
          {showDropdown && !selected && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              {filtered.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  onMouseDown={() => { setSelected(p); setSearch(''); setShowDropdown(false) }}
                >
                  {p.first_name} {p.last_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Temps */}
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1.5">Temps (M:SS.cc)</label>
          <input
            className="input-field font-mono text-lg tracking-widest"
            placeholder="1:23.45"
            value={timeInput}
            onChange={e => { setTimeInput(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            inputMode="decimal"
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn-cta w-full flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {saving ? 'Enregistrement...' : 'Enregistrer le tour'}
        </button>
      </div>

      {/* Mini classement */}
      {leaderboard.length > 0 && (
        <div className="card p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-yellow-400" />
            <h2 className="font-bebas text-lg text-[var(--text-primary)]">Classement actuel</h2>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry: any, i: number) => (
              <div key={entry.id} className="flex items-center gap-3 text-sm">
                <span className={`font-bebas text-lg w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-[var(--text-secondary)]'}`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-[var(--text-primary)]">{entry.participant_name}</span>
                <span className="font-mono text-[var(--accent)] font-semibold">{formatTime(entry.time_ms)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Derniers tours saisis */}
      <div className="card p-5">
        <h2 className="font-bebas text-lg text-[var(--text-primary)] mb-3">Derniers tours saisis</h2>
        {laps.length === 0 ? (
          <p className="text-[var(--text-secondary)] text-sm text-center py-4">Aucun tour enregistré</p>
        ) : (
          <div className="space-y-2">
            {laps.slice(0, 20).map((lap: any) => (
              <div key={lap.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-[var(--border)]/50">
                <span className="flex-1 text-[var(--text-primary)]">{lap.participant_name}</span>
                <span className="font-mono text-[var(--accent)]">{formatTime(lap.time_ms)}</span>
                <span className="text-[var(--text-secondary)] text-xs">{lap.day === '2026-05-30' ? 'SAM' : 'DIM'}</span>
                <button
                  onClick={() => handleDelete(lap.id)}
                  className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
