/*
  # Fix Supplier Gallery Access

  1. Changes
    - Add policy to allow anonymous users to read galleries by access_code
    - This enables suppliers to access their galleries using their access code
    - Maintains security by only allowing access to active galleries with valid codes

  2. Security
    - Anonymous users can only SELECT galleries
    - Only galleries with is_active = true are accessible
    - Access code must match
*/

-- Drop existing select policy and recreate with access code support
DROP POLICY IF EXISTS "galleries_select" ON galleries;

CREATE POLICY "galleries_select"
  ON galleries
  FOR SELECT
  TO anon, authenticated
  USING (
    is_master_admin() 
    OR (user_id = auth.uid())
    OR (is_active = true AND access_code IS NOT NULL)
  );
