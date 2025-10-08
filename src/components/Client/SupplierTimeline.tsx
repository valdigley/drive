import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Image as ImageIcon, Heart, Check, Printer, Tag } from 'lucide-react';
import { Photo } from '../../types';
import { formatDate } from '../../utils/fileUtils';
import { useAppContext } from '../../contexts/AppContext';

interface GalleryGroup {
  galleryId: string;
  galleryName: string;
  clientName: string;
  photos: Photo[];
  date?: Date;
  createdDate?: Date;
}

interface SupplierTimelineProps {
  galleryGroups: GalleryGroup[];
  onPhotoClick: (photo: Photo, index: number) => void;
  onTagSupplier?: (photoId: string) => void;
}

export function SupplierTimeline({ galleryGroups, onPhotoClick, onTagSupplier }: SupplierTimelineProps) {
  const { state, dispatch } = useAppContext();
  const { clientSession } = state;
  const [expandedGalleries, setExpandedGalleries] = useState<Set<string>>(new Set([galleryGroups[0]?.galleryId]));
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);

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
    if (!clientSession) return;
    dispatch({ type: 'TOGGLE_PRINT_CART', payload: { photoId } });
  };

  const handleFavoriteToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clientSession) return;
    dispatch({ type: 'TOGGLE_FAVORITE', payload: { photoId } });
  };

  const handleSelectionToggle = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!clientSession) return;
    dispatch({ type: 'TOGGLE_SELECTION', payload: { photoId } });
  };

  const toggleGallery = (galleryId: string) => {
    setExpandedGalleries(prev => {
      const next = new Set(prev);
      if (next.has(galleryId)) {
        next.delete(galleryId);
      } else {
        next.add(galleryId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGalleries(new Set(galleryGroups.map(g => g.galleryId)));
  };

  const collapseAll = () => {
    setExpandedGalleries(new Set());
  };

  // Separate recent and old events (30 days threshold)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentEvents = galleryGroups.filter(g => {
    const displayDate = g.date || g.createdDate;
    return displayDate && displayDate >= thirtyDaysAgo;
  });

  const oldEvents = galleryGroups.filter(g => {
    const displayDate = g.date || g.createdDate;
    return displayDate && displayDate < thirtyDaysAgo;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Eventos com suas Fotos
        </h2>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Expandir Todos
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Recolher Todos
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Recent Events Section */}
        {recentEvents.length > 0 && (
          <div className="space-y-8 mb-12">
            <div className="ml-20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
                Eventos Recentes
              </h3>
            </div>
            {recentEvents.map((group, groupIndex) => {
            const isExpanded = expandedGalleries.has(group.galleryId);
            const globalPhotoIndex = galleryGroups
              .slice(0, groupIndex)
              .reduce((sum, g) => sum + g.photos.length, 0);

            return (
              <div key={group.galleryId} className="relative">
                {/* Timeline dot */}
                <div className="absolute left-8 top-6 w-4 h-4 -ml-2 rounded-full bg-blue-600 dark:bg-blue-500 border-4 border-white dark:border-gray-900 shadow-lg z-10"></div>

                {/* Event Card */}
                <div className="ml-20">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Header - Clickable */}
                    <button
                      onClick={() => toggleGallery(group.galleryId)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                          <Calendar className="text-white" size={24} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {group.galleryName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cliente: {group.clientName}
                          </p>
                          {(group.date || group.createdDate) && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                              {group.date ? formatDate(group.date) : `Criada em ${formatDate(group.createdDate!)}`}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <ImageIcon size={14} className="text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {group.photos.length} foto{group.photos.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {isExpanded ? 'Recolher' : 'Ver Fotos'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="text-blue-600 dark:text-blue-400" size={20} />
                        ) : (
                          <ChevronDown className="text-blue-600 dark:text-blue-400" size={20} />
                        )}
                      </div>
                    </button>

                    {/* Expandable Content */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {/* Photo Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {group.photos.map((photo, photoIndex) => (
                            <div
                              key={photo.id}
                              className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                              onMouseEnter={() => setHoveredPhoto(photo.id)}
                              onMouseLeave={() => setHoveredPhoto(null)}
                            >
                              <button
                                onClick={() => onPhotoClick(photo, globalPhotoIndex + photoIndex)}
                                className="w-full aspect-square relative overflow-hidden"
                              >
                                <img
                                  src={photo.thumbnail || photo.url}
                                  alt={photo.filename}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  loading="lazy"
                                />
                                <div className={`absolute inset-0 bg-black transition-all duration-300 pointer-events-none ${
                                  hoveredPhoto === photo.id ? 'bg-opacity-10' : 'bg-opacity-0'
                                }`} />
                              </button>

                              {/* Action Buttons Below Photo */}
                              <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-1">
                                  {onTagSupplier && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTagSupplier(photo.id);
                                      }}
                                      className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                        photo.supplierId
                                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600'
                                      }`}
                                      title={photo.supplierId ? 'Fornecedor marcado' : 'Marcar fornecedor'}
                                    >
                                      <Tag size={16} />
                                    </button>
                                  )}

                                  <button
                                    onClick={(e) => handlePrintCartToggle(photo.id, e)}
                                    className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                      isInPrintCart(photo.id)
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600'
                                    }`}
                                    title="Carrinho de impressão"
                                  >
                                    <Printer size={16} />
                                  </button>

                                  <button
                                    onClick={(e) => handleSelectionToggle(photo.id, e)}
                                    className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                      isSelected(photo.id)
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600'
                                    }`}
                                    title="Selecionar"
                                  >
                                    <Check size={16} />
                                  </button>

                                  <button
                                    onClick={(e) => handleFavoriteToggle(photo.id, e)}
                                    className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                      isFavorite(photo.id)
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600'
                                    }`}
                                    title="Favoritar"
                                  >
                                    <Heart
                                      size={16}
                                      fill={isFavorite(photo.id) ? 'currentColor' : 'none'}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Old Events Section */}
        {oldEvents.length > 0 && (
          <div className="space-y-8">
            <div className="ml-20">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar size={24} className="text-gray-600 dark:text-gray-400" />
                Eventos Anteriores
              </h3>
            </div>
            {oldEvents.map((group, groupIndex) => {
              const isExpanded = expandedGalleries.has(group.galleryId);
              const globalPhotoIndex = galleryGroups
                .slice(0, galleryGroups.indexOf(group))
                .reduce((sum, g) => sum + g.photos.length, 0);

              return (
                <div key={group.galleryId} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-8 top-6 w-4 h-4 -ml-2 rounded-full bg-gray-400 dark:bg-gray-600 border-4 border-white dark:border-gray-900 shadow-lg z-10"></div>

                  {/* Event Card */}
                  <div className="ml-20">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 opacity-75">
                      {/* Header - Clickable */}
                      <button
                        onClick={() => toggleGallery(group.galleryId)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg">
                            <Calendar className="text-white" size={24} />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {group.galleryName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Cliente: {group.clientName}
                            </p>
                            {(group.date || group.createdDate) && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 font-medium mt-1">
                                {group.date ? formatDate(group.date) : `Criada em ${formatDate(group.createdDate!)}`}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <ImageIcon size={14} className="text-gray-500" />
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {group.photos.length} foto{group.photos.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {isExpanded ? 'Recolher' : 'Ver Fotos'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="text-gray-600 dark:text-gray-400" size={20} />
                          ) : (
                            <ChevronDown className="text-gray-600 dark:text-gray-400" size={20} />
                          )}
                        </div>
                      </button>

                      {/* Expandable Content */}
                      <div
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {/* Photo Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {group.photos.map((photo, photoIndex) => (
                              <div
                                key={photo.id}
                                className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                                onMouseEnter={() => setHoveredPhoto(photo.id)}
                                onMouseLeave={() => setHoveredPhoto(null)}
                              >
                                <button
                                  onClick={() => onPhotoClick(photo, globalPhotoIndex + photoIndex)}
                                  className="w-full aspect-square relative overflow-hidden"
                                >
                                  <img
                                    src={photo.thumbnail || photo.url}
                                    alt={photo.filename}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                  <div className={`absolute inset-0 bg-black transition-all duration-300 pointer-events-none ${
                                    hoveredPhoto === photo.id ? 'bg-opacity-10' : 'bg-opacity-0'
                                  }`} />
                                </button>

                                {/* Action Buttons Below Photo */}
                                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center gap-1">
                                    {onTagSupplier && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onTagSupplier(photo.id);
                                        }}
                                        className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                          photo.supplierId
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600'
                                        }`}
                                        title={photo.supplierId ? 'Fornecedor marcado' : 'Marcar fornecedor'}
                                      >
                                        <Tag size={16} />
                                      </button>
                                    )}

                                    <button
                                      onClick={(e) => handlePrintCartToggle(photo.id, e)}
                                      className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                        isInPrintCart(photo.id)
                                          ? 'bg-green-600 text-white hover:bg-green-700'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600'
                                      }`}
                                      title="Carrinho de impressão"
                                    >
                                      <Printer size={16} />
                                    </button>

                                    <button
                                      onClick={(e) => handleSelectionToggle(photo.id, e)}
                                      className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                        isSelected(photo.id)
                                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600'
                                      }`}
                                      title="Selecionar"
                                    >
                                      <Check size={16} />
                                    </button>

                                    <button
                                      onClick={(e) => handleFavoriteToggle(photo.id, e)}
                                      className={`flex-1 p-2 rounded flex items-center justify-center transition-all duration-200 ${
                                        isFavorite(photo.id)
                                          ? 'bg-red-500 text-white hover:bg-red-600'
                                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600'
                                      }`}
                                      title="Favoritar"
                                    >
                                      <Heart
                                        size={16}
                                        fill={isFavorite(photo.id) ? 'currentColor' : 'none'}
                                      />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Empty State */}
      {galleryGroups.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhuma foto marcada
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Você ainda não tem fotos marcadas em nenhum evento.
          </p>
        </div>
      )}
    </div>
  );
}
