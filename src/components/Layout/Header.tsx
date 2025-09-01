import React from 'react';
import { Camera, Moon, Sun, User } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';

export function Header() {
  const { state, dispatch } = useAppContext();
  const { theme, currentUser } = state;

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: theme === 'light' ? 'dark' : 'light' });
  };

  const toggleUserRole = () => {
    dispatch({ type: 'SET_USER_ROLE', payload: currentUser === 'admin' ? 'client' : 'admin' });
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PhotoShare Pro</h1>
              <p className="text-xs text-gray-600">
                {currentUser === 'admin' ? 'Painel do Fotógrafo' : 'Visualização do Cliente'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleUserRole}
              className="flex items-center gap-2"
            >
              <User size={16} />
              {currentUser === 'admin' ? 'Ver como Cliente' : 'Ver como Admin'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}