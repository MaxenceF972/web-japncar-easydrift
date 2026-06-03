'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Mail, Save, ChevronDown, ChevronUp, Loader2, Send } from 'lucide-react'
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

  async function handleSave(bookingId: string, sendEmail = false) {
    sendEmail ? setSending(bookingId) : setSaving(bookingId)
    const form = forms[bookingId]
    const resp = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        previewUrl: form.previewUrl,
        fullVideoUrl: form.fullVideoUrl,
        sendEmail,
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

  const withVideo = bookings.filter(b => b.video_order?.preview_url)
  const withoutVideo = bookings.filter(b => !b.video_order?.preview_url)

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
      <h1 className="font-bebas text-3xl text-[var(--text-primary)] mb-2">Vidéos Baptême</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        {withVideo.length} vidéos liées · {bookings.filter(b => b.video_order?.payment_status === 'paid').length} achetées · {bookings.length} clients total
      </p>

      {withVideo.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">Vidéos prêtes ({withVideo.length})</p>
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
