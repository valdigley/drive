import { supabase } from '../lib/supabase';

class FavoriteService {
  async addFavorite(photoId: string, galleryId: string, sessionId: string, clientId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          photo_id: photoId,
          gallery_id: galleryId,
          session_id: sessionId,
          client_id: clientId || null,
        });

      if (error) {
        // Ignore duplicate key errors (user already favorited this photo)
        if (error.code === '23505') {
          console.log('Photo already favorited');
          return true;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  async removeFavorite(photoId: string, sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('photo_id', photoId)
        .eq('session_id', sessionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  async getFavorites(galleryId: string, sessionId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('photo_id')
        .eq('gallery_id', galleryId)
        .eq('session_id', sessionId);

      if (error) throw error;

      return (data || []).map(f => f.photo_id);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  }

  async isFavorite(photoId: string, sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('photo_id', photoId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;

      return !!data;
    } catch (error) {
      console.error('Error checking if favorite:', error);
      return false;
    }
  }
}

export const favoriteService = new FavoriteService();
