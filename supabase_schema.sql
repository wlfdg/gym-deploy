-- ============================================================
-- LOYD'S FITNESS GYM — Supabase Schema (Full & Updated)
-- Run this entire file in Supabase → SQL Editor → Run
-- ============================================================

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id       SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT 'admin',
  status   TEXT NOT NULL DEFAULT 'active'
);

-- Members table
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

-- Walk-ins table (created_at added for owner portal time display)
CREATE TABLE IF NOT EXISTS walkins (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  amount     REAL NOT NULL,
  note       TEXT DEFAULT '',
  date       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  time_in     TEXT NOT NULL,
  time_out    TEXT,
  date        TEXT NOT NULL
);

-- Notifications table (for owner portal alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs table (admin action tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
  id             SERIAL PRIMARY KEY,
  admin_username TEXT NOT NULL,
  action         TEXT NOT NULL,
  details        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Admin DTR table (admin shift time-in/out)
CREATE TABLE IF NOT EXISTS admin_dtr (
  id              SERIAL PRIMARY KEY,
  admin_username  TEXT NOT NULL,
  date            TEXT NOT NULL,
  time_in         TEXT NOT NULL,
  time_out        TEXT,
  shift_ts_in     TIMESTAMP,
  shift_ts_out    TIMESTAMP,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Employee DTR table (employee attendance)
CREATE TABLE IF NOT EXISTS employee_dtr (
  id            SERIAL PRIMARY KEY,
  employee_name TEXT NOT NULL,
  date          TEXT NOT NULL,
  time_in       TEXT NOT NULL,
  time_out      TEXT,
  note          TEXT DEFAULT '',
  recorded_by   TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_members_expiry    ON members(expiration_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date   ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_walkins_date      ON walkins(date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_usr ON activity_logs(admin_username);
CREATE INDEX IF NOT EXISTS idx_admin_dtr_usr     ON admin_dtr(admin_username);
CREATE INDEX IF NOT EXISTS idx_employee_dtr_name ON employee_dtr(employee_name);
CREATE INDEX IF NOT EXISTS idx_notif_read        ON notifications(is_read);

-- ============================================================
-- Add created_at to walkins if upgrading existing database
-- (safe to run even if column already exists)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='walkins' AND column_name='created_at'
  ) THEN
    ALTER TABLE walkins ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add role/status columns to admins if upgrading existing database
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='admins' AND column_name='role'
  ) THEN
    ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='admins' AND column_name='status'
  ) THEN
    ALTER TABLE admins ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
END $$;

-- ============================================================
-- Default owner account (password = "admin123" — CHANGE THIS!)
-- ============================================================
INSERT INTO admins (username, password, role, status)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'owner', 'active')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Row Level Security — disabled for simplicity
-- Use service role key on backend only, never expose anon key
-- ============================================================
ALTER TABLE admins       DISABLE ROW LEVEL SECURITY;
ALTER TABLE members      DISABLE ROW LEVEL SECURITY;
ALTER TABLE walkins      DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance   DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dtr    DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_dtr DISABLE ROW LEVEL SECURITY;
