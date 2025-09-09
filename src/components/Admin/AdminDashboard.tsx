import React, { useState } from 'react';
import { Plus, Camera, Users, Download, Eye, LogOut } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { VSButton, VSCard, VSCardBody, VSPageHeader, VSStatCard, VSEmptyState } from '../UI/valdigley-design-system';
import { CreateGalleryModal } from './CreateGalleryModal';
import { GalleryCard } from './GalleryCard';
import { galleryService } from '../../services/galleryService';
import { supabase } from '../../lib/supabase';

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
      } catch (error) {
        console.error('Error loading galleries:', error);
      } finally {
        setLoadingGalleries(false);
      }
    };

    loadGalleriesWithPhotos();
  }, [dispatch]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const { galleries, adminStats } = state;

  return (
    <div className="vs-h-screen">
      <VSCard className="vs-mb-0 vs-rounded-none vs-border-x-0 vs-border-t-0">
        <VSCardBody>
          <VSPageHeader
            title="Dashboard"
            subtitle="Gerencie suas galerias e fotos"
            actions={
              <div className="vs-flex vs-gap-2">
                <VSButton 
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus size={20} />}
                >
                  Nova Galeria
                </VSButton>
                
                <VSButton 
                  onClick={handleSignOut}
                  variant="secondary"
                  icon={<LogOut size={20} />}
                >
                  Sair
                </VSButton>
              </div>
            }
          />
        </VSCardBody>
      </VSCard>

      <div className="vs-content">
        {/* Stats Overview */}
        <div className="vs-stats-grid vs-mb-8">
          <VSStatCard
            title="Total de Galerias"
            value={adminStats.totalGalleries}
            icon={<Camera size={24} />}
            trend="+12%"
            color="blue"
          />
          
          <VSStatCard
            title="Fotos Compartilhadas"
            value={adminStats.totalPhotos}
            icon={<Camera size={24} />}
            trend="+8%"
            color="green"
          />
          
          <VSStatCard
            title="Visualizações"
            value={adminStats.totalViews}
            icon={<Eye size={24} />}
            trend="+23%"
            color="purple"
          />
          
          <VSStatCard
            title="Downloads"
            value={adminStats.totalDownloads}
            icon={<Download size={24} />}
            trend="+15%"
            color="orange"
          />
        </div>

        <div>
          <div className="vs-flex vs-justify-between vs-items-center vs-mb-6">
            <h2 className="vs-heading-2">Suas Galerias</h2>
          </div>

          {galleries.length === 0 ? (
            <VSEmptyState
              icon={<Camera size={48} />}
              title="Nenhuma galeria criada ainda"
              description="Comece criando sua primeira galeria para compartilhar fotos com seus clientes."
              action={
                <VSButton onClick={() => setShowCreateModal(true)} icon={<Plus size={20} />}>
                  Criar Primeira Galeria
                </VSButton>
              }
            />
          ) : (
            <div className="vs-grid vs-grid-3">
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