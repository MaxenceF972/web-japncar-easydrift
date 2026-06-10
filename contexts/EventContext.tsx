'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Event } from '@/lib/supabase/types'

interface EventContextValue {
  events: Event[]
  selectedEvent: Event | null
  setSelectedEvent: (event: Event) => void
  loading: boolean
  refetch: () => Promise<void>
}

const EventContext = createContext<EventContextValue>({
  events: [],
  selectedEvent: null,
  setSelectedEvent: () => {},
  loading: true,
  refetch: async () => {},
})

export function useEvent() {
  return useContext(EventContext)
}

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEventState] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchEvents() {
    try {
      const res = await fetch('/api/admin/events')
      const data = await res.json()
      const list: Event[] = data.events || []
      setEvents(list)

      // Restaurer la sélection depuis localStorage
      const savedId = typeof window !== 'undefined'
        ? localStorage.getItem('easydrift_selected_event')
        : null

      const saved = savedId ? list.find(e => e.id === savedId) : null
      const active = list.find(e => e.status === 'active')
      const fallback = list[0] ?? null

      setSelectedEventState(saved ?? active ?? fallback)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  function setSelectedEvent(event: Event) {
    setSelectedEventState(event)
    if (typeof window !== 'undefined') {
      localStorage.setItem('easydrift_selected_event', event.id)
    }
  }

  return (
    <EventContext.Provider value={{ events, selectedEvent, setSelectedEvent, loading, refetch: fetchEvents }}>
      {children}
    </EventContext.Provider>
  )
}
