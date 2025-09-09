import React, { useEffect, useState } from 'react';
import { useAppContext } from './contexts/AppContext';
import { Button } from './components/UI/Button';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { GalleryManager } from './components/Admin/GalleryManager';
import { ClientGallery } from './components/Client/ClientGallery';
import { GalleryAccess } from './components/Client/GalleryAccess';
import { Header } from './components/Layout/Header';
import { galleryService } from './services/galleryService';
import { supabase } from './lib/supabase';

function App() {
  const { state, dispatch } = useAppContext();
  
  // State hooks - must be called unconditionally
  const [currentView, setCurrentView] = useState<'dashboard' | 'gallery-manager' | 'client-gallery'>('dashboard');
  const [managingGalleryId, setManagingGalleryId] = useState<string | null>(null);
  const [clientGalleryId, setClientGalleryId] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extract state values after hooks
  const { currentUser, galleries, theme } = state;

  // Effect hooks - must be called unconditionally
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const galleries = await galleryService.getAllGalleries();
        dispatch({ type: 'SET_GALLERIES', payload: galleries });
        
        const stats = await galleryService.getAdminStats();
        dispatch({ type: 'SET_ADMIN_STATS', payload: stats });
      } catch (error) {
        console.warn('App initialization completed with fallback data:', error);
      } finally {
        setInitializing(false);
      }
    };

    if (state.galleries.length === 0) {
      initializeApp();
    } else {
      setInitializing(false);
    }
  }, [dispatch, state.galleries.length]);

  useEffect(() => {
    const loadGalleryFromUrl = async () => {
      if (initializing) return;
      
      const path = window.location.pathname;
      const galleryMatch = path.match(/\/gallery\/(.+)/);
      
      if (galleryMatch) {
        const galleryId = galleryMatch[1];
        setClientGalleryId(galleryId);
        dispatch({ type: 'SET_USER_ROLE', payload: 'client' });
        
        let gallery = state.galleries.find(g => g.id === galleryId);
        
        if (!gallery) {
          setLoadingGallery(true);
          try {
            gallery = await galleryService.getGalleryDetails(galleryId);
            if (gallery) {
              const photos = await galleryService.getGalleryPhotos(galleryId);
              const completeGallery = { ...gallery, photos };
              dispatch({ type: 'ADD_GALLERY', payload: completeGallery });
              dispatch({ type: 'SET_CURRENT_GALLERY', payload: completeGallery });
            } else {
              console.log('Gallery not found:', galleryId);
            }
          } catch (error) {
            console.log('Gallery not found or error loading:', galleryId, error);
          } finally {
            setLoadingGallery(false);
          }
        } else {
          dispatch({ type: 'SET_CURRENT_GALLERY', payload: gallery });
        }
      }
    };
    
    loadGalleryFromUrl();
  }, [dispatch, initializing, state.galleries]);

  // Clean SSO token from URL after authentication
  useEffect(() => {
    if (!loading && user) {
      const urlParams = new URLSearchParams(window.location.search);
      const hasSsoToken = urlParams.has('sso_token') || urlParams.has('timestamp');
      
      if (hasSsoToken) {
        // Remove SSO parameters from URL
        urlParams.delete('sso_token');
        urlParams.delete('timestamp');
        
        // Update URL without reloading the page
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
        
        console.log('✅ SSO token cleaned from URL');
      }
    }
  }, [loading, user]);

  // Handler functions
  const handleManageGallery = (galleryId: string) => {
    setManagingGalleryId(galleryId);
    setCurrentView('gallery-manager');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setManagingGalleryId(null);
  };

  const handleClientAccessGranted = () => {
    setAccessGranted(true);
    setCurrentView('client-gallery');
  };

  // CONDITIONAL RENDERING - AFTER ALL HOOKS HAVE BEEN CALLED
  
  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="relative">
                {/* Camera aperture icon */}
                <div className="w-12 h-12 border-4 border-slate-800 rounded-full relative">
                  <div className="absolute inset-2 border-2 border-slate-800 rounded-full">
                    <div className="absolute inset-1 bg-slate-800 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {businessInfo?.name || 'Triagem'}
            </h1>
            <p className="text-slate-400 text-sm mb-1">By Valdigley Santos</p>
            <p className="text-slate-300 text-sm">Acesso Administrativo</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    );
  }

  if (initializing || loadingGallery) {
    return (
      <div className="min-h-screen bg-slate-800">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-slate-300">
            {initializing ? 'Carregando aplicação...' : 'Carregando galeria...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Client view with gallery access
  if (currentUser === 'client' && clientGalleryId) {
    const gallery = state.galleries.find(g => g.id === clientGalleryId) || state.currentGallery;
    
    if (!gallery) {
      return (
        <div className="min-h-screen bg-slate-800">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Galeria não encontrada</h1>
              <p className="text-slate-400 mb-4">
              A galeria que você está tentando acessar não existe ou foi removida.
              </p>
              <Button onClick={() => window.location.href = '/'}>
              Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (!accessGranted) {
      return (
        <GalleryAccess
          galleryId={clientGalleryId}
          onAccessGranted={handleClientAccessGranted}
        />
      );
    }
    
    return <ClientGallery />;
  }

  // Admin views
  return (
    <div className="min-h-screen bg-slate-800">
      <div className="h-screen">
      <Header />
      
      {currentView === 'dashboard' && (
        <AdminDashboard onManageGallery={handleManageGallery} />
      )}
      
      {currentView === 'gallery-manager' && managingGalleryId && (
        <GalleryManager
          galleryId={managingGalleryId}
          onBack={handleBackToDashboard}
        />
      )}
      </div>
    </div>
  );
}
    );
  }

  if (initializing || loadingGallery) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
            {initializing ? 'Carregando aplicação...' : 'Carregando galeria...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Client view with gallery access
  if (currentUser === 'client' && clientGalleryId) {
    const gallery = state.galleries.find(g => g.id === clientGalleryId) || state.currentGallery;
    
    if (!gallery) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Galeria não encontrada</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
              A galeria que você está tentando acessar não existe ou foi removida.
              </p>
              <Button onClick={() => window.location.href = '/'}>
              Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (!accessGranted) {
      return (
        <GalleryAccess
          galleryId={clientGalleryId}
          onAccessGranted={handleClientAccessGranted}
        />
      );
    }
    
    return <ClientGallery />;
  }

  // Admin views
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="h-screen">
      <Header />
      
      {currentView === 'dashboard' && (
        <AdminDashboard onManageGallery={handleManageGallery} />
      )}
      
      {currentView === 'gallery-manager' && managingGalleryId && (
        <GalleryManager
          galleryId={managingGalleryId}
          onBack={handleBackToDashboard}
        />
      )}
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Verifique seu email para confirmar a conta!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="admin@studio.com"
          placeholder="admin@studio.com"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Senha
        </label>
              {businessInfo?.logo_url ? (
                <img 
                  src={businessInfo.logo_url} 
                <div className="relative">
                  {/* Camera aperture icon */}
                  <div className="w-12 h-12 border-4 border-slate-800 rounded-full relative">
                    <div className="absolute inset-2 border-2 border-slate-800 rounded-full">
                      <div className="absolute inset-1 bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Button
        type="submit" 
        disabled={loading}
        loading={loading}
        className="w-full"
      >
        {isSignUp ? 'Criar Conta' : 'Entrar'}
      </Button>

      <div className="vs-text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </form>
  );
}

export default App;