-- ============================================================
-- Daily Rhythm — Journal Entries
-- Run in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS dr_journal_entries (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date  TEXT NOT NULL,          -- 'YYYY-MM-DD'
  title       TEXT,
  content     TEXT NOT NULL DEFAULT '',
  mood        TEXT,                   -- 'great','good','okay','hard','rough'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dr_journal_user_date_idx
  ON dr_journal_entries(user_id, entry_date DESC);
