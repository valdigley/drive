import React, { useState, useEffect } from 'react';
import { Camera, Moon, Sun, User } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { Button } from '../UI/Button';
import { supabase } from '../../lib/supabase';

export function Header() {
  const { state, dispatch } = useAppContext();
  const { theme } = state;
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('business_info')
          .select('*')
          .single();

        if (error) {
          console.error('Error loading business info:', error);
          return;
        }

        setBusinessInfo(data);
      } catch (error) {
        console.error('Error loading business info:', error);
      }
    };

    loadBusinessInfo();
  }, []);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            {businessInfo?.logo_url_drive ? (
              <img 
                src={businessInfo.logo_url_drive} 
                alt="Logo" 
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Camera size={32} className="text-blue-600 dark:text-blue-400" />
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {businessInfo?.name || 'DriVal'}
            </h1>
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

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User size={16} />
              <span>Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}