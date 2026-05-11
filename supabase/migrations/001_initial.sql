-- ============================================================
-- EasyDrift JAPN Car - Schéma initial
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table activities
-- ============================================================
CREATE TABLE activities (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL CHECK (name IN ('bapteme', 'conduite', 'carbooling')),
  label       text NOT NULL,
  price       int NOT NULL, -- en centimes
  duration    int NOT NULL, -- en minutes
  color       text NOT NULL,
  description text,
  capacity    int NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- Table slots
-- ============================================================
CREATE TABLE slots (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id  uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  day          date NOT NULL,
  start_time   time NOT NULL,
  end_time     time NOT NULL,
  capacity     int NOT NULL,
  booked_count int NOT NULL DEFAULT 0,
  is_active    bool NOT NULL DEFAULT true,
  is_break     bool NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now(),
  CONSTRAINT booked_count_valid CHECK (booked_count >= 0 AND booked_count <= capacity)
);

CREATE INDEX idx_slots_activity_day ON slots(activity_id, day);
CREATE INDEX idx_slots_day ON slots(day);

-- ============================================================
-- Table slot_locks (verrou temporaire 10 min pendant paiement)
-- ============================================================
CREATE TABLE slot_locks (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id     uuid NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  session_id  text NOT NULL,
  locked_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX idx_slot_locks_slot ON slot_locks(slot_id);
CREATE INDEX idx_slot_locks_expires ON slot_locks(expires_at);

-- ============================================================
-- Table bookings
-- ============================================================
CREATE TABLE bookings (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id           uuid NOT NULL REFERENCES slots(id),
  activity_id       uuid NOT NULL REFERENCES activities(id),
  -- Infos client
  first_name        text NOT NULL,
  last_name         text NOT NULL,
  email             text NOT NULL,
  phone             text,
  -- Paiement
  payment_status    text NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending', 'paid', 'cash', 'free', 'cancelled')),
  sumup_checkout_id text,
  amount_paid       int,
  -- Ticket
  ticket_code       text UNIQUE,
  ticket_sent_at    timestamptz,
  -- Validation sur place
  checked_in        bool NOT NULL DEFAULT false,
  checked_in_at     timestamptz,
  checked_in_by     text,
  -- Méta
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  booked_by_admin   bool NOT NULL DEFAULT false
);

CREATE INDEX idx_bookings_slot ON bookings(slot_id);
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_ticket_code ON bookings(ticket_code);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================================
-- Table admin_users
-- ============================================================
CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         text UNIQUE NOT NULL,
  name          text NOT NULL,
  role          text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Activities : lecture publique
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_public_read" ON activities FOR SELECT USING (true);
CREATE POLICY "activities_admin_all" ON activities FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Slots : lecture publique
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots_public_read" ON slots FOR SELECT USING (true);
CREATE POLICY "slots_admin_all" ON slots FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Slot locks : service role uniquement
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slot_locks_service_all" ON slot_locks FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);

-- Bookings : lecture uniquement par email (client), tout pour service_role
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_service_all" ON bookings FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);
-- Les clients peuvent lire leur booking via le ticket_code (pas d'auth requise, access via API)

-- Admin users : service role uniquement
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_service_all" ON admin_users FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);

-- ============================================================
-- Fonction : libérer les locks expirés
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM slot_locks WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Fonction : disponibilité réelle d'un slot
-- ============================================================
CREATE OR REPLACE FUNCTION get_slot_available(p_slot_id uuid)
RETURNS int AS $$
DECLARE
  v_slot slots%ROWTYPE;
  v_locks int;
BEGIN
  SELECT * INTO v_slot FROM slots WHERE id = p_slot_id;
  SELECT COUNT(*) INTO v_locks FROM slot_locks
    WHERE slot_id = p_slot_id AND expires_at > now();
  RETURN GREATEST(0, v_slot.capacity - v_slot.booked_count - v_locks);
END;
$$ LANGUAGE plpgsql;
