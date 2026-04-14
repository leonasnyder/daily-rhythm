-- CalDAV credentials per user
-- Stores Apple ID (or other CalDAV username) + App-Specific Password
CREATE TABLE IF NOT EXISTS dr_caldav_credentials (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  server_url TEXT NOT NULL DEFAULT 'https://caldav.icloud.com',
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
