-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS add_or_update_game;

-- Create the function with the correct parameters
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

-- Create a simpler version that returns void if the UUID version doesn't work
CREATE OR REPLACE FUNCTION add_or_update_game_void(
  p_hometeam TEXT,
  p_awayteam TEXT,
  p_time TEXT,
  p_date TIMESTAMP WITH TIME ZONE,
  p_league TEXT,
  p_closingtime TIMESTAMP WITH TIME ZONE,
  p_week INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Check if the game already exists
  DECLARE
    v_game_id UUID;
  BEGIN
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
      );
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
