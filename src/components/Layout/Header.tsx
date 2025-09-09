import React from 'react';
import { Camera, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';

export function Header() {
  const { state, dispatch } = useAppContext();
  const { theme } = state;

  const toggleTheme = () => {
    dispatch({ 
      type: 'SET_THEME', 
      payload: theme === 'light' ? 'dark' : 'light' 
    });
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DriVal</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Fotos</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === 'light' ? (
              <Moon size={20} />
            ) : (
              <Sun size={20} />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}