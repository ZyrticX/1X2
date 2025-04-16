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

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
 id TEXT PRIMARY KEY,
 value TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to reset weekly leaderboard
CREATE OR REPLACE FUNCTION reset_weekly_leaderboard() RETURNS BOOLEAN AS $$
BEGIN
  -- Reset weekly points for all users
  UPDATE users
  SET 
    last_week_points = points,
    weekly_points = 0,
    weekly_correct_predictions = 0,
    weekly_total_predictions = 0,
    trend = 'same',
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
