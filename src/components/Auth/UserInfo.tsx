import React from 'react';
import { User, LogOut } from 'lucide-react';
import { authService } from '../../services/authService';
import { Button } from '../UI/Button';

export function UserInfo() {
  const user = authService.getUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
          <User size={16} className="text-blue-600 dark:text-blue-400" />
        </div>
        <span className="hidden sm:block">{user.name}</span>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => authService.logout()}
        className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Sair"
      >
        <LogOut size={16} />
      </Button>
    </div>
  );
}