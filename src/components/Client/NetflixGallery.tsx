import React, { useState, useEffect } from 'react';
import { Play, Heart, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo } from '../../types';
import { VideoPlayer } from './VideoPlayer';
import { r2Service } from '../../services/r2Service';

interface NetflixGalleryProps {
  photos: Photo[];
  onToggleFavorite?: (photoId: string) => void;
  favoriteIds?: string[];
}

const categories = [
  { id: 'making_of', label: 'Making Of', icon: '🎬' },
  { id: 'cerimonia', label: 'Cerimônia', icon: '💍' },
  { id: 'festa', label: 'Festa', icon: '🎉' },
  { id: 'outros', label: 'Outros', icon: '📸' },
];

export function NetflixGallery({ photos, onToggleFavorite, favoriteIds = [] }: NetflixGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<Photo | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSignedUrls = async () => {
      const urls: Record<string, string> = {};

      for (const photo of photos) {
        if (photo.r2Key && !photo.r2Key.startsWith('data:')) {
          urls[photo.id] = await r2Service.getSignedViewUrl(photo.r2Key);
        } else {
          urls[photo.id] = photo.url;
        }
      }

      setSignedUrls(urls);
    };

    loadSignedUrls();
  }, [photos]);

  const getPhotosByCategory = (categoryId: string) => {
    return photos.filter(p => (p.metadata?.category || 'outros') === categoryId);
  };

  const handleMediaClick = (photo: Photo) => {
    setSelectedMedia(photo);
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const signedUrl = await r2Service.getSignedDownloadUrl(photo.r2Key, photo.filename);
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = photo.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const scrollRow = (categoryId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(`row-${categoryId}`);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section - Featured Video or Photo */}
      {photos.length > 0 && (
        <div className="relative h-[70vh] mb-8">
          <div className="absolute inset-0">
            {photos[0].mediaType === 'video' && photos[0].videoUrl ? (
              <div className="w-full h-full">
                <VideoPlayer
                  videoUrl={signedUrls[photos[0].id] || photos[0].videoUrl!}
                  thumbnail={photos[0].thumbnail}
                  title={photos[0].filename}
                />
              </div>
            ) : (
              <img
                src={photos[0].thumbnail || signedUrls[photos[0].id] || photos[0].url}
                alt="Featured"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-12">
            <h1 className="text-5xl font-bold mb-4">Sua Galeria</h1>
            <p className="text-xl text-gray-300 mb-6 max-w-2xl">
              Reviva os melhores momentos organizados por categorias
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleMediaClick(photos[0])}
                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded font-semibold hover:bg-gray-200 transition"
              >
                <Play size={24} fill="black" />
                Ver Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Rows */}
      <div className="px-12 pb-12 space-y-12">
        {categories.map(category => {
          const categoryPhotos = getPhotosByCategory(category.id);

          if (categoryPhotos.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>{category.icon}</span>
                {category.label}
                <span className="text-sm text-gray-400 ml-2">
                  ({categoryPhotos.length})
                </span>
              </h2>

              <div className="relative group">
                {/* Scroll Buttons */}
                <button
                  onClick={() => scrollRow(category.id, 'left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/90"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={() => scrollRow(category.id, 'right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-full bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/90"
                >
                  <ChevronRight size={32} />
                </button>

                {/* Photos Row */}
                <div
                  id={`row-${category.id}`}
                  className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categoryPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative flex-shrink-0 w-72 h-40 group/item cursor-pointer"
                      onMouseEnter={() => setHoveredId(photo.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleMediaClick(photo)}
                    >
                      <div className="relative w-full h-full rounded overflow-hidden transition-transform group-hover/item:scale-105">
                        <img
                          src={photo.thumbnail || signedUrls[photo.id] || photo.url}
                          alt={photo.filename}
                          className="w-full h-full object-cover"
                        />
                        {photo.mediaType === 'video' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play size={48} fill="white" className="text-white" />
                          </div>
                        )}

                        {/* Hover Overlay */}
                        {hoveredId === photo.id && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4">
                            <div className="flex items-center gap-2 mb-2">
                              {onToggleFavorite && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(photo.id);
                                  }}
                                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition"
                                >
                                  <Heart
                                    size={16}
                                    className={favoriteIds.includes(photo.id) ? 'fill-red-500 text-red-500' : 'text-white'}
                                  />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(photo);
                                }}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-200 truncate">
                              {photo.filename}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox/Player Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-6xl">
            {selectedMedia.mediaType === 'video' && selectedMedia.videoUrl ? (
              <VideoPlayer
                videoUrl={signedUrls[selectedMedia.id] || selectedMedia.videoUrl}
                thumbnail={selectedMedia.thumbnail}
                title={selectedMedia.filename}
              />
            ) : (
              <img
                src={signedUrls[selectedMedia.id] || selectedMedia.url}
                alt={selectedMedia.filename}
                className="w-full h-auto rounded-lg"
              />
            )}

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{selectedMedia.filename}</h3>
                <p className="text-gray-400">
                  {categories.find(c => c.id === (selectedMedia.metadata?.category || 'outros'))?.label}
                </p>
              </div>
              <div className="flex gap-2">
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(selectedMedia.id)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
                  >
                    <Heart
                      size={20}
                      className={favoriteIds.includes(selectedMedia.id) ? 'fill-red-500 text-red-500' : 'text-white'}
                    />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(selectedMedia)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
