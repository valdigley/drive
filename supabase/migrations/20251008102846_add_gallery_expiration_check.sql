/*
  # Adicionar Verificação de Expiração nas Políticas RLS

  1. Alterações
    - Atualiza política de SELECT para galerias públicas
    - Bloqueia acesso a galerias expiradas (quando expiration_date < now())
    - Mantém acesso a galerias sem data de expiração
    
  2. Segurança
    - Usuários anônimos só podem ver galerias não expiradas
    - Usuários autenticados (donos) sempre têm acesso às suas galerias
*/

-- Remove política antiga de acesso público
DROP POLICY IF EXISTS "Public can view galleries" ON galleries;
DROP POLICY IF EXISTS "galleries_select" ON galleries;

-- Cria nova política que verifica expiração
CREATE POLICY "galleries_public_select"
  ON galleries
  FOR SELECT
  TO anon
  USING (
    expiration_date IS NULL 
    OR expiration_date > now()
  );

-- Mantém política para usuários autenticados (donos sempre têm acesso)
CREATE POLICY "galleries_authenticated_select"
  ON galleries
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR expiration_date IS NULL 
    OR expiration_date > now()
  );