-- Table contacts (formulaire de contact landing page)
CREATE TABLE contacts (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name  text NOT NULL,
  email      text NOT NULL,
  phone      text,
  type       text NOT NULL DEFAULT 'particulier' CHECK (type IN ('particulier', 'professionnel')),
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_created_at ON contacts(created_at DESC);
CREATE INDEX idx_contacts_type ON contacts(type);

-- RLS : seul le service role peut lire/écrire
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_service_all" ON contacts FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
);
-- Insertion publique (formulaire de contact sans auth)
CREATE POLICY "contacts_public_insert" ON contacts FOR INSERT WITH CHECK (true);
