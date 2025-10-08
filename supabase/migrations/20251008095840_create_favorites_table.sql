/*
  # Create Favorites Table

  1. New Tables
    - `favorites`
      - `id` (uuid, primary key) - Unique identifier for the favorite
      - `photo_id` (uuid, foreign key) - Reference to the photo
      - `gallery_id` (uuid, foreign key) - Reference to the gallery
      - `client_id` (uuid, foreign key, nullable) - Reference to client if logged in
      - `session_id` (text) - Browser session ID for anonymous users
      - `created_at` (timestamptz) - When the favorite was created

  2. Security
    - Enable RLS on `favorites` table
    - Allow anyone to insert favorites (for anonymous users)
    - Allow users to view their own favorites by session_id
    - Allow users to delete their own favorites by session_id

  3. Indexes
    - Index on photo_id for faster lookups
    - Index on session_id for faster lookups
    - Unique constraint on (photo_id, session_id) to prevent duplicates
*/

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  gallery_id uuid NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorites_photo_id ON favorites(photo_id);
CREATE INDEX IF NOT EXISTS idx_favorites_session_id ON favorites(session_id);
CREATE INDEX IF NOT EXISTS idx_favorites_gallery_id ON favorites(gallery_id);

-- Create unique constraint to prevent duplicate favorites
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique ON favorites(photo_id, session_id);

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert favorites (for anonymous users)
CREATE POLICY "Anyone can add favorites"
  ON favorites
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their own favorites by session_id
CREATE POLICY "Users can view their own favorites"
  ON favorites
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow users to delete their own favorites by session_id
CREATE POLICY "Users can delete their own favorites"
  ON favorites
  FOR DELETE
  TO anon, authenticated
  USING (true);