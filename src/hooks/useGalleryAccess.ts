import { useState, useEffect } from 'react';
import { Gallery, ClientSession } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { galleryService } from '../services/galleryService';
import { favoriteService } from '../services/favoriteService';

export function useGalleryAccess(galleryId: string) {
  const { state, dispatch } = useAppContext();
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      const gallery = state.galleries.find(g => g.id === galleryId) || state.currentGallery;

      if (!gallery) {
        setLoading(false);
        return;
      }

      // Check if gallery requires password
      if (gallery.password) {
        const sessionKey = `gallery_access_${galleryId}`;
        const savedAccess = localStorage.getItem(sessionKey);

        if (savedAccess) {
          const accessData = JSON.parse(savedAccess);
          const now = new Date().getTime();
          const accessTime = new Date(accessData.timestamp).getTime();
          const hoursSinceAccess = (now - accessTime) / (1000 * 60 * 60);

          if (hoursSinceAccess < 24) {
            setAccessGranted(true);
            await initializeClientSession(gallery);
            setLoading(false);
            return;
          }
        }

        setNeedsPassword(true);
      } else {
        setAccessGranted(true);
        await initializeClientSession(gallery);
      }

      setLoading(false);
    };

    checkAccess();
  }, [galleryId]);

  const initializeClientSession = async (gallery: Gallery) => {
    const sessionId = `gallery_session_${gallery.id}`;

    // Carregar sessão existente do localStorage se houver
    const existingSession = localStorage.getItem(sessionId);
    let session: ClientSession;

    // Carregar favoritos do banco de dados
    const favoritesFromDB = await favoriteService.getFavorites(gallery.id, sessionId);
    console.log('💾 Favorites loaded from database:', favoritesFromDB.length);

    if (existingSession) {
      const parsedSession = JSON.parse(existingSession);
      session = {
        ...parsedSession,
        printCart: parsedSession.printCart || [],
        favorites: favoritesFromDB, // Usar favoritos do banco de dados
      };
      session.accessedAt = new Date();
    } else {
      session = {
        galleryId: gallery.id,
        accessedAt: new Date(),
        favorites: favoritesFromDB, // Usar favoritos do banco de dados
        selectedPhotos: [],
        printCart: [],
        downloads: 0,
      };
    }

    // Salvar sessão no localStorage
    localStorage.setItem(sessionId, JSON.stringify({
      galleryId: gallery.id,
      accessedAt: new Date(),
      favorites: session.favorites,
      selectedPhotos: session.selectedPhotos,
      printCart: session.printCart || [],
      downloads: session.downloads,
    }));

    dispatch({ type: 'SET_CLIENT_SESSION', payload: session });

    // Try to increment access count, but don't fail if it errors
    try {
      await galleryService.incrementAccessCount(gallery.id);
    } catch (error) {
      console.warn('Could not increment access count:', error);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    const gallery = state.galleries.find(g => g.id === galleryId) || state.currentGallery;
    if (!gallery || !gallery.password) return false;

    if (password === gallery.password) {
      const sessionKey = `gallery_access_${galleryId}`;
      localStorage.setItem(sessionKey, JSON.stringify({
        timestamp: new Date().toISOString(),
      }));
      
      setAccessGranted(true);
      setNeedsPassword(false);
      await initializeClientSession(gallery);
      return true;
    }
    
    return false;
  };

  return {
    accessGranted,
    needsPassword,
    loading,
    verifyPassword,
  };
}