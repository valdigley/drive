import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {value.toLocaleString('pt-BR')}
          </p>
          {trend && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">{trend} este mês</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}