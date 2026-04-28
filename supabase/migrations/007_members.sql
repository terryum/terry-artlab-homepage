-- Members: registered Google-OAuth users with assigned role + group.
-- Source of truth for who has access. The id-session cookie embeds role+group
-- but this table is what the Google callback consults to issue tokens.

CREATE TABLE IF NOT EXISTS members (
  email TEXT PRIMARY KEY,
  name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  group_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS members_group_slug_idx ON members(group_slug);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_service_only" ON members;
CREATE POLICY "members_service_only"
  ON members
  FOR ALL
  USING (auth.role() = 'service_role');
