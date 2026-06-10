'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lock,
  Plus, Pencil, Trash2, Check, X, Users, DollarSign, CheckSquare,
  BarChart3, Save, Settings2, Loader2,
} from 'lucide-react'
import { useEvent } from '@/contexts/EventContext'

interface Charge { poste: string; montant: number }
interface Activite { nom: string; couleur: string; personnes: number; prix: number; detail: string }
interface PrevisionnelConfig { utac_rate: number; charges: Charge[]; activites: Activite[] }
interface TeamMember { id: string; nom: string; poste: string; samedi: boolean; dimanche: boolean }

const SESSION_KEY = 'previsionnel_auth'
const PASSWORD    = process.env.NEXT_PUBLIC_PREVISIONNEL_PASSWORD || 'driftagain'
const SCENARIOS   = [25, 50, 75, 100]
const PRESET_COLORS = ['#F47B20', '#E8601C', '#E67E22', '#8E44AD', '#2980B9', '#27AE60', '#E74C3C', '#6C3483']

function formatEur(n: number) { return n.toLocaleString('fr-FR') + ' €' }

export default function PrevisionnelPage() {
  const { selectedEvent, refetch } = useEvent()

  // ── Auth ──────────────────────────────────────────────────────────────────
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput]       = useState('')
  const [authErr, setAuthErr]   = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') setUnlocked(true)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === PASSWORD) { sessionStorage.setItem(SESSION_KEY, '1'); setUnlocked(true) }
    else { setAuthErr(true); setInput('') }
  }

  // ── Données prévisionnel ─────────────────────────────────────────────────
  const [charges, setCharges]     = useState<Charge[]>([])
  const [activites, setActivites] = useState<Activite[]>([])
  const [utacRate, setUtacRate]   = useState(5)
  const [editMode, setEditMode]   = useState(false)
  const [saving, setSaving]       = useState(false)

  const [newCharge, setNewCharge] = useState({ poste: '', montant: '' })
  const [newAct, setNewAct]       = useState({ nom: '', personnes: '', prix: '', couleur: '#F47B20', detail: '' })

  // ── KPIs live ─────────────────────────────────────────────────────────────
  const [liveKpis, setLiveKpis] = useState<{ revenue: number; checkins: number; totalBookings: number } | null>(null)

  // ── Équipe ────────────────────────────────────────────────────────────────
  const [team, setTeam]           = useState<TeamMember[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm]   = useState({ nom: '', poste: '', samedi: true, dimanche: true })
  const [dayFilter, setDayFilter] = useState<'all' | 'samedi' | 'dimanche'>('all')

  useEffect(() => {
    if (!selectedEvent) return

    // Charger données prévisionnel depuis config de l'event
    const prev = (selectedEvent.config as any)?.previsionnel as PrevisionnelConfig | undefined
    setCharges(prev?.charges    || [])
    setActivites(prev?.activites || [])
    setUtacRate(prev?.utac_rate  ?? 5)
    setEditMode(!prev) // ouvrir en edit si aucune donnée

    // KPIs live
    fetch(`/api/admin/stats?event_id=${selectedEvent.id}`)
      .then(r => r.json())
      .then(d => {
        const bookings = d.bookings || []
        setLiveKpis({
          revenue:       bookings.reduce((s: number, b: any) => s + (b.amount_paid || 0), 0),
          checkins:      bookings.filter((b: any) => b.checked_in).length,
          totalBookings: bookings.length,
        })
      })

    // Équipe
    fetch('/api/admin/team').then(r => r.json()).then(d => setTeam(d.members || []))
  }, [selectedEvent?.id])

  async function handleSave() {
    if (!selectedEvent) return
    setSaving(true)
    const previsionnel: PrevisionnelConfig = { utac_rate: utacRate, charges, activites }
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedEvent.id, config: { ...selectedEvent.config, previsionnel } }),
    })
    await refetch()
    setSaving(false)
    setEditMode(false)
  }

  function addCharge() {
    if (!newCharge.poste || !newCharge.montant) return
    setCharges(prev => [...prev, { poste: newCharge.poste, montant: parseFloat(newCharge.montant) }])
    setNewCharge({ poste: '', montant: '' })
  }

  function addActivite() {
    if (!newAct.nom || !newAct.personnes || !newAct.prix) return
    setActivites(prev => [...prev, {
      nom: newAct.nom, couleur: newAct.couleur,
      personnes: parseInt(newAct.personnes), prix: parseFloat(newAct.prix),
      detail: newAct.detail,
    }])
    setNewAct({ nom: '', personnes: '', prix: '', couleur: '#F47B20', detail: '' })
  }

  // Équipe helpers
  function startEdit(m: TeamMember) { setEditingId(m.id); setEditForm({ nom: m.nom, poste: m.poste, samedi: m.samedi, dimanche: m.dimanche }) }
  async function confirmEdit() {
    setTeam(t => t.map(m => m.id === editingId ? { ...m, ...editForm } : m))
    setEditingId(null)
    await fetch(`/api/admin/team/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
  }
  async function deleteMember(id: string) {
    setTeam(t => t.filter(m => m.id !== id))
    await fetch(`/api/admin/team/${id}`, { method: 'DELETE' })
  }
  async function addMember() {
    const m: TeamMember = { id: Date.now().toString(), nom: '', poste: '', samedi: true, dimanche: true }
    await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, position: team.length }) })
    setTeam(t => [...t, m]); startEdit(m)
  }
  async function toggleDay(id: string, day: 'samedi' | 'dimanche') {
    const m = team.find(x => x.id === id); if (!m) return
    const val = !m[day]
    setTeam(t => t.map(x => x.id === id ? { ...x, [day]: val } : x))
    await fetch(`/api/admin/team/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [day]: val }) })
  }

  // ── Calculs ───────────────────────────────────────────────────────────────
  const totalChargesFixes  = charges.reduce((s, c) => s + c.montant, 0)
  const totalCAMax         = activites.reduce((s, a) => s + a.personnes * a.prix, 0)
  const totalPersonnesMax  = activites.reduce((s, a) => s + a.personnes, 0)
  const utacMax            = totalPersonnesMax * utacRate
  const totalChargesMax    = totalChargesFixes + utacMax
  const seuilPct           = totalCAMax > utacMax
    ? Math.ceil((totalChargesFixes / (totalCAMax - utacMax)) * 100) : 0

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!unlocked) return (
    <div className="md:ml-56 min-h-dvh flex items-center justify-center p-5">
      <div className="card p-8 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-[var(--accent)]" />
        </div>
        <h2 className="font-bebas text-2xl text-[var(--text-primary)] mb-1">Prévisionnel</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6">Accès restreint — mot de passe requis</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" value={input} onChange={e => { setInput(e.target.value); setAuthErr(false) }}
            placeholder="Mot de passe" autoFocus
            className={`w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)] transition-colors ${authErr ? 'border-red-500' : 'border-[var(--border)]'}`} />
          {authErr && <p className="text-red-400 text-xs">Mot de passe incorrect</p>}
          <button type="submit" className="btn-cta w-full">Accéder</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="md:ml-56 p-5 max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Prévisionnel</h1>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-xl text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-1.5">
                <X size={12} /> Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="btn-cta px-4 py-1.5 font-bebas text-sm flex items-center gap-1.5 disabled:opacity-40">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                SAUVEGARDER
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
              <Settings2 size={13} /> Modifier
            </button>
          )}
        </div>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-6">{selectedEvent?.name}</p>

      {/* KPIs live */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <DollarSign size={16} className="text-green-400 mb-2" />
          <p className="font-bebas text-2xl text-[var(--text-primary)]">{liveKpis ? formatEur(liveKpis.revenue / 100) : '—'}</p>
          <p className="text-[var(--text-secondary)] text-xs">CA encaissé</p>
        </div>
        <div className="card p-4">
          <Users size={16} className="text-blue-400 mb-2" />
          <p className="font-bebas text-2xl text-[var(--text-primary)]">{liveKpis?.totalBookings ?? '—'}</p>
          <p className="text-[var(--text-secondary)] text-xs">Réservations</p>
        </div>
        <div className="card p-4">
          <CheckSquare size={16} className="text-purple-400 mb-2" />
          <p className="font-bebas text-2xl text-[var(--text-primary)]">{liveKpis?.checkins ?? '—'}</p>
          <p className="text-[var(--text-secondary)] text-xs">Check-ins</p>
        </div>
        <div className="card p-4">
          <BarChart3 size={16} className="text-orange-400 mb-2" />
          <p className="font-bebas text-2xl text-[var(--text-primary)]">
            {totalPersonnesMax > 0 && liveKpis
              ? `${Math.round((liveKpis.totalBookings / totalPersonnesMax) * 100)}%`
              : '—'}
          </p>
          <p className="text-[var(--text-secondary)] text-xs">Remplissage</p>
        </div>
      </div>

      {/* Message si pas de données */}
      {!editMode && charges.length === 0 && activites.length === 0 && (
        <div className="card p-8 text-center mb-6">
          <p className="text-[var(--text-secondary)] mb-3">Aucun prévisionnel configuré pour cet événement.</p>
          <button onClick={() => setEditMode(true)} className="btn-cta px-6 font-bebas">
            CONFIGURER LE PRÉVISIONNEL
          </button>
        </div>
      )}

      {/* ── Mode édition ───────────────────────────────────────────────── */}
      {editMode && (
        <div className="grid md:grid-cols-2 gap-6 mb-6">

          {/* Charges */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bebas text-xl text-[var(--text-primary)]">Charges fixes TTC</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">UTAC :</span>
                <input type="number" min="0" step="0.5" className="input-field text-sm w-16 text-center py-1"
                  value={utacRate} onChange={e => setUtacRate(parseFloat(e.target.value) || 0)} />
                <span className="text-xs text-[var(--text-secondary)]">€/pers</span>
              </div>
            </div>

            <div className="space-y-1.5">
              {charges.map((c, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                  <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{c.poste}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] flex-shrink-0">{formatEur(c.montant)}</span>
                  <button onClick={() => setCharges(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 rounded hover:text-red-400 text-[var(--text-secondary)] transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input className="input-field text-sm flex-1" placeholder="Poste de charge"
                value={newCharge.poste} onChange={e => setNewCharge(f => ({ ...f, poste: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addCharge()} />
              <input type="number" min="0" className="input-field text-sm w-24" placeholder="Montant €"
                value={newCharge.montant} onChange={e => setNewCharge(f => ({ ...f, montant: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addCharge()} />
              <button onClick={addCharge} disabled={!newCharge.poste || !newCharge.montant}
                className="px-3 py-2 rounded-xl bg-[var(--accent)] text-white text-sm disabled:opacity-40 flex-shrink-0">
                <Plus size={15} />
              </button>
            </div>
            {charges.length > 0 && (
              <div className="flex justify-between text-sm pt-1 border-t border-[var(--border)] font-bebas">
                <span className="text-[var(--text-secondary)]">TOTAL CHARGES FIXES</span>
                <span className="text-red-400">{formatEur(totalChargesFixes)}</span>
              </div>
            )}
          </div>

          {/* Activités */}
          <div className="card p-5 space-y-3">
            <h2 className="font-bebas text-xl text-[var(--text-primary)]">Activités / CA max</h2>

            <div className="space-y-1.5">
              {activites.map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: a.couleur }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{a.nom}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{a.personnes} pers × {a.prix}€</p>
                  </div>
                  <span className="text-sm font-medium text-green-400 flex-shrink-0">{formatEur(a.personnes * a.prix)}</span>
                  <button onClick={() => setActivites(prev => prev.filter((_, j) => j !== i))}
                    className="p-1 rounded hover:text-red-400 text-[var(--text-secondary)] transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-1 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">Ajouter une activité</p>
              <input className="input-field text-sm w-full" placeholder="Nom de l'activité"
                value={newAct.nom} onChange={e => setNewAct(f => ({ ...f, nom: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" className="input-field text-sm" placeholder="Nb personnes"
                  value={newAct.personnes} onChange={e => setNewAct(f => ({ ...f, personnes: e.target.value }))} />
                <input type="number" min="0" className="input-field text-sm" placeholder="Prix / pers (€)"
                  value={newAct.prix} onChange={e => setNewAct(f => ({ ...f, prix: e.target.value }))} />
              </div>
              <input className="input-field text-sm w-full" placeholder="Détail (optionnel)"
                value={newAct.detail} onChange={e => setNewAct(f => ({ ...f, detail: e.target.value }))} />
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setNewAct(f => ({ ...f, couleur: c }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${newAct.couleur === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={addActivite} disabled={!newAct.nom || !newAct.personnes || !newAct.prix}
                className="btn-cta w-full font-bebas text-sm py-2.5 disabled:opacity-40">
                AJOUTER L'ACTIVITÉ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Affichage (lecture) ─────────────────────────────────────────── */}
      {!editMode && (charges.length > 0 || activites.length > 0) && (
        <>
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
              <p className="font-bebas text-2xl text-yellow-400 mt-1">{seuilPct > 0 ? `${seuilPct}%` : '—'}</p>
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
              {charges.map((c, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
                  <span className="text-[var(--text-secondary)]">{c.poste}</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatEur(c.montant)}</span>
                </div>
              ))}
              <div className="flex justify-between text-base pt-3 mt-1 border-t-2 border-[var(--border)] font-bebas">
                <span className="text-[var(--text-primary)]">TOTAL CHARGES FIXES</span>
                <span className="text-red-400 text-xl">{formatEur(totalChargesFixes)}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">UTAC — {utacRate}€ / personne</p>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-[var(--text-secondary)]">UTAC max (100%) — {totalPersonnesMax} pers.</span>
                  <span className="text-yellow-400 font-medium">{formatEur(utacMax)}</span>
                </div>
                {liveKpis && (
                  <div className="flex justify-between text-sm py-1.5 font-semibold">
                    <span className="text-yellow-400">UTAC dû actuellement ({liveKpis.totalBookings} pers.)</span>
                    <span className="text-yellow-400">{formatEur(liveKpis.totalBookings * utacRate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CA max */}
            <div className="card p-5">
              <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-4">CA Maximum</h2>
              <p className="text-[var(--text-secondary)] text-xs mb-4">Capacité totale (100% remplissage)</p>
              <div className="space-y-4">
                {activites.map((a, i) => {
                  const ca  = a.personnes * a.prix
                  const pct = totalCAMax > 0 ? Math.round((ca / totalCAMax) * 100) : 0
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <div>
                          <span className="text-[var(--text-primary)] text-sm font-medium">{a.nom}</span>
                          {a.detail && <p className="text-[var(--text-secondary)] text-xs">{a.detail}</p>}
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
          {totalCAMax > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-4">Scénarios de remplissage</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SCENARIOS.map(pct => {
                  const ca      = Math.round(totalCAMax * pct / 100)
                  const utac    = Math.round(totalPersonnesMax * pct / 100) * utacRate
                  const charges = totalChargesFixes + utac
                  const net     = ca - charges
                  const positif = net >= 0
                  return (
                    <div key={pct} className={`rounded-xl p-4 border ${positif ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bebas text-2xl text-[var(--text-primary)]">{pct}%</span>
                        {positif ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}
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

              {seuilPct > 0 && (
                <div className={`mt-4 flex items-center gap-2 p-3 rounded-xl text-sm ${seuilPct <= 40 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
                  {seuilPct <= 40 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span>
                    Seuil de rentabilité à <strong>{seuilPct}%</strong> de remplissage —{' '}
                    {seuilPct <= 40 ? 'Objectif très accessible.' : 'Viser au minimum 50% de remplissage.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Répartition visuelle */}
          {activites.length > 0 && totalCAMax > 0 && (
            <div className="card p-5 mb-6">
              <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-1">Répartition du CA max</h2>
              <p className="text-[var(--text-secondary)] text-xs mb-4">Par activité en % du total</p>
              <div className="flex h-8 rounded-lg overflow-hidden gap-0.5">
                {activites.map((a, i) => {
                  const pct = (a.personnes * a.prix / totalCAMax * 100).toFixed(1)
                  return (
                    <div key={i} style={{ width: `${pct}%`, backgroundColor: a.couleur }}
                      className="flex items-center justify-center" title={`${a.nom} : ${pct}%`}>
                      <span className="text-white text-xs font-bold drop-shadow">{pct}%</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3 flex-wrap">
                {activites.map((a, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.couleur }} />
                    <span className="text-[var(--text-secondary)] text-xs">{a.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Équipe */}
      <div className="card p-5 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-xl text-[var(--text-primary)]">Équipe</h2>
          <div className="flex items-center gap-2">
            {(['all', 'samedi', 'dimanche'] as const).map(f => (
              <button key={f} onClick={() => setDayFilter(f)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${dayFilter === f ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                {f === 'all' ? 'Tous' : f === 'samedi' ? 'Sam.' : 'Dim.'}
              </button>
            ))}
            <button onClick={addMember} className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:opacity-80 transition-opacity ml-2">
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {team.filter(m => dayFilter === 'all' || m[dayFilter]).map(m =>
            editingId === m.id ? (
              <div key={m.id} className="flex flex-wrap items-center gap-2 py-2">
                <input className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text-primary)] text-sm outline-none"
                  placeholder="Prénom Nom" value={editForm.nom} autoFocus
                  onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} />
                <input className="flex-1 min-w-[160px] px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="Poste / rôle" value={editForm.poste}
                  onChange={e => setEditForm(f => ({ ...f, poste: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') confirmEdit() }} />
                <button onClick={() => setEditForm(f => ({ ...f, samedi: !f.samedi }))}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${editForm.samedi ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}>SAM</button>
                <button onClick={() => setEditForm(f => ({ ...f, dimanche: !f.dimanche }))}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${editForm.dimanche ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'}`}>DIM</button>
                <button onClick={confirmEdit} className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 transition-colors"><Check size={14} /></button>
                <button onClick={() => setEditingId(null)} className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]"><X size={14} /></button>
              </div>
            ) : (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-[var(--border)]/50 group">
                <div className="flex-1 min-w-0">
                  <span className="text-[var(--text-primary)] text-sm font-medium">{m.nom || <span className="text-[var(--text-secondary)] italic">Sans nom</span>}</span>
                  {m.poste && <span className="text-[var(--text-secondary)] text-xs ml-2">· {m.poste}</span>}
                </div>
                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  <button onClick={() => toggleDay(m.id, 'samedi')}
                    className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${m.samedi ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]/40 line-through'}`}>SAM</button>
                  <button onClick={() => toggleDay(m.id, 'dimanche')}
                    className={`text-xs px-2 py-0.5 rounded font-semibold transition-colors ${m.dimanche ? 'bg-purple-500/20 text-purple-400' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]/40 line-through'}`}>DIM</button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(m)} className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"><Pencil size={12} /></button>
                    <button onClick={() => deleteMember(m.id)} className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            )
          )}
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
