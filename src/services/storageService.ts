import { supabase } from '../lib/supabase';

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  usedPercentage: number;
  formattedUsed: string;
  formattedTotal: string;
}

class StorageService {
  private readonly STORAGE_LIMIT_GB = 10; // 10GB limit for R2
  private readonly BYTES_PER_GB = 1024 * 1024 * 1024;

  async getStorageStats(): Promise<StorageStats> {
    try {
      // Get total size of all photos from database
      const { data: photos, error } = await supabase
        .from('photos')
        .select('size');

      if (error) {
        console.error('Error fetching storage stats:', error);
        return this.getDefaultStats();
      }

      const usedBytes = (photos || []).reduce((total, photo) => total + (photo.size || 0), 0);
      const totalBytes = this.STORAGE_LIMIT_GB * this.BYTES_PER_GB;
      const usedPercentage = Math.min((usedBytes / totalBytes) * 100, 100);

      return {
        usedBytes,
        totalBytes,
        usedPercentage,
        formattedUsed: this.formatBytes(usedBytes),
        formattedTotal: this.formatBytes(totalBytes),
      };
    } catch (error) {
      console.error('Error calculating storage stats:', error);
      return this.getDefaultStats();
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