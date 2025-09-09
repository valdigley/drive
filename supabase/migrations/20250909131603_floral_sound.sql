/*
  # Remove user_sessions table and related functionality

  1. Changes
    - Drop user_sessions table
    - Drop related trigger function
    - Clean up unused session management code

  Since we're using Supabase Authentication, the user_sessions table
  is redundant and not needed anymore.
*/

-- Drop the user_sessions table
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_user_sessions_updated_at() CASCADE;