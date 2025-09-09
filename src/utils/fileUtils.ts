import { r2Service } from '../services/r2Service';
import { galleryService } from '../services/galleryService';

export async function downloadFile(url: string, filename: string, r2Key?: string, galleryId?: string): Promise<void> {
  try {
    // For R2 files, get a signed download URL with proper headers
    if (r2Key && !r2Key.startsWith('data:')) {
      const downloadUrl = await r2Service.getSignedDownloadUrl(r2Key, filename);
      
      // Use fetch to get the file as blob, then create download link
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    } else {
      // For data URLs or local files, fetch as blob first
      const response = await fetch(url);
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
    }
    
    // Increment download count if galleryId is provided
    if (galleryId) {
      await galleryService.incrementDownloadCount(galleryId);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    alert('Erro ao baixar arquivo. Tente novamente em alguns instantes.');
  }
}

export async function downloadMultipleFiles(photos: { url: string; filename: string; r2Key?: string }[], galleryId?: string): Promise<void> {
  for (const photo of photos) {
    await downloadFile(photo.url, photo.filename, photo.r2Key, galleryId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent browser blocking
  }
}

export function generateSecureId(): string {
  return crypto.randomUUID();
}


export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function isGalleryExpired(expirationDate?: Date): boolean {
  if (!expirationDate) return false;
  return new Date() > expirationDate;
}