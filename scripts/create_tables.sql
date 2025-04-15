-- סקריפט ליצירת הטבלאות הנדרשות בסופאבייס

-- יצירת טבלת games אם היא לא קיימת
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hometeam TEXT NOT NULL,
  awayteam TEXT NOT NULL,
  time TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  league TEXT NOT NULL,
  closingtime TIMESTAMP WITH TIME ZONE NOT NULL,
  week INTEGER DEFAULT 1,
  isfinished BOOLEAN DEFAULT FALSE,
  islocked BOOLEAN DEFAULT FALSE,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת weekly_games אם היא לא קיימת
CREATE TABLE IF NOT EXISTS weekly_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week INTEGER NOT NULL,
  games JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת users אם היא לא קיימת
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  playercode TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  city TEXT,
  status TEXT DEFAULT 'active',
  points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  last_week_points INTEGER DEFAULT 0,
  trend TEXT,
  success_rate FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת predictions אם היא לא קיימת
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userid UUID NOT NULL,
  gameid UUID NOT NULL,
  prediction TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS games_week_idx ON games(week);
CREATE INDEX IF NOT EXISTS weekly_games_week_idx ON weekly_games(week);
CREATE INDEX IF NOT EXISTS predictions_userid_idx ON predictions(userid);
CREATE INDEX IF NOT EXISTS predictions_gameid_idx ON predictions(gameid);
CREATE INDEX IF NOT EXISTS users_playercode_idx ON users(playercode);
