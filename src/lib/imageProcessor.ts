import { PlatformPreset, BackgroundFillType } from './presets';

export interface ResizeOptions {
  preset: PlatformPreset;
  backgroundFill: BackgroundFillType;
  solidColor: string;
  gradientColors: [string, string];
  smartCrop: boolean;
}

export async function resizeImage(
  imageFile: File,
  options: ResizeOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const { width: targetWidth, height: targetHeight } = options.preset;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate scaling and positioning
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth: number;
        let drawHeight: number;
        let offsetX: number;
        let offsetY: number;

        if (imgRatio > targetRatio) {
          // Image is wider than target - fit height
          drawHeight = targetHeight;
          drawWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller than target - fit width
          drawWidth = targetWidth;
          drawHeight = img.height * (targetWidth / img.width);
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // Apply background fill
        switch (options.backgroundFill) {
          case 'blur':
            // Draw blurred background
            ctx.filter = 'blur(30px)';
            ctx.drawImage(img, -50, -50, targetWidth + 100, targetHeight + 100);
            ctx.filter = 'none';
            // Draw a slight overlay to soften
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            break;

          case 'solid':
            ctx.fillStyle = options.solidColor;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            break;

          case 'gradient':
            const gradient = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
            gradient.addColorStop(0, options.gradientColors[0]);
            gradient.addColorStop(1, options.gradientColors[1]);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            break;

          case 'transparent':
            // Canvas is already transparent
            break;
        }

        // Smart crop adjustments (simplified - centers on image)
        if (options.smartCrop) {
          // For smart crop, we cover the entire canvas
          const coverRatio = Math.max(targetWidth / img.width, targetHeight / img.height);
          drawWidth = img.width * coverRatio;
          drawHeight = img.height * coverRatio;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // Draw the main image
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to blob
        const format = options.backgroundFill === 'transparent' ? 'image/png' : 'image/jpeg';
        const quality = 0.92;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generatePreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  aspectRatio: number | null; // null means keep original aspect ratio or use custom crop
  customCrop?: CropArea; // Custom crop coordinates (in image pixels)
}

export async function cropImage(
  imageFile: File,
  options: CropOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        let cropWidth: number;
        let cropHeight: number;
        let cropX: number;
        let cropY: number;

        if (options.customCrop) {
          // Use custom crop coordinates
          cropX = Math.max(0, Math.min(options.customCrop.x, img.width));
          cropY = Math.max(0, Math.min(options.customCrop.y, img.height));
          cropWidth = Math.max(1, Math.min(options.customCrop.width, img.width - cropX));
          cropHeight = Math.max(1, Math.min(options.customCrop.height, img.height - cropY));
        } else if (options.aspectRatio === null) {
          // Keep original dimensions
          cropWidth = img.width;
          cropHeight = img.height;
          cropX = 0;
          cropY = 0;
        } else {
          // Calculate crop dimensions based on aspect ratio
          const imgRatio = img.width / img.height;
          const targetRatio = options.aspectRatio;

          if (imgRatio > targetRatio) {
            // Image is wider - crop width
            cropHeight = img.height;
            cropWidth = img.height * targetRatio;
            cropX = (img.width - cropWidth) / 2;
            cropY = 0;
          } else {
            // Image is taller - crop height
            cropWidth = img.width;
            cropHeight = img.width / targetRatio;
            cropX = 0;
            cropY = (img.height - cropHeight) / 2;
          }
        }

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw the cropped portion
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        // Convert to blob (preserve original format if possible)
        const format = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = 0.92;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

export type RotateDirection = '90' | '-90' | '180';
export type FlipDirection = 'horizontal' | 'vertical';

export async function rotateImage(
  imageFile: File,
  direction: RotateDirection
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        const angle = parseInt(direction) * (Math.PI / 180);
        
        // Calculate new canvas dimensions
        if (direction === '90' || direction === '-90') {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Translate and rotate
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(angle);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // Convert to blob
        const format = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = 0.92;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

export async function flipImage(
  imageFile: File,
  direction: FlipDirection
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Flip horizontally or vertically
        if (direction === 'horizontal') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        } else {
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);
        }

        ctx.drawImage(img, 0, 0);

        // Convert to blob
        const format = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = 0.92;
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}
