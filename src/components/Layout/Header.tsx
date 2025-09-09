import React from 'react';
import { Camera, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';

export function Header() {
  const { state, dispatch } = useAppContext();
  const { theme, currentUser } = state;

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <Camera size={32} className="text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">DriVal</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sistema de Fotos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}