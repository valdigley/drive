import React, { useState } from 'react';
import { Heart, Download, ZoomIn, Check, Star, Trash2 } from 'lucide-react';
import { Photo } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { downloadFile } from '../../utils/fileUtils';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  showCoverIndicator?: boolean;
  isAdmin?: boolean;
  onDeletePhoto?: (photoId: string) => void;
}

export function PhotoGrid({ 
  photos, 
  onPhotoClick, 
  showCoverIndicator = false, 
  isAdmin = false,
  onDeletePhoto 
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
    downloadFile(photo.url, photo.filename, photo.r2Key);
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
      return photo.url;
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
            
            {/* Deleting Overlay */}
            {deletingPhoto === photo.id && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                <div className="text-white text-sm font-medium">Deletando...</div>
              </div>
            )}
            
            {/* Hover Overlay with Actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300">
              {/* Action Buttons - Always visible on hover */}
              <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-all duration-200 ${
                hoveredPhoto === photo.id || isAdmin ? 'opacity-100' : 'opacity-0'
              } ${isCoverPhoto(photo.id) ? 'mt-10' : ''}`}>
                
                {/* Admin Delete Button - Red and prominent */}
                {isAdmin && (
                  <button
                    onClick={(e) => handleDeletePhoto(photo.id, e)}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    title="Deletar foto"
                    disabled={deletingPhoto === photo.id}
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                {/* Client Actions */}
                {!isAdmin && (
                  <>
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
                  </>
                )}
              </div>

              {/* Bottom Actions */}
              <div className={`absolute bottom-2 left-2 right-2 flex justify-between items-end transition-all duration-200 ${
                hoveredPhoto === photo.id ? 'opacity-100' : 'opacity-0'
              }`}>
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
          </div>

          {/* Photo Info */}
          <div className="p-3">
            <p className="text-xs text-gray-500 truncate">{photo.filename}</p>
            {photo.metadata && (
              <p className="text-xs text-gray-400 mt-1">
                {photo.metadata.width} × {photo.metadata.height}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}