import { useState } from 'react';
import { Photo } from '../types';
import { r2Service } from '../services/r2Service';

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const processFiles = async (files: FileList, galleryId: string): Promise<Photo[]> => {
    setUploading(true);
    setUploadProgress(0);
    
    const photos: Photo[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }

      try {
        const photo = await processSingleFile(file, galleryId);
        photos.push(photo);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (error) {
        console.error('Error processing file:', file.name, error);
        // Continue processing other files instead of stopping
        continue;
      }
    }

    setUploading(false);
    setUploadProgress(0);
    
    return photos;
  };

  const processSingleFile = async (file: File, galleryId: string): Promise<Photo> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const img = new Image();
          
          img.onload = async () => {
            // Create thumbnail
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const maxThumbnailSize = 300;
            const ratio = Math.min(maxThumbnailSize / img.width, maxThumbnailSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to blob for R2 upload
            canvas.toBlob(async (thumbnailBlob) => {
              if (!thumbnailBlob) {
                reject(new Error('Failed to create thumbnail'));
                return;
              }

              try {
                // Upload original photo to R2
                const { url, key } = await r2Service.uploadPhoto(file, galleryId);
                
                // Upload thumbnail to R2
                const thumbnailUrl = await r2Service.uploadThumbnail(thumbnailBlob, galleryId, key);
                
                const photo: Photo = {
                  id: crypto.randomUUID(),
                  url,
                  thumbnail: thumbnailUrl,
                  filename: file.name,
                  size: file.size,
                  uploadDate: new Date(),
                  r2Key: key,
                  metadata: {
                    width: img.width,
                    height: img.height,
                  },
                };
                
                resolve(photo);
              } catch (error) {
                reject(error);
              }
            }, 'image/jpeg', 0.8);
          };
            
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  return {
    uploading,
    uploadProgress,
    processFiles,
  };
}