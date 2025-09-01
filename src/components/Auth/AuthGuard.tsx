import React, { useState, useEffect } from 'react';
import { Shield, ExternalLink, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { Button } from '../UI/Button';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthChange((authenticated) => {
      setIsAuthenticated(authenticated);
      setUser(authService.getUser());
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Check permission if required
  const hasRequiredPermission = !requiredPermission || authService.hasPermission(requiredPermission);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você precisa estar logado no sistema principal para acessar esta aplicação.
          </p>
          
          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = 'https://fotografo.site/login'}
              className="w-full flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              Fazer Login no Sistema Principal
            </Button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>Após fazer login, você será redirecionado automaticamente</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasRequiredPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-orange-600 dark:text-orange-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Permissão Insuficiente
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
          
          <Button
            onClick={() => authService.logout()}
            variant="secondary"
            className="w-full"
          >
            Voltar ao Sistema Principal
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}