import React from 'react';
import { Moon, Sun } from 'lucide-react';
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
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">DV</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">DriVal</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sistema de Fotos</p>
                </div>
              </div>
            </div>
            
            {/* Dashboard Title */}
            {currentUser === 'admin' && (
              <div className="border-l border-gray-300 dark:border-gray-600 pl-6">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Dashboard</h2>
              </div>
            )}
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
      </div>
    </header>
  );
}