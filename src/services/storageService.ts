import { supabase } from '../lib/supabase';

export interface GalleryStorageInfo {
  galleryId: string;
  galleryName: string;
  photoCount: number;
  totalSize: number;
  formattedSize: string;
  percentage: number;
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  usedPercentage: number;
  formattedUsed: string;
  formattedTotal: string;
  totalPhotos: number;
  topGalleries: GalleryStorageInfo[];
}

class StorageService {
  private readonly STORAGE_LIMIT_GB = 10; // 10GB limit for R2
  private readonly BYTES_PER_GB = 1024 * 1024 * 1024;

  async getStorageStats(): Promise<StorageStats> {
    try {
      // Get total size of all photos from database
      const { data: photos, error } = await supabase
        .from('photos')
        .select('size, gallery_id');

      if (error) {
        console.error('Error fetching storage stats:', error);
        return this.getDefaultStats();
      }

      const usedBytes = (photos || []).reduce((total, photo) => total + (photo.size || 0), 0);
      const totalBytes = this.STORAGE_LIMIT_GB * this.BYTES_PER_GB;
      const usedPercentage = Math.min((usedBytes / totalBytes) * 100, 100);

      // Get top galleries by storage usage
      const topGalleries = await this.getTopGalleriesBySize();

      return {
        usedBytes,
        totalBytes,
        usedPercentage,
        formattedUsed: this.formatBytes(usedBytes),
        formattedTotal: this.formatBytes(totalBytes),
        totalPhotos: photos?.length || 0,
        topGalleries,
      };
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      return this.getDefaultStats();
    }
  }

  async getTopGalleriesBySize(limit: number = 5): Promise<GalleryStorageInfo[]> {
    try {
      // Get galleries with their photo sizes
      const { data: galleries, error: galleriesError } = await supabase
        .from('galleries')
        .select('id, name');

      if (galleriesError || !galleries) {
        console.error('Error fetching galleries:', galleriesError);
        return [];
      }

      // Get photos for each gallery
      const { data: photos, error: photosError } = await supabase
        .from('photos')
        .select('gallery_id, size');

      if (photosError || !photos) {
        console.error('Error fetching photos:', photosError);
        return [];
      }

      // Calculate total size per gallery
      const galleryMap = new Map<string, { name: string; totalSize: number; photoCount: number }>();

      galleries.forEach(gallery => {
        galleryMap.set(gallery.id, { name: gallery.name, totalSize: 0, photoCount: 0 });
      });

      photos.forEach(photo => {
        const galleryInfo = galleryMap.get(photo.gallery_id);
        if (galleryInfo) {
          galleryInfo.totalSize += photo.size || 0;
          galleryInfo.photoCount++;
        }
      });

      // Convert to array and sort by size
      const galleryStorageInfos: GalleryStorageInfo[] = Array.from(galleryMap.entries())
        .map(([galleryId, info]) => ({
          galleryId,
          galleryName: info.name,
          photoCount: info.photoCount,
          totalSize: info.totalSize,
          formattedSize: this.formatBytes(info.totalSize),
          percentage: 0, // Will be calculated below
        }))
        .sort((a, b) => b.totalSize - a.totalSize);

      // Calculate percentage of total storage
      const totalUsed = galleryStorageInfos.reduce((sum, g) => sum + g.totalSize, 0);
      galleryStorageInfos.forEach(info => {
        info.percentage = totalUsed > 0 ? (info.totalSize / totalUsed) * 100 : 0;
      });

      return galleryStorageInfos.slice(0, limit);
    } catch (error) {
      console.error('Error getting top galleries by size:', error);
      return [];
    }
  }

  private getDefaultStats(): StorageStats {
    const totalBytes = this.STORAGE_LIMIT_GB * this.BYTES_PER_GB;
    return {
      usedBytes: 0,
      totalBytes,
      usedPercentage: 0,
      formattedUsed: '0 GB',
      formattedTotal: this.formatBytes(totalBytes),
      totalPhotos: 0,
      topGalleries: [],
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 GB';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = Math.round((bytes / Math.pow(1024, i)) * 100) / 100;
    
    return `${size} ${sizes[i]}`;
  }

  getStorageStatusColor(percentage: number): string {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 85) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getStorageStatusText(percentage: number): string {
    if (percentage < 70) return 'Armazenamento saudável';
    if (percentage < 85) return 'Armazenamento moderado';
    if (percentage < 95) return 'Armazenamento quase cheio';
    return 'Armazenamento crítico';
  }
}

export const storageService = new StorageService();