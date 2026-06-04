'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Save, ChevronDown, ChevronUp, Loader2, Send, Plus, X, Search } from 'lucide-react'
import { formatTime, getDayLabel } from '@/lib/utils'

interface VideoOrder {
  id: string
  preview_url: string
  full_video_url: string
  payment_status: string
  download_token: string
  email_sent_at: string | null
}

interface BookingWithVideo {
  id: string
  first_name: string
  last_name: string
  email: string
  slot: { day: string; start_time: string } | null
  video_order: VideoOrder | null
}

export function VideosClient() {
  const [bookings, setBookings] = useState<BookingWithVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, { previewUrl: string; fullVideoUrl: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ firstName: '', lastName: '', email: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [sendingAll, setSendingAll] = useState(false)
  const [sendAllProgress, setSendAllProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    fetch('/api/admin/videos')
      .then(r => r.json())
      .then(d => {
        setBookings(d.bookings || [])
        const f: typeof forms = {}
        for (const b of d.bookings || []) {
          f[b.id] = {
            previewUrl: b.video_order?.preview_url || '',
            fullVideoUrl: b.video_order?.full_video_url || '',
          }
        }
        setForms(f)
        setLoading(false)
      })
  }, [])

  async function handleAddCustom() {
    if (!addForm.firstName || !addForm.lastName) return
    setAddLoading(true)
    const resp = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customFirstName: addForm.firstName.trim(),
        customLastName: addForm.lastName.trim(),
        customEmail: addForm.email.trim(),
        previewUrl: '',
        fullVideoUrl: '',
      }),
    })
    const data = await resp.json()
    setAddLoading(false)
    if (resp.ok) {
      const newEntry = {
        id: `custom_${data.order.id}`,
        first_name: addForm.firstName.trim(),
        last_name: addForm.lastName.trim(),
        email: addForm.email.trim(),
        slot: null,
        video_order: data.order,
        is_custom: true,
      }
      setBookings(prev => [...prev, newEntry])
      setForms(f => ({ ...f, [`custom_${data.order.id}`]: { previewUrl: '', fullVideoUrl: '' } }))
      setAddForm({ firstName: '', lastName: '', email: '' })
      setShowAddForm(false)
    }
  }

  async function handleSave(bookingId: string, sendEmail = false) {
    sendEmail ? setSending(bookingId) : setSaving(bookingId)
    const form = forms[bookingId]
    const booking = bookings.find(b => b.id === bookingId)
    const isCustom = !!(booking as any)?.is_custom
    const resp = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: isCustom ? null : bookingId,
        previewUrl: form.previewUrl,
        fullVideoUrl: form.fullVideoUrl,
        sendEmail,
        ...(isCustom && {
          customFirstName: booking?.first_name,
          customLastName: booking?.last_name,
          customEmail: booking?.email,
        }),
      }),
    })
    const data = await resp.json()
    sendEmail ? setSending(null) : setSaving(null)
    if (resp.ok) {
      setSaved(bookingId)
      setTimeout(() => setSaved(null), 2000)
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, video_order: data.order } : b
      ))
    }
  }

  async function handleSendAll() {
    const toSend = bookings.filter((b: BookingWithVideo) => b.email && !b.video_order?.email_sent_at && b.video_order?.preview_url && b.video_order?.full_video_url)
    if (!toSend.length) return
    if (!window.confirm(`Envoyer l'email à ${toSend.length} client${toSend.length > 1 ? 's' : ''} ?`)) return
    setSendingAll(true)
    setSendAllProgress({ done: 0, total: toSend.length })
    for (let i = 0; i < toSend.length; i++) {
      const b = toSend[i]
      const isCustom = !!(b as any).is_custom
      await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: isCustom ? null : b.id,
          previewUrl: b.video_order!.preview_url,
          fullVideoUrl: b.video_order!.full_video_url,
          sendEmail: true,
          ...(isCustom && { customFirstName: b.first_name, customLastName: b.last_name, customEmail: b.email }),
        }),
      })
      setBookings(prev => prev.map(x =>
        x.id === b.id ? { ...x, video_order: { ...x.video_order!, email_sent_at: new Date().toISOString() } } : x
      ))
      setSendAllProgress({ done: i + 1, total: toSend.length })
    }
    setSendingAll(false)
    setSendAllProgress(null)
  }

  const withVideoAll = bookings.filter(b => b.video_order?.preview_url)
  const filtered = search.trim()
    ? bookings.filter(b => `${b.first_name} ${b.last_name}`.toLowerCase().includes(search.toLowerCase()))
    : bookings
  const withVideo = filtered.filter(b => b.video_order?.preview_url)
  const withoutVideo = filtered.filter(b => !b.video_order?.preview_url)
  const pendingSendCount = withVideoAll.filter(b => b.email && !b.video_order?.email_sent_at && b.video_order?.full_video_url).length

  if (loading) {
    return (
      <div className="md:ml-56 p-5 flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[var(--accent)] animate-spin" />
      </div>
    )
  }

  const renderBooking = (b: BookingWithVideo) => {
    const isExpanded = expandedId === b.id
    const form = forms[b.id] || { previewUrl: '', fullVideoUrl: '' }
    const hasPaid = b.video_order?.payment_status === 'paid'
    const emailSent = !!b.video_order?.email_sent_at
    const hasVideo = !!b.video_order?.preview_url

    return (
      <div key={b.id} className="card overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 text-left"
          onClick={() => setExpandedId(isExpanded ? null : b.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${hasPaid ? 'bg-green-500' : hasVideo ? 'bg-yellow-500' : 'bg-[var(--border)]'}`} />
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-sm">
                {b.first_name} {b.last_name.toUpperCase()}
              </p>
              <p className="text-[var(--text-secondary)] text-xs">
                {b.slot ? `${getDayLabel(b.slot.day)} · ${formatTime(b.slot.start_time)}` : ''}
                {emailSent && ' · ✉️ Email envoyé'}
                {hasPaid && ' · 💳 Vidéo achetée'}
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-[var(--text-secondary)]" /> : <ChevronDown size={16} className="text-[var(--text-secondary)]" />}
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-4">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">URL du clip preview (Drive)</label>
              <input
                className="input-field text-sm"
                placeholder="https://drive.google.com/file/d/..."
                value={form.previewUrl}
                onChange={e => setForms(f => ({ ...f, [b.id]: { ...f[b.id], previewUrl: e.target.value } }))}
              />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">URL de la vidéo complète (Drive)</label>
              <input
                className="input-field text-sm"
                placeholder="https://drive.google.com/file/d/..."
                value={form.fullVideoUrl}
                onChange={e => setForms(f => ({ ...f, [b.id]: { ...f[b.id], fullVideoUrl: e.target.value } }))}
              />
            </div>

            {b.video_order?.download_token && (
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)] break-all">
                🔗 {window.location.origin}/video/{b.video_order.download_token}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleSave(b.id, false)}
                disabled={saving === b.id || !form.previewUrl || !form.fullVideoUrl}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-sm font-medium text-[var(--text-secondary)] flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saved === b.id ? <CheckCircle size={14} className="text-green-400" /> : saving === b.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saved === b.id ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
              <button
                onClick={() => handleSave(b.id, true)}
                disabled={sending === b.id || !form.previewUrl || !form.fullVideoUrl || !b.email}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {sending === b.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {emailSent ? 'Renvoyer l\'email' : 'Envoyer l\'email'}
              </button>
            </div>
            {!b.email && <p className="text-yellow-400 text-xs">⚠️ Pas d'email pour ce client</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="md:ml-56 p-5 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-bebas text-3xl text-[var(--text-primary)]">Vidéos Baptême</h1>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] transition-colors"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'Annuler' : 'Ajouter client'}
        </button>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-4">
        {withVideo.length} vidéos liées · {bookings.filter(b => b.video_order?.payment_status === 'paid').length} achetées · {bookings.length} clients total
      </p>

      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          className="input-field pl-9 text-sm w-full"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {showAddForm && (
        <div className="card p-4 mb-6 space-y-3">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Ajouter un client manuellement</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Prénom *</label>
              <input className="input-field text-sm" placeholder="Maxence" value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1">Nom *</label>
              <input className="input-field text-sm" placeholder="FORTIER" value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-1">Email</label>
            <input className="input-field text-sm" type="email" placeholder="email@..." value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <button
            onClick={handleAddCustom}
            disabled={addLoading || !addForm.firstName || !addForm.lastName}
            className="btn-cta w-full font-bebas text-base disabled:opacity-40"
          >
            {addLoading ? <Loader2 size={16} className="animate-spin" /> : 'AJOUTER'}
          </button>
        </div>
      )}

      {withVideo.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Vidéos prêtes ({withVideo.length})</p>
            {pendingSendCount > 0 && (
              <button
                onClick={handleSendAll}
                disabled={sendingAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold disabled:opacity-60"
              >
                {sendingAll
                  ? <><Loader2 size={12} className="animate-spin" />{sendAllProgress ? `${sendAllProgress.done}/${sendAllProgress.total}` : '...'}</>
                  : <><Send size={12} />Tout envoyer ({pendingSendCount})</>
                }
              </button>
            )}
          </div>
          <div className="space-y-2">{withVideo.map(renderBooking)}</div>
        </div>
      )}

      {withoutVideo.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Sans vidéo ({withoutVideo.length})</p>
          <div className="space-y-2">{withoutVideo.map(renderBooking)}</div>
        </div>
      )}
    </div>
  )
}
