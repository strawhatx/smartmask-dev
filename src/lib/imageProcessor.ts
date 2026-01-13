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
