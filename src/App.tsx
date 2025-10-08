import React, { useEffect, useState } from 'react';
import { useAppContext } from './contexts/AppContext';
import { Button } from './components/UI/Button';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { GalleryManager } from './components/Admin/GalleryManager';
import { ClientGallery } from './components/Client/ClientGallery';
import { ClientDashboard } from './components/Client/ClientDashboard';
import { GalleryAccess } from './components/Client/GalleryAccess';
import { Header } from './components/Layout/Header';
import { galleryService } from './services/galleryService';
import { supplierService } from './services/supplierService';
import { clientService } from './services/clientService';
import { favoriteService } from './services/favoriteService';
import { setGlobalDispatch } from './utils/fileUtils';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { supabase } from './lib/supabase';

function App() {
  const { state, dispatch } = useAppContext();

  // State hooks - must be called unconditionally
  const [currentView, setCurrentView] = useState<'dashboard' | 'gallery-manager' | 'client-gallery' | 'client-dashboard'>('dashboard');
  const [managingGalleryId, setManagingGalleryId] = useState<string | null>(null);
  const [clientGalleryId, setClientGalleryId] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to initialize client session with favorites from database
  const initializeClientSession = async (galleryId: string, clientId?: string) => {
    const sessionId = `gallery_session_${galleryId}`;
    const existingSession = localStorage.getItem(sessionId);

    // Load favorites from database
    const favoritesFromDB = await favoriteService.getFavorites(galleryId, sessionId);
    console.log('💾 Favorites loaded from database:', favoritesFromDB.length);

    const session = existingSession ? JSON.parse(existingSession) : {
      galleryId: galleryId,
      accessedAt: new Date(),
      favorites: [],
      selectedPhotos: [],
      printCart: [],
      downloads: 0,
    };

    // Update with favorites from database
    session.favorites = favoritesFromDB;
    session.accessedAt = new Date();

    localStorage.setItem(sessionId, JSON.stringify(session));
    dispatch({ type: 'SET_CLIENT_SESSION', payload: session });
  };

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
    setGlobalDispatch(dispatch);
  }, [dispatch]);

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

      const urlParams = new URLSearchParams(window.location.search);
      const accessCode = urlParams.get('code');
      const path = window.location.pathname;
      const galleryMatch = path.match(/\/gallery\/(.+)/);

      if (accessCode && !clientGalleryId) {
        setLoadingGallery(true);
        try {
          // Check if this is a supplier access code
          const supplier = await supplierService.getSupplierByAccessCode(accessCode);

          if (supplier && supplier.galleryId) {
            // It's a supplier accessing their gallery
            console.log('✅ Supplier found:', supplier.name, 'ID:', supplier.id, 'Gallery:', supplier.galleryId);
            const gallery = await galleryService.getGalleryDetails(supplier.galleryId);
            if (gallery) {
              console.log('✅ Gallery found:', gallery.name);
              // Load only photos tagged for this supplier
              const photos = await galleryService.getGalleryPhotos(supplier.galleryId, supplier.id);
              console.log('✅ Photos loaded for supplier:', photos.length);
              const completeGallery = { ...gallery, photos };
              dispatch({ type: 'ADD_GALLERY', payload: completeGallery });
              dispatch({ type: 'SET_CURRENT_GALLERY', payload: completeGallery });
              dispatch({ type: 'SET_CURRENT_SUPPLIER_ID', payload: supplier.id });
              setClientGalleryId(supplier.galleryId);
              dispatch({ type: 'SET_USER_ROLE', payload: 'supplier' });
              setAccessGranted(true);
              // Initialize client session for supplier
              await initializeClientSession(supplier.galleryId);
            }
          } else {
            // Check if this is a client access code
            const client = await clientService.getClientByAccessCode(accessCode);

            if (client) {
              // It's a client - show their dashboard
              console.log('✅ Client found:', client.name);
              const clientGalleries = await clientService.getClientGalleries(client.id);

              if (clientGalleries.length > 0) {
                // Set client info and show dashboard
                dispatch({ type: 'SET_CURRENT_CLIENT_ID', payload: client.id });
                dispatch({ type: 'SET_CURRENT_CLIENT_NAME', payload: client.name });
                dispatch({ type: 'SET_USER_ROLE', payload: 'client' });
                setCurrentView('client-dashboard');
                setAccessGranted(true);
              } else {
                setError('Este cliente não possui galerias vinculadas');
              }
            } else {
              // Try regular gallery access code
              const gallery = await galleryService.getGalleryByAccessCode(accessCode);
              if (gallery) {
                const photos = await galleryService.getGalleryPhotos(gallery.id);
                const completeGallery = { ...gallery, photos };
                dispatch({ type: 'ADD_GALLERY', payload: completeGallery });
                dispatch({ type: 'SET_CURRENT_GALLERY', payload: completeGallery });
                setClientGalleryId(gallery.id);
                dispatch({ type: 'SET_USER_ROLE', payload: 'client' });

                // Grant access immediately if no password and initialize session
                if (!gallery.password) {
                  setAccessGranted(true);
                  await initializeClientSession(gallery.id);
                }
              } else {
                console.log('Gallery not found with access code:', accessCode);
              }
            }
          }
        } catch (error) {
          console.log('Error loading gallery by access code:', accessCode, error);
        } finally {
          setLoadingGallery(false);
        }
        return;
      }

      if (galleryMatch && !clientGalleryId) {
        const galleryId = galleryMatch[1];
        setClientGalleryId(galleryId);

        // Check if there's a saved supplierId for supplier access
        const savedSupplierId = localStorage.getItem('currentSupplierId');

        if (savedSupplierId) {
          console.log('🔄 Reloading supplier gallery with saved supplier ID:', savedSupplierId);
          dispatch({ type: 'SET_USER_ROLE', payload: 'supplier' });
          dispatch({ type: 'SET_CURRENT_SUPPLIER_ID', payload: savedSupplierId });
        } else {
          dispatch({ type: 'SET_USER_ROLE', payload: 'client' });
        }

        let gallery = state.galleries.find(g => g.id === galleryId);

        if (!gallery) {
          setLoadingGallery(true);
          try {
            gallery = await galleryService.getGalleryDetails(galleryId);
            if (gallery) {
              // Load photos filtered by supplier if saved
              const photos = await galleryService.getGalleryPhotos(galleryId, savedSupplierId || undefined);
              console.log('✅ Photos loaded on reload:', photos.length);
              const completeGallery = { ...gallery, photos };
              dispatch({ type: 'ADD_GALLERY', payload: completeGallery });
              dispatch({ type: 'SET_CURRENT_GALLERY', payload: completeGallery });

              // Grant access immediately if no password and initialize session
              if (!gallery.password) {
                setAccessGranted(true);
                await initializeClientSession(galleryId);
              }
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

          // Grant access immediately if no password
          if (!gallery.password) {
            setAccessGranted(true);
          }
        }
      }
    };

    loadGalleryFromUrl();
  }, [dispatch, initializing]);

  // Handler functions
  const handleManageGallery = (galleryId: string) => {
    setManagingGalleryId(galleryId);
    setCurrentView('gallery-manager');
  };

  const handleSelectClientGallery = async (galleryId: string) => {
    try {
      setLoadingGallery(true);
      const gallery = await galleryService.getGalleryDetails(galleryId);
      if (gallery) {
        const photos = await galleryService.getGalleryPhotos(galleryId);
        const completeGallery = { ...gallery, photos };
        dispatch({ type: 'ADD_GALLERY', payload: completeGallery });
        dispatch({ type: 'SET_CURRENT_GALLERY', payload: completeGallery });
        setClientGalleryId(galleryId);
        setCurrentView('client-gallery');
        setAccessGranted(true);
        // Initialize client session
        await initializeClientSession(galleryId);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleBackToClientDashboard = () => {
    setCurrentView('client-dashboard');
    setClientGalleryId(null);
    dispatch({ type: 'SET_CURRENT_GALLERY', payload: null });
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated AND not accessing a gallery
  if (!user && !clientGalleryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">DriVal</h1>
            <p className="text-gray-600 dark:text-gray-400">Faça login para continuar</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (initializing || loadingGallery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">
            {initializing ? 'Carregando aplicação...' : 'Carregando galeria...'}
          </p>
        </div>
      </div>
    );
  }

  // Client Dashboard view
  if (currentUser === 'client' && currentView === 'client-dashboard' && state.currentClientId && state.currentClientName) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <ClientDashboard
          clientId={state.currentClientId}
          clientName={state.currentClientName}
          onSelectGallery={handleSelectClientGallery}
        />
      </div>
    );
  }

  // Client or Supplier view with gallery access
  if ((currentUser === 'client' || currentUser === 'supplier') && clientGalleryId) {
    const gallery = state.galleries.find(g => g.id === clientGalleryId) || state.currentGallery;

    if (!gallery) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Galeria não encontrada</h1>
            <p className="text-gray-600 mb-4">
              A galeria que você está tentando acessar não existe ou foi removida.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      );
    }

    // If gallery has password and user hasn't provided it, show password screen
    if (gallery.password && !accessGranted) {
      return (
        <GalleryAccess
          galleryId={clientGalleryId}
          onAccessGranted={handleClientAccessGranted}
        />
      );
    }

    // Show gallery if access granted or no password required
    if (accessGranted || !gallery.password) {
      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          {state.currentClientId && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToClientDashboard}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar para Minhas Galerias
                </Button>
              </div>
            </div>
          )}
          <ClientGallery />
        </div>
      );
    }

    // Still loading access verification
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Admin views
  return (
    <div className="min-h-screen bg-gray-50">
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
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 hover:text-blue-500 text-sm"
        >
          {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
        </button>
      </div>
    </form>
  );
}

export default App;