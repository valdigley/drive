/*
  # Add gallery type to distinguish supplier and client galleries

  1. Changes
    - Add gallery_type column to galleries table
    - Set default type as 'client'
    - Update existing galleries to be 'client' type
    - Supplier galleries will have 'supplier' type
    
  2. Security
    - No policy changes needed
*/

-- Add gallery_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'gallery_type'
  ) THEN
    ALTER TABLE galleries ADD COLUMN gallery_type text DEFAULT 'client' CHECK (gallery_type IN ('client', 'supplier'));
  END IF;
END $$;

-- Update existing galleries to be 'client' type by default
UPDATE galleries SET gallery_type = 'client' WHERE gallery_type IS NULL;

-- Update the trigger function to set gallery_type as 'supplier' for supplier galleries
CREATE OR REPLACE FUNCTION create_supplier_gallery()
RETURNS TRIGGER AS $$
DECLARE
  new_gallery_id uuid;
  new_access_code text;
  code_exists boolean;
BEGIN
  -- Generate unique access code
  LOOP
    new_access_code := generate_supplier_access_code();
    SELECT EXISTS(SELECT 1 FROM suppliers WHERE access_code = new_access_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Create a gallery for this supplier with type 'supplier'
  INSERT INTO galleries (
    name,
    client_name,
    access_code,
    created_date,
    expiration_date,
    is_active,
    gallery_type
  ) VALUES (
    'Galeria de ' || NEW.name,
    NEW.name,
    new_access_code,
    now(),
    now() + interval '10 years',
    true,
    'supplier'
  ) RETURNING id INTO new_gallery_id;

  -- Update the supplier with gallery_id and access_code
  NEW.gallery_id := new_gallery_id;
  NEW.access_code := new_access_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_galleries_type ON galleries(gallery_type);
