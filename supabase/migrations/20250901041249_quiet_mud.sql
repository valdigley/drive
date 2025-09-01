/*
  # Função para incrementar contador de acessos

  1. Funções
    - `increment_access_count` - Incrementa o contador de acessos de uma galeria
*/

-- Função para incrementar contador de acessos
CREATE OR REPLACE FUNCTION increment_access_count(gallery_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE galleries 
  SET access_count = access_count + 1 
  WHERE id = gallery_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;