/*
  # Allow Anonymous Access to Suppliers

  1. Changes
    - Add policy to allow anonymous users to read suppliers by access_code
    - This enables the system to identify which supplier is accessing via their code

  2. Security
    - Anonymous users can only SELECT (read) suppliers
    - No write access for anonymous users
    - Suppliers are readable to enable access code validation
*/

-- Add policy for anonymous users to view suppliers
CREATE POLICY "Anonymous users can view suppliers"
  ON suppliers
  FOR SELECT
  TO anon
  USING (true);
