import React from 'react';
import { HardDrive, AlertTriangle } from 'lucide-react';
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

  const getStatusText = () => {
    if (usedPercentage < 70) return 'Armazenamento saudável';
    if (usedPercentage < 85) return 'Armazenamento moderado';
    if (usedPercentage < 95) return 'Armazenamento quase cheio';
    return 'Armazenamento crítico';
  };

  const showWarning = usedPercentage >= 85;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <HardDrive size={24} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Armazenamento R2
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formattedUsed} de {formattedTotal} utilizados
            </p>
          </div>
        </div>
        
        {showWarning && (
          <AlertTriangle size={20} className="text-yellow-500" />
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {getStatusText()}
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {Math.round(usedPercentage)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getStatusColor()}`}
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        </div>
        
        {showWarning && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            {usedPercentage >= 95 
              ? 'Considere fazer limpeza de galerias antigas ou aumentar o limite de armazenamento.'
              : 'Monitore o uso de armazenamento para evitar problemas futuros.'
            }
          </p>
        )}
      </div>
    </div>
  );
}