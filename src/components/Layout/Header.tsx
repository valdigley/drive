import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Header() {
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

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            {businessInfo?.logo_url ? (
              <img
                src={businessInfo.logo_url}
                alt="Logo"
                className="h-12 w-12 object-contain"
              />
            ) : (
              <Camera size={32} className="text-blue-600" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {businessInfo?.name || 'DriVal'}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}