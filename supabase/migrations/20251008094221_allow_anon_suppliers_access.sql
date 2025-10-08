/*
  # Allow anonymous access to suppliers

  1. Changes
    - Add anon policies to allow suppliers table operations without authentication
    - This enables the admin interface to work without auth system
    
  2. Security
    - Using 'anon' role for public access
    - In production, you should add proper authentication
*/

-- Drop existing authenticated-only policies
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Authenticated users can delete suppliers" ON suppliers;

-- Create new policies that allow anon access
CREATE POLICY "Allow all to view suppliers"
  ON suppliers FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert suppliers"
  ON suppliers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update suppliers"
  ON suppliers FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete suppliers"
  ON suppliers FOR DELETE
  USING (true);