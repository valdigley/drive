import React, { useState } from 'react';
import { Plus, Camera, Users, Download, Eye, Settings } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { CreateGalleryModal } from './CreateGalleryModal';
import { GalleryCard } from './GalleryCard';
import { StatsCard } from './StatsCard';
import { StorageStatusCard } from './StorageStatusCard';
import { galleryService } from '../../services/galleryService';
import { storageService, StorageStats } from '../../services/storageService';

// Valid UUID for testing purposes
const TEST_USER_UUID = '00000000-0000-4000-8000-000000000001';

interface AdminDashboardProps {
  onManageGallery?: (galleryId: string) => void;
}

export function AdminDashboard({ onManageGallery }: AdminDashboardProps) {
  const { state, dispatch } = useAppContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingGalleries, setLoadingGalleries] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [testingAuth, setTestingAuth] = useState(false);

  // Reload galleries with photos when component mounts
  React.useEffect(() => {
    const loadGalleriesWithPhotos = async () => {
      setLoadingGalleries(true);
      try {
        const galleries = await galleryService.getAllGalleries();
        
        // Load photos for each gallery
        const galleriesWithPhotos = await Promise.all(
          galleries.map(async (gallery) => {
            const photos = await galleryService.getGalleryPhotos(gallery.id);
            return { ...gallery, photos };
          })
        );
        
        dispatch({ type: 'SET_GALLERIES', payload: galleriesWithPhotos });
        
        const stats = await galleryService.getAdminStats();
        dispatch({ type: 'SET_ADMIN_STATS', payload: stats });
        
        // Load storage stats
        const storage = await storageService.getStorageStats();
        setStorageStats(storage);
      } catch (error) {
        console.error('Error loading galleries:', error);
      } finally {
        setLoadingGalleries(false);
      }
    };

    loadGalleriesWithPhotos();
  }, [dispatch]);

  const handleCreateSampleData = () => {
    alert('Para criar dados de exemplo, use o painel do Supabase para inserir dados de teste.');
  };

  const handleTestAuthentication = async () => {
    setTestingAuth(true);
    console.log('🧪 Iniciando teste de autenticação...');
    
    try {
      console.log('📡 Testando conexão com Supabase...');
      
      // Testar conexão direta com Supabase
      const { supabase } = await import('../../lib/supabase');
      
      // Usar upsert para garantir que o usuário existe
      console.log('👤 Garantindo que usuário de teste existe...');
      const { data: upsertedUser, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: TEST_USER_UUID,
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      if (upsertError) {
        console.error('❌ Erro ao garantir usuário de teste:', upsertError);
        alert(`Erro ao garantir usuário de teste:\n${upsertError.message}`);
        return;
      }
      
      // Verificar se o usuário foi realmente criado/recuperado
      if (!upsertedUser) {
        console.error('❌ Usuário não foi criado ou recuperado após upsert');
        alert(`❌ Falha ao criar usuário de teste!\n\nO usuário não foi criado mesmo sem erro direto.\n\nVerifique as políticas RLS na tabela 'users':\n1. A role 'anon' precisa ter permissão INSERT\n2. A role 'anon' precisa ter permissão SELECT\n\nVá para Supabase Dashboard > Authentication > Policies\ne configure as políticas adequadas para a tabela 'users'.`);
        return;
      } else {
        console.log('✅ Usuário de teste garantido:', upsertedUser);
      }
      
      // Criar sessão de teste diretamente
      const sessionToken = `test_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      console.log('🔑 Criando sessão com token:', sessionToken);
      
      // Primeiro, invalidar sessões antigas de teste
      console.log('🧹 Limpando sessões antigas de teste...');
      const { error: cleanupError } = await supabase
        .from('user_sessions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', TEST_USER_UUID)
        .eq('is_active', true);
      
      if (cleanupError) {
        console.warn('⚠️ Aviso ao limpar sessões antigas:', cleanupError);
      }
      
      // Preparar dados da sessão
      const sessionData = {
        user_id: TEST_USER_UUID,
        session_token: sessionToken,
        is_active: true,
        expires_at: expiresAt.toISOString(),
        ip_address: 'localhost',
        user_agent: navigator.userAgent,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📝 Dados da sessão a serem inseridos:', sessionData);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .insert(sessionData)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao inserir sessão:', error);
        console.error('❌ Detalhes completos do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Tentar inserção sem RLS (usando service role se disponível)
        console.log('🔄 Tentando inserção alternativa...');
        
        try {
          // Criar um cliente temporário sem RLS para teste
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
          
          if (supabaseServiceKey) {
            console.log('🔑 Usando service role key para bypass RLS...');
            const adminClient = createClient(supabaseUrl, supabaseServiceKey);
            
            const { data: adminData, error: adminError } = await adminClient
              .from('user_sessions')
              .insert(sessionData)
              .select()
              .single();
            
            if (adminError) {
              console.error('❌ Erro mesmo com service role:', adminError);
              alert(`❌ Erro ao criar sessão:\n${error.message}\n\nErro com service role:\n${adminError.message}\n\nVerifique:\n1. Se a tabela user_sessions existe\n2. Se as políticas RLS estão corretas\n3. Se o service role key está configurado`);
            } else {
              console.log('✅ Sessão criada com service role:', adminData);
              localStorage.setItem('shared_session_token', sessionToken);
              alert(`✅ Sessão criada com sucesso usando service role!\n\nToken: ${sessionToken}\nUser ID: ${TEST_USER_UUID}\nExpira em: ${expiresAt.toLocaleString()}`);
            }
          } else {
            alert(`❌ Erro ao criar sessão:\n${error.message}\n\nSugestões:\n1. Verifique se a tabela user_sessions existe no Supabase\n2. Configure as políticas RLS para permitir INSERT\n3. Configure VITE_SUPABASE_SERVICE_ROLE_KEY no .env`);
          }
        } catch (fallbackError) {
          console.error('❌ Erro na inserção alternativa:', fallbackError);
          alert(`❌ Erro ao criar sessão:\n${error.message}\n\nErro alternativo:\n${fallbackError instanceof Error ? fallbackError.message : 'Erro desconhecido'}`);
        }
      } else {
        console.log('✅ Sessão criada com sucesso:', data);
        
        // Verificar se a sessão foi realmente criada
        console.log('🔍 Verificando sessão criada...');
        const { data: verifyData, error: verifyError } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .single();
        
        if (verifyError) {
          console.error('❌ Erro ao verificar sessão:', verifyError);
          alert(`❌ Sessão criada mas não foi possível verificar:\n${verifyError.message}`);
        } else {
          console.log('✅ Sessão verificada:', verifyData);
          
          // Salvar token no localStorage para teste
          localStorage.setItem('shared_session_token', sessionToken);
          
          alert(`✅ Sessão criada e verificada com sucesso!\n\nToken: ${sessionToken}\nUser ID: ${TEST_USER_UUID}\nExpira em: ${expiresAt.toLocaleString()}\n\nToken salvo no localStorage para teste.\n\nVerifique a tabela user_sessions no Supabase!`);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert(`❌ Erro no teste:\n${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique a conexão com o Supabase.`);
    } finally {
      setTestingAuth(false);
    }
  };

  const handleClearTestSessions = async () => {
    try {
      console.log('🧹 Limpando todas as sessões de teste...');
      const { supabase } = await import('../../lib/supabase');
      
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', TEST_USER_UUID);
      
      if (error) {
        console.error('❌ Erro ao limpar sessões:', error);
        alert(`Erro ao limpar sessões:\n${error.message}`);
      } else {
        console.log('✅ Sessões de teste limpas');
        localStorage.removeItem('shared_session_token');
        alert('✅ Todas as sessões de teste foram removidas!');
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert(`❌ Erro ao limpar sessões:\n${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTestingAuth(false);
    }
  };
  const { galleries, adminStats } = state;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Storage Status Bar */}
      {storageStats && <StorageStatusCard storageStats={storageStats} />}
      
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Gerencie suas galerias e fotos</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2"
              >
                <Plus size={20} />
                Nova Galeria
              </Button>
              
              <Button 
                onClick={handleTestAuthentication}
                variant="secondary"
                disabled={testingAuth}
                className="flex items-center gap-2"
              >
                {testingAuth ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Settings size={20} />
                )}
                Testar Auth
              </Button>
              
              <Button 
                onClick={handleClearTestSessions}
                variant="ghost"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                🧹 Limpar Testes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total de Galerias"
            value={adminStats.totalGalleries}
            icon={<Camera className="text-blue-600" size={24} />}
            trend="+12%"
          />
          
          <StatsCard
            title="Fotos Compartilhadas"
            value={adminStats.totalPhotos}
            icon={<Camera className="text-green-600" size={24} />}
            trend="+8%"
          />
          
          <StatsCard
            title="Visualizações"
            value={adminStats.totalViews}
            icon={<Eye className="text-purple-600" size={24} />}
            trend="+23%"
          />
          
          <StatsCard
            title="Downloads"
            value={adminStats.totalDownloads}
            icon={<Download className="text-orange-600" size={24} />}
            trend="+15%"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Suas Galerias</h2>
          </div>

          {galleries.length === 0 ? (
            <div className="text-center py-8">
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma galeria criada ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Comece criando sua primeira galeria para compartilhar fotos com seus clientes.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus size={20} className="mr-2" />
                  Criar Nova Galeria
                </Button>
                <Button variant="secondary" onClick={handleCreateSampleData}>
                  Criar Dados de Exemplo
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleries.map((gallery) => (
                <GalleryCard 
                  key={gallery.id} 
                  gallery={gallery} 
                  onManage={onManageGallery}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateGalleryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}