import { removeBackground } from '@imgly/background-removal';

/**
 * Optimizes image size for faster processing
 * Resizes large images to max 1024px on the longest side
 */
async function optimizeImageForProcessing(imageFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDimension = 1024;
      let { width, height } = img;
      
      // Only resize if image is larger than max dimension
      if (width <= maxDimension && height <= maxDimension) {
        resolve(imageFile);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      // Create canvas and resize
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageFile);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], imageFile.name, { type: imageFile.type });
          resolve(optimizedFile);
        } else {
          resolve(imageFile);
        }
      }, imageFile.type, 0.92);
    };
    img.onerror = () => resolve(imageFile);
    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Removes the background from an image file
 * @param imageFile - The image file to process
 * @returns A Promise that resolves to a Blob of the image with transparent background (PNG)
 */
export async function removeImageBackground(imageFile: File): Promise<Blob> {
  try {
    // Optimize image size for faster processing
    const optimizedFile = await optimizeImageForProcessing(imageFile);
    
    const blob = await removeBackground(optimizedFile, {
      outputFormat: 'image/png',
      model: 'small', // Use 'small' for faster processing (can be 'small' | 'medium' | 'large')
    });
    return blob;
  } catch (error) {
    console.error('Error removing background:', error);
    throw new Error('Failed to remove background from image');
  }
}

/**
 * Converts a Blob to a data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

