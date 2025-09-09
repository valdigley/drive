import React, { useState } from 'react';
import { Plus, Camera, Users, Download, Eye, LogOut } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { GalleryCard } from './GalleryCard';
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
    <div>
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400">Gerencie suas galerias e fotos</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={20} className="mr-2" />
                  Nova Galeria
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="secondary"
                >
                  <LogOut size={20} className="mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Galerias</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.totalGalleries}</p>
              </div>
              <Camera size={24} className="text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fotos Compartilhadas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.totalPhotos}</p>
              </div>
              <Camera size={24} className="text-green-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visualizações</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.totalViews}</p>
              </div>
              <Eye size={24} className="text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Downloads</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminStats.totalDownloads}</p>
              </div>
              <Download size={24} className="text-orange-600" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Suas Galerias</h2>
          </div>

          {galleries.length === 0 ? (
            <div className="text-center py-12">
              <Camera size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma galeria criada ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece criando sua primeira galeria para compartilhar fotos com seus clientes.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={20} className="mr-2" />
                Criar Primeira Galeria
              </Button>
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