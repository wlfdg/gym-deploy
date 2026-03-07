-- ============================================================
-- LOYD'S FITNESS GYM — Supabase Schema
-- Run this entire file in Supabase → SQL Editor → Run
-- ============================================================

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  plan TEXT NOT NULL,
  months INTEGER NOT NULL,
  price REAL NOT NULL,
  discount REAL DEFAULT 0,
  start_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  status TEXT DEFAULT 'active'
);

-- Walk-ins table
CREATE TABLE IF NOT EXISTS walkins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT DEFAULT '',
  date TEXT NOT NULL
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  time_in TEXT NOT NULL,
  time_out TEXT,
  date TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_expiry ON members(expiration_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_walkins_date ON walkins(date);

-- Default admin (password = "admin123" SHA-256 hashed)
INSERT INTO admins (username, password)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS) — disable for simplicity on free plan
-- Or enable and use service role key on backend
-- ============================================================
ALTER TABLE admins    DISABLE ROW LEVEL SECURITY;
ALTER TABLE members   DISABLE ROW LEVEL SECURITY;
ALTER TABLE walkins   DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
