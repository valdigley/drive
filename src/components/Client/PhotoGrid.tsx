import React, { useState } from 'react';
import { Heart, Download, ZoomIn, Check, Star, Printer } from 'lucide-react';
import { Photo } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { downloadFile, getPhotoCode } from '../../utils/fileUtils';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo, index: number) => void;
  showCoverIndicator?: boolean;
  isAdmin?: boolean;
  onDeletePhoto?: (photoId: string) => void;
}

export function PhotoGrid({ photos, onPhotoClick, showCoverIndicator = false }: PhotoGridProps) {
  const { state, dispatch } = useAppContext();
  const { clientSession, currentGallery } = state;
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());

  console.log('📸 PhotoGrid - Client Session:', clientSession);
  console.log('📸 PhotoGrid - Current Gallery:', currentGallery?.id);

  const isFavorite = (photoId: string) => {
    return clientSession?.favorites.includes(photoId) || false;
  };

  const isSelected = (photoId: string) => {
    return clientSession?.selectedPhotos.includes(photoId) || false;
  };

  const isInPrintCart = (photoId: string) => {
    return clientSession?.printCart.includes(photoId) || false;
  };

  const handlePrintCartToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🖨️ Toggle Print Cart:', photoId, 'Session exists:', !!clientSession);
    if (!clientSession) {
      console.error('❌ No client session available for print cart toggle');
      return;
    }
    dispatch({ type: 'TOGGLE_PRINT_CART', payload: { photoId } });
  };

  const handleFavoriteToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('❤️ Toggle Favorite:', photoId, 'Session exists:', !!clientSession);
    if (!clientSession) {
      console.error('❌ No client session available for favorite toggle');
      return;
    }
    dispatch({ type: 'TOGGLE_FAVORITE', payload: { photoId } });
  };

  const handleSelectionToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('✅ Toggle Selection:', photoId, 'Session exists:', !!clientSession);
    if (!clientSession) {
      console.error('❌ No client session available for selection toggle');
      return;
    }
    dispatch({ type: 'TOGGLE_SELECTION', payload: { photoId } });
  };

  const handleDownload = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFile(photo.url, photo.filename, photo.r2Key, currentGallery?.id);
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
        return photo.url;
      }
      return photo.url;
    }
    
    // Se é um arquivo R2 e o bucket é privado, usar URL assinada
    if (photo.r2Key && !photo.r2Key.startsWith('data:') && photo.thumbnail.includes('catalog.cloudflarestorage.com')) {
      return photo.url; // Temporariamente usar a URL principal
    }
    
    return photo.thumbnail;
  };
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {photos.map((photo, index) => {
        const photoCode = photo.photoCode || getPhotoCode(photo.filename, index);

        return (
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

              {/* Photo Code Badge */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded font-mono">
                {photoCode}
              </div>

              {/* Cover Photo Indicator */}
              {isCoverPhoto(photo.id) && (
                <div className="absolute top-10 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Star size={12} />
                  Capa
                </div>
              )}
            
            {/* Overlay */}
            <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 ${hoveredPhoto === photo.id ? 'opacity-100' : 'opacity-0'}`}>
              <div className={`absolute top-2 right-2 flex gap-2 ${isCoverPhoto(photo.id) ? 'mt-8' : ''}`}>
                {/* Print Cart Toggle */}
                <button
                  onClick={(e) => handlePrintCartToggle(photo.id, e)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isInPrintCart(photo.id)
                      ? 'bg-green-600 text-white'
                      : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                  }`}
                  title="Adicionar ao carrinho de impressão"
                >
                  <Printer size={16} />
                </button>

                {/* Selection Toggle */}
                <button
                  onClick={(e) => handleSelectionToggle(photo.id, e)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected(photo.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                  }`}
                  title="Selecionar foto"
                >
                  <Check size={16} />
                </button>

                {/* Favorite Toggle */}
                <button
                  onClick={(e) => handleFavoriteToggle(photo.id, e)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                    isFavorite(photo.id)
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white bg-opacity-80 text-gray-700 hover:bg-opacity-100'
                  }`}
                  title={isFavorite(photo.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart
                    size={16}
                    fill={isFavorite(photo.id) ? 'currentColor' : 'none'}
                    className={isFavorite(photo.id) ? 'animate-pulse' : ''}
                  />
                </button>
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleDownload(photo, e)}
                    className="w-8 h-8 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 flex items-center justify-center text-gray-700 transition-all duration-200"
                  >
                    <Download size={16} />
                  </button>
                  
                  <button className="w-8 h-8 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 flex items-center justify-center text-gray-700 transition-all duration-200">
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Info */}
          <div className="p-3">
            <p className="text-xs text-gray-500 truncate">{photoCode}</p>
            {photo.metadata && (
              <p className="text-xs text-gray-400 mt-1">
                {photo.metadata.width} × {photo.metadata.height}
              </p>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}