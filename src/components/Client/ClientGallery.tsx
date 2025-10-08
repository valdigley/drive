import React, { useState, useMemo, useEffect } from 'react';
import { Heart, Download, Grid, List, Filter, ShoppingCart, Clock, Printer, FolderOpen } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { PhotoGrid } from '../Client/PhotoGrid';
import { PhotoLightbox } from './PhotoLightbox';
import { SelectionPanel } from './SelectionPanel';
import { PrintCartPanel } from './PrintCartPanel';
import { SupplierTimeline } from './SupplierTimeline';
import { SupplierTagModal } from './SupplierTagModal';
import { Photo, ViewMode } from '../../types';
import { formatDate, isGalleryExpired } from '../../utils/fileUtils';
import { galleryService } from '../../services/galleryService';
import { favoriteService } from '../../services/favoriteService';

export function ClientGallery() {
  const { state, dispatch } = useAppContext();
  const { currentGallery, clientSession, currentUser, currentSupplierId } = state;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [showSelection, setShowSelection] = useState(false);
  const [showPrintCart, setShowPrintCart] = useState(false);
  const [supplierGalleries, setSupplierGalleries] = useState<Array<{ galleryId: string; galleryName: string; clientName: string; photoCount: number }>>([]);
  const [selectedGalleryFilter, setSelectedGalleryFilter] = useState<string>('all');
  const [loadingGalleryFilter, setLoadingGalleryFilter] = useState(false);
  const [showSupplierTagModal, setShowSupplierTagModal] = useState(false);
  const [photoToTag, setPhotoToTag] = useState<string | null>(null);

  const isSupplier = currentUser === 'supplier';

  // Log filter changes
  useEffect(() => {
    console.log('🔄 Filter changed to:', filter);
  }, [filter]);

  // Sync favorites from database when filter changes to favorites
  useEffect(() => {
    const syncFavorites = async () => {
      if (filter === 'favorites' && clientSession && currentGallery) {
        const sessionId = `gallery_session_${currentGallery.id}`;
        const favoritesFromDB = await favoriteService.getFavorites(currentGallery.id, sessionId);

        console.log('🔄 Syncing favorites from database:', favoritesFromDB);
        console.log('📊 Current favorites in session:', clientSession.favorites);

        // Compare arrays properly
        const needsUpdate = favoritesFromDB.length !== clientSession.favorites.length ||
            !favoritesFromDB.every(id => clientSession.favorites.includes(id));

        if (needsUpdate) {
          const updatedSession = {
            ...clientSession,
            favorites: favoritesFromDB
          };

          localStorage.setItem(sessionId, JSON.stringify(updatedSession));
          dispatch({ type: 'SET_CLIENT_SESSION', payload: updatedSession });
          console.log('✅ Favorites synced:', {
            before: clientSession.favorites.length,
            after: favoritesFromDB.length
          });
        } else {
          console.log('✓ Favorites already in sync');
        }
      }
    };

    syncFavorites();
  }, [filter]);

  // Load supplier galleries on mount if supplier
  useEffect(() => {
    if (isSupplier && currentSupplierId) {
      galleryService.getSupplierGalleriesWithPhotos(currentSupplierId).then(galleries => {
        console.log('📁 Supplier galleries:', galleries);
        setSupplierGalleries(galleries);
      });
    }
  }, [isSupplier, currentSupplierId]);

  // Handle gallery filter change
  const handleGalleryFilterChange = async (galleryId: string) => {
    if (!currentSupplierId || !currentGallery) return;

    setLoadingGalleryFilter(true);
    setSelectedGalleryFilter(galleryId);

    try {
      const photos = await galleryService.getGalleryPhotos(
        currentGallery.id,
        currentSupplierId,
        galleryId === 'all' ? undefined : galleryId
      );

      const updatedGallery = { ...currentGallery, photos };
      dispatch({ type: 'SET_CURRENT_GALLERY', payload: updatedGallery });
    } catch (error) {
      console.error('Error filtering gallery:', error);
    } finally {
      setLoadingGalleryFilter(false);
    }
  };

  if (!currentGallery) {
    return <div>Galeria não encontrada</div>;
  }

  // Buscar a foto de capa corretamente
  const coverPhoto = useMemo(() => {
    if (!currentGallery.photos.length) return null;

    // Se tem coverPhotoId, procurar essa foto
    if (currentGallery.coverPhotoId) {
      const cover = currentGallery.photos.find(p => p.id === currentGallery.coverPhotoId);
      if (cover) return cover;
    }

    // Caso contrário, usar a primeira foto
    return currentGallery.photos[0];
  }, [currentGallery.photos, currentGallery.coverPhotoId]);

  const filteredPhotos = useMemo(() => {
    console.log('🖼️ ClientGallery - Total photos in gallery:', currentGallery.photos.length);
    console.log('🔍 Filter mode:', filter);
    console.log('💾 Client session:', clientSession);
    console.log('❤️ Favorites in session:', clientSession?.favorites || []);

    if (filter === 'favorites' && clientSession) {
      const favorited = currentGallery.photos.filter(photo =>
        clientSession.favorites.includes(photo.id)
      );
      console.log('✨ Filtered favorites:', favorited.length, 'photos');
      return favorited;
    }
    return currentGallery.photos;
  }, [currentGallery.photos, filter, clientSession]);

  // Group photos by gallery for supplier timeline view
  const galleryGroups = useMemo(() => {
    if (!isSupplier || !currentGallery) return [];

    const groups = new Map<string, { galleryId: string; galleryName: string; clientName: string; photos: Photo[]; date?: Date; createdDate?: Date }>();

    currentGallery.photos.forEach(photo => {
      const photoGalleryId = (photo as any).galleryId;
      const matchingGallery = supplierGalleries.find(g => g.galleryId === photoGalleryId);

      const galleryId = photoGalleryId || currentGallery.id;
      const galleryName = matchingGallery?.galleryName || currentGallery.name;
      const clientName = matchingGallery?.clientName || currentGallery.clientName || 'Cliente';
      const eventDate = matchingGallery?.eventDate ? new Date(matchingGallery.eventDate) : undefined;
      const createdDate = matchingGallery?.createdDate ? new Date(matchingGallery.createdDate) : new Date(currentGallery.createdDate);

      if (!groups.has(galleryId)) {
        groups.set(galleryId, {
          galleryId,
          galleryName,
          clientName,
          photos: [],
          date: eventDate,
          createdDate: createdDate,
        });
      }

      groups.get(galleryId)!.photos.push(photo);
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Sort by event date or created date (newest first)
      const dateA = a.date || a.createdDate;
      const dateB = b.date || b.createdDate;

      if (dateA && dateB) {
        return dateB.getTime() - dateA.getTime();
      }
      if (dateA) return -1;
      if (dateB) return 1;
      return b.photos.length - a.photos.length;
    });
  }, [isSupplier, currentGallery, supplierGalleries]);

  const handlePhotoClick = (photo: Photo, index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxOpen(true);
  };

  const handleTagSupplier = (photoId: string) => {
    setPhotoToTag(photoId);
    setShowSupplierTagModal(true);
  };

  const handleSupplierTagged = async () => {
    const updatedGallery = await galleryService.getGalleryDetails(currentGallery.id);
    if (updatedGallery) {
      dispatch({ type: 'SET_CURRENT_GALLERY', payload: updatedGallery });
    }
  };

  const selectedCount = clientSession?.selectedPhotos.length || 0;
  const favoritesCount = clientSession?.favorites.length || 0;
  const printCartCount = clientSession?.printCart?.length || 0;

  console.log('📈 Counts:', { favoritesCount, selectedCount, printCartCount });
  console.log('💾 Session state:', clientSession);

  // Calculate days until expiration
  const getDaysUntilExpiration = () => {
    if (!currentGallery.expirationDate) return null;
    
    const now = new Date();
    const expiration = new Date(currentGallery.expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration();
  const isExpired = isGalleryExpired(currentGallery.expirationDate);

  console.log('🖼️ Cover photo:', coverPhoto);
  console.log('📷 Total photos:', currentGallery.photos.length);
  console.log('🆔 Cover photo ID:', currentGallery.coverPhotoId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Cover Photo */}
      {coverPhoto ? (
        <div className="relative h-96 overflow-hidden">
          <img
            src={coverPhoto.url}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              console.error('❌ Cover photo failed to load:', coverPhoto.url);
            }}
            onLoad={() => {
              console.log('✅ Cover photo loaded:', coverPhoto.url);
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          <div className="relative h-full flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              <div className="text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{currentGallery.clientName || 'Cliente'}</h1>
                <div className="flex items-center gap-4 text-lg opacity-90">
                  <span>{currentGallery.photos.length} fotos</span>
                  {daysUntilExpiration !== null && (
                    <>
                      <span>•</span>
                      <div className={`flex items-center gap-1 ${isExpired ? 'text-red-300' : daysUntilExpiration <= 7 ? 'text-yellow-300' : 'text-green-300'}`}>
                        <Clock size={16} />
                        <span>
                          {isExpired
                            ? 'Essa galeria expirou'
                            : daysUntilExpiration === 1
                              ? 'Essa galeria expira em 1 dia'
                              : `Essa galeria expira em ${daysUntilExpiration} dias`
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {currentGallery.description && (
                  <p className="text-lg opacity-90 mt-3 max-w-2xl">{currentGallery.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 relative h-96 overflow-hidden">
          <div className="relative h-full flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              <div className="text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{currentGallery.clientName || 'Cliente'}</h1>
                <div className="flex items-center gap-4 text-lg opacity-90">
                  <span>{currentGallery.photos.length} fotos</span>
                  {daysUntilExpiration !== null && (
                    <>
                      <span>•</span>
                      <div className={`flex items-center gap-1 ${isExpired ? 'text-red-300' : daysUntilExpiration <= 7 ? 'text-yellow-300' : 'text-green-300'}`}>
                        <Clock size={16} />
                        <span>
                          {isExpired
                            ? 'Essa galeria expirou'
                            : daysUntilExpiration === 1
                              ? 'Essa galeria expira em 1 dia'
                              : `Essa galeria expira em ${daysUntilExpiration} dias`
                          }
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header - Only for clients */}
      {!isSupplier && (
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Filters */}
                  <Button
                    variant={filter === 'all' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      console.log('🔘 Clicked "Todas" button');
                      setFilter('all');
                    }}
                  >
                    Todas ({currentGallery.photos.length})
                  </Button>

                  <Button
                    variant={filter === 'favorites' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      console.log('🔘 Clicked "Favoritas" button, current count:', favoritesCount);
                      setFilter('favorites');
                    }}
                    className="flex items-center gap-1"
                  >
                    <Heart size={16} />
                    Favoritas ({favoritesCount})
                  </Button>
                </div>

              {/* Selection Cart */}
              <div className="flex items-center gap-3">
                {/* Print Cart */}
                {printCartCount > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowPrintCart(true)}
                    className="flex items-center gap-2"
                  >
                    <Printer size={16} />
                    {printCartCount} para imprimir
                  </Button>
                )}
                
                {selectedCount > 0 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowSelection(true)}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart size={16} />
                      {selectedCount} selecionadas
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (clientSession && currentGallery) {
                          const selectedPhotos = currentGallery.photos.filter(photo =>
                            clientSession.selectedPhotos.includes(photo.id)
                          );

                          selectedPhotos.forEach(photo => {
                            dispatch({ type: 'ADD_TO_PRINT_CART', payload: photo.id });
                          });

                          dispatch({ type: 'CLEAR_SELECTED_PHOTOS' });
                          setShowPrintCart(true);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Printer size={16} />
                      Imprimir Selecionadas
                    </Button>
                  </>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Content */}
      {isSupplier ? (
        <SupplierTimeline
          galleryGroups={galleryGroups}
          onPhotoClick={handlePhotoClick}
          onTagSupplier={handleTagSupplier}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {filter === 'favorites' ? 'Nenhuma foto favorita ainda' : 'Nenhuma foto encontrada'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'favorites'
                  ? 'Marque algumas fotos como favoritas para vê-las aqui.'
                  : 'Esta galeria ainda não possui fotos.'}
              </p>
            </div>
          ) : (
            <PhotoGrid
              photos={filteredPhotos}
              onPhotoClick={handlePhotoClick}
              onTagSupplier={handleTagSupplier}
            />
          )}
        </div>
      )}

      {/* Lightbox */}
      <PhotoLightbox
        photos={isSupplier ? currentGallery.photos : filteredPhotos}
        currentIndex={currentPhotoIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setCurrentPhotoIndex}
        onTagSupplier={handleTagSupplier}
      />

      {/* Selection Panel */}
      <SelectionPanel
        isOpen={showSelection}
        onClose={() => setShowSelection(false)}
      />
      
      {/* Print Cart Panel */}
      <PrintCartPanel
        isOpen={showPrintCart}
        onClose={() => setShowPrintCart(false)}
      />

      {/* Supplier Tag Modal */}
      {photoToTag && (
        <SupplierTagModal
          isOpen={showSupplierTagModal}
          onClose={() => {
            setShowSupplierTagModal(false);
            setPhotoToTag(null);
          }}
          photoId={photoToTag}
          galleryId={currentGallery.id}
          currentSupplierId={currentGallery.photos.find(p => p.id === photoToTag)?.supplierId}
          onTagged={handleSupplierTagged}
        />
      )}
    </div>
  );
}