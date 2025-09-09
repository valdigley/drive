import { supabase } from '../lib/supabase';

export async function createSharedSession(userId: string): Promise<string | null> {
  try {
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let ipAddress = 'localhost';
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      ipAddress = data.ip;
    } catch (error) {
      console.warn('Não foi possível obter IP externo, usando localhost');
    }

    const userAgent = navigator.userAgent;

    // Invalidar sessões antigas do mesmo usuário
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (updateError) {
      console.warn('Aviso ao invalidar sessões antigas:', updateError);
    }

    // Criar nova sessão
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro detalhado ao criar sessão:', error);
      throw error;
    }

    console.log('✅ Sessão compartilhada criada:', {
      token: sessionToken,
      userId,
      expiresAt: expiresAt.toISOString(),
      ipAddress,
      data
    });
    
    return sessionToken;

  } catch (error) {
    console.error('❌ Erro ao criar sessão compartilhada:', error);
    return null;
  }
}

export function generateSystemUrl(sessionToken: string, systemUrl: string): string {
  const url = new URL(systemUrl);
  url.searchParams.set('session_token', sessionToken);
  return url.toString();
}

/**
 * Função genérica para qualquer sistema
 */
export function generateSystemUrlByName(sessionToken: string, systemName: string): string | null {
  const systemUrls: Record<string, string> = {
    'triagem': 'https://triagem.fotografo.site',
    'contrato': 'https://contrato.fotografo.site',
    'drive': 'https://drive.fotografo.site',
    'formatura': 'https://formatura.fotografo.site',
    // Para desenvolvimento local
    'drive-local': 'http://localhost:5173'
  };
  
  const baseUrl = systemUrls[systemName] || systemUrls[`${systemName}-local`];
  if (!baseUrl) {
    console.error('Sistema não encontrado:', systemName);
    return null;
  }
  
  const url = new URL(baseUrl);
  url.searchParams.set('session_token', sessionToken);
  return url.toString();
}

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    if (error) throw error;

    const cleanedCount = data?.length || 0;
    console.log(`🧹 ${cleanedCount} sessões expiradas limpas`);
    return cleanedCount;

  } catch (error) {
    console.error('❌ Erro ao limpar sessões expiradas:', error);
    return 0;
  }
}