import React, { useState } from 'react';
import { Heart, Download, ZoomIn, Check, Star, Trash2 } from 'lucide-react';
import { Photo } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { downloadFile } from '../../utils/fileUtils';
import { PhotoSupplierTag } from './PhotoSupplierTag';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  showCoverIndicator?: boolean;
  isAdmin?: boolean;
  onDeletePhoto?: (photoId: string) => void;
  galleryId?: string;
}

export function PhotoGrid({
  photos,
  onPhotoClick,
  showCoverIndicator = false,
  isAdmin = false,
  onDeletePhoto,
  galleryId
}: PhotoGridProps) {
  const { state, dispatch } = useAppContext();
  const { clientSession, currentGallery } = state;
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);

  const isFavorite = (photoId: string) => {
    return clientSession?.favorites.includes(photoId) || false;
  };

  const isSelected = (photoId: string) => {
    return clientSession?.selectedPhotos.includes(photoId) || false;
  };

  const handleFavoriteToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_FAVORITE', payload: { photoId } });
  };

  const handleSelectionToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'TOGGLE_SELECTION', payload: { photoId } });
  };

  const handleDownload = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(photo.url, photo.filename, photo.r2Key, state.currentGallery?.id);
  };

  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Tem certeza que deseja deletar esta foto? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingPhoto(photoId);
    
    try {
      if (onDeletePhoto) {
        await onDeletePhoto(photoId);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erro ao deletar foto. Tente novamente.');
    } finally {
      setDeletingPhoto(null);
    }
  };

  const isCoverPhoto = (photoId: string) => {
    return showCoverIndicator && currentGallery?.coverPhotoId === photoId;
  };

  const handleThumbnailError = (photoId: string) => {
    setFailedThumbnails(prev => new Set(prev).add(photoId));
  };

  const getThumbnailUrl = (photo: Photo) => {
    if (failedThumbnails.has(photo.id)) {
      // Se o thumbnail falhou, tentar usar a URL original
      if (photo.r2Key && !photo.r2Key.startsWith('data:')) {
        // Para arquivos R2, usar URL assinada
        return photo.url;
      }
      return photo.url;
    }
    
    // Se é um arquivo R2 e o bucket é privado, usar URL assinada
    if (photo.r2Key && !photo.r2Key.startsWith('data:') && photo.thumbnail.includes('catalog.cloudflarestorage.com')) {
      // Gerar URL assinada para o thumbnail
      return photo.url; // Temporariamente usar a URL principal
    }
    
    return photo.thumbnail;
  };

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="break-inside-avoid relative group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
          onMouseEnter={() => setHoveredPhoto(photo.id)}
          onMouseLeave={() => setHoveredPhoto(null)}
          onClick={() => onPhotoClick(photo, index)}
        >
          <div className="relative overflow-hidden">
            <img
              src={getThumbnailUrl(photo)}
              alt={photo.filename}
              className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => handleThumbnailError(photo.id)}
            />
            
            {/* Cover Photo Indicator */}
            {isCoverPhoto(photo.id) && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
                <Star size={12} />
                Capa
              </div>
            )}
            
            {/* ADMIN DELETE BUTTON - SEMPRE VISÍVEL QUANDO É ADMIN */}
            {isAdmin && (
              <button
                onClick={(e) => handleDeletePhoto(photo.id, e)}
                className="absolute top-2 right-2 z-20 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                title="Deletar foto"
                disabled={deletingPhoto === photo.id}
                style={{ opacity: 1 }}
              >
                {deletingPhoto === photo.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
            
            {/* CLIENT ACTIONS - Only for non-admin */}
            {!isAdmin && (
              <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 ${hoveredPhoto === photo.id ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute top-2 right-2 flex gap-2">
                  {/* Selection Toggle */}
                  <button
                    onClick={(e) => handleSelectionToggle(photo.id, e)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isSelected(photo.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                    }`}
                  >
                    <Check size={16} />
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => handleFavoriteToggle(photo.id, e)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isFavorite(photo.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                    }`}
                  >
                    <Heart size={16} fill={isFavorite(photo.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDownload(photo, e)}
                      className="w-8 h-8 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 flex items-center justify-center text-gray-700 transition-all duration-200"
                      title="Baixar foto"
                    >
                      <Download size={16} />
                    </button>
                    
                    <button 
                      className="w-8 h-8 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 flex items-center justify-center text-gray-700 transition-all duration-200"
                      title="Visualizar em tela cheia"
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Photo Info */}
          <div className="p-3">
            <p className="text-xs text-gray-500 truncate">{photo.filename}</p>
            <div className="flex items-center justify-between mt-2">
              {photo.metadata && (
                <p className="text-xs text-gray-400">
                  {photo.metadata.width} × {photo.metadata.height}
                </p>
              )}
              {isAdmin && galleryId && (
                <PhotoSupplierTag photoId={photo.id} galleryId={galleryId} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}