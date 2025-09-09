/*
  # Sistema de Sessões Compartilhadas

  1. Nova Tabela
    - `user_sessions` - Controla sessões ativas entre sistemas
      - `id` (uuid, primary key)
      - `user_id` (uuid, referência ao usuário)
      - `session_token` (text, único)
      - `is_active` (boolean, default true)
      - `expires_at` (timestamp, 24h de validade)
      - `last_activity` (timestamp)
      - `ip_address` (text, para auditoria)
      - `user_agent` (text, para auditoria)
      - `created_at` e `updated_at` (timestamps)

  2. Segurança
    - Enable RLS na tabela user_sessions
    - Políticas para usuários autenticados gerenciarem suas sessões
    - Política pública para verificação de sessões ativas

  3. Performance
    - Índices para session_token, user_id, expires_at
    - Trigger para atualizar updated_at
*/

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  last_activity timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read active sessions for verification"
  ON user_sessions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND expires_at > now());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions (is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_sessions_updated_at();