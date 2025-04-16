-- פונקציה להוספת משחק חדש (עוקפת את מדיניות RLS)
CREATE OR REPLACE FUNCTION add_game(
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה למחיקת משחקים לפי שבוע (עוקפת את מדיניות RLS)
CREATE OR REPLACE FUNCTION delete_games_by_week(
  week_number INTEGER
) RETURNS VOID AS $$
BEGIN
  DELETE FROM games
  WHERE week = week_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה למחיקת משחק לפי מזהה (עוקפת את מדיניות RLS)
CREATE OR REPLACE FUNCTION delete_game_by_id(
  game_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM games
  WHERE id = game_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
