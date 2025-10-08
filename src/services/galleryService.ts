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

  async getGalleryByAccessCode(accessCode: string): Promise<Gallery | null> {
    try {
      const { data: gallery, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('access_code', accessCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Gallery query error:', error);
        return null;
      }
      if (!gallery) {
        console.log('Gallery not found with access code:', accessCode);
        return null;
      }

      return {
        ...this.transformGalleryFromDB(gallery),
        photos: [],
      };
    } catch (error) {
      console.error('Error loading gallery by access code:', error);
      return null;
    }
  }

  async getSupplierGalleriesWithPhotos(supplierId: string): Promise<Array<{ galleryId: string; galleryName: string; clientName: string; photoCount: number }>> {
    try {
      const { data, error } = await supabase
        .from('photo_suppliers')
        .select(`
          gallery_id,
          galleries!inner(id, name, client_name)
        `)
        .eq('supplier_id', supplierId);

      if (error) throw error;

      // Group by gallery and count photos
      const galleryMap = new Map<string, { galleryId: string; galleryName: string; clientName: string; photoCount: number }>();

      (data || []).forEach(item => {
        const galleryId = item.gallery_id;
        if (!galleryMap.has(galleryId)) {
          galleryMap.set(galleryId, {
            galleryId,
            galleryName: item.galleries.name,
            clientName: item.galleries.client_name,
            photoCount: 0,
          });
        }
        galleryMap.get(galleryId)!.photoCount++;
      });

      return Array.from(galleryMap.values());
    } catch (error) {
      console.error('Error fetching supplier galleries:', error);
      return [];
    }
  }

  async getGalleryPhotos(galleryId: string, supplierId?: string, filterByGalleryId?: string): Promise<Photo[]> {
    try {
      let photoIds: string[] | null = null;

      // If supplierId is provided, get ALL photos tagged for this supplier
      if (supplierId) {
        console.log('🔍 Loading photos tagged for supplier:', supplierId, filterByGalleryId ? `in gallery: ${filterByGalleryId}` : 'from all galleries');

        let tagQuery = supabase
          .from('photo_suppliers')
          .select('photo_id, gallery_id')
          .eq('supplier_id', supplierId);

        // Filter by specific gallery if requested
        if (filterByGalleryId) {
          tagQuery = tagQuery.eq('gallery_id', filterByGalleryId);
        }

        const { data: taggedPhotos, error: tagError } = await tagQuery;

        if (tagError) throw tagError;

        photoIds = (taggedPhotos || []).map(tp => tp.photo_id);
        console.log('📸 Found tagged photos:', photoIds.length);

        // If no photos are tagged, return empty array
        if (photoIds.length === 0) {
          console.log('⚠️ No photos tagged for this supplier');
          return [];
        }
      }

      // Build the query
      let query = supabase
        .from('photos')
        .select('*');

      // For suppliers, optionally filter by specific gallery
      if (!supplierId) {
        query = query.eq('gallery_id', galleryId);
      } else if (filterByGalleryId) {
        query = query.eq('gallery_id', filterByGalleryId);
      }

      // Filter by photo IDs if we have them (supplier's tagged photos)
      if (photoIds) {
        query = query.in('id', photoIds);
      }

      const { data: photos, error } = await query.order('upload_date', { ascending: false });

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
        galleryId: photo.gallery_id,
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
        event_date: gallery.eventDate?.toISOString().split('T')[0],
        location: gallery.location,
        client_id: gallery.clientId,
        settings: gallery.settings,
        user_id: null,
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
      eventDate: dbGallery.event_date ? new Date(dbGallery.event_date) : undefined,
      location: dbGallery.location,
      clientId: dbGallery.client_id,
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