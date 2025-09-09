import React, { useEffect, useState } from 'react';
import { useSessionVerification } from './hooks/useSessionVerification';
import { SessionRedirect } from './components/Auth/SessionRedirect';
import { useAppContext } from './contexts/AppContext';
import { Button } from './components/UI/Button';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { GalleryManager } from './components/Admin/GalleryManager';
import { ClientGallery } from './components/Client/ClientGallery';
import { GalleryAccess } from './components/Client/GalleryAccess';
import { Header } from './components/Layout/Header';
import { galleryService } from './services/galleryService';
import { setGlobalDispatch } from './utils/fileUtils';
import { LoadingSpinner } from './components/UI/LoadingSpinner';

function App() {
  // ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL LOGIC BEFORE THIS POINT
  const { isVerifying, isAuthenticated } = useSessionVerification();
  const { state, dispatch } = useAppContext();
  
  // State hooks - must be called unconditionally
  const [currentView, setCurrentView] = useState<'dashboard' | 'gallery-manager' | 'client-gallery'>('dashboard');
  const [managingGalleryId, setManagingGalleryId] = useState<string | null>(null);
  const [clientGalleryId, setClientGalleryId] = useState<string | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [initializing, setInitializing] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Extract state values after hooks
  const { currentUser, galleries, theme } = state;

  // Effect hooks - must be called unconditionally
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
  
  // Show loading while verifying session
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Show redirect screen if not authenticated (only in production)
  if (!isAuthenticated && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('stackblitz') &&
      !window.location.hostname.includes('bolt.new') &&
      !window.location.hostname.includes('bolt') &&
      !window.location.hostname.includes('webcontainer') &&
      !window.location.hostname.includes('csb.app') &&
      window.location.port !== '5173') {
    return <SessionRedirect />;
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

  // Client view with gallery access
  if (currentUser === 'client' && clientGalleryId) {
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

export default App;