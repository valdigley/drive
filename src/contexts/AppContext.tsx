import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Gallery, ClientSession, AdminStats, Theme, UserRole } from '../types';
import { favoriteService } from '../services/favoriteService';

interface AppState {
  currentUser: UserRole;
  theme: Theme;
  galleries: Gallery[];
  currentGallery: Gallery | null;
  clientSession: ClientSession | null;
  adminStats: AdminStats;
  isLoading: boolean;
  error: string | null;
  currentSupplierId: string | null;
  currentClientId: string | null;
  currentClientName: string | null;
}

type AppAction =
  | { type: 'SET_USER_ROLE'; payload: UserRole }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_GALLERIES'; payload: Gallery[] }
  | { type: 'SET_CURRENT_GALLERY'; payload: Gallery | null }
  | { type: 'SET_CLIENT_SESSION'; payload: ClientSession | null }
  | { type: 'SET_ADMIN_STATS'; payload: AdminStats }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_GALLERY'; payload: Gallery }
  | { type: 'UPDATE_GALLERY'; payload: Gallery }
  | { type: 'DELETE_GALLERY'; payload: string }
  | { type: 'ADD_PHOTOS'; payload: { galleryId: string; photos: any[] } }
  | { type: 'TOGGLE_FAVORITE'; payload: { photoId: string } }
  | { type: 'TOGGLE_SELECTION'; payload: { photoId: string } }
  | { type: 'TOGGLE_PRINT_CART'; payload: { photoId: string } }
  | { type: 'INCREMENT_DOWNLOAD_COUNT' }
  | { type: 'SET_CURRENT_SUPPLIER_ID'; payload: string | null }
  | { type: 'SET_CURRENT_CLIENT_ID'; payload: string | null }
  | { type: 'SET_CURRENT_CLIENT_NAME'; payload: string | null };

const initialState: AppState = {
  currentUser: 'admin',
  theme: 'dark',
  galleries: [],
  currentGallery: null,
  clientSession: null,
  adminStats: {
    totalGalleries: 0,
    totalPhotos: 0,
    totalViews: 0,
    totalDownloads: 0,
    activeGalleries: 0,
  },
  isLoading: false,
  error: null,
  currentSupplierId: null,
  currentClientId: null,
  currentClientName: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER_ROLE':
      return { ...state, currentUser: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_GALLERIES':
      return { ...state, galleries: action.payload };
    case 'SET_CURRENT_GALLERY':
      return { ...state, currentGallery: action.payload };
    case 'SET_CLIENT_SESSION':
      return { ...state, clientSession: action.payload };
    case 'SET_ADMIN_STATS':
      return { ...state, adminStats: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_GALLERY':
      return { ...state, galleries: [...state.galleries, action.payload] };
    case 'UPDATE_GALLERY':
      return {
        ...state,
        galleries: state.galleries.map(g =>
          g.id === action.payload.id ? action.payload : g
        ),
        currentGallery: state.currentGallery?.id === action.payload.id ? action.payload : state.currentGallery,
      };
    case 'DELETE_GALLERY':
      return {
        ...state,
        galleries: state.galleries.filter(g => g.id !== action.payload),
        currentGallery: state.currentGallery?.id === action.payload ? null : state.currentGallery,
      };
    case 'ADD_PHOTOS':
      return {
        ...state,
        galleries: state.galleries.map(g =>
          g.id === action.payload.galleryId
            ? { ...g, photos: [...g.photos, ...action.payload.photos] }
            : g
        ),
        currentGallery: state.currentGallery?.id === action.payload.galleryId
          ? { ...state.currentGallery, photos: [...state.currentGallery.photos, ...action.payload.photos] }
          : state.currentGallery,
      };
    case 'TOGGLE_FAVORITE':
      if (!state.clientSession) {
        console.error('❌ No client session - cannot toggle favorite');
        return state;
      }

      const isFavorited = state.clientSession.favorites.includes(action.payload.photoId);
      const updatedFavorites = isFavorited
        ? state.clientSession.favorites.filter(id => id !== action.payload.photoId)
        : [...state.clientSession.favorites, action.payload.photoId];

      console.log('❤️ Toggle Favorite:', {
        photoId: action.payload.photoId,
        isFavorited,
        beforeCount: state.clientSession.favorites.length,
        afterCount: updatedFavorites.length
      });

      const updatedSessionWithFavorites = {
        ...state.clientSession,
        favorites: updatedFavorites,
      };

      // Salvar no localStorage
      const sessionKey = `gallery_session_${state.clientSession.galleryId}`;
      localStorage.setItem(sessionKey, JSON.stringify(updatedSessionWithFavorites));

      // Salvar no banco de dados de forma assíncrona
      const sessionId = sessionKey;
      const galleryId = state.clientSession.galleryId;
      const photoId = action.payload.photoId;

      if (isFavorited) {
        // Remover favorito
        favoriteService.removeFavorite(photoId, sessionId).then(success => {
          if (success) {
            console.log('✅ Favorite removed from database');
          } else {
            console.error('❌ Failed to remove favorite from database');
          }
        }).catch(err => {
          console.error('❌ Error removing favorite:', err);
        });
      } else {
        // Adicionar favorito
        favoriteService.addFavorite(photoId, galleryId, sessionId).then(success => {
          if (success) {
            console.log('✅ Favorite added to database');
          } else {
            console.error('❌ Failed to add favorite to database');
          }
        }).catch(err => {
          console.error('❌ Error adding favorite:', err);
        });
      }

      return {
        ...state,
        clientSession: updatedSessionWithFavorites,
      };
    case 'TOGGLE_SELECTION':
      if (!state.clientSession) return state;
      const updatedSelectedPhotos = state.clientSession.selectedPhotos.includes(action.payload.photoId)
        ? state.clientSession.selectedPhotos.filter(id => id !== action.payload.photoId)
        : [...state.clientSession.selectedPhotos, action.payload.photoId];

      const updatedSessionWithSelection = {
        ...state.clientSession,
        selectedPhotos: updatedSelectedPhotos,
      };

      // Salvar no localStorage
      const selectionSessionKey = `gallery_session_${state.clientSession.galleryId}`;
      localStorage.setItem(selectionSessionKey, JSON.stringify(updatedSessionWithSelection));

      return {
        ...state,
        clientSession: updatedSessionWithSelection,
      };
    case 'TOGGLE_PRINT_CART':
      if (!state.clientSession) return state;
      const currentPrintCart = state.clientSession.printCart || [];
      const updatedPrintCart = currentPrintCart.includes(action.payload.photoId)
        ? currentPrintCart.filter(id => id !== action.payload.photoId)
        : [...currentPrintCart, action.payload.photoId];
      
      const updatedSessionWithPrintCart = {
        ...state.clientSession,
        printCart: updatedPrintCart,
      };
      
      // Salvar no localStorage
      const printCartSessionKey = `gallery_session_${state.clientSession.galleryId}`;
      localStorage.setItem(printCartSessionKey, JSON.stringify(updatedSessionWithPrintCart));
      
      return {
        ...state,
        clientSession: updatedSessionWithPrintCart,
      };
    case 'SET_CURRENT_SUPPLIER_ID':
      if (action.payload) {
        localStorage.setItem('currentSupplierId', action.payload);
      } else {
        localStorage.removeItem('currentSupplierId');
      }
      return {
        ...state,
        currentSupplierId: action.payload,
      };
    case 'SET_CURRENT_CLIENT_ID':
      if (action.payload) {
        localStorage.setItem('currentClientId', action.payload);
      } else {
        localStorage.removeItem('currentClientId');
      }
      return {
        ...state,
        currentClientId: action.payload,
      };
    case 'SET_CURRENT_CLIENT_NAME':
      if (action.payload) {
        localStorage.setItem('currentClientName', action.payload);
      } else {
        localStorage.removeItem('currentClientName');
      }
      return {
        ...state,
        currentClientName: action.payload,
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}