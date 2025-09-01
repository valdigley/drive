import { useState, useEffect } from 'react';
import { Gallery, ClientSession } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { galleryService } from '../services/galleryService';

export function useGalleryAccess(galleryId: string) {
  const { state, dispatch } = useAppContext();
  const [accessGranted, setAccessGranted] = useState<boolean>(false);
  const [needsPassword, setNeedsPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true);
      let gallery = state.galleries.find(g => g.id === galleryId);
      
      if (!gallery) {
        try {
          // Load gallery from Supabase if not in state
          gallery = await galleryService.getGalleryDetails(galleryId);
          if (!gallery) {
            setLoading(false);
            return;
          }
          
          // Load photos for the gallery
          const photos = await galleryService.getGalleryPhotos(galleryId);
          const completeGallery = { ...gallery, photos };
          
          // Add to global state
          dispatch({ type: 'ADD_GALLERY', payload: completeGallery });
          dispatch({ type: 'SET_CURRENT_GALLERY', payload: completeGallery });
          gallery = completeGallery;
        } catch (error) {
          console.error('Error loading gallery:', error);
          setLoading(false);
          return;
        }
      } else {
        dispatch({ type: 'SET_CURRENT_GALLERY', payload: gallery });
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

    loadGallery();
  }, [galleryId, state.galleries, dispatch]);

  const initializeClientSession = async (gallery: Gallery) => {
    const session: ClientSession = {
      galleryId: gallery.id,
      accessedAt: new Date(),
      favorites: [],
      selectedPhotos: [],
      downloads: 0,
    };
    
    dispatch({ type: 'SET_CLIENT_SESSION', payload: session });
    
    await galleryService.incrementAccessCount(gallery.id);
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