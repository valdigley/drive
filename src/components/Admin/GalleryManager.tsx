import React, { useState, useEffect } from 'react';
import { Upload, ArrowLeft, Star, Trash2, Calendar, Save, ExternalLink, MapPin, User, Heart, Clock } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { useImageUpload } from '../../hooks/useImageUpload';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { PhotoGrid } from '../Client/PhotoGrid';
import { PhotoGrid as AdminPhotoGrid } from './PhotoGrid';
import { PhotoLightbox } from '../Client/PhotoLightbox';
import { galleryService } from '../../services/galleryService';
import { isValidImageFile, formatDate } from '../../utils/fileUtils';
import { Gallery } from '../../types';
import { r2Service } from '../../services/r2Service';
import { supabase } from '../../lib/supabase';

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
  const [editingExpiration, setEditingExpiration] = useState(false);
  const [newExpirationDays, setNewExpirationDays] = useState('');
  const [savingExpiration, setSavingExpiration] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    clientId: '',
    eventDate: '',
    location: ''
  });
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [favoritePhotoIds, setFavoritePhotoIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  const gallery = fullGallery || state.galleries.find(g => g.id === galleryId);

  console.log('📊 GalleryManager state:', { editingDetails, clients: clients.length, gallery: gallery?.name });

  // Load favorites from database
  useEffect(() => {
    const loadFavorites = async () => {
      if (!galleryId) return;

      setLoadingFavorites(true);
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('photo_id')
          .eq('gallery_id', galleryId);

        if (error) throw error;

        const photoIds = data?.map(f => f.photo_id) || [];
        setFavoritePhotoIds(photoIds);
        console.log('📊 Admin: Loaded favorites from database:', photoIds.length);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoadingFavorites(false);
      }
    };

    loadFavorites();
  }, [galleryId]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const { clientService } = await import('../../services/clientService');
        const clientsList = await clientService.getAllClients();
        setClients(clientsList.map(c => ({ id: c.id, name: c.name })));
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    loadClients();
  }, []);

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

  const handleEditExpiration = () => {
    if (gallery?.expirationDate) {
      const daysFromNow = Math.ceil((gallery.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      setNewExpirationDays(Math.max(1, daysFromNow).toString());
    } else {
      setNewExpirationDays('30');
    }
    setEditingExpiration(true);
  };

  const handleSaveExpiration = async () => {
    if (!gallery) return;
    
    const days = parseInt(newExpirationDays);
    if (isNaN(days) || days < 1 || days > 365) {
      alert('O prazo deve ser entre 1 e 365 dias');
      return;
    }

    setSavingExpiration(true);
    try {
      const newExpirationDate = new Date();
      newExpirationDate.setDate(newExpirationDate.getDate() + days);
      
      const updatedGallery = {
        ...gallery,
        expirationDate: newExpirationDate,
      };
      
      await galleryService.saveGallery(updatedGallery);
      dispatch({ type: 'UPDATE_GALLERY', payload: updatedGallery });
      setFullGallery(updatedGallery);
      setEditingExpiration(false);
    } catch (error) {
      console.error('Error updating expiration:', error);
      alert('Erro ao atualizar prazo de expiração');
    } finally {
      setSavingExpiration(false);
    }
  };

  const handleCancelEditExpiration = () => {
    setEditingExpiration(false);
    setNewExpirationDays('');
  };

  const handleEditDetails = () => {
    console.log('🖊️ Edit details clicked', { gallery, clients });
    if (gallery) {
      setEditedDetails({
        clientId: gallery.clientId || '',
        eventDate: gallery.eventDate ? new Date(gallery.eventDate).toISOString().split('T')[0] : '',
        location: gallery.location || ''
      });
      setEditingDetails(true);
    }
  };

  const handleSaveDetails = async () => {
    if (!gallery) return;

    setSavingDetails(true);
    try {
      const selectedClient = clients.find(c => c.id === editedDetails.clientId);

      const updatedGallery = {
        ...gallery,
        clientId: editedDetails.clientId || undefined,
        clientName: selectedClient?.name || gallery.clientName,
        eventDate: editedDetails.eventDate ? new Date(editedDetails.eventDate) : undefined,
        location: editedDetails.location || undefined,
      };

      await galleryService.saveGallery(updatedGallery);
      dispatch({ type: 'UPDATE_GALLERY', payload: updatedGallery });
      setFullGallery(updatedGallery);
      setEditingDetails(false);
    } catch (error) {
      console.error('Error updating gallery details:', error);
      alert('Erro ao atualizar detalhes da galeria');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleCancelEditDetails = () => {
    setEditingDetails(false);
    setEditedDetails({
      clientId: '',
      eventDate: '',
      location: ''
    });
  };

  const getTotalFavorites = () => {
    return favoritePhotoIds.length;
  };

  const getMostFavoritedPhotos = () => {
    if (!gallery) return [];
    return gallery.photos.filter(photo => favoritePhotoIds.includes(photo.id));
  };

  const getFavoritedPhotosText = () => {
    const favoritedPhotos = getMostFavoritedPhotos();
    if (favoritedPhotos.length === 0) return '';
    
    return favoritedPhotos
      .map(photo => {
        // Remove extensão do arquivo para ficar apenas o nome
        const nameWithoutExtension = photo.filename.replace(/\.[^/.]+$/, '');
        return nameWithoutExtension;
      })
      .join(' OR ');
  };

  const handleCopyFavorites = () => {
    const text = getFavoritedPhotosText();
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Lista de fotos favoritadas copiada!');
    }
  };

  const handlePhotoClickForCover = (photo: any, index: number) => {
    if (selectingCover) {
      handleSetCoverPhoto(photo.id);
    } else {
      handlePhotoClick(photo, index);
    }
  };

  // Filter photos based on filter state
  const filteredPhotos = React.useMemo(() => {
    if (!gallery) return [];

    if (filter === 'favorites') {
      return gallery.photos.filter(photo => favoritePhotoIds.includes(photo.id));
    }

    return gallery.photos;
  }, [gallery, filter, favoritePhotoIds]);

  if (!gallery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
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

                {/* Filter Buttons */}
                {gallery.photos.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={filter === 'all' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      Todas ({gallery.photos.length})
                    </Button>
                    <Button
                      variant={filter === 'favorites' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('favorites')}
                      className="flex items-center gap-1"
                    >
                      <Heart size={16} />
                      Favoritas {loadingFavorites ? '...' : `(${favoritePhotoIds.length})`}
                    </Button>

                    {gallery?.type === 'client' && getTotalFavorites() > 0 && getFavoritedPhotosText() && (
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <code
                          className="text-xs font-mono text-blue-900 dark:text-blue-100 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          onClick={handleCopyFavorites}
                          title="Clique para copiar"
                        >
                          {getFavoritedPhotosText()}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyFavorites}
                          className="text-xs px-1.5 py-0.5 h-auto text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
                        >
                          Copiar
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{gallery.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {gallery.clientName} • {filteredPhotos.length} {filter === 'favorites' ? 'favoritas' : 'fotos'}
                    {filter === 'favorites' && ` de ${gallery.photos.length}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    const link = `${window.location.origin}/gallery/${galleryId}`;
                    window.open(link, '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Ver Galeria
                </Button>
                
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
        <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <div className="flex-1">
                <p className="text-sm text-blue-800 dark:text-blue-200">Processando imagens...</p>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-1">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Gallery Info and Expiration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Gallery Info */}
            <div>
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Informações da Galeria</h3>
                  {!editingDetails && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditDetails}
                      className="text-xs"
                    >
                      Editar
                    </Button>
                  )}
                </div>

                {editingDetails ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cliente
                      </label>
                      <select
                        value={editedDetails.clientId}
                        onChange={(e) => setEditedDetails({ ...editedDetails, clientId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione um cliente</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data do Evento
                      </label>
                      <input
                        type="date"
                        value={editedDetails.eventDate}
                        onChange={(e) => setEditedDetails({ ...editedDetails, eventDate: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Localização
                      </label>
                      <input
                        type="text"
                        value={editedDetails.location}
                        onChange={(e) => setEditedDetails({ ...editedDetails, location: e.target.value })}
                        placeholder="Ex: Igreja São José, Centro"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSaveDetails}
                        disabled={savingDetails}
                        className="flex-1"
                      >
                        {savingDetails ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCancelEditDetails}
                        disabled={savingDetails}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          <User size={14} />
                          Cliente
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{gallery.clientName}</p>
                      </div>

                      {gallery.eventDate && (
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            <Calendar size={14} />
                            Evento
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(gallery.eventDate)}</p>
                        </div>
                      )}

                      {gallery.location && (
                        <div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            <MapPin size={14} />
                            Local
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{gallery.location}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Criada em</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(gallery.createdDate)}</p>
                      </div>

                      <div className="flex gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Acessos</div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{gallery.accessCount}</p>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Downloads</div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">{gallery.downloadCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column - Expiration */}
            <div className="lg:border-l lg:border-gray-200 lg:dark:border-gray-700 lg:pl-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Prazo de Expiração</h3>
              {editingExpiration ? (
                <div className="space-y-3">
                  <Input
                    label="Dias até expirar"
                    type="number"
                    value={newExpirationDays}
                    onChange={(e) => setNewExpirationDays(e.target.value)}
                    min="1"
                    max="365"
                    placeholder="Ex: 30"
                    icon={<Calendar />}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveExpiration}
                      disabled={savingExpiration}
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      {savingExpiration ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleCancelEditExpiration}
                      disabled={savingExpiration}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Clock className="text-orange-600 dark:text-orange-400" size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Expira em</div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {gallery.expirationDate ? formatDate(gallery.expirationDate) : 'Sem expiração'}
                        </p>
                      </div>
                    </div>
                    {gallery.expirationDate && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {Math.ceil((gallery.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleEditExpiration}
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <Calendar size={16} />
                    Editar Prazo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

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
            {loadingFavorites && filter === 'favorites' ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredPhotos.length === 0 && filter === 'favorites' ? (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Nenhuma foto favoritada nesta galeria</p>
              </div>
            ) : (
              <AdminPhotoGrid
                photos={filteredPhotos}
                onPhotoClick={handlePhotoClickForCover}
                showCoverIndicator={true}
                isAdmin={true}
                onDeletePhoto={handleDeletePhoto}
                galleryId={galleryId}
              />
            )}
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