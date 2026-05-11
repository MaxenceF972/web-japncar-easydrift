'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Calendar, CheckCircle } from 'lucide-react'
import type { Booking } from '@/lib/supabase/types'
import { formatTime, formatDate, generateICSContent } from '@/lib/utils'

interface TicketProps {
  booking: Booking & {
    slot: { start_time: string; end_time: string; day: string }
    activity: { label: string; color: string }
  }
}

export function Ticket({ booking }: TicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    if (!ticketRef.current) return
    const html2canvas = (await import('html2canvas')).default
    const canvas = await html2canvas(ticketRef.current, {
      backgroundColor: '#111111',
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = `ticket-easydrift-${booking.ticket_code}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  function handleCalendar() {
    const ics = generateICSContent({
      activity_label: booking.activity.label,
      day: booking.slot.day,
      start_time: booking.slot.start_time,
      end_time: booking.slot.end_time,
      first_name: booking.first_name,
      last_name: booking.last_name,
      ticket_code: booking.ticket_code!,
    })
    const blob = new Blob([ics], { type: 'text/calendar' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'easydrift.ics'
    link.click()
  }

  const qrValue = `${process.env.NEXT_PUBLIC_APP_URL}/admin/scanner?code=${booking.ticket_code}`

  return (
    <div className="space-y-4">
      {/* Ticket */}
      <div ref={ticketRef} className="card overflow-hidden" style={{ borderTop: `3px solid ${booking.activity.color}` }}>
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <img src="/logo-easydrift.png" alt="EasyDrift" className="h-8 w-auto mb-1" />
              <p className="text-[var(--text-secondary)] text-sm">JAPN Car à Montlhéry</p>
            </div>
            <CheckCircle size={28} className="text-green-500" />
          </div>
        </div>

        {/* Activity info */}
        <div className="p-5 border-b border-[var(--border)]">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
            style={{ background: `${booking.activity.color}20`, color: booking.activity.color }}
          >
            {booking.activity.label}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bebas text-2xl text-[var(--text-primary)]">
              {formatDate(booking.slot.day)}
            </span>
          </div>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {formatTime(booking.slot.start_time)} — {formatTime(booking.slot.end_time)}
          </p>
        </div>

        {/* QR Code */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-[var(--text-primary)] font-semibold mb-1">
            {booking.first_name} {booking.last_name.toUpperCase()}
          </p>
          <p className="text-[var(--text-secondary)] text-sm mb-5">{booking.email}</p>

          <div className="p-3 bg-white rounded-xl">
            <QRCodeSVG
              value={qrValue}
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <p className="font-bebas text-xl tracking-widest text-[var(--text-primary)] mt-4">
            {booking.ticket_code}
          </p>
          <p className="text-[var(--text-secondary)] text-xs mt-1">
            Présentez ce QR code à l'entrée
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[var(--bg-elevated)] flex items-center gap-2">
          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          <p className="text-[var(--text-secondary)] text-xs">
            Ticket envoyé à {booking.email}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleCalendar} className="btn-secondary text-sm">
          <Calendar size={16} />
          Calendrier
        </button>
        <button onClick={handleDownload} className="btn-secondary text-sm">
          <Download size={16} />
          Télécharger
        </button>
      </div>
    </div>
  )
}
