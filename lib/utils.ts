import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { v4 as uuidv4 } from 'uuid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(centimes: number): string {
  return `${(centimes / 100).toFixed(0)}€`
}

export function formatTime(time: string): string {
  // '09:00:00' -> '09h00'
  const [h, m] = time.split(':')
  return `${h}h${m}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  if (day === 6) return 'Samedi'
  if (day === 0) return 'Dimanche'
  return date.toLocaleDateString('fr-FR', { weekday: 'long' })
}

export function generateTicketCode(): string {
  const id = uuidv4().replace(/-/g, '').toUpperCase()
  return `EASY-${id.slice(0, 4)}-${id.slice(4, 8)}`
}

export function getAvailabilityStatus(available: number, capacity: number): {
  label: string
  color: string
  variant: 'available' | 'low' | 'full'
} {
  if (available === 0) {
    return { label: 'Complet', color: 'text-red-500', variant: 'full' }
  }
  if (available <= 2) {
    return { label: `${available} place${available > 1 ? 's' : ''}`, color: 'text-yellow-500', variant: 'low' }
  }
  return { label: `${available} places`, color: 'text-green-500', variant: 'available' }
}

export function getMorningAfternoon(timeStr: string): 'morning' | 'afternoon' {
  const [h] = timeStr.split(':').map(Number)
  return h < 12 ? 'morning' : 'afternoon'
}

export function generateICSContent(booking: {
  activity_label: string
  day: string
  start_time: string
  end_time: string
  first_name: string
  last_name: string
  ticket_code: string
}): string {
  const start = new Date(`${booking.day}T${booking.start_time}`)
  const end = new Date(`${booking.day}T${booking.end_time}`)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EASYDRIFT//JAPN Car//FR',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:EASYDRIFT - ${booking.activity_label}`,
    `DESCRIPTION:${booking.first_name} ${booking.last_name} - Code: ${booking.ticket_code}`,
    'LOCATION:Circuit de Montlhéry\\, 91310 Linas',
    `UID:${booking.ticket_code}@easydrift-experience.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
