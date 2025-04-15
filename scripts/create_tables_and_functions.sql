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

-- Create games table if it doesn't exist
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hometeam TEXT NOT NULL,
  awayteam TEXT NOT NULL,
  time TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  league TEXT NOT NULL,
  closingtime TIMESTAMP WITH TIME ZONE NOT NULL,
  week INTEGER,
  isfinished BOOLEAN DEFAULT FALSE,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on week column for faster lookups
CREATE INDEX IF NOT EXISTS games_week_idx ON games(week);

-- Create function to add or update a game (bypassing RLS)
CREATE OR REPLACE FUNCTION add_or_update_game(
  p_hometeam TEXT,
  p_awayteam TEXT,
  p_time TEXT,
  p_date TIMESTAMP WITH TIME ZONE,
  p_league TEXT,
  p_closingtime TIMESTAMP WITH TIME ZONE,
  p_week INTEGER
) RETURNS UUID AS $$
DECLARE
  v_game_id UUID;
BEGIN
  -- Check if the game already exists
  SELECT id INTO v_game_id
  FROM games
  WHERE hometeam = p_hometeam
    AND awayteam = p_awayteam
    AND date::date = p_date::date;
    
  -- If the game exists, update it
  IF v_game_id IS NOT NULL THEN
    UPDATE games
    SET 
      time = p_time,
      league = p_league,
      closingtime = p_closingtime,
      week = p_week,
      updated_at = NOW()
    WHERE id = v_game_id;
    
    RETURN v_game_id;
  ELSE
    -- If the game doesn't exist, insert it
    INSERT INTO games (
      hometeam, 
      awayteam, 
      time, 
      date, 
      league, 
      closingtime, 
      week, 
      isfinished, 
      created_at, 
      updated_at
    ) VALUES (
      p_hometeam,
      p_awayteam,
      p_time,
      p_date,
      p_league,
      p_closingtime,
      p_week,
      FALSE,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_game_id;
    
    RETURN v_game_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to save weekly games (bypassing RLS)
CREATE OR REPLACE FUNCTION save_weekly_games(
  p_week INTEGER,
  p_games JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if the weekly games already exist
  SELECT id INTO v_id
  FROM weekly_games
  WHERE week = p_week;
    
  -- If the weekly games exist, update them
  IF v_id IS NOT NULL THEN
    UPDATE weekly_games
    SET 
      games = p_games,
      updated_at = NOW()
    WHERE id = v_id;
    
    RETURN v_id;
  ELSE
    -- If the weekly games don't exist, insert them
    INSERT INTO weekly_games (
      week,
      games,
      created_at,
      updated_at
    ) VALUES (
      p_week,
      p_games,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
