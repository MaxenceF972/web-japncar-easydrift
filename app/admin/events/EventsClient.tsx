'use client'

import { useState } from 'react'
import { Plus, X, ChevronRight, CheckCircle, Archive, FileEdit, Loader2, Calendar, MapPin, Settings2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useEvent } from '@/contexts/EventContext'
import type { Event, EventConfig, EventSiteContent } from '@/lib/supabase/types'

const STATUS_LABELS: Record<string, string> = { active: 'Actif', draft: 'Brouillon', archived: 'Archivé' }
const STATUS_COLORS: Record<string, string> = {
  active:   'text-green-400 bg-green-400/10 border-green-400/20',
  draft:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  archived: 'text-[var(--text-secondary)] bg-[var(--bg-elevated)] border-[var(--border)]',
}

const DEFAULT_CONFIG: EventConfig = {
  slots_enabled:      true,
  walkin_enabled:     false,
  video_enabled:      false,
  chrono_enabled:     false,
  carbooling_enabled: false,
}

const DEFAULT_SITE: EventSiteContent = {
  hero_title:       '',
  hero_subtitle:    '',
  hero_image_url:   '',
  description:      '',
  show_chrono_prize: false,
}

const CONFIG_LABELS: Record<keyof EventConfig, string> = {
  slots_enabled:      'Créneaux (planning)',
  walkin_enabled:     'Walk-in (sans créneaux)',
  video_enabled:      'Module Vidéos',
  chrono_enabled:     'Module Chrono',
  carbooling_enabled: 'Covoiturage',
}

function slugify(str: string) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Formulaire de création ───────────────────────────────────────────────────
function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', date_start: '', date_end: '', location: '' })
  const [config, setConfig] = useState<EventConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!form.name) return
    setLoading(true); setError(null)
    const slug = slugify(form.name)
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug, config, site_content: DEFAULT_SITE }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    onCreated()
  }

  return (
    <div className="card p-5 space-y-4">
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Nouvel événement</p>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1">Nom de l'événement *</label>
          <input className="input-field" placeholder="Jap'N'Car 2027" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          {form.name && <p className="text-[10px] text-[var(--text-secondary)] mt-1">Slug : {slugify(form.name)}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Date début</label>
            <input type="date" className="input-field text-sm" value={form.date_start}
              onChange={e => setForm(f => ({ ...f, date_start: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Date fin</label>
            <input type="date" className="input-field text-sm" value={form.date_end}
              onChange={e => setForm(f => ({ ...f, date_end: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1">Lieu</label>
          <input className="input-field" placeholder="Circuit de Montlhéry" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Modules activés</p>
        <div className="space-y-2">
          {(Object.keys(DEFAULT_CONFIG) as (keyof EventConfig)[]).map(key => (
            <button key={key} onClick={() => setConfig(c => ({ ...c, [key]: !c[key] }))}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors">
              <span className="text-sm text-[var(--text-primary)]">{CONFIG_LABELS[key]}</span>
              {config[key]
                ? <ToggleRight size={20} className="text-[var(--accent)]" />
                : <ToggleLeft size={20} className="text-[var(--text-secondary)]" />}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={handleCreate} disabled={loading || !form.name}
        className="btn-cta w-full font-bebas text-base disabled:opacity-40">
        {loading ? <Loader2 size={16} className="animate-spin" /> : 'CRÉER L\'ÉVÉNEMENT'}
      </button>
    </div>
  )
}

// ─── Panneau de configuration d'un event ─────────────────────────────────────
function EventConfigPanel({ event, onClose, onUpdated }: { event: Event; onClose: () => void; onUpdated: () => void }) {
  const [config, setConfig] = useState<EventConfig>({ ...DEFAULT_CONFIG, ...(event.config as EventConfig) })
  const [site, setSite] = useState<EventSiteContent>({ ...DEFAULT_SITE, ...(event.site_content as EventSiteContent) })
  const [info, setInfo] = useState({ name: event.name, date_start: event.date_start || '', date_end: event.date_end || '', location: event.location || '' })
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  async function handleSave() {
    setSaving(true)
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, ...info, config, site_content: site }),
    })
    setSaving(false)
    onUpdated()
  }

  async function handleActivate() {
    setActivating(true)
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, status: 'active' }),
    })
    setActivating(false)
    onUpdated()
  }

  async function handleArchive() {
    await fetch('/api/admin/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, status: 'archived' }),
    })
    onUpdated()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-[var(--bg-card)] h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border)] px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{event.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
          </div>
          <button onClick={onClose}><X size={20} className="text-[var(--text-secondary)]" /></button>
        </div>

        <div className="p-5 space-y-6">

          {/* Infos de base */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Informations</p>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Nom</label>
              <input className="input-field" value={info.name} onChange={e => setInfo(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Date début</label>
                <input type="date" className="input-field text-sm" value={info.date_start}
                  onChange={e => setInfo(f => ({ ...f, date_start: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] block mb-1">Date fin</label>
                <input type="date" className="input-field text-sm" value={info.date_end}
                  onChange={e => setInfo(f => ({ ...f, date_end: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Lieu</label>
              <input className="input-field" value={info.location} onChange={e => setInfo(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Modules</p>
            {(Object.keys(DEFAULT_CONFIG) as (keyof EventConfig)[]).map(key => (
              <button key={key} onClick={() => setConfig(c => ({ ...c, [key]: !c[key] }))}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors">
                <span className="text-sm text-[var(--text-primary)]">{CONFIG_LABELS[key]}</span>
                {config[key]
                  ? <ToggleRight size={20} className="text-[var(--accent)]" />
                  : <ToggleLeft size={20} className="text-[var(--text-secondary)]" />}
              </button>
            ))}
          </div>

          {/* Site vitrine */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Site vitrine</p>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Titre principal</label>
              <input className="input-field" placeholder="Jap'N'Car 2027" value={site.hero_title}
                onChange={e => setSite(s => ({ ...s, hero_title: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Sous-titre</label>
              <input className="input-field" placeholder="EASYDRIFT × Circuit de Montlhéry" value={site.hero_subtitle}
                onChange={e => setSite(s => ({ ...s, hero_subtitle: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Description</label>
              <textarea className="input-field text-sm resize-none" rows={3} value={site.description}
                onChange={e => setSite(s => ({ ...s, description: e.target.value }))} />
            </div>
            <button onClick={() => setSite(s => ({ ...s, show_chrono_prize: !s.show_chrono_prize }))}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border)] transition-colors">
              <span className="text-sm text-[var(--text-primary)]">Afficher le prix chrono</span>
              {site.show_chrono_prize
                ? <ToggleRight size={20} className="text-[var(--accent)]" />
                : <ToggleLeft size={20} className="text-[var(--text-secondary)]" />}
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="btn-cta w-full font-bebas text-base disabled:opacity-40">
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'SAUVEGARDER'}
            </button>

            {event.status !== 'active' && (
              <button onClick={handleActivate} disabled={activating}
                className="w-full py-3 rounded-xl border border-green-500/40 bg-green-500/10 text-green-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-500/20 transition-colors disabled:opacity-40">
                {activating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Activer cet événement
              </button>
            )}

            {event.status !== 'archived' && (
              <button onClick={handleArchive}
                className="w-full py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--bg-elevated)] transition-colors">
                <Archive size={14} />
                Archiver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export function EventsClient() {
  const { events, selectedEvent, setSelectedEvent, loading, refetch } = useEvent()
  const [showCreate, setShowCreate] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  if (loading) return (
    <div className="md:ml-56 p-5 flex items-center justify-center py-20">
      <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
    </div>
  )

  const active   = events.filter(e => e.status === 'active')
  const drafts   = events.filter(e => e.status === 'draft')
  const archived = events.filter(e => e.status === 'archived')

  function renderEvent(event: Event) {
    const isSelected = selectedEvent?.id === event.id
    return (
      <div key={event.id} className={`card p-4 ${isSelected ? 'ring-1 ring-[var(--accent)]' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[event.status]}`}>
                {STATUS_LABELS[event.status]}
              </span>
              {isSelected && <span className="text-xs text-[var(--accent)] font-semibold">En cours de consultation</span>}
            </div>
            <p className="font-semibold text-[var(--text-primary)]">{event.name}</p>
            <div className="flex items-center gap-3 mt-1">
              {event.date_start && (
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(event.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {event.date_end && event.date_end !== event.date_start && ` → ${new Date(event.date_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                </span>
              )}
              {event.location && (
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <MapPin size={11} />{event.location}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {(Object.entries(event.config) as [keyof EventConfig, boolean][])
                .filter(([, v]) => v)
                .map(([k]) => (
                  <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                    {CONFIG_LABELS[k]}
                  </span>
                ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isSelected && (
              <button onClick={() => setSelectedEvent(event)}
                className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                Consulter
              </button>
            )}
            <button onClick={() => setEditingEvent(event)}
              className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
              <Settings2 size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="md:ml-56 p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Événements</h1>
        <button onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors">
          {showCreate ? <X size={14} /> : <Plus size={14} />}
          {showCreate ? 'Annuler' : 'Nouvel événement'}
        </button>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        {events.length} événement{events.length > 1 ? 's' : ''} · Sélectionner un événement pour consulter ses données dans l'admin
      </p>

      {showCreate && (
        <div className="mb-6">
          <CreateEventForm onCreated={() => { setShowCreate(false); refetch() }} />
        </div>
      )}

      {active.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Actif</p>
          <div className="space-y-3">{active.map(renderEvent)}</div>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Brouillons</p>
          <div className="space-y-3">{drafts.map(renderEvent)}</div>
        </div>
      )}

      {archived.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Archivés</p>
          <div className="space-y-3">{archived.map(renderEvent)}</div>
        </div>
      )}

      {editingEvent && (
        <EventConfigPanel
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={() => { refetch(); setEditingEvent(null) }}
        />
      )}
    </div>
  )
}
