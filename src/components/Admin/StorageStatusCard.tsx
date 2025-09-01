import React from 'react';
import { HardDrive } from 'lucide-react';
import { StorageStats } from '../../services/storageService';

interface StorageStatusCardProps {
  storageStats: StorageStats;
}

export function StorageStatusCard({ storageStats }: StorageStatusCardProps) {
  const { usedPercentage, formattedUsed, formattedTotal } = storageStats;
  
  const getStatusColor = () => {
    if (usedPercentage < 70) return 'bg-green-500';
    if (usedPercentage < 85) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Armazenamento R2
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formattedUsed} / {formattedTotal}
            </span>
          </div>
          
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {Math.round(usedPercentage)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getStatusColor()}`}
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}