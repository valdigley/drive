import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SessionData {
  user_id: string;
  session_token: string;
  expires_at: string;
  last_activity: string;
}

export function useSessionVerification() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      // Para desenvolvimento local, sempre autenticar
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Modo desenvolvimento - autenticação automática');
        
        // Verificar se há token de teste no localStorage
        const testToken = localStorage.getItem('shared_session_token');
        if (testToken) {
          console.log('🧪 Token de teste encontrado, verificando no banco...');
          
          try {
            const { data: sessionRecord, error } = await supabase
              .from('user_sessions')
              .select('*')
              .eq('session_token', testToken)
              .eq('is_active', true)
              .gt('expires_at', new Date().toISOString())
              .single();

            if (!error && sessionRecord) {
              console.log('✅ Sessão de teste válida encontrada:', sessionRecord);
              setSessionData(sessionRecord);
              setIsAuthenticated(true);
              setIsVerifying(false);
              return;
            } else {
              console.log('❌ Sessão de teste inválida, removendo...');
              localStorage.removeItem('shared_session_token');
            }
          } catch (error) {
            console.log('❌ Erro ao verificar sessão de teste:', error);
            localStorage.removeItem('shared_session_token');
          }
        }
        
        // Em desenvolvimento, permitir acesso sem sessão válida
        console.log('🔧 Permitindo acesso em modo desenvolvimento');
        setIsAuthenticated(true);
        setIsVerifying(false);
        return;
      }

      // Verificar se há um token de sessão compartilhada nos parâmetros da URL ou localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const sessionToken = urlParams.get('session_token') || localStorage.getItem('shared_session_token');

      if (!sessionToken) {
        console.log('ℹ️ Nenhum token de sessão encontrado');
        setIsAuthenticated(false);
        setIsVerifying(false);
        return;
      }

      console.log('🔍 Verificando token de sessão compartilhada...');

      // Verificar se a sessão é válida na tabela user_sessions
      const { data: sessionRecord, error: sessionCheckError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionCheckError || !sessionRecord) {
        console.log('❌ Sessão inválida ou expirada');
        localStorage.removeItem('shared_session_token');
        setIsAuthenticated(false);
        setIsVerifying(false);
        return;
      }

      console.log('✅ Sessão válida encontrada');

      // Atualizar última atividade
      await supabase
        .from('user_sessions')
        .update({ 
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionRecord.id);

      // Salvar token no localStorage para próximas visitas
      localStorage.setItem('shared_session_token', sessionToken);
      
      setSessionData(sessionRecord);
      setIsAuthenticated(true);
      
      // Remover token da URL se estiver presente
      if (urlParams.get('session_token')) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('session_token');
        window.history.replaceState({}, '', newUrl.toString());
      }

    } catch (error) {
      console.error('❌ Erro na verificação de sessão:', error);
      setError(error instanceof Error ? error.message : 'Erro na verificação de sessão');
      setIsAuthenticated(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const createSharedSession = async (userId: string): Promise<string | null> => {
    try {
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');

      const userAgent = navigator.userAgent;

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

      if (error) throw error;

      console.log('✅ Sessão compartilhada criada:', sessionToken);
      return sessionToken;

    } catch (error) {
      console.error('❌ Erro ao criar sessão compartilhada:', error);
      return null;
    }
  };

  const invalidateSession = async (sessionToken?: string) => {
    try {
      const tokenToInvalidate = sessionToken || localStorage.getItem('shared_session_token');
      
      if (tokenToInvalidate) {
        await supabase
          .from('user_sessions')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('session_token', tokenToInvalidate);

        localStorage.removeItem('shared_session_token');
      }

      setIsAuthenticated(false);
      setSessionData(null);
    } catch (error) {
      console.error('❌ Erro ao invalidar sessão:', error);
    }
  };

  return {
    isVerifying,
    isAuthenticated,
    sessionData,
    error,
    createSharedSession,
    invalidateSession,
    refreshSession: verifySession
  };
}