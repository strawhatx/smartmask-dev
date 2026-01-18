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
  // Sanitize customCrop - convert invalid values to undefined
  if (options.customCrop &&
      (!Number.isFinite(options.customCrop.x) ||
       !Number.isFinite(options.customCrop.y) ||
       !Number.isFinite(options.customCrop.width) ||
       !Number.isFinite(options.customCrop.height) ||
       options.customCrop.width <= 0 ||
       options.customCrop.height <= 0)) {
    options = { ...options, customCrop: undefined };
  }

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
          // Convert to numbers first
          const customCropX = Number(options.customCrop.x);
          const customCropY = Number(options.customCrop.y);
          const customCropW = Number(options.customCrop.width);
          const customCropH = Number(options.customCrop.height);
          
          // Validate custom crop coordinates - check for NaN, Infinity, and invalid values
          if (!Number.isFinite(customCropX) || !Number.isFinite(customCropY) ||
              !Number.isFinite(customCropW) || !Number.isFinite(customCropH) ||
              isNaN(customCropX) || isNaN(customCropY) || isNaN(customCropW) || isNaN(customCropH) ||
              !isFinite(customCropX) || !isFinite(customCropY) || !isFinite(customCropW) || !isFinite(customCropH) ||
              customCropW <= 0 || customCropH <= 0 || customCropX < 0 || customCropY < 0) {
            reject(new Error(`Invalid crop coordinates: x=${customCropX}, y=${customCropY}, width=${customCropW}, height=${customCropH}`));
            return;
          }
          
          // Use custom crop coordinates - these should already be in image coordinates
          cropX = Math.max(0, Math.min(Math.round(customCropX), img.width));
          cropY = Math.max(0, Math.min(Math.round(customCropY), img.height));
          cropWidth = Math.max(1, Math.min(Math.round(customCropW), img.width - cropX));
          cropHeight = Math.max(1, Math.min(Math.round(customCropH), img.height - cropY));
          
          // Ensure valid dimensions
          if (cropWidth <= 0 || cropHeight <= 0 || cropX < 0 || cropY < 0) {
            reject(new Error('Invalid crop dimensions'));
            return;
          }
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

        // Ensure canvas dimensions are valid
        if (cropWidth <= 0 || cropHeight <= 0 || !Number.isFinite(cropWidth) || !Number.isFinite(cropHeight)) {
          reject(new Error('Invalid canvas dimensions'));
          return;
        }
        
        canvas.width = Math.round(cropWidth);
        canvas.height = Math.round(cropHeight);

        // Clear canvas first
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the cropped portion
        try {
          ctx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );
        } catch (drawError) {
          reject(new Error(`Failed to draw image: ${drawError instanceof Error ? drawError.message : 'Unknown error'}`));
          return;
        }

        // Verify canvas dimensions are valid
        if (canvas.width <= 0 || canvas.height <= 0) {
          reject(new Error(`Invalid canvas dimensions: ${canvas.width}x${canvas.height}`));
          return;
        }

        // Convert to blob - use PNG for better compatibility and to preserve transparency
        const format = 'image/png';
        
        // Check if toBlob is supported
        if (typeof canvas.toBlob !== 'function') {
          reject(new Error('Canvas toBlob is not supported in this browser'));
          return;
        }
        
        // Create blob - PNG format doesn't use quality parameter
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              // Fallback: try with JPEG format
              canvas.toBlob(
                (fallbackBlob) => {
                  if (fallbackBlob && fallbackBlob.size > 0) {
                    resolve(fallbackBlob);
                  } else {
                    reject(new Error(
                      `Failed to create blob. Canvas: ${canvas.width}x${canvas.height}, ` +
                      `Image: ${img.width}x${img.height}, Crop: ${cropX},${cropY} ${cropWidth}x${cropHeight}`
                    ));
                  }
                },
                'image/jpeg',
                0.92
              );
            }
          },
          format
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

export interface CompressOptions {
  quality?: number; // 0-1 for quality mode
  targetSizeKB?: number; // Target file size in KB for size mode
  mode: 'quality' | 'size' | 'custom';
  outputFormat?: 'original' | 'webp';
}

export async function compressImage(
  imageFile: File,
  options: CompressOptions
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
        ctx.drawImage(img, 0, 0);

        // Determine output format
        let mimeType: string;
        let quality: number = 0.8;

        if (options.outputFormat === 'webp') {
          mimeType = 'image/webp';
          quality = options.quality ?? 0.8;
        } else {
          // Keep original format
          mimeType = imageFile.type || 'image/jpeg';
          
          if (options.mode === 'quality') {
            quality = 0.7; // High quality compression
          } else if (options.mode === 'custom' && options.quality !== undefined) {
            quality = options.quality / 100;
          } else {
            quality = 0.6; // Default compression
          }
        }

        // For target size mode, binary search for quality
        if (options.mode === 'size' && options.targetSizeKB) {
          findQualityForTargetSize(canvas, mimeType, options.targetSizeKB * 1024)
            .then(quality => {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to create blob'));
                  }
                },
                mimeType,
                quality
              );
            })
            .catch(reject);
          return;
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          mimeType,
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

async function findQualityForTargetSize(
  canvas: HTMLCanvasElement,
  mimeType: string,
  targetSizeBytes: number
): Promise<number> {
  let minQuality = 0.1;
  let maxQuality = 1.0;
  let quality = 0.5;

  for (let i = 0; i < 10; i++) {
    quality = (minQuality + maxQuality) / 2;
    
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    if (!blob) {
      return 0.8;
    }

    if (blob.size <= targetSizeBytes) {
      minQuality = quality;
    } else {
      maxQuality = quality;
    }
  }

  return quality;
}

export type ImageFormat = 'jpg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff';

export interface ConvertOptions {
  format: ImageFormat;
  maintainQuality?: boolean;
}

export async function convertImage(
  imageFile: File,
  options: ConvertOptions
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
        ctx.drawImage(img, 0, 0);

        // Map format to MIME type
        const formatMap: Record<ImageFormat, string> = {
          jpg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
          gif: 'image/gif',
          bmp: 'image/bmp',
          tiff: 'image/tiff'
        };

        const mimeType = formatMap[options.format];
        const quality = options.maintainQuality ? 0.95 : 0.85;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          mimeType,
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

export type UpscaleLevel = '2x' | '4x' | '8x';

export interface UpscaleOptions {
  level: UpscaleLevel;
  enhanceDetails?: boolean;
  removeNoise?: boolean;
  sharpenEdges?: boolean;
}

export async function upscaleImage(
  imageFile: File,
  options: UpscaleOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        const multiplier = parseInt(options.level);
        const newWidth = img.width * multiplier;
        const newHeight = img.height * multiplier;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Use imageSmoothingEnabled for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw scaled image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Apply enhancements if requested
        if (options.enhanceDetails || options.removeNoise || options.sharpenEdges) {
          const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
          const data = imageData.data;

          // Simple enhancement: slight contrast and sharpening
          for (let i = 0; i < data.length; i += 4) {
            if (options.enhanceDetails) {
              // Slight contrast boost
              data[i] = Math.min(255, data[i] * 1.05);     // R
              data[i + 1] = Math.min(255, data[i + 1] * 1.05); // G
              data[i + 2] = Math.min(255, data[i + 2] * 1.05); // B
            }
            
            if (options.removeNoise) {
              // Simple noise reduction (would need more sophisticated algorithm in production)
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (Math.abs(data[i] - avg) < 10) {
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // Convert to blob
        const format = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = 0.95;
        
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
