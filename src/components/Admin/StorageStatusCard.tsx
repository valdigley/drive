import React, { useState } from 'react';
import { HardDrive, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { StorageStats } from '../../services/storageService';

interface StorageStatusCardProps {
  storageStats: StorageStats;
}

export function StorageStatusCard({ storageStats }: StorageStatusCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { usedPercentage, formattedUsed, formattedTotal, totalPhotos, topGalleries } = storageStats;

  const getStatusColor = () => {
    if (usedPercentage < 70) return 'bg-green-500';
    if (usedPercentage < 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusTextColor = () => {
    if (usedPercentage < 70) return 'text-green-700 dark:text-green-400';
    if (usedPercentage < 85) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-red-700 dark:text-red-400';
  };

  const getBarColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-400';
    if (percentage < 85) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <HardDrive size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Armazenamento R2
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formattedUsed} / {formattedTotal}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusTextColor()} bg-opacity-10`}>
              {totalPhotos} {totalPhotos === 1 ? 'foto' : 'fotos'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${getStatusTextColor()}`}>
              {Math.round(usedPercentage)}%
            </span>
            {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getStatusColor()}`}
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        </div>

        {/* Expanded Details */}
        {expanded && topGalleries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Galerias que mais ocupam espaço
            </h4>
            <div className="space-y-3">
              {topGalleries.map((gallery) => (
                <div key={gallery.galleryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Camera size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {gallery.galleryName}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs flex-shrink-0">
                        ({gallery.photoCount} {gallery.photoCount === 1 ? 'foto' : 'fotos'})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-gray-600 dark:text-gray-400">
                        {gallery.formattedSize}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs w-12 text-right">
                        {Math.round(gallery.percentage)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(gallery.percentage)}`}
                      style={{ width: `${Math.min(gallery.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
