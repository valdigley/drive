/*
  # Allow Anonymous Access to Photo Suppliers

  1. Changes
    - Add policy to allow anonymous users to read photo_suppliers
    - This enables suppliers to see which photos are tagged for them when accessing via access code

  2. Security
    - Anonymous users can only SELECT (read) photo_suppliers
    - No write access for anonymous users
*/

-- Add policy for anonymous users to view photo tags
CREATE POLICY "Anonymous users can view photo tags"
  ON photo_suppliers
  FOR SELECT
  TO anon
  USING (true);
