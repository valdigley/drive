export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  filename: string;
  size: number;
  uploadDate: Date;
  r2Key?: string;
  metadata?: {
    width: number;
    height: number;
  };
}

export interface Gallery {
  id: string;
  name: string;
  clientName: string;
  description?: string;
  coverPhotoId?: string;
  createdDate: Date;
  expirationDate?: Date;
  password?: string;
  photos: Photo[];
  accessCount: number;
  downloadCount: number;
  isActive: boolean;
  settings: {
    allowDownload: boolean;
    watermark: boolean;
    downloadQuality: 'web' | 'print' | 'original';
  };
}

export interface ClientSession {
  galleryId: string;
  accessedAt: Date;
  favorites: string[];
  selectedPhotos: string[];
  downloads: number;
}

export interface AdminStats {
  totalGalleries: number;
  totalPhotos: number;
  totalViews: number;
  totalDownloads: number;
  activeGalleries: number;
}

export type Theme = 'light' | 'dark';
export type UserRole = 'admin' | 'client';