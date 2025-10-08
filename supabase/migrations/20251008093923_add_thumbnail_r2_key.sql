/*
  # Add thumbnail R2 key column

  1. Changes
    - Add `thumbnail_r2_key` column to photos table to store the R2 key for thumbnails separately
    - This allows proper signed URL generation for thumbnails in private R2 buckets
    
  2. Notes
    - Existing thumbnails that use data URLs or public URLs will continue to work
    - New uploads will store the thumbnail R2 key separately for better URL management
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'thumbnail_r2_key'
  ) THEN
    ALTER TABLE photos ADD COLUMN thumbnail_r2_key text;
  END IF;
END $$;