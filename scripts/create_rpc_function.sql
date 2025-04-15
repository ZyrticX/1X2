-- Create a function to create the weekly_games table (bypassing RLS)
CREATE OR REPLACE FUNCTION create_weekly_games_table() RETURNS boolean AS $$
BEGIN
  -- Check if the table already exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'weekly_games'
  ) THEN
    RETURN true;
  END IF;

  -- Create the weekly_games table
  EXECUTE '
    CREATE TABLE IF NOT EXISTS weekly_games (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      week INTEGER NOT NULL,
      games JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  ';
  
  -- Create an index on the week column
  EXECUTE '
    CREATE INDEX IF NOT EXISTS weekly_games_week_idx ON weekly_games(week)
  ';
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating weekly_games table: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to create the games table (bypassing RLS)
CREATE OR REPLACE FUNCTION create_games_table() RETURNS boolean AS $$
BEGIN
  -- Check if the table already exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'games'
  ) THEN
    RETURN true;
  END IF;

  -- Create the games table
  EXECUTE '
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
    )
  ';
  
  -- Create an index on the week column
  EXECUTE '
    CREATE INDEX IF NOT EXISTS games_week_idx ON games(week)
  ';
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating games table: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
