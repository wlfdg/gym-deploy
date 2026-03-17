-- ============================================================
-- LOYD'S FITNESS GYM — Supabase Schema (Authoritative)
-- Last updated: 2025
-- Run in Supabase → SQL Editor → Run
-- Safe to re-run on existing databases (uses IF NOT EXISTS + DO blocks)
-- ============================================================

-- ── 1. admins ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id       SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT 'admin',   -- 'owner' | 'admin'
  status   TEXT NOT NULL DEFAULT 'active'   -- 'active' | 'pending' | 'disabled'
);

-- ── 2. members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT DEFAULT '',
  phone           TEXT DEFAULT '',
  plan            TEXT NOT NULL,
  months          INTEGER NOT NULL,
  price           REAL NOT NULL,
  discount        REAL DEFAULT 0,
  start_date      TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  status          TEXT DEFAULT 'active'
);

-- ── 3. walkins ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS walkins (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  amount     REAL NOT NULL,
  note       TEXT DEFAULT '',
  date       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. attendance ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  time_in     TEXT NOT NULL,
  time_out    TEXT,
  date        TEXT NOT NULL
);

-- ── 5. notifications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. activity_logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id             SERIAL PRIMARY KEY,
  admin_username TEXT NOT NULL,
  action         TEXT NOT NULL,
  details        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. admin_dtr ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_dtr (
  id             SERIAL PRIMARY KEY,
  admin_username TEXT NOT NULL,
  date           TEXT NOT NULL,
  time_in        TEXT,
  time_out       TEXT,
  note           TEXT DEFAULT '',
  shift_revenue  NUMERIC DEFAULT 0,
  shift_ts_in    TIMESTAMP,
  shift_ts_out   TIMESTAMP
);

-- ── 8. employee_dtr ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_dtr (
  id            SERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  date          TEXT NOT NULL,
  time_in       TEXT,
  time_out      TEXT,
  note          TEXT DEFAULT '',
  recorded_by   TEXT DEFAULT ''
);

-- ── 9. deletion_requests ───────────────────────────────────
-- Admin requests deletion of a member → owner approves/rejects
CREATE TABLE IF NOT EXISTS deletion_requests (
  id           SERIAL PRIMARY KEY,
  member_id    INTEGER NOT NULL,
  member_name  TEXT NOT NULL,
  member_plan  TEXT,
  requested_by TEXT NOT NULL,
  reviewed_by  TEXT,
  status       TEXT DEFAULT 'pending',    -- 'pending' | 'approved' | 'rejected'
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_members_expiry      ON members(expiration_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date     ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_walkins_date        ON walkins(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user  ON activity_logs(admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_dtr_user      ON admin_dtr(admin_username);
CREATE INDEX IF NOT EXISTS idx_employee_dtr_name   ON employee_dtr(employee_name);
CREATE INDEX IF NOT EXISTS idx_notifications_read  ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_del_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_del_requests_member ON deletion_requests(member_id);

-- ============================================================
-- Safe upgrade patches (safe to run on existing databases)
-- ============================================================

-- Patch: fix walkins.created_at to TIMESTAMPTZ if it's plain timestamp
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='walkins' AND column_name='created_at'
    AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE walkins
      ALTER COLUMN created_at TYPE TIMESTAMPTZ
      USING created_at AT TIME ZONE 'Asia/Manila';
  END IF;
END $$;

-- Patch: add role to admins if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='admins' AND column_name='role'
  ) THEN
    ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
  END IF;
END $$;

-- Patch: add status to admins if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='admins' AND column_name='status'
  ) THEN
    ALTER TABLE admins ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- Patch: add created_at to walkins if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='walkins' AND column_name='created_at'
  ) THEN
    ALTER TABLE walkins ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Patch: add note + shift_revenue to admin_dtr if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='admin_dtr' AND column_name='note'
  ) THEN
    ALTER TABLE admin_dtr ADD COLUMN note TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='admin_dtr' AND column_name='shift_revenue'
  ) THEN
    ALTER TABLE admin_dtr ADD COLUMN shift_revenue NUMERIC DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- Row Level Security — disabled (using service role key on backend)
-- ============================================================
ALTER TABLE admins            DISABLE ROW LEVEL SECURITY;
ALTER TABLE members           DISABLE ROW LEVEL SECURITY;
ALTER TABLE walkins           DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance        DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs     DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dtr         DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_dtr      DISABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Default owner account
-- ⚠️  Change password after first login!
-- Default password: admin123
-- ============================================================
INSERT INTO admins (username, password, role, status)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'owner', 'active')
ON CONFLICT (username) DO NOTHING;
