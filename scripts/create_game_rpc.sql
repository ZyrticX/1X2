-- Create a function to add or update a game that bypasses RLS
CREATE OR REPLACE FUNCTION add_or_update_game(
  p_hometeam TEXT,
  p_awayteam TEXT,
  p_time TEXT,
  p_date TIMESTAMP WITH TIME ZONE,
  p_league TEXT,
  p_closingtime TIMESTAMP WITH TIME ZONE,
  p_week INTEGER
) RETURNS VOID AS $$
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
  -- Otherwise, insert a new game
  ELSE
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
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disable RLS for the games table for admin users
CREATE OR REPLACE FUNCTION disable_rls_for_games() RETURNS VOID AS $$
BEGIN
  ALTER TABLE games DISABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
