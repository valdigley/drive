import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Image as ImageIcon } from 'lucide-react';
import { Photo } from '../../types';
import { formatDate } from '../../utils/fileUtils';

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
}

export function SupplierTimeline({ galleryGroups, onPhotoClick }: SupplierTimelineProps) {
  const [expandedGalleries, setExpandedGalleries] = useState<Set<string>>(new Set([galleryGroups[0]?.galleryId]));

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
                            <button
                              key={photo.id}
                              onClick={() => onPhotoClick(photo, globalPhotoIndex + photoIndex)}
                              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:ring-2 hover:ring-blue-500 transition-all duration-200"
                            >
                              <img
                                src={photo.thumbnail || photo.url}
                                alt={photo.filename}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                                    <ImageIcon size={20} className="text-blue-600 dark:text-blue-400" />
                                  </div>
                                </div>
                              </div>
                            </button>
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
                              <button
                                key={photo.id}
                                onClick={() => onPhotoClick(photo, globalPhotoIndex + photoIndex)}
                                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 hover:ring-2 hover:ring-gray-500 transition-all duration-200"
                              >
                                <img
                                  src={photo.thumbnail || photo.url}
                                  alt={photo.filename}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg">
                                      <ImageIcon size={20} className="text-gray-600 dark:text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                              </button>
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
