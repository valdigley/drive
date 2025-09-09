import React, { useState } from 'react';
import { Calendar, Eye, Download, Lock, Settings, ExternalLink, Camera, Trash2 } from 'lucide-react';
import { Gallery } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { VSButton, VSCard, VSCardBody } from '../UI/valdigley-design-system';
import { formatDate, isGalleryExpired } from '../../utils/fileUtils';
import { galleryService } from '../../services/galleryService';

interface GalleryCardProps {
  gallery: Gallery;
  onManage?: (galleryId: string) => void;
}

export function GalleryCard({ gallery, onManage }: GalleryCardProps) {
  const { dispatch } = useAppContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingGallery, setDeletingGallery] = useState(false);
  const isExpired = isGalleryExpired(gallery.expirationDate);
  const previewPhotos = gallery.photos.slice(0, 4);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/gallery/${gallery.id}`;
    navigator.clipboard.writeText(link);
    // In a real app, show a toast notification
    alert('Link copiado para a área de transferência!');
  };

  const handleDelete = async () => {
    setDeletingGallery(true);
    try {
      await galleryService.deleteGallery(gallery.id);
      dispatch({ type: 'DELETE_GALLERY', payload: gallery.id });
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting gallery:', error);
      alert('Erro ao deletar galeria');
    } finally {
      setDeletingGallery(false);
    }
  };
  return (
    <VSCard className={`vs-overflow-hidden ${isExpired ? 'vs-opacity-75' : ''}`}>
      {/* Photo Preview Grid */}
      <div className="vs-aspect-square vs-bg-secondary vs-relative vs-overflow-hidden">
        {previewPhotos.length > 0 ? (
          <div className="vs-grid vs-grid-2 vs-gap-1 vs-h-full">
            {previewPhotos.map((photo, index) => (
              <div key={photo.id} className="vs-relative vs-overflow-hidden">
                <img
                  src={photo.thumbnail}
                  alt={photo.filename}
                  className="vs-w-full vs-h-full vs-object-cover vs-transition vs-hover-scale"
                />
              </div>
            ))}
            {gallery.photos.length > 4 && (
              <div className="vs-absolute vs-bottom-2 vs-right-2 vs-bg-black vs-bg-opacity-60 vs-text-white vs-text-xs vs-px-2 vs-py-1 vs-rounded">
                +{gallery.photos.length - 4} fotos
              </div>
            )}
          </div>
        ) : (
          <div className="vs-flex vs-items-center vs-justify-center vs-h-full">
            <div className="vs-text-center">
              <Camera size={32} className="vs-text-tertiary vs-mx-auto vs-mb-2" />
              <p className="vs-text-sm vs-text-tertiary">Nenhuma foto</p>
            </div>
          </div>
        )}
        
        {isExpired && (
          <div className="vs-badge vs-badge-error vs-absolute vs-top-2 vs-right-2">
            Expirada
          </div>
        )}
      </div>

      {/* Gallery Info */}
      <VSCardBody>
        <div className="vs-flex vs-justify-between vs-items-start vs-mb-2">
          <h3 className="vs-font-semibold vs-text-primary vs-truncate">{gallery.name}</h3>
          {gallery.password && (
            <Lock size={16} className="vs-text-tertiary vs-flex-shrink-0 vs-ml-2" />
          )}
        </div>
        
        <p className="vs-text-sm vs-text-secondary vs-mb-3">{gallery.clientName}</p>

        {/* Stats */}
        <div className="vs-flex vs-items-center vs-gap-4 vs-text-xs vs-text-tertiary vs-mb-4">
          <div className="vs-flex vs-items-center vs-gap-1">
            <Eye size={12} />
            {gallery.accessCount}
          </div>
          <div className="vs-flex vs-items-center vs-gap-1">
            <Download size={12} />
            {gallery.downloadCount}
          </div>
          <div className="vs-flex vs-items-center vs-gap-1">
            <Calendar size={12} />
            {formatDate(gallery.createdDate)}
          </div>
        </div>

        {/* Actions */}
        <div className="vs-flex vs-gap-2">
          <VSButton
            size="sm"
            variant="secondary"
            onClick={handleCopyLink}
            className="vs-flex-1 vs-text-xs"
            icon={<ExternalLink size={14} />}
          >
            Copiar Link
          </VSButton>
          
          <VSButton
            size="sm"
            variant="secondary"
            onClick={() => onManage?.(gallery.id)}
            className="vs-flex-1 vs-text-xs"
            icon={<Settings size={16} />}
          >
            Gerenciar
          </VSButton>
        </div>
      </VSCardBody>
    </VSCard>
  );
}