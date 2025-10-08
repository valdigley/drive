/*
  # Create Suppliers and Photo Tagging System

  1. New Tables
    - `suppliers`
      - `id` (uuid, primary key)
      - `name` (text) - Nome do fornecedor
      - `email` (text) - Email para acesso
      - `phone` (text) - Telefone
      - `category` (text) - Categoria: fotografia, buffet, decoração, etc
      - `password_hash` (text) - Senha para acesso ao painel
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `photo_suppliers`
      - `id` (uuid, primary key)
      - `photo_id` (uuid, foreign key to photos)
      - `supplier_id` (uuid, foreign key to suppliers)
      - `gallery_id` (uuid, foreign key to galleries) - Para saber qual evento
      - `tagged_at` (timestamptz) - Quando foi marcado
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Suppliers can view their own data and tagged photos
    - Admins can manage suppliers and tag photos
    - Clients cannot access supplier data

  3. Indexes
    - Index on supplier email for login
    - Index on photo_suppliers (supplier_id, gallery_id) for fast queries
*/

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  category text NOT NULL,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photo_suppliers junction table
CREATE TABLE IF NOT EXISTS photo_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  gallery_id uuid NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  tagged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, supplier_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);
CREATE INDEX IF NOT EXISTS idx_photo_suppliers_supplier ON photo_suppliers(supplier_id, gallery_id);
CREATE INDEX IF NOT EXISTS idx_photo_suppliers_photo ON photo_suppliers(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_suppliers_gallery ON photo_suppliers(gallery_id);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_suppliers ENABLE ROW LEVEL SECURITY;

-- Suppliers policies
CREATE POLICY "Suppliers can view own data"
  ON suppliers FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

CREATE POLICY "Admins can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

CREATE POLICY "Admins can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

CREATE POLICY "Admins can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

-- Photo suppliers policies
CREATE POLICY "Suppliers can view their tagged photos"
  ON photo_suppliers FOR SELECT
  TO authenticated
  USING (auth.uid()::text = supplier_id::text);

CREATE POLICY "Admins can view all photo tags"
  ON photo_suppliers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

CREATE POLICY "Admins can insert photo tags"
  ON photo_suppliers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

CREATE POLICY "Admins can delete photo tags"
  ON photo_suppliers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'valdigley.fotografia@gmail.com'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for suppliers updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
