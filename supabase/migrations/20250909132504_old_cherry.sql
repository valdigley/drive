/*
  # Add logo URL to business info

  1. Changes
    - Add `logo_url` column to `business_info` table
    - Set default logo URL for the camera aperture icon
  
  2. Security
    - Maintains existing RLS policies
*/

-- Add logo_url column to business_info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_info' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE business_info ADD COLUMN logo_url text;
  END IF;
END $$;

-- Insert default business info with logo if no record exists
INSERT INTO business_info (
  name, 
  logo_url,
  whatsapp,
  email,
  address,
  city,
  state
) 
SELECT 
  'Triagem',
  'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
  '85999991507',
  'contato@studio.com',
  'Rua General Demétrio, 545, Triângulo do Marco',
  'Marco',
  'CE'
WHERE NOT EXISTS (SELECT 1 FROM business_info LIMIT 1);