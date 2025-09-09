import React from 'react';
import { Camera } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <img 
              src="/image.png" 
              alt="Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">DriVal</h1>
          </div>
        </div>
      </div>
    </header>
  );
}