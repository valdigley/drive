/*
  # Add access_code column to galleries

  1. Changes
    - Add access_code column to galleries table
    - Generate unique access codes for existing galleries
    - Create unique constraint on access_code
    
  2. Notes
    - This allows galleries to be accessed via code instead of just ID
    - Useful for supplier galleries and easy client access
*/

-- Add access_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'access_code'
  ) THEN
    ALTER TABLE galleries ADD COLUMN access_code text;
  END IF;
END $$;

-- Function to generate unique access code (if not exists)
CREATE OR REPLACE FUNCTION generate_gallery_access_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate access codes for existing galleries that don't have one
DO $$
DECLARE
  gallery_record RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  FOR gallery_record IN SELECT id FROM galleries WHERE access_code IS NULL LOOP
    LOOP
      new_code := generate_gallery_access_code();
      SELECT EXISTS(SELECT 1 FROM galleries WHERE access_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    
    UPDATE galleries SET access_code = new_code WHERE id = gallery_record.id;
  END LOOP;
END $$;

-- Create unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'galleries_access_code_key'
  ) THEN
    ALTER TABLE galleries ADD CONSTRAINT galleries_access_code_key UNIQUE (access_code);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_galleries_access_code ON galleries(access_code);
