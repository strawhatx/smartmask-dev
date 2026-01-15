import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Crown, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { type PlatformPreset } from './platform-presets';
import { cn } from '@/lib/utils';

// Types
type ImageStatus = 'pending' | 'processing' | 'complete';

interface BatchImage {
  id: string;
  file: File;
  url: string;
  status: ImageStatus;
  processedUrl?: string;
}

interface BatchProcessorProps {
  preset: PlatformPreset;
  isPro: boolean;
  onUpgrade: () => void;
}

interface ProcessedImageDimensions {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
}

// Constants
const ASPECT_RATIO_TOLERANCE = 0.01;
const BLUR_RADIUS = 20;
const OVERLAY_OPACITY = 0.3;
const PROCESSING_DELAY_MS = 500;
const DOWNLOAD_DELAY_MS = 100;
const BYTES_TO_KB = 1024;
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif';
const OUTPUT_FORMAT = 'image/png';

const PRO_FEATURES = [
  'Batch process unlimited images',
  'HD quality downloads',
  'Ad-free experience',
  'Priority support',
] as const;

// Helper Functions
function generateImageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  return (bytes / BYTES_TO_KB).toFixed(1);
}

function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

function calculateBlurBackgroundDimensions(
  imgWidth: number,
  imgHeight: number,
  canvasWidth: number,
  canvasHeight: number
): ProcessedImageDimensions {
  const imgAspect = imgWidth / imgHeight;
  const canvasAspect = canvasWidth / canvasHeight;

  if (imgAspect > canvasAspect) {
    const drawHeight = canvasHeight;
    const drawWidth = canvasHeight * imgAspect;
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = 0;
    return { drawWidth, drawHeight, offsetX, offsetY };
  } else {
    const drawWidth = canvasWidth;
    const drawHeight = canvasWidth / imgAspect;
    const offsetX = 0;
    const offsetY = (canvasHeight - drawHeight) / 2;
    return { drawWidth, drawHeight, offsetX, offsetY };
  }
}

function calculateMainImageDimensions(
  imgWidth: number,
  imgHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  targetAspectRatio: number
): ProcessedImageDimensions {
  const imageAspectRatio = imgWidth / imgHeight;

  if (imageAspectRatio > targetAspectRatio) {
    const drawWidth = canvasWidth;
    const drawHeight = imgHeight * (drawWidth / imgWidth);
    const offsetX = 0;
    const offsetY = (canvasHeight - drawHeight) / 2;
    return { drawWidth, drawHeight, offsetX, offsetY };
  } else {
    const drawHeight = canvasHeight;
    const drawWidth = imgWidth * (drawHeight / imgHeight);
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = 0;
    return { drawWidth, drawHeight, offsetX, offsetY };
  }
}

async function processImageWithPreset(
  imageUrl: string,
  preset: PlatformPreset
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = preset.width;
        canvas.height = preset.height;

        const targetAspectRatio = preset.width / preset.height;
        const imageAspectRatio = img.width / img.height;
        const aspectRatioMatch = Math.abs(targetAspectRatio - imageAspectRatio) < ASPECT_RATIO_TOLERANCE;

        if (aspectRatioMatch) {
          // Direct draw for matching aspect ratios
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          // Apply blur background fill
          ctx.filter = `blur(${BLUR_RADIUS}px)`;
          
          const blurDims = calculateBlurBackgroundDimensions(
            img.width,
            img.height,
            canvas.width,
            canvas.height
          );
          
          ctx.drawImage(
            img,
            blurDims.offsetX,
            blurDims.offsetY,
            blurDims.drawWidth,
            blurDims.drawHeight
          );
          ctx.filter = 'none';

          // Add overlay
          ctx.fillStyle = `rgba(0, 0, 0, ${OVERLAY_OPACITY})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw main image centered
          const mainDims = calculateMainImageDimensions(
            img.width,
            img.height,
            canvas.width,
            canvas.height,
            targetAspectRatio
          );
          
          ctx.drawImage(
            img,
            mainDims.offsetX,
            mainDims.offsetY,
            mainDims.drawWidth,
            mainDims.drawHeight
          );
        }

        const url = canvas.toDataURL(OUTPUT_FORMAT);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    };
    
    img.src = imageUrl;
  });
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Sub-components
interface UpgradeScreenProps {
  onUpgrade: () => void;
}

function UpgradeScreen({ onUpgrade }: UpgradeScreenProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-lg p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          Batch Processing is a Pro Feature
        </h3>
        <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
          Upgrade to Pro to resize multiple images at once, saving you time and effort.
          Perfect for content creators managing multiple platforms.
        </p>
        <div className="bg-white rounded-lg p-6 mb-8 max-w-md mx-auto">
          <h4 className="font-semibold text-gray-900 mb-3">Pro Features Include:</h4>
          <ul className="text-left text-gray-700 space-y-2">
            {PRO_FEATURES.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all shadow-lg"
        >
          <Crown className="w-6 h-6" aria-hidden="true" />
          Upgrade to Pro - $9.99/month
        </button>
      </div>
    </div>
  );
}

interface ImageItemProps {
  image: BatchImage;
  preset: PlatformPreset;
  onRemove: (id: string) => void;
  onDownload: (image: BatchImage) => void;
}

function ImageItem({ image, preset, onRemove, onDownload }: ImageItemProps) {
  const handleDownload = useCallback(() => {
    onDownload(image);
  }, [image, onDownload]);

  const handleRemove = useCallback(() => {
    onRemove(image.id);
  }, [image.id, onRemove]);

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden group">
      <div className="aspect-square bg-gray-100 relative">
        <img
          src={image.processedUrl || image.url}
          alt={image.file.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {image.status === 'processing' && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="w-8 h-8 text-white animate-spin" aria-hidden="true" />
            <span className="sr-only">Processing image</span>
          </div>
        )}
        {image.status === 'complete' && (
          <div className="absolute top-2 right-2" aria-label="Processing complete">
            <CheckCircle2 className="w-6 h-6 text-green-500 bg-white rounded-full" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm text-gray-900 truncate font-medium">{image.file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(image.file.size)} KB</p>
      </div>
      <button
        onClick={handleRemove}
        aria-label={`Remove ${image.file.name}`}
        className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      {image.status === 'complete' && (
        <button
          onClick={handleDownload}
          aria-label={`Download ${image.file.name}`}
          className="absolute bottom-2 right-2 p-2 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

interface UploadAreaProps {
  preset: PlatformPreset;
  onFilesSelect: (files: FileList) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function UploadArea({ preset, onFilesSelect, fileInputRef }: UploadAreaProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelect(files);
      }
    },
    [onFilesSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-all"
    >
      <Upload className="w-16 h-16 text-gray-400 mb-4" aria-hidden="true" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Multiple Images</h3>
      <p className="text-gray-500 text-center mb-4">
        Drag and drop your images here, or click to browse
      </p>
      <p className="text-sm text-gray-400">
        All images will be resized to {preset.name} ({preset.width}×{preset.height})
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES}
        onChange={handleFileInput}
        className="hidden"
        aria-label="Upload images"
      />
    </div>
  );
}

// Main Component
export function BatchProcessor({ preset, isPro, onUpgrade }: BatchProcessorProps) {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.url);
        if (image.processedUrl) {
          URL.revokeObjectURL(image.processedUrl);
        }
      });
    };
  }, []);

  const handleFilesSelect = useCallback((files: FileList) => {
    const newImages: BatchImage[] = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: generateImageId(),
        file,
        url: URL.createObjectURL(file),
        status: 'pending' as const,
      }));

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.url);
        if (image.processedUrl) {
          URL.revokeObjectURL(image.processedUrl);
        }
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const processImage = useCallback(
    async (image: BatchImage): Promise<string> => {
      return processImageWithPreset(image.url, preset);
    },
    [preset]
  );

  const processAllImages = useCallback(async () => {
    if (!isPro) {
      onUpgrade();
      return;
    }

    setIsProcessing(true);

    try {
      for (const image of images) {
        if (image.status === 'complete') continue;

        setImages((prev) =>
          prev.map((img) => (img.id === image.id ? { ...img, status: 'processing' as const } : img))
        );

        try {
          const processedUrl = await processImage(image);

          setImages((prev) =>
            prev.map((img) =>
              img.id === image.id ? { ...img, status: 'complete' as const, processedUrl } : img
            )
          );

          // Small delay to show progress
          await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));
        } catch (error) {
          console.error('Failed to process image:', error);
          // Continue processing other images even if one fails
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [images, isPro, onUpgrade, processImage]);

  const downloadImage = useCallback(
    (image: BatchImage) => {
      if (!image.processedUrl) return;

      const fileNameWithoutExt = getFileNameWithoutExtension(image.file.name);
      const fileName = `${fileNameWithoutExt}-${preset.id}.png`;
      triggerDownload(image.processedUrl, fileName);
    },
    [preset.id]
  );

  const downloadAll = useCallback(() => {
    images.forEach((image, index) => {
      if (image.processedUrl) {
        setTimeout(() => downloadImage(image), index * DOWNLOAD_DELAY_MS);
      }
    });
  }, [images, downloadImage]);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFilesSelect(files);
      }
    },
    [handleFilesSelect]
  );

  if (!isPro) {
    return <UpgradeScreen onUpgrade={onUpgrade} />;
  }

  const hasCompletedImages = images.some((img) => img.status === 'complete');
  const allImagesComplete = images.length > 0 && images.every((img) => img.status === 'complete');

  return (
    <div className="max-w-6xl mx-auto">
      {images.length === 0 ? (
        <UploadArea preset={preset} onFilesSelect={handleFilesSelect} fileInputRef={fileInputRef} />
      ) : (
        <>
          {/* Image Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {images.length} Image{images.length !== 1 ? 's' : ''} Selected
              </h3>
              <button
                onClick={handleAddMore}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Add More
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleFileInput}
                className="hidden"
                aria-label="Upload more images"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <ImageItem
                  key={image.id}
                  image={image}
                  preset={preset}
                  onRemove={removeImage}
                  onDownload={downloadImage}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={processAllImages}
              disabled={isProcessing || allImagesComplete}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-4 font-semibold rounded-lg transition-all shadow-lg',
                isProcessing || allImagesComplete
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5" aria-hidden="true" />
                  Process All Images
                </>
              )}
            </button>

            {hasCompletedImages && (
              <button
                onClick={downloadAll}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-lg"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                Download All
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
