/*
  # Add Supplier Gallery Support

  1. Changes
    - Add gallery_id to suppliers table to link each supplier to their personal gallery
    - Add access_code to suppliers table for gallery access
    - Add foreign key constraint to galleries table
    
  2. New Features
    - Each supplier gets a unique gallery when created
    - Suppliers can access their gallery to see photos they were tagged in
    - Gallery name format: "Galeria de [Supplier Name]"
*/

-- Add gallery_id and access_code columns to suppliers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'gallery_id'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN gallery_id uuid REFERENCES galleries(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'suppliers' AND column_name = 'access_code'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN access_code text UNIQUE;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_gallery ON suppliers(gallery_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_access_code ON suppliers(access_code);

-- Function to generate unique access code
CREATE OR REPLACE FUNCTION generate_supplier_access_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create gallery for supplier
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

  -- Create a gallery for this supplier
  INSERT INTO galleries (
    name,
    client_name,
    access_code,
    created_date,
    expiration_date,
    is_active
  ) VALUES (
    'Galeria de ' || NEW.name,
    NEW.name,
    new_access_code,
    now(),
    now() + interval '10 years', -- Long expiration for supplier galleries
    true
  ) RETURNING id INTO new_gallery_id;

  -- Update the supplier with gallery_id and access_code
  NEW.gallery_id := new_gallery_id;
  NEW.access_code := new_access_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create gallery when supplier is created
DROP TRIGGER IF EXISTS create_supplier_gallery_trigger ON suppliers;
CREATE TRIGGER create_supplier_gallery_trigger
  BEFORE INSERT ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION create_supplier_gallery();
