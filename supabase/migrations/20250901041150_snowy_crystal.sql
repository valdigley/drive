/*
  # Schema para Sistema de Galerias de Fotos

  1. Novas Tabelas
    - `galleries`
      - `id` (uuid, primary key)
      - `name` (text, nome da galeria)
      - `client_name` (text, nome do cliente)
      - `description` (text, descrição opcional)
      - `cover_photo_id` (text, ID da foto de capa)
      - `created_date` (timestamp, data de criação)
      - `expiration_date` (timestamp, data de expiração)
      - `password` (text, senha opcional)
      - `access_count` (integer, contador de acessos)
      - `download_count` (integer, contador de downloads)
      - `is_active` (boolean, status ativo)
      - `settings` (jsonb, configurações da galeria)
      - `user_id` (uuid, referência ao usuário autenticado)

    - `photos`
      - `id` (uuid, primary key)
      - `gallery_id` (uuid, referência à galeria)
      - `url` (text, URL da foto)
      - `thumbnail` (text, URL da miniatura)
      - `filename` (text, nome do arquivo)
      - `size` (bigint, tamanho em bytes)
      - `upload_date` (timestamp, data de upload)
      - `r2_key` (text, chave no R2)
      - `metadata` (jsonb, metadados da foto)

    - `client_sessions`
      - `id` (uuid, primary key)
      - `gallery_id` (uuid, referência à galeria)
      - `session_id` (text, ID da sessão)
      - `accessed_at` (timestamp, data de acesso)
      - `favorites` (text[], IDs das fotos favoritas)
      - `selected_photos` (text[], IDs das fotos selecionadas)
      - `downloads` (integer, contador de downloads)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados acessarem apenas seus dados
    - Políticas para acesso público às galerias com senha
*/

-- Criar tabela de galerias
CREATE TABLE IF NOT EXISTS galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_name text NOT NULL,
  description text,
  cover_photo_id text,
  created_date timestamptz DEFAULT now(),
  expiration_date timestamptz,
  password text,
  access_count integer DEFAULT 0,
  download_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{
    "allowDownload": true,
    "allowComments": false,
    "watermark": true,
    "downloadQuality": "print"
  }'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de fotos
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
  url text NOT NULL,
  thumbnail text NOT NULL,
  filename text NOT NULL,
  size bigint NOT NULL,
  upload_date timestamptz DEFAULT now(),
  r2_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de sessões de clientes
CREATE TABLE IF NOT EXISTS client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  accessed_at timestamptz DEFAULT now(),
  favorites text[] DEFAULT '{}',
  selected_photos text[] DEFAULT '{}',
  downloads integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para galerias
CREATE POLICY "Users can manage their own galleries"
  ON galleries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view galleries"
  ON galleries
  FOR SELECT
  TO anon
  USING (true);

-- Políticas para fotos
CREATE POLICY "Users can manage photos in their galleries"
  ON photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM galleries 
      WHERE galleries.id = photos.gallery_id 
      AND galleries.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view photos"
  ON photos
  FOR SELECT
  TO anon
  USING (true);

-- Políticas para sessões de clientes
CREATE POLICY "Anyone can manage client sessions"
  ON client_sessions
  FOR ALL
  TO anon, authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_galleries_user_id ON galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_galleries_created_date ON galleries(created_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_gallery_id ON photos(gallery_id);
CREATE INDEX IF NOT EXISTS idx_photos_upload_date ON photos(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_sessions_gallery_id ON client_sessions(gallery_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_session_id ON client_sessions(session_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_galleries_updated_at'
  ) THEN
    CREATE TRIGGER update_galleries_updated_at
      BEFORE UPDATE ON galleries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_client_sessions_updated_at'
  ) THEN
    CREATE TRIGGER update_client_sessions_updated_at
      BEFORE UPDATE ON client_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;