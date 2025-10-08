export interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  filename: string;
  photoCode?: string;
  size: number;
  uploadDate: Date;
  r2Key?: string;
  thumbnailR2Key?: string;
  metadata?: {
    width: number;
    height: number;
    camera?: string;
    lens?: string;
    iso?: number;
    aperture?: string;
    shutterSpeed?: string;
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
  eventDate?: Date;
  location?: string;
  clientId?: string;
  settings: {
    allowDownload: boolean;
    allowComments: boolean;
    watermark: boolean;
    maxDownloads?: number;
    downloadQuality: 'web' | 'print' | 'original';
  };
}

export interface ClientSession {
  galleryId: string;
  accessedAt: Date;
  favorites: string[];
  selectedPhotos: string[];
  printCart: string[];
  downloads: number;
}

export interface AdminStats {
  totalGalleries: number;
  totalPhotos: number;
  totalViews: number;
  totalDownloads: number;
  activeGalleries: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: 'fotografia' | 'buffet' | 'decoracao' | 'musica' | 'locacao' | 'outros';
  galleryId?: string;
  accessCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoSupplier {
  id: string;
  photoId: string;
  supplierId: string;
  galleryId: string;
  taggedAt: Date;
  supplier?: Supplier;
}

export type ViewMode = 'grid' | 'masonry' | 'slideshow';
export type Theme = 'light' | 'dark';
export type UserRole = 'admin' | 'client' | 'supplier';