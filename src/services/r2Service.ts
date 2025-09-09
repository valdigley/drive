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
    this.publicUrl = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-355a4912d7bb4cc0bb98db37f5c0c185.r2.dev';
    
    // Check if R2 is properly configured
    this.isConfigured = !!(
      this.endpoint &&
      import.meta.env.VITE_R2_ACCESS_KEY_ID &&
      import.meta.env.VITE_R2_SECRET_ACCESS_KEY &&
      this.bucketName
    );
    
    const configStatus = {
      isConfigured: this.isConfigured,
      endpoint: this.endpoint,
      bucketName: this.bucketName,
      publicUrl: this.publicUrl,
      hasEndpoint: !!this.endpoint,
      hasAccessKey: !!import.meta.env.VITE_R2_ACCESS_KEY_ID,
      hasSecretKey: !!import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
      hasBucketName: !!this.bucketName,
      hasPublicUrl: !!this.publicUrl,
      // Debug environment variables
      envVars: {
        VITE_R2_ENDPOINT: import.meta.env.VITE_R2_ENDPOINT ? 'SET' : 'NOT SET',
        VITE_R2_ACCESS_KEY_ID: import.meta.env.VITE_R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
        VITE_R2_SECRET_ACCESS_KEY: import.meta.env.VITE_R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
        VITE_R2_BUCKET: import.meta.env.VITE_R2_BUCKET ? 'SET' : 'NOT SET',
      }
    };
    
    console.log('R2 Configuration Status:', configStatus);
    
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
      console.warn('R2 not configured. Missing environment variables:', {
        missing: [
          !this.endpoint && 'VITE_R2_ENDPOINT',
          !import.meta.env.VITE_R2_ACCESS_KEY_ID && 'VITE_R2_ACCESS_KEY_ID',
          !import.meta.env.VITE_R2_SECRET_ACCESS_KEY && 'VITE_R2_SECRET_ACCESS_KEY',
          !this.bucketName && 'VITE_R2_BUCKET'
        ].filter(Boolean)
      });
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
      console.log('✅ Successfully deleted from R2:', key);
    } catch (error) {
      console.error('❌ Error deleting from R2:', error);
      if (error instanceof Error && error.message.includes('CORS')) {
        console.warn('🔧 CORS error - check R2 bucket CORS configuration');
      }
      console.warn('⚠️ Failed to delete from R2, continuing with cleanup:', key);
    }
  }

  async deleteGalleryDirectory(galleryId: string): Promise<void> {
    if (!this.isConfigured || !this.client) {
      console.warn('R2 not configured, cannot delete gallery directory');
      return;
    }

    try {
      // Lista todos os objetos no diretório da galeria
      const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
      
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `galleries/${galleryId}/`,
      });

      const listResponse = await this.client.send(listCommand);
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        // Preparar lista de objetos para deleção em lote
        const objectsToDelete = listResponse.Contents
          .filter(object => object.Key)
          .map(object => ({ Key: object.Key! }));

        if (objectsToDelete.length > 0) {
          // Deletar todos os objetos de uma vez (máximo 1000 por requisição)
          const deleteCommand = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: objectsToDelete,
              Quiet: false, // Para receber confirmação dos objetos deletados
            },
          });

          const deleteResponse = await this.client.send(deleteCommand);
          
          if (deleteResponse.Deleted && deleteResponse.Deleted.length > 0) {
            console.log(`✅ Successfully deleted ${deleteResponse.Deleted.length} objects from R2 for gallery:`, galleryId);
          }
          
          if (deleteResponse.Errors && deleteResponse.Errors.length > 0) {
            console.warn('⚠️ Some objects failed to delete:', deleteResponse.Errors);
          }
        }
      }
      
      console.log('✅ Gallery directory bulk cleanup completed for:', galleryId);
    } catch (error) {
      console.error('❌ Error cleaning up gallery directory:', error);
      throw error;
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

  async getSignedViewUrl(key: string): Promise<string> {
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
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn: 7200 }); // 2 hours
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed view URL:', error);
      // Fallback to public URL
      return this.getPublicUrl(key);
    }
  }

  getPublicUrl(key: string): string {
    if (key.startsWith('local/') || key.startsWith('blob:') || key.startsWith('data:')) {
      return key;
    }
    
    // For private buckets, we'll use signed URLs instead
    // This method is kept for backward compatibility but should use getSignedViewUrl
    return `https://pub-355a4912d7bb4cc0bb98db37f5c0c185.r2.dev/${key}`;
  }

  async getSignedUrlsForPhotos(photos: any[]): Promise<any[]> {
    if (!this.isConfigured || !this.client) {
      return photos;
    }

    const photosWithSignedUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          // Generate signed URLs for both main image and thumbnail
          const signedUrl = photo.r2_key && !photo.r2_key.startsWith('data:') 
            ? await this.getSignedViewUrl(photo.r2_key)
            : photo.url;
            
          const signedThumbnail = photo.r2_key && !photo.r2_key.startsWith('data:')
            ? await this.getSignedViewUrl(photo.r2_key.replace('/photos/', '/thumbnails/').replace(/\.[^/.]+$/, '.jpg'))
            : photo.thumbnail;

          return {
            ...photo,
            url: signedUrl,
            thumbnail: signedThumbnail,
          };
        } catch (error) {
          console.warn('Error generating signed URL for photo:', photo.id, error);
          return photo; // Return original photo if signing fails
        }
      })
    );

    return photosWithSignedUrls;
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