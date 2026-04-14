-- ============================================================
-- Daily Rhythm — Tasks v2: due date, due time, subtasks
-- Run in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

ALTER TABLE pa_tasks ADD COLUMN IF NOT EXISTS due_date TEXT;
ALTER TABLE pa_tasks ADD COLUMN IF NOT EXISTS due_time TEXT;
ALTER TABLE pa_tasks ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES pa_tasks(id) ON DELETE CASCADE;
ALTER TABLE pa_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
