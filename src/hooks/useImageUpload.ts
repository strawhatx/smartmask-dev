import { useState, useCallback } from 'react';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  width: number;
  height: number;
}

export function useImageUpload() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImages = useCallback(async (files: File[]) => {
    setIsLoading(true);
    
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
    );

    const newImages: UploadedImage[] = await Promise.all(
      validFiles.map(async (file) => {
        const dimensions = await loadImageDimensions(file);
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview: URL.createObjectURL(file),
          ...dimensions,
        };
      })
    );

    setImages(prev => [...prev, ...newImages]);
    setIsLoading(false);
    
    return newImages;
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const clearImages = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  return {
    images,
    isLoading,
    uploadImages,
    removeImage,
    clearImages,
  };
}
