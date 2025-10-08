/*
  # Add Date, Location and Client Link to Galleries

  1. Changes to Galleries Table
    - Add `event_date` (date) - Data do evento/sessão
    - Add `location` (text) - Local do evento/sessão
    - Note: `client_id` already exists from previous migration
    
  2. Important Notes
    - event_date is nullable (galerias existentes podem não ter data)
    - location is nullable (galerias existentes podem não ter local)
    - client_id remains nullable (nem todas as galerias precisam ter cliente vinculado)
*/

-- Add event_date column to galleries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE galleries ADD COLUMN event_date date;
  END IF;
END $$;

-- Add location column to galleries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'location'
  ) THEN
    ALTER TABLE galleries ADD COLUMN location text;
  END IF;
END $$;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_galleries_event_date ON galleries(event_date);

-- Create index for client_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_galleries_client_id ON galleries(client_id);
