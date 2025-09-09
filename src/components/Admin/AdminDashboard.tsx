import React, { useState } from 'react';
import { Plus, Camera, Eye, Download, Calendar, Users, Image, TrendingUp } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { CreateGalleryModal } from './CreateGalleryModal';
import { GalleryCard } from './GalleryCard';
import { formatDate } from '../../utils/fileUtils';

interface AdminDashboardProps {
  onManageGallery: (galleryId: string) => void;
}

export function AdminDashboard({ onManageGallery }: AdminDashboardProps) {
  const { state } = useAppContext();
  const { galleries, adminStats } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const recentGalleries = galleries
    .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime())
    .slice(0, 6);

  const statsCards = [
    {
      title: 'Total de Galerias',
      value: adminStats.totalGalleries,
      icon: <Image size={24} />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total de Fotos',
      value: adminStats.totalPhotos,
      icon: <Camera size={24} />,
      color: 'bg-green-500',
    },
    {
      title: 'Visualizações',
      value: adminStats.totalViews,
      icon: <Eye size={24} />,
      color: 'bg-purple-500',
    },
    {
      title: 'Downloads',
      value: adminStats.totalDownloads,
      icon: <Download size={24} />,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Camera size={64} className="text-blue-600" />
            <div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white">DriVal</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">Sistema de Compartilhamento de Fotos</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Galerias Recentes</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {galleries.length === 0 ? 'Nenhuma galeria criada ainda' : `${galleries.length} galeria${galleries.length !== 1 ? 's' : ''} no total`}
            </p>
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus size={20} />
            Nova Galeria
          </Button>
        </div>

        {/* Galleries Grid */}
        {galleries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma galeria criada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Comece criando sua primeira galeria para compartilhar fotos com seus clientes de forma segura e organizada.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Criar Primeira Galeria
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentGalleries.map((gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                onManage={onManageGallery}
              />
            ))}
          </div>
        )}

        {/* Show more galleries if there are more than 6 */}
        {galleries.length > 6 && (
          <div className="text-center mt-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Mostrando {recentGalleries.length} de {galleries.length} galerias
            </p>
            <Button variant="secondary">
              Ver Todas as Galerias
            </Button>
          </div>
        )}

        {/* Recent Activity */}
        {galleries.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Atividade Recente</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="space-y-4">
                  {recentGalleries.slice(0, 5).map((gallery) => (
                    <div key={gallery.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Camera size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{gallery.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {gallery.clientName} • {gallery.photos.length} fotos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(gallery.createdDate)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {gallery.accessCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download size={12} />
                            {gallery.downloadCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Gallery Modal */}
      <CreateGalleryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}