/*
  # Create increment_download_count RPC function

  1. New Functions
    - `increment_download_count` - RPC function to safely increment download count for galleries
  
  2. Security
    - Function is accessible to all users (anon and authenticated)
    - Uses atomic increment to prevent race conditions
  
  3. Notes
    - Matches the existing increment_access_count pattern
    - Returns the updated download count
*/

CREATE OR REPLACE FUNCTION increment_download_count(gallery_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE galleries 
  SET download_count = download_count + 1,
      updated_at = now()
  WHERE id = gallery_id;
  
  SELECT download_count INTO new_count
  FROM galleries 
  WHERE id = gallery_id;
  
  RETURN COALESCE(new_count, 0);
END;
$$;