import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value.toLocaleString('pt-BR')}
          </p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">{trend} este mês</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}