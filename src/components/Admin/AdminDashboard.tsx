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
      
      // Criar sessão de teste diretamente
      const sessionToken = `test_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      console.log('🔑 Criando sessão com token:', sessionToken);
      
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: 'test-user-123',
          session_token: sessionToken,
          is_active: true,
          expires_at: expiresAt.toISOString(),
          ip_address: 'localhost',
          user_agent: navigator.userAgent
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao inserir sessão:', error);
        alert(`Erro ao criar sessão:\n${error.message}\n\nVerifique se a tabela user_sessions existe no Supabase.`);
      } else {
        console.log('✅ Sessão criada com sucesso:', data);
        alert(`✅ Sessão criada com sucesso!\n\nToken: ${sessionToken}\nUser ID: test-user-123\nExpira em: ${expiresAt.toLocaleString()}\n\nVerifique a tabela user_sessions no Supabase!`);
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert(`❌ Erro no teste:\n${error.message}\n\nVerifique a conexão com o Supabase.`);
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
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Galeria
            </Button>
            
            <div className="flex gap-2">
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