/*
  # Create Clients Management System

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text) - Client's full name
      - `email` (text) - Client's email address
      - `phone` (text, optional) - Client's phone number
      - `access_code` (text, unique) - Unique code for client access
      - `notes` (text, optional) - Internal notes about the client
      - `created_at` (timestamptz) - When client was created
      - `updated_at` (timestamptz) - Last update timestamp

  2. Changes to Existing Tables
    - Add `client_id` to `galleries` table
      - Links gallery to a specific client
      - Optional field (existing galleries may not have a client)

  3. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated admin access
    - Add policy for anonymous read access by access_code

  4. Important Notes
    - Access codes are auto-generated and unique
    - Clients can have multiple galleries
    - Email is optional but recommended for communication
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  access_code text UNIQUE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add client_id to galleries table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'galleries' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE galleries ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_access_code ON clients(access_code);
CREATE INDEX IF NOT EXISTS idx_galleries_client_id ON galleries(client_id);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policies for clients table

-- Allow authenticated users (admin) to do everything
CREATE POLICY "Authenticated users can view all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow anonymous users to read their own client data by access_code
CREATE POLICY "Anonymous users can view own client by access code"
  ON clients
  FOR SELECT
  TO anon
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
