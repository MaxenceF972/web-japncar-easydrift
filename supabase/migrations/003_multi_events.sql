-- ============================================================
-- Migration 003 : Architecture multi-événements
-- ============================================================

-- ============================================================
-- Table events
-- ============================================================
CREATE TABLE events (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  date_start   date,
  date_end     date,
  location     text,
  status       text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'active', 'archived')),
  -- Modules activés/désactivés pour cet event
  config       jsonb NOT NULL DEFAULT '{
    "slots_enabled": true,
    "walkin_enabled": false,
    "video_enabled": false,
    "chrono_enabled": false,
    "carbooling_enabled": false
  }',
  -- Contenu du site vitrine (éditable depuis l'admin)
  site_content jsonb NOT NULL DEFAULT '{
    "hero_title": "",
    "hero_subtitle": "",
    "hero_image_url": "",
    "description": "",
    "show_chrono_prize": false
  }',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS events : lecture publique (vitrine), écriture service role
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read"  ON events FOR SELECT USING (true);
CREATE POLICY "events_admin_all"    ON events FOR ALL    USING (auth.jwt() ->> 'role' = 'service_role');

-- Insérer l'événement Jap'N'Car 2026 (données existantes)
INSERT INTO events (name, slug, date_start, date_end, location, status, config, site_content)
VALUES (
  'Jap''N''Car 2026',
  'japncar-2026',
  '2026-05-30',
  '2026-05-31',
  'Circuit de Montlhéry',
  'archived',
  '{
    "slots_enabled": true,
    "walkin_enabled": false,
    "video_enabled": true,
    "chrono_enabled": true,
    "carbooling_enabled": true
  }',
  '{
    "hero_title": "Jap''N''Car 2026",
    "hero_subtitle": "EASYDRIFT x Circuit de Montlhéry",
    "hero_image_url": "",
    "description": "Vivez l''expérience drift au Circuit de Montlhéry lors du Jap''N''Car 2026.",
    "show_chrono_prize": true
  }'
);

-- ============================================================
-- Ajouter event_id aux tables concernées
-- ============================================================

-- activities : supprimer la contrainte de nom fixe + ajouter event_id + type
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_name_check;
ALTER TABLE activities ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE activities ADD COLUMN type text NOT NULL DEFAULT 'scheduled'
  CHECK (type IN ('scheduled', 'walkin'));

-- Migrer les activités existantes vers Jap'N'Car 2026
UPDATE activities
SET event_id = (SELECT id FROM events WHERE slug = 'japncar-2026');

ALTER TABLE activities ALTER COLUMN event_id SET NOT NULL;
CREATE INDEX idx_activities_event ON activities(event_id);

-- bookings : rendre slot_id nullable (walk-in) + ajouter event_id
ALTER TABLE bookings ALTER COLUMN slot_id DROP NOT NULL;
ALTER TABLE bookings ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;

-- Migrer les bookings existants vers Jap'N'Car 2026
UPDATE bookings
SET event_id = (SELECT id FROM events WHERE slug = 'japncar-2026');

ALTER TABLE bookings ALTER COLUMN event_id SET NOT NULL;
CREATE INDEX idx_bookings_event ON bookings(event_id);

-- Ajouter 'terminal' au check payment_status si pas déjà présent
-- (la migration initiale ne l'avait pas)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'cash', 'terminal', 'free', 'cancelled'));

-- lap_times : ajouter event_id
ALTER TABLE lap_times ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE CASCADE;
UPDATE lap_times SET event_id = (SELECT id FROM events WHERE slug = 'japncar-2026') WHERE event_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_lap_times_event ON lap_times(event_id);

-- team_members : ajouter event_id (nullable = membres globaux)
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL;
UPDATE team_members SET event_id = (SELECT id FROM events WHERE slug = 'japncar-2026') WHERE event_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_event ON team_members(event_id);
