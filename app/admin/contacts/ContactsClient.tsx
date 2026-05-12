'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  type: 'particulier' | 'professionnel'
  message: string
  created_at: string
}

type Filter = 'tous' | 'particulier' | 'professionnel'

interface Props {
  contacts: Contact[]
}

export function ContactsClient({ contacts }: Props) {
  const [filter, setFilter] = useState<Filter>('tous')

  const filtered = filter === 'tous' ? contacts : contacts.filter(c => c.type === filter)

  const counts = {
    tous: contacts.length,
    particulier: contacts.filter(c => c.type === 'particulier').length,
    professionnel: contacts.filter(c => c.type === 'professionnel').length,
  }

  function handleExport() {
    const header = 'Prénom,Nom,Email,Téléphone,Type,Message,Date'
    const rows = filtered.map(c =>
      [
        c.first_name,
        c.last_name,
        c.email,
        c.phone || '',
        c.type,
        `"${c.message.replace(/"/g, '""')}"`,
        new Date(c.created_at).toLocaleDateString('fr-FR'),
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contacts-easydrift-${filter}.csv`
    link.click()
  }

  return (
    <div className="md:ml-56 p-5 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Contacts</h1>
        {filtered.length > 0 && (
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2">
            <Download size={15} />
            Exporter CSV
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'tous', label: 'Tous', emoji: '' },
          { key: 'particulier', label: 'Particuliers', emoji: '👤' },
          { key: 'professionnel', label: 'Professionnels', emoji: '🏢' },
        ] as const).map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              filter === key
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            {emoji && <span>{emoji}</span>}
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? 'bg-white/20' : 'bg-[var(--bg-primary)]'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[var(--text-secondary)]">Aucun contact pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {c.first_name} {c.last_name}
                    </p>
                    <span className={`badge text-xs ${c.type === 'professionnel' ? 'badge-purple' : 'badge-gray'}`}>
                      {c.type === 'professionnel' ? '🏢 Pro' : '👤 Particulier'}
                    </span>
                  </div>
                  <a href={`mailto:${c.email}`} className="text-[var(--accent)] text-sm">
                    {c.email}
                  </a>
                  {c.phone && (
                    <p className="text-[var(--text-secondary)] text-sm">{c.phone}</p>
                  )}
                  <p className="text-[var(--text-secondary)] text-sm mt-2 whitespace-pre-wrap">{c.message}</p>
                </div>
                <p className="text-[var(--text-secondary)] text-xs flex-shrink-0">
                  {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
