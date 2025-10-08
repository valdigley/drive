import React, { useState } from 'react';
import { Calendar, Eye, Download, Lock, Settings, ExternalLink, Camera, Trash2, MapPin } from 'lucide-react';
import { Gallery } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { formatDate, isGalleryExpired } from '../../utils/fileUtils';
import { galleryService } from '../../services/galleryService';

interface GalleryCardProps {
  gallery: Gallery;
  onManage?: (galleryId: string) => void;
  viewMode?: 'grid' | 'list';
}

export function GalleryCard({ gallery, onManage, viewMode = 'grid' }: GalleryCardProps) {
  const { dispatch } = useAppContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGallery, setDeletingGallery] = useState(false);
  const isExpired = isGalleryExpired(gallery.expirationDate);
  const previewPhotos = gallery.photos.slice(0, 4);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/gallery/${gallery.id}`;
    navigator.clipboard.writeText(link);
    // In a real app, show a toast notification
    alert('Link copiado para a área de transferência!');
  };

  const handleDelete = async () => {
    setDeletingGallery(true);
    try {
      await galleryService.deleteGallery(gallery.id);
      dispatch({ type: 'DELETE_GALLERY', payload: gallery.id });
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Erro ao deletar galeria');
    } finally {
      setDeletingGallery(false);
    }
  };

  // List view layout
  if (viewMode === 'list') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md ${isExpired ? 'opacity-75' : ''}`}>
        <div className="flex items-center p-4 gap-4">
          {/* Thumbnail Preview */}
          <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            {previewPhotos.length > 0 ? (
              <img
                src={previewPhotos[0].thumbnail}
                alt={gallery.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>

          {/* Gallery Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{gallery.name}</h3>
                  {gallery.password && (
                    <Lock size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  )}
                  {isExpired && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded flex-shrink-0">
                      Expirada
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{gallery.clientName}</p>
                {(gallery.eventDate || gallery.location) && (
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {gallery.eventDate && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(gallery.eventDate)}</span>
                      </div>
                    )}
                    {gallery.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span className="truncate max-w-[200px]">{gallery.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Camera size={16} />
                  <span>{gallery.photos.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={16} />
                  <span>{gallery.accessCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Download size={16} />
                  <span>{gallery.downloadCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleCopyLink}
                  className="text-xs"
                >
                  <ExternalLink size={14} className="mr-1" />
                  Copiar Link
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onManage?.(gallery.id)}
                  className="text-xs"
                >
                  <Settings size={14} className="mr-1" />
                  Gerenciar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view layout (original)
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md ${isExpired ? 'opacity-75' : ''}`}>
      {/* Photo Preview Grid */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
        {previewPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 h-full">
            {previewPhotos.map((photo, index) => (
              <div key={photo.id} className="relative overflow-hidden">
                <img
                  src={photo.thumbnail}
                  alt={photo.filename}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
            {gallery.photos.length > 4 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                +{gallery.photos.length - 4} fotos
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Camera size={32} className="text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma foto</p>
            </div>
          </div>
        )}
        
        {isExpired && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Expirada
          </div>
        )}
      </div>

      {/* Gallery Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{gallery.name}</h3>
          {gallery.password && (
            <Lock size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
          )}
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{gallery.clientName}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            {gallery.accessCount}
          </div>
          <div className="flex items-center gap-1">
            <Download size={12} />
            {gallery.downloadCount}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(gallery.createdDate)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            className="flex-1 text-xs"
          >
            <ExternalLink size={14} className="mr-1" />
            Copiar Link
          </Button>
          
          <Button
            size="sm"
            variant="primary"
            onClick={() => onManage?.(gallery.id)}
            className="flex-1 text-xs"
          >
            <Settings size={14} className="mr-1" />
            Gerenciar
          </Button>
        </div>
      </div>
    </div>
  );
}