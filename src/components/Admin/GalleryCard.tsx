import React, { useState } from 'react';
import { Calendar, Eye, Download, Lock, Settings, ExternalLink, Camera, Trash2 } from 'lucide-react';
import { Gallery } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { formatDate, isGalleryExpired } from '../../utils/fileUtils';

interface GalleryCardProps {
  gallery: Gallery;
  onManage?: (galleryId: string) => void;
}

export function GalleryCard({ gallery, onManage }: GalleryCardProps) {
  const isExpired = isGalleryExpired(gallery.expirationDate);
  const previewPhotos = gallery.photos.slice(0, 4);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/gallery/${gallery.id}`;
    navigator.clipboard.writeText(link);
    // In a real app, show a toast notification
    alert('Link copiado para a área de transferência!');
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${isExpired ? 'opacity-75' : ''}`}>
      {/* Photo Preview Grid */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {previewPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 h-full">
            {previewPhotos.map((photo, index) => (
              <div key={photo.id} className="relative overflow-hidden">
                <img
                  src={photo.thumbnail}
                  alt={photo.filename}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
            {gallery.photos.length > 4 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                +{gallery.photos.length - 4} fotos
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Camera size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Nenhuma foto</p>
            </div>
          </div>
        )}
        
        {isExpired && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Expirada
          </div>
        )}
      </div>

      {/* Gallery Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{gallery.name}</h3>
          {gallery.password && (
            <Lock size={16} className="text-gray-400 flex-shrink-0 ml-2" />
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{gallery.clientName}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Eye size={12} />
            {gallery.accessCount}
          </div>
          <div className="flex items-center gap-1">
            <Download size={12} />
            {gallery.downloadCount}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(gallery.createdDate)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            className="flex-1 text-xs"
          >
            <ExternalLink size={14} className="mr-1" />
            Copiar Link
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onManage?.(gallery.id)}
            className="px-2"
          >
            <Settings size={16} />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-gray-900 mb-4">Deletar esta galeria?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
              >
                Deletar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}