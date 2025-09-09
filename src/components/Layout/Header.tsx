import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { businessService } from '../../services/businessService';

export function Header() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinessInfo = async () => {
      try {
        const businessInfo = await businessService.getBusinessInfo();
        if (businessInfo?.logo_url) {
          setLogoUrl(businessInfo.logo_url);
        }
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
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-8 w-auto"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <Camera size={32} className="text-blue-600" />
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              DriVal
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}