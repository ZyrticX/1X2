-- Add the week column to games table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'games' AND column_name = 'week'
  ) THEN
    ALTER TABLE games ADD COLUMN week INTEGER;
  END IF;
END $$;

-- Create a function to refresh schema cache if it doesn't exist
CREATE OR REPLACE FUNCTION refresh_schema_cache() RETURNS void AS $$
BEGIN
  -- This is a placeholder function that doesn't actually do anything
  -- In a real environment, you would need admin privileges to refresh the schema cache
  RETURN;
END;
$$ LANGUAGE plpgsql;
