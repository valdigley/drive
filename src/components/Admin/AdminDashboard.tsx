import React, { useState } from 'react';
import { Plus, Camera, Users, Download, Eye, Settings } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { CreateGalleryModal } from './CreateGalleryModal';
import { GalleryCard } from './GalleryCard';
import { StatsCard } from './StatsCard';
import { galleryService } from '../../services/galleryService';

interface AdminDashboardProps {
  onManageGallery?: (galleryId: string) => void;
}

export function AdminDashboard({ onManageGallery }: AdminDashboardProps) {
  const { state, dispatch } = useAppContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingGalleries, setLoadingGalleries] = useState(false);

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

  const { galleries, adminStats } = state;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PhotoShare Pro</h1>
              <p className="text-gray-600">Painel do Fotógrafo</p>
            </div>
            
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Galeria
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Galleries Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Suas Galerias</h2>
            <div className="flex items-center gap-4">
              <select className="rounded-md border-gray-300 text-sm">
                <option>Todas as galerias</option>
                <option>Ativas</option>
                <option>Expiradas</option>
              </select>
            </div>
          </div>

          {galleries.length === 0 ? (
            <div className="text-center py-12">
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma galeria criada ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Comece criando sua primeira galeria para compartilhar fotos com seus clientes.
              </p>
              <div className="flex gap-3 justify-center">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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