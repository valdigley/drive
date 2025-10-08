/*
  # Allow anonymous access to photo_suppliers

  1. Changes
    - Add anon policies to allow photo_suppliers table operations without authentication
    - This enables the admin interface to tag photos with suppliers
    
  2. Security
    - Using 'anon' role for public access
    - In production, you should add proper authentication
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can view photo tags" ON photo_suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert photo tags" ON photo_suppliers;
DROP POLICY IF EXISTS "Authenticated users can update photo tags" ON photo_suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete photo tags" ON photo_suppliers;

-- Create new policies that allow anon access
CREATE POLICY "Allow all to view photo tags"
  ON photo_suppliers FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert photo tags"
  ON photo_suppliers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update photo tags"
  ON photo_suppliers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete photo tags"
  ON photo_suppliers FOR DELETE
  USING (true);