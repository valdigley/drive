import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class R2Service {
  private client: S3Client | null = null;
  private bucketName: string;
  private isConfigured: boolean;
  private endpoint: string;
  private publicUrl: string;

  constructor() {
    this.bucketName = import.meta.env.VITE_R2_BUCKET || 'fotos-clientes';
    this.endpoint = import.meta.env.VITE_R2_ENDPOINT || '';
    this.publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
    
    // Check if R2 is properly configured
    this.isConfigured = !!(
      this.endpoint &&
      import.meta.env.VITE_R2_ACCESS_KEY_ID &&
      import.meta.env.VITE_R2_SECRET_ACCESS_KEY &&
      this.bucketName
    );
    
    console.log('R2 Configuration Status:', {
      isConfigured: this.isConfigured,
      endpoint: this.endpoint,
      bucketName: this.bucketName,
      publicUrl: this.publicUrl,
      hasEndpoint: !!this.endpoint,
      hasAccessKey: !!import.meta.env.VITE_R2_ACCESS_KEY_ID,
      hasSecretKey: !!import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
      hasBucketName: !!this.bucketName,
      hasPublicUrl: !!this.publicUrl,
    });
    
    if (this.isConfigured) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: this.endpoint,
        credentials: {
          accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
          secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
        },
      });
      console.log('R2 Client initialized successfully');
    } else {
      console.warn('R2 not configured. Check environment variables.');
    }
  }

  async uploadPhoto(file: File, galleryId: string): Promise<{ url: string; key: string }> {
    if (!this.isConfigured || !this.client) {
      console.warn('R2 not configured, using data URL fallback');
      const dataUrl = await this.fileToDataUrl(file);
      const dataKey = `data:${galleryId}/${Date.now()}-${file.name}`;
      return { url: dataUrl, key: dataKey };
    }

    try {
      const key = `galleries/${galleryId}/photos/${crypto.randomUUID()}-${file.name}`;
      
      const arrayBuffer = await this.blobToArrayBuffer(file);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: arrayBuffer,
        ContentType: file.type,
      });

      await this.client.send(command);
      return { url: this.getPublicUrl(key), key };
    } catch (error) {
      console.error('Error uploading to R2, using data URL fallback:', error);
      const dataUrl = await this.fileToDataUrl(file);
      const dataKey = `data:${galleryId}/${Date.now()}-${file.name}`;
      return { url: dataUrl, key: dataKey };
    }
  }

  async uploadThumbnail(thumbnailBlob: Blob, galleryId: string, photoId: string): Promise<string> {
    if (!this.isConfigured || !this.client) {
      return await this.blobToDataUrl(thumbnailBlob);
    }

    try {
      const key = `galleries/${galleryId}/thumbnails/${crypto.randomUUID()}.jpg`;
      const arrayBuffer = await this.blobToArrayBuffer(thumbnailBlob);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: arrayBuffer,
        ContentType: 'image/jpeg',
      });

      await this.client.send(command);
      return this.getPublicUrl(key);
    } catch (error) {
      console.error('Error uploading thumbnail to R2, using data URL:', error);
      return await this.blobToDataUrl(thumbnailBlob);
    }
  }

  async deletePhoto(key: string): Promise<void> {
    if (!this.isConfigured || !this.client) {
      console.warn('R2 not configured, cannot delete photo from cloud storage');
      return;
    }

    // Skip deletion for local keys
    if (key.startsWith('local/') || key.startsWith('data:')) {
      console.log('Skipping deletion of local file:', key);
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      console.log('Successfully deleted from R2:', key);
    } catch (error) {
      console.error('Error deleting from R2:', error);
      console.warn('Failed to delete from R2, continuing with cleanup:', key);
    }
  }

  async deleteGalleryDirectory(galleryId: string): Promise<void> {
    if (!this.isConfigured || !this.client) {
      console.warn('R2 not configured, cannot delete gallery directory');
      return;
    }

    try {
      // Lista todos os objetos no diretório da galeria
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `galleries/${galleryId}/`,
      });

      const listResponse = await this.client.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Deletar todos os objetos restantes no diretório
        for (const object of listResponse.Contents) {
          if (object.Key) {
            try {
              await this.deletePhoto(object.Key);
            } catch (error) {
              console.warn('Error deleting remaining object:', object.Key, error);
            }
          }
        }
      }
      
      console.log('Gallery directory cleanup completed for:', galleryId);
    } catch (error) {
      console.error('Error cleaning up gallery directory:', error);
    }
  }

  async getSignedDownloadUrl(key: string, filename: string): Promise<string> {
    if (!this.isConfigured || !this.client) {
      return key;
    }

    // Return local URLs as-is
    if (key.startsWith('local/') || key.startsWith('blob:') || key.startsWith('data:')) {
      return key;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 }); // 1 hour
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      // Fallback to public URL
      return this.getPublicUrl(key);
    }
  }

  getPublicUrl(key: string): string {
    if (key.startsWith('local/') || key.startsWith('blob:') || key.startsWith('data:')) {
      return key;
    }
    
    return `${this.publicUrl}/${key}`;
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }
}

export const r2Service = new R2Service();