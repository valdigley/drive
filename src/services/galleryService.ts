import { Gallery, Photo, AdminStats } from '../types';
import { supabase } from '../lib/supabase';

class GalleryService {
  async getAllGalleries(): Promise<Gallery[]> {
    try {
      const { data: galleries, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('gallery_type', 'client')
        .order('created_date', { ascending: false });

      if (error) throw error;

      // Load galleries with their photos
      const galleriesWithPhotos = await Promise.all(
        galleries.map(async (gallery) => {
          const photos = await this.getGalleryPhotos(gallery.id);
          return {
            ...this.transformGalleryFromDB(gallery),
            photos,
          };
        })
      );

      return galleriesWithPhotos;
    } catch (error) {
      console.error('Error loading galleries:', error);
      return [];
    }
  }

  async getGalleryDetails(id: string): Promise<Gallery | null> {
    try {
      const { data: gallery, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('Gallery not found:', id);
          return null;
        }
        console.error('Gallery query error:', error);
        return null;
      }
      if (!gallery) return null;

      return {
        ...this.transformGalleryFromDB(gallery),
        photos: [], // Photos will be loaded separately
      };
    } catch (error) {
      console.error('Error loading gallery:', error);
      return null;
    }
  }

  async getGalleryPhotos(galleryId: string): Promise<Photo[]> {
    try {
      const { data: photos, error } = await supabase
        .from('photos')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      const mappedPhotos = (photos || []).map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        thumbnail: photo.thumbnail,
        filename: photo.filename,
        size: photo.size,
        uploadDate: new Date(photo.upload_date),
        r2Key: photo.r2_key,
        metadata: photo.metadata || {},
      }));

      // Generate signed URLs for R2 photos
      const { r2Service } = await import('./r2Service');
      const photosWithSignedUrls = await r2Service.getSignedUrlsForPhotos(
        mappedPhotos.map(photo => ({
          ...photo,
          r2_key: photo.r2Key,
        }))
      );

      return photosWithSignedUrls.map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        thumbnail: photo.thumbnail,
        filename: photo.filename,
        size: photo.size,
        uploadDate: photo.uploadDate,
        r2Key: photo.r2_key,
        metadata: photo.metadata || {},
      }));
    } catch (error) {
      console.error('Error loading gallery photos:', error);
      return [];
    }
  }

  async saveGallery(gallery: Gallery): Promise<void> {
    try {
      const galleryData = {
        id: gallery.id,
        name: gallery.name,
        client_name: gallery.clientName,
        description: gallery.description,
        cover_photo_id: gallery.coverPhotoId,
        created_date: gallery.createdDate.toISOString(),
        expiration_date: gallery.expirationDate?.toISOString(),
        password: gallery.password,
        access_count: gallery.accessCount,
        download_count: gallery.downloadCount,
        is_active: gallery.isActive,
        settings: gallery.settings,
        user_id: null, // Sem autenticação por enquanto
      };

      const { error } = await supabase
        .from('galleries')
        .upsert(galleryData);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving gallery:', error);
      throw new Error('Falha ao salvar galeria');
    }
  }

  async deleteGallery(id: string): Promise<void> {
    try {
      // Deletar toda a pasta da galeria do R2 de uma vez
      try {
        const { r2Service } = await import('./r2Service');
        await r2Service.deleteGalleryDirectory(id);
        console.log('✅ Gallery files deleted from R2');
      } catch (error) {
        console.warn('⚠️ Error deleting gallery from R2 (continuing with database cleanup):', error);
      }

      // Agora deletar a galeria do banco (cascade vai deletar as fotos automaticamente)
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting gallery from database:', error);
        throw error;
      }
      
      console.log('✅ Gallery deleted from database');
    } catch (error) {
      console.error('Error deleting gallery:', error);
      throw new Error('Falha ao deletar galeria');
    }
  }

  async addPhotosToGallery(galleryId: string, photos: Photo[]): Promise<void> {
    try {
      const photosData = photos.map(photo => ({
        id: photo.id,
        gallery_id: galleryId,
        url: photo.url,
        thumbnail: photo.thumbnail,
        filename: photo.filename,
        size: photo.size,
        upload_date: photo.uploadDate.toISOString(),
        r2_key: photo.r2Key,
        metadata: photo.metadata || {},
      }));

      const { error } = await supabase
        .from('photos')
        .insert(photosData);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding photos:', error);
      throw new Error('Falha ao adicionar fotos');
    }
  }

  async deletePhoto(photoId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw new Error('Falha ao deletar foto');
    }
  }

  async incrementAccessCount(galleryId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_access_count', {
        gallery_id: galleryId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing access count:', error);
    }
  }

  async incrementDownloadCount(galleryId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_download_count', {
        gallery_id: galleryId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing download count:', error);
    }
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      const { data: galleries, error } = await supabase
        .from('galleries')
        .select(`
          id,
          access_count,
          download_count,
          is_active,
          photos (id)
        `);

      if (error) throw error;

      const stats: AdminStats = {
        totalGalleries: galleries.length,
        totalPhotos: galleries.reduce((sum, g) => sum + (g.photos?.length || 0), 0),
        totalViews: galleries.reduce((sum, g) => sum + g.access_count, 0),
        totalDownloads: galleries.reduce((sum, g) => sum + g.download_count, 0),
        activeGalleries: galleries.filter(g => g.is_active).length,
      };

      return stats;
    } catch (error) {
      console.warn('Supabase connection failed, using fallback stats:', error);
      return {
        totalGalleries: 0,
        totalPhotos: 0,
        totalViews: 0,
        totalDownloads: 0,
        activeGalleries: 0,
      };
    }
  }

  generateSecureLink(galleryId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/gallery/${galleryId}`;
  }

  private transformGalleryFromDB(dbGallery: any): Gallery {
    return {
      id: dbGallery.id,
      name: dbGallery.name,
      clientName: dbGallery.client_name,
      description: dbGallery.description,
      coverPhotoId: dbGallery.cover_photo_id,
      createdDate: new Date(dbGallery.created_date),
      expirationDate: dbGallery.expiration_date ? new Date(dbGallery.expiration_date) : undefined,
      password: dbGallery.password,
      accessCount: dbGallery.access_count,
      downloadCount: dbGallery.download_count,
      isActive: dbGallery.is_active,
      settings: dbGallery.settings,
      photos: (dbGallery.photos || []).map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        thumbnail: photo.thumbnail,
        filename: photo.filename,
        size: photo.size,
        uploadDate: new Date(photo.upload_date),
        r2Key: photo.r2_key,
        metadata: photo.metadata || {},
      })),
    };
  }

  // Função para migrar dados do localStorage para Supabase (usar apenas uma vez)
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const localData = localStorage.getItem('photoShare_galleries');
      if (!localData) return;

      const galleries = JSON.parse(localData);
      
      for (const gallery of galleries) {
        await this.saveGallery({
          ...gallery,
          createdDate: new Date(gallery.createdDate),
          expirationDate: gallery.expirationDate ? new Date(gallery.expirationDate) : undefined,
          photos: gallery.photos.map((photo: any) => ({
            ...photo,
            uploadDate: new Date(photo.uploadDate),
          })),
        });

        // Salvar fotos separadamente
        if (gallery.photos.length > 0) {
          await this.addPhotosToGallery(gallery.id, gallery.photos.map((photo: any) => ({
            ...photo,
            uploadDate: new Date(photo.uploadDate),
          })));
        }
      }

      // Limpar localStorage após migração
      localStorage.removeItem('photoShare_galleries');
      localStorage.removeItem('photoShare_stats');
      localStorage.removeItem('photoShare_initialized');
      
      console.log('Migração concluída com sucesso');
    } catch (error) {
      console.error('Error migrating data:', error);
      throw new Error('Falha na migração dos dados');
    }
  }
}

export const galleryService = new GalleryService();