'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lock, Plus, Pencil, Trash2, Check, X } from 'lucide-react'


interface TeamMember { id: string; nom: string; poste: string; samedi: boolean; dimanche: boolean }

const SESSION_KEY = 'previsionnel_auth'
const PASSWORD    = process.env.NEXT_PUBLIC_PREVISIONNEL_PASSWORD || 'driftagain'

const UTAC_RATE = 5 // € par personne

// ── Données fixes du planning ──────────────────────────────────────────────
const CHARGES = [
  { poste: 'Pneus — 1 voiture Baptême',                montant: 400 },
  { poste: 'Anneaux — 3 voitures Baptême',             montant: 1000 },
  { poste: 'Location voitures Baptême (J1×2 + J2×1)',  montant: 648 },
  { poste: 'Pneus — voiture Conduite',                 montant: 600 },
  { poste: 'Anneaux — voiture Conduite',               montant: 700 },
  { poste: 'Essence Baptême 2J',                       montant: 800 },
  { poste: 'Essence Conduite 2J',                      montant: 250 },
  { poste: 'Location Mégane Booling',                  montant: 180 },
  { poste: 'Bouffe',                                   montant: 300 },
  { poste: 'Équipe',                                   montant: 1000 },
]

const ACTIVITES = [
  { nom: 'Baptême — Samedi', couleur: '#F47B20', personnes: 396, prix: 50, detail: '44 créneaux × 9 pers. (3 voitures × 3 places)' },
  { nom: 'Baptême — Dimanche', couleur: '#E8601C', personnes: 264, prix: 50, detail: '44 créneaux × 6 pers. (2 voitures × 3 places)' },
  { nom: 'Session Conduite', couleur: '#E67E22', personnes: 122, prix: 50, detail: '61 passages/j × 2j × 1 pilote' },
  { nom: 'Car Booling / Football', couleur: '#8E44AD', personnes: 14, prix: 25, detail: '7 passages/j × 2j × 1 passager' },
]

const SCENARIOS = [25, 50, 75, 100]

function formatEur(n: number) {
  return n.toLocaleString('fr-FR') + ' €'
}

export default function PrevisionnelPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput]       = useState('')
  const [error, setError]       = useState(false)
  const [utacCounts, setUtacCounts] = useState<{ bapteme: number; conduite: number; carbooling: number; total: number } | null>(null)
  const [team, setTeam]           = useState<TeamMember[]>([])
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editForm, setEditForm]     = useState({ nom: '', poste: '', samedi: true, dimanche: true })
  const [dayFilter, setDayFilter]   = useState<'all' | 'samedi' | 'dimanche'>('all')

  useEffect(() => {
    fetch('/api/admin/team')
      .then(r => r.json())
      .then(d => setTeam(d.members || []))
      .catch(() => {})
    fetch('/api/admin/bookings/count')
      .then(r => r.json())
      .then(d => setUtacCounts(d.counts ? { ...d.counts, total: d.total } : null))
      .catch(() => {})
  }, [])

  async function addMember() {
    const newMember: TeamMember = { id: Date.now().toString(), nom: '', poste: '', samedi: true, dimanche: true }
    await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMember, position: team.length }),
    })
    setTeam(t => [...t, newMember])
    startEdit(newMember)
  }

  function startEdit(m: TeamMember) {
    setEditingId(m.id)
    setEditForm({ nom: m.nom, poste: m.poste, samedi: m.samedi, dimanche: m.dimanche })
  }

  async function confirmEdit() {
    const updated = { ...editForm }
    setTeam(t => t.map(m => m.id === editingId ? { ...m, ...updated } : m))
    setEditingId(null)
    await fetch(`/api/admin/team/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
  }

  async function deleteMember(id: string) {
    setTeam(t => t.filter(m => m.id !== id))
    await fetch(`/api/admin/team/${id}`, { method: 'DELETE' })
  }

  async function toggleDay(id: string, day: 'samedi' | 'dimanche') {
    const member = team.find(m => m.id === id)
    if (!member) return
    const newVal = !member[day]
    setTeam(t => t.map(m => m.id === id ? { ...m, [day]: newVal } : m))
    await fetch(`/api/admin/team/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [day]: newVal }),
    })
  }

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (!unlocked) {
    return (
      <div className="md:ml-56 min-h-dvh flex items-center justify-center p-5">
        <div className="card p-8 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-[var(--accent)]" />
          </div>
          <h2 className="font-bebas text-2xl text-[var(--text-primary)] mb-1">Prévisionnel</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Accès restreint — mot de passe requis</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={e => { setInput(e.target.value); setError(false) }}
              placeholder="Mot de passe"
              autoFocus
              className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors ${error ? 'border-red-500' : 'border-[var(--border)]'}`}
            />
            {error && <p className="text-red-400 text-xs">Mot de passe incorrect</p>}
            <button type="submit" className="btn-cta w-full">Accéder</button>
          </form>
        </div>
      </div>
    )
  }

  const totalChargesFixes = CHARGES.reduce((s, c) => s + c.montant, 0)
  const totalCAMax        = ACTIVITES.reduce((s, a) => s + a.personnes * a.prix, 0)
  const totalPersonnesMax = ACTIVITES.reduce((s, a) => s + a.personnes, 0)
  const utacMax           = totalPersonnesMax * UTAC_RATE
  const totalChargesMax   = totalChargesFixes + utacMax
  const seuilPct          = Math.ceil((totalChargesMax / totalCAMax) * 100)
  const utacLive          = utacCounts ? utacCounts.total * UTAC_RATE : null

  return (
    <div className="md:ml-56 p-5 max-w-4xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-6">Prévisionnel</h1>

      {/* KPIs rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[var(--text-secondary)] text-xs">Charges fixes</p>
          <p className="font-bebas text-2xl text-red-400 mt-1">{formatEur(totalChargesFixes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[var(--text-secondary)] text-xs">CA max (100%)</p>
          <p className="font-bebas text-2xl text-green-400 mt-1">{formatEur(totalCAMax)}</p>
        </div>
        <div className="card p-4">
          <p className="text-[var(--text-secondary)] text-xs">Seuil rentabilité</p>
          <p className="font-bebas text-2xl text-yellow-400 mt-1">{seuilPct}%</p>
        </div>
        <div className="card p-4">
          <p className="text-[var(--text-secondary)] text-xs">Bénéfice max</p>
          <p className="font-bebas text-2xl text-green-400 mt-1">{formatEur(totalCAMax - totalChargesMax)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">

        {/* Charges */}
        <div className="card p-5">
          <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-4">Charges fixes TTC</h2>
          {CHARGES.map(c => (
            <div key={c.poste} className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
              <span className="text-[var(--text-secondary)]">{c.poste}</span>
              <span className="text-[var(--text-primary)] font-medium">{formatEur(c.montant)}</span>
            </div>
          ))}
          <div className="flex justify-between text-base pt-3 mt-1 border-t-2 border-[var(--border)] font-bebas">
            <span className="text-[var(--text-primary)]">TOTAL CHARGES FIXES</span>
            <span className="text-red-400 text-xl">{formatEur(totalChargesFixes)}</span>
          </div>

          {/* UTAC */}
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">UTAC — 5€ / personne</p>
            {utacCounts ? (
              <>
                <div className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Baptême ({(utacCounts.bapteme)} pers.)</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatEur(utacCounts.bapteme * UTAC_RATE)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Conduite ({utacCounts.conduite} pers.)</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatEur(utacCounts.conduite * UTAC_RATE)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">Car Booling ({utacCounts.carbooling} pers.)</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatEur(utacCounts.carbooling * UTAC_RATE)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 font-semibold">
                  <span className="text-yellow-400">UTAC dû actuellement</span>
                  <span className="text-yellow-400">{formatEur(utacCounts.total * UTAC_RATE)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-sm py-1">
                <span className="text-[var(--text-secondary)]">UTAC max (100%)</span>
                <span className="text-[var(--text-primary)] font-medium">{formatEur(utacMax)}</span>
              </div>
            )}
          </div>
        </div>

        {/* CA max par activité */}
        <div className="card p-5">
          <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-4">CA Maximum</h2>
          <p className="text-[var(--text-secondary)] text-xs mb-4">Capacité totale weekend (100% remplissage)</p>

          <div className="space-y-4">
            {ACTIVITES.map(a => {
              const ca = a.personnes * a.prix
              const pct = Math.round((ca / totalCAMax) * 100)
              return (
                <div key={a.nom}>
                  <div className="flex justify-between items-baseline mb-1">
                    <div>
                      <span className="text-[var(--text-primary)] text-sm font-medium">{a.nom}</span>
                      <p className="text-[var(--text-secondary)] text-xs">{a.detail}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bebas text-lg" style={{ color: a.couleur }}>{formatEur(ca)}</span>
                      <p className="text-[var(--text-secondary)] text-xs">{a.personnes} pers × {a.prix}€</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: a.couleur }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between text-base pt-4 mt-2 border-t border-[var(--border)] font-bebas">
            <span className="text-[var(--text-primary)]">TOTAL CA MAX</span>
            <span className="text-green-400 text-xl">{formatEur(totalCAMax)}</span>
          </div>
        </div>
      </div>

      {/* Scénarios */}
      <div className="card p-5 mb-6">
        <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-4">Scénarios de remplissage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SCENARIOS.map(pct => {
            const ca      = Math.round(totalCAMax * pct / 100)
            const utac    = Math.round(totalPersonnesMax * pct / 100) * UTAC_RATE
            const charges = totalChargesFixes + utac
            const net     = ca - charges
            const positif = net >= 0
            return (
              <div
                key={pct}
                className={`rounded-xl p-4 border ${positif
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-red-500/30 bg-red-500/5'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bebas text-2xl text-[var(--text-primary)]">{pct}%</span>
                  {positif
                    ? <CheckCircle size={16} className="text-green-400" />
                    : <AlertTriangle size={16} className="text-red-400" />}
                </div>
                <p className="text-[var(--text-secondary)] text-xs mb-1">CA estimé</p>
                <p className="font-semibold text-[var(--text-primary)] text-sm">{formatEur(ca)}</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">Part UTAC</p>
                <p className="text-yellow-400 text-sm font-medium">−{formatEur(utac)}</p>
                <p className="text-[var(--text-secondary)] text-xs mt-2">Résultat net</p>
                <p className={`font-bebas text-lg ${positif ? 'text-green-400' : 'text-red-400'}`}>
                  {positif ? '+' : ''}{formatEur(net)}
                </p>
              </div>
            )
          })}
        </div>

        <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-sm
          ${seuilPct <= 40
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
          {seuilPct <= 40
            ? <TrendingUp size={16} />
            : <TrendingDown size={16} />}
          <span>
            Seuil de rentabilité à <strong>{seuilPct}%</strong> de remplissage —{' '}
            {seuilPct <= 40
              ? 'Objectif très accessible.'
              : 'Viser au minimum 50% de remplissage.'}
          </span>
        </div>
      </div>

      {/* Répartition visuelle */}
      <div className="card p-5">
        <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-1">Répartition du CA max</h2>
        <p className="text-[var(--text-secondary)] text-xs mb-4">Par activité en % du total</p>
        <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
          {ACTIVITES.map(a => {
            const pct = (a.personnes * a.prix / totalCAMax * 100).toFixed(1)
            return (
              <div
                key={a.nom}
                style={{ width: `${pct}%`, backgroundColor: a.couleur }}
                className="flex items-center justify-center"
                title={`${a.nom} : ${pct}%`}
              >
                <span className="text-white text-xs font-bold drop-shadow">{pct}%</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {ACTIVITES.map(a => (
            <div key={a.nom} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.couleur }} />
              <span className="text-[var(--text-secondary)] text-xs">{a.nom}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Équipe */}
      <div className="card p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-xl text-[var(--text-primary)]">Équipe</h2>
          <div className="flex items-center gap-2">
            {(['all', 'samedi', 'dimanche'] as const).map(f => (
              <button
                key={f}
                onClick={() => setDayFilter(f)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                  dayFilter === f
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'samedi' ? 'Samedi' : 'Dimanche'}
              </button>
            ))}
            <button
              onClick={addMember}
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity ml-2"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {team
            .filter(m => dayFilter === 'all' || m[dayFilter])
            .map(m => editingId === m.id ? (
            <div key={m.id} className="flex flex-wrap items-center gap-2 py-2">
              <input
                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text-primary)] text-sm outline-none"
                placeholder="Prénom Nom"
                value={editForm.nom}
                onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                autoFocus
              />
              <input
                className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]"
                placeholder="Poste / rôle"
                value={editForm.poste}
                onChange={e => setEditForm(f => ({ ...f, poste: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') confirmEdit() }}
              />
              <button
                onClick={() => setEditForm(f => ({ ...f, samedi: !f.samedi }))}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${editForm.samedi ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}
              >SAM</button>
              <button
                onClick={() => setEditForm(f => ({ ...f, dimanche: !f.dimanche }))}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${editForm.dimanche ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}
              >DIM</button>
              <button onClick={confirmEdit} className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors">
                <Check size={14} />
              </button>
              <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 group">
              <div className="flex-1 min-w-0">
                <span className="text-[var(--text-primary)] text-sm font-medium">{m.nom || <span className="text-[var(--text-secondary)] italic">Sans nom</span>}</span>
                {m.poste && <span className="text-[var(--text-secondary)] text-xs ml-2">· {m.poste}</span>}
              </div>
              <div className="flex items-center gap-1.5 ml-3 shrink-0">
                <button
                  onClick={() => toggleDay(m.id, 'samedi')}
                  className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${m.samedi ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]/40 line-through'}`}
                >SAM</button>
                <button
                  onClick={() => toggleDay(m.id, 'dimanche')}
                  className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${m.dimanche ? 'bg-purple-500/20 text-purple-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]/40 line-through'}`}
                >DIM</button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(m)} className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => deleteMember(m.id)} className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {team.filter(m => dayFilter === 'all' || m[dayFilter]).length === 0 && (
          <p className="text-[var(--text-secondary)] text-sm text-center py-4">
            {team.length === 0 ? 'Aucun membre — cliquez sur Ajouter' : 'Aucun membre disponible ce jour'}
          </p>
        )}
      </div>
    </div>
  )
}
