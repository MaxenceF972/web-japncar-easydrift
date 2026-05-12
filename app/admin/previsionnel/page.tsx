'use client'

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react'

// ── Données fixes du planning ──────────────────────────────────────────────
const CHARGES = [
  { categorie: 'Matériel', poste: 'Pneus — 3 voitures Baptême',    montant: 1200 },
  { categorie: 'Matériel', poste: 'Anneaux — 3 voitures Baptême',  montant: 1200 },
  { categorie: 'Matériel', poste: 'Pneus — 2 voitures Conduite',   montant: 600 },
  { categorie: 'Matériel', poste: 'Anneaux — 2 voitures Conduite', montant: 700 },
  { categorie: 'Matériel', poste: 'Essence — Baptême (2j)',         montant: 960 },
  { categorie: 'Matériel', poste: 'Essence — Conduite (2j)',        montant: 280 },
  { categorie: 'Personnel', poste: 'BPJEPS Conduite ×2 (2j)',       montant: 1400 },
  { categorie: 'Personnel', poste: 'Bouffe personnel ×12 (2j)',     montant: 480 },
  { categorie: 'Personnel', poste: 'Indemnités équipe ×4',          montant: 800 },
]

const ACTIVITES = [
  { nom: 'Session Conduite', couleur: '#E67E22', personnes: 122, prix: 50, detail: '61 passages/j × 2j × 1 pilote' },
  { nom: 'Baptême EASYDRIFT', couleur: '#F47B20', personnes: 440, prix: 40, detail: '44 passages/j × 2j × 5 passagers' },
  { nom: 'Car Booling CLIO', couleur: '#8E44AD', personnes: 20, prix: 20, detail: '10 passages/j × 2j × 1 passager' },
]

const SCENARIOS = [25, 50, 75, 100]

function formatEur(n: number) {
  return n.toLocaleString('fr-FR') + ' €'
}

export default function PrevisionnelPage() {
  const totalCharges = CHARGES.reduce((s, c) => s + c.montant, 0)
  const totalCAMax   = ACTIVITES.reduce((s, a) => s + a.personnes * a.prix, 0)
  const seuilPct     = Math.ceil((totalCharges / totalCAMax) * 100)

  const materiel  = CHARGES.filter(c => c.categorie === 'Matériel').reduce((s, c) => s + c.montant, 0)
  const personnel = CHARGES.filter(c => c.categorie === 'Personnel').reduce((s, c) => s + c.montant, 0)

  return (
    <div className="md:ml-56 p-5 max-w-4xl">
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-6">Prévisionnel</h1>

      {/* KPIs rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-[var(--text-secondary)] text-xs">Charges fixes</p>
          <p className="font-bebas text-2xl text-red-400 mt-1">{formatEur(totalCharges)}</p>
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
          <p className="font-bebas text-2xl text-green-400 mt-1">{formatEur(totalCAMax - totalCharges)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">

        {/* Charges */}
        <div className="card p-5">
          <h2 className="font-bebas text-xl text-[var(--text-primary)] mb-4">Charges fixes</h2>

          <div className="mb-3">
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
              Matériel & Logistique
            </p>
            {CHARGES.filter(c => c.categorie === 'Matériel').map(c => (
              <div key={c.poste} className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
                <span className="text-[var(--text-secondary)]">{c.poste}</span>
                <span className="text-[var(--text-primary)] font-medium">{formatEur(c.montant)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-1.5 font-semibold">
              <span className="text-[var(--text-primary)]">Sous-total Matériel</span>
              <span className="text-orange-400">{formatEur(materiel)}</span>
            </div>
          </div>

          <div>
            <p className="text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2">
              Personnel
            </p>
            {CHARGES.filter(c => c.categorie === 'Personnel').map(c => (
              <div key={c.poste} className="flex justify-between text-sm py-1 border-b border-[var(--border)]/50">
                <span className="text-[var(--text-secondary)]">{c.poste}</span>
                <span className="text-[var(--text-primary)] font-medium">{formatEur(c.montant)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-1.5 font-semibold">
              <span className="text-[var(--text-primary)]">Sous-total Personnel</span>
              <span className="text-orange-400">{formatEur(personnel)}</span>
            </div>
          </div>

          <div className="flex justify-between text-base pt-3 mt-1 border-t-2 border-[var(--border)] font-bebas">
            <span className="text-[var(--text-primary)]">TOTAL CHARGES</span>
            <span className="text-red-400 text-xl">{formatEur(totalCharges)}</span>
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
            const ca     = Math.round(totalCAMax * pct / 100)
            const net    = ca - totalCharges
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
    </div>
  )
}
