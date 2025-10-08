/*
  # Add photo categories support

  1. Changes
    - Add `category` column to photos table
    - Add index for faster filtering by category
    - Default category is 'outros' (others)

  2. Categories
    - making_of: Making Of
    - cerimonia: Cerimônia
    - festa: Festa
    - outros: Outros
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photos' AND column_name = 'category'
  ) THEN
    ALTER TABLE photos ADD COLUMN category text DEFAULT 'outros';
  END IF;
END $$;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_photos_category ON photos(category);
CREATE INDEX IF NOT EXISTS idx_photos_gallery_category ON photos(gallery_id, category);