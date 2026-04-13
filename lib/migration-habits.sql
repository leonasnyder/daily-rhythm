-- ============================================================
-- Daily Rhythm — Habit Tracker tables
-- Run this in the Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- Habit definitions (per-user, editable list)
CREATE TABLE IF NOT EXISTS dr_habits (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'General',
  color       TEXT DEFAULT '#6B7280',
  frequency   TEXT DEFAULT 'daily',   -- 'daily', 'weekly'
  is_active   INTEGER DEFAULT 1,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dr_habits_user_id_idx ON dr_habits(user_id);

-- Daily completions (one row per habit per day when checked)
CREATE TABLE IF NOT EXISTS dr_habit_completions (
  id             SERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id       INTEGER NOT NULL REFERENCES dr_habits(id) ON DELETE CASCADE,
  completed_date TEXT NOT NULL,   -- 'YYYY-MM-DD'
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, habit_id, completed_date)
);

CREATE INDEX IF NOT EXISTS dr_habit_completions_user_date_idx
  ON dr_habit_completions(user_id, completed_date);

-- ============================================================
-- Reminders table (Apple Reminders-style)
-- ============================================================

CREATE TABLE IF NOT EXISTS pa_tasks (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  notes       TEXT,
  is_completed INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pa_tasks_user_id_idx ON pa_tasks(user_id);
