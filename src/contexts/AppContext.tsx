import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Gallery, ClientSession, AdminStats, Theme, UserRole } from '../types';

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
  | { type: 'SET_CURRENT_SUPPLIER_ID'; payload: string | null };

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
      if (!state.clientSession) return state;
      const updatedFavorites = state.clientSession.favorites.includes(action.payload.photoId)
        ? state.clientSession.favorites.filter(id => id !== action.payload.photoId)
        : [...state.clientSession.favorites, action.payload.photoId];
      
      const updatedSessionWithFavorites = {
        ...state.clientSession,
        favorites: updatedFavorites,
      };
      
      // Salvar no localStorage
      const sessionKey = `gallery_session_${state.clientSession.galleryId}`;
      localStorage.setItem(sessionKey, JSON.stringify(updatedSessionWithFavorites));
      
      return {
        ...state,
        clientSession: updatedSessionWithFavorites,
      };
    case 'TOGGLE_SELECTION':
      if (!state.clientSession) return state;
      return {
        ...state,
        clientSession: {
          ...state.clientSession,
          selectedPhotos: state.clientSession.selectedPhotos.includes(action.payload.photoId)
            ? state.clientSession.selectedPhotos.filter(id => id !== action.payload.photoId)
            : [...state.clientSession.selectedPhotos, action.payload.photoId],
        },
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