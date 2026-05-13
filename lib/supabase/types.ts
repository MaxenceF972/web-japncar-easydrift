export type ActivityName = 'bapteme' | 'conduite' | 'carbooling'
export type PaymentStatus = 'pending' | 'paid' | 'cash' | 'terminal' | 'free' | 'cancelled'
export type AdminRole = 'admin' | 'staff'

export interface Activity {
  id: string
  name: ActivityName
  label: string
  price: number // centimes
  duration: number // minutes
  color: string
  description: string | null
  capacity: number
  created_at: string
}

export interface Slot {
  id: string
  activity_id: string
  day: string // 'YYYY-MM-DD'
  start_time: string // 'HH:MM:SS'
  end_time: string
  capacity: number
  booked_count: number
  is_active: boolean
  is_break: boolean
  created_at: string
  // joined
  activity?: Activity
  available?: number
}

export interface SlotLock {
  id: string
  slot_id: string
  session_id: string
  locked_at: string
  expires_at: string
}

export interface Booking {
  id: string
  slot_id: string
  activity_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  payment_status: PaymentStatus
  sumup_checkout_id: string | null
  amount_paid: number | null
  ticket_code: string | null
  ticket_sent_at: string | null
  checked_in: boolean
  checked_in_at: string | null
  checked_in_by: string | null
  notes: string | null
  created_at: string
  booked_by_admin: boolean
  // joined
  slot?: Slot
  activity?: Activity
}

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      activities: {
        Row: Activity
        Insert: Omit<Activity, 'id' | 'created_at'>
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>
      }
      slots: {
        Row: Slot
        Insert: Omit<Slot, 'id' | 'created_at' | 'booked_count'>
        Update: Partial<Omit<Slot, 'id' | 'created_at'>>
      }
      slot_locks: {
        Row: SlotLock
        Insert: Omit<SlotLock, 'id' | 'locked_at'>
        Update: Partial<SlotLock>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'created_at'>
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>
      }
      admin_users: {
        Row: AdminUser
        Insert: Omit<AdminUser, 'id' | 'created_at'>
        Update: Partial<Omit<AdminUser, 'id' | 'created_at'>>
      }
    }
  }
}
