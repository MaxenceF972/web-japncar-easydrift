'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useEvent } from '@/contexts/EventContext'

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

export function ContactsClient() {
  const { selectedEvent } = useEvent()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('tous')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedEvent?.date_start) params.set('date_start', selectedEvent.date_start)
    if (selectedEvent?.date_end)   params.set('date_end',   selectedEvent.date_end)
    fetch(`/api/admin/contacts?${params}`)
      .then(r => r.json())
      .then(d => setContacts(d.contacts || []))
      .finally(() => setLoading(false))
  }, [selectedEvent?.id])

  const filtered = filter === 'tous' ? contacts : contacts.filter(c => c.type === filter)
  const counts = {
    tous: contacts.length,
    particulier: contacts.filter(c => c.type === 'particulier').length,
    professionnel: contacts.filter(c => c.type === 'professionnel').length,
  }

  function handleExport() {
    const header = 'Prénom,Nom,Email,Téléphone,Type,Message,Date'
    const rows = filtered.map(c =>
      [c.first_name, c.last_name, c.email, c.phone || '', c.type,
       `"${c.message.replace(/"/g, '""')}"`,
       new Date(c.created_at).toLocaleDateString('fr-FR'),
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `contacts-${selectedEvent?.slug || 'easydrift'}-${filter}.csv`
    link.click()
  }

  if (loading) return (
    <div className="md:ml-56 p-5 flex items-center justify-center py-20">
      <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
    </div>
  )

  return (
    <div className="md:ml-56 p-5 max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Contacts</h1>
        {filtered.length > 0 && (
          <button onClick={handleExport} className="btn-secondary text-sm flex items-center gap-2">
            <Download size={15} />
            Exporter CSV
          </button>
        )}
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-5">
        {selectedEvent?.name}
        {selectedEvent?.date_start && ` · À partir du ${new Date(selectedEvent.date_start + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
      </p>

      <div className="flex gap-2 mb-5">
        {([
          { key: 'tous', label: 'Tous' },
          { key: 'particulier', label: 'Particuliers' },
          { key: 'professionnel', label: 'Professionnels' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors flex items-center gap-1.5 ${
              filter === key
                ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === key ? 'bg-white/20' : 'bg-[var(--bg-primary)]'}`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[var(--text-secondary)]">Aucun contact pour cet événement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[var(--text-primary)]">{c.first_name} {c.last_name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                      {c.type === 'professionnel' ? '🏢 Pro' : '👤 Particulier'}
                    </span>
                  </div>
                  <a href={`mailto:${c.email}`} className="text-[var(--accent)] text-sm">{c.email}</a>
                  {c.phone && <p className="text-[var(--text-secondary)] text-sm">{c.phone}</p>}
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
