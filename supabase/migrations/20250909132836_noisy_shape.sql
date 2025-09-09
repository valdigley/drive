/*
  # Update logo URL in business_info

  1. Updates
    - Set the logo_url to the provided Supabase storage URL
    - Ensures the business_info record exists
*/

-- Insert or update business_info with the new logo URL
INSERT INTO business_info (
  id,
  name,
  logo_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'DriVal',
  'https://bdzvqewxciiozkppwsyk.supabase.co/storage/v1/object/public/photos/logos/DriVal.png',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  logo_url = 'https://bdzvqewxciiozkppwsyk.supabase.co/storage/v1/object/public/photos/logos/DriVal.png',
  updated_at = now();

-- If no record exists, update any existing record
UPDATE business_info 
SET 
  logo_url = 'https://bdzvqewxciiozkppwsyk.supabase.co/storage/v1/object/public/photos/logos/DriVal.png',
  updated_at = now()
WHERE id IS NOT NULL;

-- If still no record, insert a new one
INSERT INTO business_info (
  id,
  name,
  logo_url,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'DriVal',
  'https://bdzvqewxciiozkppwsyk.supabase.co/storage/v1/object/public/photos/logos/DriVal.png',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM business_info LIMIT 1);