-- Create weekly_games table if it doesn't exist
CREATE TABLE IF NOT EXISTS weekly_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week INTEGER NOT NULL,
  games JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on week column for faster lookups
CREATE INDEX IF NOT EXISTS weekly_games_week_idx ON weekly_games(week);
