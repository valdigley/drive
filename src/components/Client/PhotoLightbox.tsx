import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Download, Info, Tag, Printer, Check } from 'lucide-react';
import { Photo } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { downloadFile, formatFileSize, getPhotoCode } from '../../utils/fileUtils';

interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onTagSupplier?: (photoId: string) => void;
}

export function PhotoLightbox({ photos, currentIndex, isOpen, onClose, onNavigate, onTagSupplier }: PhotoLightboxProps) {
  const { state, dispatch } = useAppContext();
  const { clientSession } = state;
  const [showInfo, setShowInfo] = useState(false);

  const currentPhoto = photos[currentIndex];

  const isInPrintCart = clientSession?.printCart?.includes(currentPhoto?.id) || false;
  const isSelected = clientSession?.selectedPhotos?.includes(currentPhoto?.id) || false;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < photos.length - 1) {
            onNavigate(currentIndex + 1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onNavigate]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const isFavorite = clientSession?.favorites.includes(currentPhoto.id) || false;
  const photoCode = currentPhoto.photoCode || getPhotoCode(currentPhoto.filename, currentIndex);

  const handleFavoriteToggle = () => {
    dispatch({ type: 'TOGGLE_FAVORITE', payload: { photoId: currentPhoto.id } });
  };

  const handleDownload = () => {
    downloadFile(currentPhoto.url, currentPhoto.filename, currentPhoto.r2Key, state.currentGallery?.id);
  };

  const handlePrintCartToggle = () => {
    if (!clientSession) return;
    dispatch({ type: 'TOGGLE_PRINT_CART', payload: { photoId: currentPhoto.id } });
  };

  const handleSelectionToggle = () => {
    if (!clientSession) return;
    dispatch({ type: 'TOGGLE_SELECTION', payload: { photoId: currentPhoto.id } });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <p className="text-sm opacity-80">
              {currentIndex + 1} de {photos.length}
            </p>
            <p className="font-medium font-mono">{photoCode}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Info size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteToggle}
              className={`text-white hover:bg-white hover:bg-opacity-20 transition-all duration-200 ${
                isFavorite ? 'text-red-400 bg-white bg-opacity-20' : ''
              }`}
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart
                size={20}
                fill={isFavorite ? 'currentColor' : 'none'}
                className={isFavorite ? 'animate-pulse' : ''}
              />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Download size={20} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all duration-200"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all duration-200"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Photo */}
      <div className="flex flex-col items-center justify-center h-full p-16 gap-4">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.filename}
          className="max-w-full max-h-[calc(100%-120px)] object-contain rounded-lg shadow-2xl"
        />

        {/* Action Buttons Below Photo */}
        <div className="flex items-center justify-center gap-3 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3">
          {onTagSupplier && (
            <button
              onClick={() => onTagSupplier(currentPhoto.id)}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
                currentPhoto.supplierId
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
              title={currentPhoto.supplierId ? 'Fornecedor marcado' : 'Marcar fornecedor'}
            >
              <Tag size={18} />
              <span>Fornecedor</span>
            </button>
          )}

          <button
            onClick={handlePrintCartToggle}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
              isInPrintCart
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
            title="Carrinho de impressão"
          >
            <Printer size={18} />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleSelectionToggle}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
              isSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
            title="Selecionar"
          >
            <Check size={18} />
            <span>Selecionar</span>
          </button>

          <button
            onClick={handleFavoriteToggle}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 text-sm font-medium ${
              isFavorite
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
            title="Favoritar"
          >
            <Heart
              size={18}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
            <span>Favorito</span>
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="opacity-80">Arquivo:</p>
                <p className="font-medium">{currentPhoto.filename}</p>
              </div>
              <div>
                <p className="opacity-80">Tamanho:</p>
                <p className="font-medium">{formatFileSize(currentPhoto.size)}</p>
              </div>
              {currentPhoto.metadata && (
                <>
                  <div>
                    <p className="opacity-80">Dimensões:</p>
                    <p className="font-medium">
                      {currentPhoto.metadata.width} × {currentPhoto.metadata.height}
                    </p>
                  </div>
                  {currentPhoto.metadata.camera && (
                    <div>
                      <p className="opacity-80">Câmera:</p>
                      <p className="font-medium">{currentPhoto.metadata.camera}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}