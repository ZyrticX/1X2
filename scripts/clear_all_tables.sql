-- מחיקת כל הנתונים מטבלת המשתמשים
TRUNCATE TABLE users CASCADE;

-- מחיקת כל הנתונים מטבלת הניחושים
TRUNCATE TABLE predictions CASCADE;

-- מחיקת כל הנתונים מטבלת תוצאות המשחקים
TRUNCATE TABLE game_results CASCADE;

-- מחיקת כל הנתונים מטבלת המשחקים
TRUNCATE TABLE games CASCADE;

-- מחיקת כל הנתונים מטבלת המשחקים השבועיים
TRUNCATE TABLE weekly_games CASCADE;

-- יצירת פונקציית RPC למחיקת כל הנתונים
CREATE OR REPLACE FUNCTION clear_all_tables() RETURNS boolean AS $$
BEGIN
  -- מחיקת כל הנתונים מטבלת המשתמשים
  DELETE FROM users WHERE id != '00000000-0000-0000-0000-000000000000';
  
  -- מחיקת כל הנתונים מטבלת הניחושים
  DELETE FROM predictions WHERE id != '00000000-0000-0000-0000-000000000000';
  
  -- מחיקת כל הנתונים מטבלת תוצאות המשחקים
  DELETE FROM game_results WHERE id != '00000000-0000-0000-0000-000000000000';
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error clearing tables: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
