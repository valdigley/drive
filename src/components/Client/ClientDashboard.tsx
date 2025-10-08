import React, { useState, useEffect } from 'react';
import { FolderOpen, Image as ImageIcon, Calendar, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { clientService } from '../../services/clientService';
import { galleryService } from '../../services/galleryService';
import { formatDate } from '../../utils/fileUtils';

interface ClientGallery {
  id: string;
  name: string;
  description?: string;
  coverPhotoUrl?: string;
  photoCount: number;
  createdDate: Date;
}

interface ClientDashboardProps {
  clientId: string;
  clientName: string;
  onSelectGallery: (galleryId: string) => void;
}

export function ClientDashboard({ clientId, clientName, onSelectGallery }: ClientDashboardProps) {
  const [galleries, setGalleries] = useState<ClientGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientGalleries();
  }, [clientId]);

  const loadClientGalleries = async () => {
    try {
      setLoading(true);
      const galleriesData = await clientService.getClientGalleries(clientId);

      const galleriesWithDetails = await Promise.all(
        galleriesData.map(async (gallery: any) => {
          const photos = await galleryService.getGalleryPhotos(gallery.id);
          const coverPhoto = photos[0];

          return {
            id: gallery.id,
            name: gallery.name,
            description: gallery.description,
            coverPhotoUrl: coverPhoto?.url || coverPhoto?.thumbnail,
            photoCount: photos.length,
            createdDate: new Date(gallery.created_date),
          };
        })
      );

      setGalleries(galleriesWithDetails);
    } catch (error) {
      console.error('Error loading client galleries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white dark:bg-gray-800 rounded-full mb-4 shadow-lg">
              <FolderOpen className="text-green-600 dark:text-green-400" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Bem-vindo, {clientName}!
            </h1>
            <p className="text-xl text-green-100 dark:text-green-200">
              {galleries.length} {galleries.length === 1 ? 'galeria disponível' : 'galerias disponíveis'}
            </p>
          </div>
        </div>
      </div>

      {/* Galleries Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {galleries.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen size={64} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma galeria disponível
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Suas galerias aparecerão aqui quando estiverem prontas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => onSelectGallery(gallery.id)}
              >
                {/* Cover Image */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                  {gallery.coverPhotoUrl ? (
                    <img
                      src={gallery.coverPhotoUrl}
                      alt={gallery.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={48} className="text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white text-gray-900 font-semibold shadow-lg"
                    >
                      <Eye size={16} className="mr-2" />
                      Ver Galeria
                    </Button>
                  </div>
                  {/* Photo Count Badge */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <ImageIcon size={14} />
                    {gallery.photoCount}
                  </div>
                </div>

                {/* Gallery Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {gallery.name}
                  </h3>
                  {gallery.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                      {gallery.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(gallery.createdDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium group-hover:gap-2 transition-all">
                      <span>Abrir</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        {galleries.length > 0 && (
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Como usar suas galerias
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span>Clique em qualquer galeria para visualizar as fotos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span>Marque suas fotos favoritas com o ícone de coração</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                    <span>Selecione fotos para impressão e faça download quando quiser</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
