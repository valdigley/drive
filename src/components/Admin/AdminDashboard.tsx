import React, { useState, useMemo } from 'react';
import { Plus, Camera, Users, Download, Eye, LogOut, Search, Store, User } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { CreateGalleryModal } from './CreateGalleryModal';
import { GalleryCard } from './GalleryCard';
import { StatsCard } from './StatsCard';
import { StorageStatusCard } from './StorageStatusCard';
import { SupplierManager } from './SupplierManager';
import { ClientManager } from './ClientManager';
import { galleryService } from '../../services/galleryService';
import { storageService, StorageStats } from '../../services/storageService';
import { supabase } from '../../lib/supabase';

interface AdminDashboardProps {
  onManageGallery?: (galleryId: string) => void;
}

export function AdminDashboard({ onManageGallery }: AdminDashboardProps) {
  const { state, dispatch } = useAppContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingGalleries, setLoadingGalleries] = useState(false);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'galleries' | 'suppliers' | 'clients'>('galleries');
  const [displayLimit, setDisplayLimit] = useState(5);

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

  // Load storage stats
  React.useEffect(() => {
    const loadStorageStats = async () => {
      try {
        const stats = await storageService.getStorageStats();
        setStorageStats(stats);
      } catch (error) {
        console.error('Error loading storage stats:', error);
      }
    };

    loadStorageStats();
    // Reload stats every 30 seconds
    const interval = setInterval(loadStorageStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const { galleries, adminStats } = state;

  // Reset display limit when search query changes
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setDisplayLimit(galleries.length);
    } else {
      setDisplayLimit(5);
    }
  }, [searchQuery, galleries.length]);

  // Filter galleries based on search query
  const filteredGalleries = useMemo(() => {
    if (!searchQuery.trim()) return galleries;

    const query = searchQuery.toLowerCase();
    return galleries.filter(gallery =>
      gallery.name.toLowerCase().includes(query) ||
      gallery.clientName.toLowerCase().includes(query)
    );
  }, [galleries, searchQuery]);

  // Get displayed galleries (limit to displayLimit when not searching)
  const displayedGalleries = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredGalleries;
    }
    return filteredGalleries.slice(0, displayLimit);
  }, [filteredGalleries, displayLimit, searchQuery]);

  const hasMoreGalleries = !searchQuery.trim() && filteredGalleries.length > displayLimit;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Storage Status Bar - Always show */}
      <StorageStatusCard storageStats={storageStats || {
        usedBytes: 0,
        totalBytes: 10 * 1024 * 1024 * 1024,
        usedPercentage: 0,
        formattedUsed: '0 GB',
        formattedTotal: '10 GB',
        totalPhotos: 0,
        topGalleries: [],
      }} />
      
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Gerencie suas galerias e fotos</p>
            </div>

            <Button
              onClick={handleSignOut}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <LogOut size={20} />
              Sair
            </Button>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('galleries')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'galleries'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Camera size={18} />
                Galerias
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'clients'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <User size={18} />
                Clientes
              </div>
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === 'suppliers'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Store size={18} />
                Fornecedores
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'galleries' ? (
          <div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suas Galerias</h2>
                  <p className="text-gray-600 dark:text-gray-400">Gerencie suas galerias de fotos</p>
                </div>
              </div>

              {/* Search Bar and Button */}
              <div className="flex justify-between items-center gap-4 mb-4">
                <div className="flex-1 max-w-md">
                  <div className="w-full">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nome da galeria ou cliente..."
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500 focus:ring-1 pl-10 pr-3 py-2"
                      />
                    </div>
                  </div>
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

            {/* Section Title */}
            {!searchQuery.trim() && filteredGalleries.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Galerias Recentes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Exibindo {Math.min(displayLimit, filteredGalleries.length)} de {filteredGalleries.length} galerias
                </p>
              </div>
            )}

          {filteredGalleries.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-8">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma galeria encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente buscar por outro termo.
              </p>
            </div>
          ) : filteredGalleries.length === 0 ? (
            <div className="text-center py-8">
              <Camera size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhuma galeria criada ainda
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comece criando sua primeira galeria para compartilhar fotos com seus clientes.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedGalleries.map((gallery) => (
                  <GalleryCard
                    key={gallery.id}
                    gallery={gallery}
                    onManage={onManageGallery}
                    viewMode="list"
                  />
                ))}
              </div>

              {hasMoreGalleries && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setDisplayLimit(prev => prev + 5)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Carregar mais ({filteredGalleries.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </>
          )}
          </div>
        ) : activeTab === 'clients' ? (
          <ClientManager />
        ) : (
          <SupplierManager />
        )}
      </div>

      <CreateGalleryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}