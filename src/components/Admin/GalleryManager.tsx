import React, { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Star, Trash2 } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Button } from '../UI/Button';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { PhotoGrid } from '../Client/PhotoGrid';
import { PhotoGrid as AdminPhotoGrid } from './PhotoGrid';
import { PhotoLightbox } from '../Client/PhotoLightbox';
import { galleryService } from '../../services/galleryService';
import { isValidImageFile } from '../../utils/fileUtils';
import { Gallery } from '../../types';
import { r2Service } from '../../services/r2Service';

interface GalleryManagerProps {
  galleryId: string;
  onBack: () => void;
}

export function GalleryManager({ galleryId, onBack }: GalleryManagerProps) {
  const { state, dispatch } = useAppContext();
  const { uploading, uploadProgress, processFiles } = useImageUpload();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectingCover, setSelectingCover] = useState(false);
  const [fullGallery, setFullGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGallery, setDeletingGallery] = useState(false);

  const gallery = fullGallery || state.galleries.find(g => g.id === galleryId);

  useEffect(() => {
    const loadFullGalleryData = async () => {
      const stateGallery = state.galleries.find(g => g.id === galleryId);
      
      // Check if we have complete photo data (photos should have url property)
      const hasCompleteData = stateGallery?.photos.every(photo => 'url' in photo && photo.url);
      
      if (!hasCompleteData && stateGallery) {
        setLoading(true);
        try {
          const galleryDetails = await galleryService.getGalleryDetails(galleryId);
          const photos = await galleryService.getGalleryPhotos(galleryId);
          
          if (galleryDetails) {
            const completeGallery = {
              ...galleryDetails,
              photos: photos,
            };
            setFullGallery(completeGallery);
            
            // Update the global state with complete data
            dispatch({ type: 'UPDATE_GALLERY', payload: completeGallery });
          }
        } catch (error) {
          console.error('Error loading complete gallery data:', error);
        } finally {
          setLoading(false);
        }
      } else if (stateGallery) {
        // Se já temos dados completos, usar do estado global
        setFullGallery(stateGallery);
      }
    };

    loadFullGalleryData();
  }, [galleryId, state.galleries]);

  if (!gallery) {
    return <div>Galeria não encontrada</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleFileUpload = async (files: FileList) => {
    const validFiles = Array.from(files).filter(isValidImageFile);
    
    if (validFiles.length === 0) {
      alert('Nenhum arquivo de imagem válido encontrado');
      return;
    }

    const photos = await processFiles(validFiles as any, galleryId);
    
    if (photos.length > 0) {
      await galleryService.addPhotosToGallery(galleryId, photos);
      dispatch({ type: 'ADD_PHOTOS', payload: { galleryId, photos } });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handlePhotoClick = (photo: any, index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleSetCoverPhoto = (photoId: string) => {
    const updatedGallery = {
      ...gallery,
      coverPhotoId: photoId,
    };
    
    galleryService.saveGallery(updatedGallery).then(() => {
      dispatch({ type: 'UPDATE_GALLERY', payload: updatedGallery });
      
      // Update current gallery if it's the same one being managed
      if (state.currentGallery?.id === galleryId) {
        dispatch({ type: 'SET_CURRENT_GALLERY', payload: updatedGallery });
      }
      
      setSelectingCover(false);
    }).catch(error => {
      console.error('Error setting cover photo:', error);
    });
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const photo = gallery.photos.find(p => p.id === photoId);
      if (!photo) return;

      // Delete from R2 first
      if (photo.r2Key && !photo.r2Key.startsWith('data:') && !photo.r2Key.startsWith('local/')) {
        await r2Service.deletePhoto(photo.r2Key);
      }

      // Delete thumbnail from R2
      if (photo.thumbnail && !photo.thumbnail.startsWith('data:') && !photo.thumbnail.startsWith('local/')) {
        const thumbnailKey = photo.thumbnail.replace('https://pub-355a4912d7bb4cc0bb98db37f5c0c185.r2.dev/', '');
        await r2Service.deletePhoto(thumbnailKey);
      }

      // Delete from database
      await galleryService.deletePhoto(photoId);

      // Update local state
      const updatedGallery = {
        ...gallery,
        photos: gallery.photos.filter(p => p.id !== photoId),
      };

      dispatch({ type: 'UPDATE_GALLERY', payload: updatedGallery });
      
      // If deleted photo was cover photo, clear cover photo
      if (gallery.coverPhotoId === photoId) {
        const galleryWithoutCover = { ...updatedGallery, coverPhotoId: undefined };
        await galleryService.saveGallery(galleryWithoutCover);
        dispatch({ type: 'UPDATE_GALLERY', payload: galleryWithoutCover });
      }

    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Erro ao deletar foto. Tente novamente.');
    }
  };

  const handleDeleteGallery = async () => {
    setDeletingGallery(true);
    try {
      await galleryService.deleteGallery(galleryId);
      dispatch({ type: 'DELETE_GALLERY', payload: galleryId });
      setShowDeleteConfirm(false);
      onBack();
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Erro ao deletar galeria. Tente novamente.');
    } finally {
      setDeletingGallery(false);
    }
  };

  const handlePhotoClickForCover = (photo: any, index: number) => {
    if (selectingCover) {
      handleSetCoverPhoto(photo.id);
    } else {
      handlePhotoClick(photo, index);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft size={20} />
                </Button>
                
                {gallery.photos.length > 0 && (
                  <Button
                    variant={selectingCover ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSelectingCover(!selectingCover)}
                  >
                    <Star size={16} className="mr-2" />
                    {selectingCover ? 'Cancelar' : 'Definir Capa'}
                  </Button>
                )}
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{gallery.name}</h1>
                  <p className="text-gray-600">{gallery.clientName} • {gallery.photos.length} fotos</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[140px]">
                    <Upload size={20} />
                    Upload Fotos
                  </span>
                </label>
                
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 min-w-[140px]"
                >
                  <Trash2 size={16} />
                  Deletar Galeria
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <div className="flex-1">
                <p className="text-sm text-blue-800">Processando imagens...</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gallery.photos.length === 0 ? (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            <div className="text-center">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Faça upload das suas fotos
              </h3>
              <p className="text-gray-600">
                Arraste e solte as imagens aqui ou use o botão "Upload Fotos" acima
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AdminPhotoGrid
              photos={gallery.photos}
              onPhotoClick={handlePhotoClickForCover}
              showCoverIndicator={true}
              isAdmin={true}
              onDeletePhoto={handleDeletePhoto}
            />
          </div>
        )}
      </div>

      {/* Cover Selection Notice */}
      {selectingCover && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-blue-800">
              <Star size={16} className="inline mr-2" />
              Clique em uma foto para defini-la como capa da galeria
            </p>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photos={gallery.photos}
        currentIndex={currentPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentPhotoIndex}
      />

      {/* Delete Gallery Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Deletar Galeria
                </h3>
                
                <p className="text-gray-600 mb-2">
                  Tem certeza que deseja deletar a galeria <strong>"{gallery.name}"</strong>?
                </p>
                
                <p className="text-sm text-red-600 mb-6">
                  Esta ação não pode ser desfeita. Todas as {gallery.photos.length} fotos serão removidas permanentemente.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deletingGallery}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    variant="danger"
                    onClick={handleDeleteGallery}
                    disabled={deletingGallery}
                    className="flex items-center gap-2"
                  >
                    {deletingGallery ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deletando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Deletar Galeria
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}