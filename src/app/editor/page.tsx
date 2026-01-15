'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  Home, Image as ImageIcon, Crop as CropIcon, Maximize2,
  FileText, Upload, Trash2, CheckSquare, Square, RotateCw,
  ZoomIn, Tag, ArrowLeft, Minimize2, RefreshCw, TrendingUp, Loader2, Check, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundPanel } from '@/components/background-panel';
import { CropPanel } from '@/components/crop-panel';
import { ResizePanel } from '@/components/resize-panel';
import { CompressPanel } from '@/components/compress-panel';
import { ConvertPanel } from '@/components/convert-panel';
import { UpscalerPanel } from '@/components/upscaler-panel';
import { removeImageBackground, blobToDataURL } from '@/lib/backgroundRemoval';
import { cropImage, rotateImage, flipImage, compressImage, convertImage, upscaleImage, CropArea, ImageFormat, UpscaleLevel } from '@/lib/imageProcessor';
import { CropOverlay, CropOverlayHandle } from '@/components/crop-overlay';
import { CropPreviewOverlay } from '@/components/crop-preview-overlay';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const TRANSPARENT_CHECKERBOARD_PATTERN = {
  backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
} as const;

// Types
export type BackgroundType = 'blur' | 'color' | 'texture' | 'transparent';
export type SidebarSection = 'home' | 'background' | 'crop' | 'resize' | 'compress' | 'convert' | 'upscaler';

export interface UploadedImage {
  id: string;
  file: File;
  url: string;
  selected: boolean;
  background?: string;
  backgroundType?: BackgroundType;
  processedUrl?: string;
  isProcessing?: boolean;
  error?: string;
  cropArea?: CropArea;
  isCustomCropActive?: boolean;
  cropPreviewAspectRatio?: number | null;
  originalWidth?: number;
  originalHeight?: number;
  resizeWidth?: number;
  resizeHeight?: number;
}

interface EditorWorkspaceProps {
  onBack: () => void;
}

interface SidebarNavItem {
  id: SidebarSection;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

// Helper function to validate file
const validateFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `File type ${file.type} is not supported. Please use: ${ACCEPTED_IMAGE_TYPES.join(', ')}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  return null;
};

// Helper function to generate unique ID
const generateImageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to resize image
async function resizeImageFile(imageFile: File, width: number, height: number): Promise<Blob> {
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

        canvas.width = width;
        canvas.height = height;

        // Calculate aspect ratios
        const imageAspectRatio = img.width / img.height;
        const targetAspectRatio = width / height;

        let drawWidth: number;
        let drawHeight: number;
        let offsetX: number;
        let offsetY: number;

        // Maintain aspect ratio and center the image
        if (imageAspectRatio > targetAspectRatio) {
          // Image is wider - fit to width
          drawWidth = width;
          drawHeight = width / imageAspectRatio;
          offsetX = 0;
          offsetY = (height - drawHeight) / 2;
        } else {
          // Image is taller - fit to height
          drawHeight = height;
          drawWidth = height * imageAspectRatio;
          offsetX = (width - drawWidth) / 2;
          offsetY = 0;
        }

        // Draw the image centered (canvas background is transparent by default)
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to PNG to preserve transparency
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png'
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

// Image Item Component
interface ImageItemProps {
  image: UploadedImage;
  backgroundStyle: React.CSSProperties | undefined;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
  onCustomCropApply: (imageId: string, cropArea: CropArea) => void;
  onCustomCropCancel: () => void;
  onApplyCropToImage: (imageId: string, aspectRatio: number | null, customCrop?: CropArea) => void;
  onSetImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  resizePreview?: { width: number | null; height: number | null };
}

function ImageItem({ 
  image, 
  backgroundStyle, 
  onToggleSelection, 
  onDelete,
  onCustomCropApply,
  onCustomCropCancel,
  onApplyCropToImage,
  onSetImages,
  resizePreview
}: ImageItemProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Memoize callbacks to prevent infinite loops
  const handleCropAreaChange = useCallback((cropArea: CropArea) => {
    // Store the crop area (already converted to image coordinates)
    onSetImages(prev => prev.map(img => 
      img.id === image.id 
        ? { ...img, cropArea } 
        : img
    ));
  }, [image.id, onSetImages]);

  // Update container size when image is displayed (needed for both custom crop and preview)
  useEffect(() => {
    const needsContainerSize = image.isCustomCropActive || image.cropPreviewAspectRatio !== undefined;
    
    if (needsContainerSize && imageContainerRef.current) {
      const updateSize = () => {
        const rect = imageContainerRef.current?.getBoundingClientRect();
        if (rect) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      };
      updateSize();
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(imageContainerRef.current);
      return () => resizeObserver.disconnect();
    } else if (!needsContainerSize) {
      // Reset container size when crop modes are inactive
      setContainerSize({ width: 0, height: 0 });
    }
  }, [image.isCustomCropActive, image.cropPreviewAspectRatio]);

  const cropOverlayRef = useRef<CropOverlayHandle | null>(null);

  // Calculate aspect ratio for container
  const getAspectRatio = () => {
    // Use resize preview if available and image is selected
    if (image.selected && resizePreview?.width && resizePreview?.height) {
      return resizePreview.width / resizePreview.height;
    }
    // Use applied resize dimensions if available
    if (image.resizeWidth && image.resizeHeight) {
      return image.resizeWidth / image.resizeHeight;
    }
    // Default to square
    return 1;
  };

  const aspectRatio = getAspectRatio();

  // Calculate explicit size to fit within square
  const getContainerStyle = () => {
    if (aspectRatio === 1) {
      return { width: '100%', height: '100%' };
    }
    // For non-square, fit within the square container
    // The square container is 1:1, so we need to fit our aspect ratio within it
    if (aspectRatio > 1) {
      // Landscape: width is the limiting factor
      return { 
        width: '100%', 
        height: `${100 / aspectRatio}%`,
        maxHeight: '100%'
      };
    } else {
      // Portrait: height is the limiting factor  
      return { 
        width: `${aspectRatio * 100}%`,
        height: '100%',
        maxWidth: '100%'
      };
    }
  };

  return (
    <div className="flex flex-col">
      <div className="relative aspect-square flex items-center justify-center overflow-hidden">
        <div
          data-image-id={image.id}
          className={cn(
            "relative rounded-xl overflow-hidden border-4 transition-all group",
            image.isCustomCropActive || image.cropPreviewAspectRatio !== undefined ? "cursor-default" : "cursor-pointer",
            image.selected 
              ? "border-blue-500 shadow-lg" 
              : "border-transparent hover:border-gray-300"
          )}
          style={{
            aspectRatio: `${aspectRatio}`,
            ...getContainerStyle()
          }}
        onClick={() => {
          if (!image.isCustomCropActive && image.cropPreviewAspectRatio === undefined) {
            onToggleSelection(image.id);
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!image.isCustomCropActive) {
              onToggleSelection(image.id);
            }
          }
        }}
        aria-label={`Image ${image.file.name}${image.selected ? ' (selected)' : ''}`}
      >
        <div 
          ref={imageContainerRef}
          className="w-full h-full flex items-center justify-center relative bg-white"
        >
          {/* Background layer - positioned behind image */}
          {image.backgroundType && (
            <div
              className="absolute inset-0"
              style={backgroundStyle}
            />
          )}
          {image.isProcessing && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20"
              role="status"
              aria-live="polite"
            >
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" aria-hidden="true" />
                <span className="text-xs text-gray-600 font-medium">Processing...</span>
              </div>
            </div>
          )}
          {image.error && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 z-20 p-2"
              role="alert"
            >
              <span className="text-xs text-red-600 font-medium text-center">{image.error}</span>
            </div>
          )}
          <img
            ref={imgRef}
            src={image.url}
            alt={image.file.name}
            className={cn(
              "relative z-10",
              image.backgroundType === 'transparent' && "drop-shadow-lg"
            )}
            style={{
              width: 'auto',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            loading="lazy"
            onLoad={() => {
              if (imgRef.current) {
                setDimensions({
                  width: imgRef.current.naturalWidth,
                  height: imgRef.current.naturalHeight
                });
              }
            }}
          />
          {image.isCustomCropActive && containerSize.width > 0 && (
            <CropOverlay
              ref={cropOverlayRef}
              imageId={image.id}
              imageUrl={image.url}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              onCrop={(cropArea) => onCustomCropApply(image.id, cropArea)}
              onCancel={onCustomCropCancel}
              initialCrop={image.cropArea}
            />
          )}
          {image.cropPreviewAspectRatio !== undefined && 
           image.cropPreviewAspectRatio !== null && 
           !image.isCustomCropActive &&
           containerSize.width > 0 && (
            <CropPreviewOverlay
              key={`${image.id}-${image.cropPreviewAspectRatio}`}
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              aspectRatio={image.cropPreviewAspectRatio}
              imageUrl={image.url}
              onCropAreaChange={handleCropAreaChange}
            />
          )}
        </div>

        {/* Selection Checkbox */}
        {!image.isCustomCropActive && (
          <button
            className={cn(
              "absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center transition-all z-30",
              image.selected
                ? "bg-blue-500 text-white"
                : "bg-white bg-opacity-80 text-gray-400 opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(image.id);
            }}
            aria-label={image.selected ? 'Deselect image' : 'Select image'}
          >
            {image.selected ? (
              <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Square className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        )}

        {/* Delete Button */}
        {!image.isCustomCropActive && (
          <button
            className="absolute bottom-2 right-2 w-8 h-8 bg-white bg-opacity-90 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 z-30"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
            aria-label={`Delete ${image.file.name}`}
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}

        {/* Zoom Button */}
        {!image.isCustomCropActive && (
          <button
            className="absolute bottom-2 left-2 w-8 h-8 bg-white bg-opacity-90 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 z-30"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement zoom functionality
            }}
            aria-label={`Zoom ${image.file.name}`}
          >
            <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
        </div>
      </div>

      {/* Dimension Label - Below Image */}
      {(dimensions.width > 0 && dimensions.height > 0) && (
        <div className="mt-2 px-3 py-1.5 bg-gray-800 bg-opacity-75 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {image.resizeWidth && image.resizeHeight
              ? `${image.originalWidth || dimensions.width} x ${image.originalHeight || dimensions.height} → ${image.resizeWidth} x ${image.resizeHeight}`
              : `${dimensions.width} x ${dimensions.height}`
            }
          </span>
        </div>
      )}

      {/* Crop Control Buttons - Below Image */}
      {(image.isCustomCropActive || image.cropPreviewAspectRatio !== undefined) && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (image.isCustomCropActive && cropOverlayRef.current) {
                cropOverlayRef.current.apply();
              } else if (image.cropPreviewAspectRatio !== undefined && image.cropArea) {
                // Apply preset crop with custom position/size
                onApplyCropToImage(image.id, image.cropPreviewAspectRatio, image.cropArea);
                onSetImages(prev => prev.map(img => 
                  img.id === image.id 
                    ? { ...img, cropPreviewAspectRatio: undefined, cropArea: undefined } 
                    : img
                ));
              } else if (image.cropPreviewAspectRatio !== undefined) {
                // Apply preset crop with default position
                onApplyCropToImage(image.id, image.cropPreviewAspectRatio);
                onSetImages(prev => prev.map(img => 
                  img.id === image.id 
                    ? { ...img, cropPreviewAspectRatio: undefined } 
                    : img
                ));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Apply Crop</span>
          </button>
          <button
            onClick={() => {
              if (image.isCustomCropActive) {
                onCustomCropCancel();
              } else {
                // Cancel preset crop preview
                onSetImages(prev => prev.map(img => 
                  img.id === image.id 
                    ? { ...img, cropPreviewAspectRatio: undefined } 
                    : img
                ));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to get background style
const getBackgroundStyle = (image: UploadedImage): React.CSSProperties | undefined => {
  if (!image.backgroundType) {
    return undefined;
  }

  switch (image.backgroundType) {
    case 'transparent':
      return TRANSPARENT_CHECKERBOARD_PATTERN;
    case 'color':
      return { backgroundColor: image.background || '#E5E7EB' };
    case 'texture':
      return {
        backgroundImage: `url(${image.background})`,
        backgroundSize: '50%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    case 'blur':
      return {
        backgroundImage: `url(${image.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(20px)',
        transform: 'scale(1.1)'
      };
    default:
      return undefined;
  }
};

// Sidebar navigation items
const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'background', icon: ImageIcon, label: 'Background' },
  { id: 'crop', icon: CropIcon, label: 'Crop' },
  { id: 'resize', icon: Maximize2, label: 'Resize' },
  { id: 'compress', icon: Minimize2, label: 'Compress' },
  { id: 'convert', icon: RefreshCw, label: 'Convert' },
  { id: 'upscaler', icon: TrendingUp, label: 'Upscaler' },
];

export function EditorWorkspace({ onBack }: EditorWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>('home');
  const [resizePreview, setResizePreview] = useState<{ width: number | null; height: number | null }>({ width: null, height: null });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customCropMode, setCustomCropMode] = useState(false);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
        if (img.processedUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(img.processedUrl);
        }
      });
    };
  }, []); // Only run on unmount

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        return;
      }

      newImages.push({
        id: generateImageId(),
        file,
        url: URL.createObjectURL(file),
        selected: false
      });
    });

    if (errors.length > 0) {
      console.warn('File validation errors:', errors);
      // In a production app, you'd show these errors to the user via toast/notification
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const toggleImageSelection = useCallback((id: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, selected: !img.selected } : img
    ));
  }, []);

  const selectAll = useCallback(() => {
    setImages(prev => prev.map(img => ({ ...img, selected: true })));
  }, []);

  const deleteSelected = useCallback(() => {
    setImages(prev => {
      const toDelete = prev.filter(img => img.selected);
      // Clean up all URLs before removing
      toDelete.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
        if (img.processedUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(img.processedUrl);
        }
      });
      return prev.filter(img => !img.selected);
    });
  }, []);

  const deleteImage = useCallback((id: string) => {
    setImages(prev => {
      const imageToDelete = prev.find(img => img.id === id);
      if (imageToDelete) {
        // Clean up all URLs
        if (imageToDelete.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageToDelete.url);
        }
        if (imageToDelete.processedUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(imageToDelete.processedUrl);
        }
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const selectedCount = useMemo(() => 
    images.filter(img => img.selected).length, 
    [images]
  );

  const selectedImages = useMemo(() => 
    images.filter(img => img.selected), 
    [images]
  );

  const applyBackgroundToSelected = useCallback(async (
    background: string, 
    type: BackgroundType
  ) => {
    if (type === 'transparent') {
      // Mark selected images as processing
      setImages(prev => {
        const selectedIds = prev.filter(img => img.selected).map(img => img.id);
        
        // Process each selected image
        selectedIds.forEach(async (imageId) => {
          setImages(current => {
            const image = current.find(img => img.id === imageId);
            if (!image) return current;

            // Process asynchronously
            (async () => {
              try {
                const processedBlob = await removeImageBackground(image.file);
                const processedDataURL = await blobToDataURL(processedBlob);
                
                const processedFile = new File(
                  [processedBlob], 
                  image.file.name.replace(/\.[^/.]+$/, '.png'), 
                  { type: 'image/png' }
                );
                
                setImages(prevState => {
                  const currentImage = prevState.find(img => img.id === imageId);
                  if (!currentImage) return prevState;

                  // Revoke old URL
                  if (currentImage.url.startsWith('blob:')) {
                    URL.revokeObjectURL(currentImage.url);
                  }

                  return prevState.map(img => 
                    img.id === imageId 
                      ? { 
                          ...img, 
                          file: processedFile,
                          url: processedDataURL,
                          background, 
                          backgroundType: type,
                          processedUrl: undefined,
                          isProcessing: false,
                          error: undefined
                        } 
                      : img
                  );
                });
              } catch (error) {
                console.error('Failed to remove background:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to remove background';
                
                setImages(prevState => prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        isProcessing: false,
                        error: errorMessage
                      } 
                    : img
                ));
              }
            })();

            return current;
          });
        });

        return prev.map(img => 
          img.selected ? { ...img, isProcessing: true, error: undefined } : img
        );
      });
    } else {
      // For other background types, just update metadata
      setImages(prev => prev.map(img => 
        img.selected 
          ? { 
              ...img, 
              background, 
              backgroundType: type,
              processedUrl: undefined,
              error: undefined
            } 
          : img
      ));
    }
  }, []);

  const applyCropToImage = useCallback(async (imageId: string, aspectRatio: number | null, customCrop?: CropArea) => {
    setImages(prev => {
      const image = prev.find(img => img.id === imageId);
      if (!image) return prev;

      // Process asynchronously
      (async () => {
        try {
          setImages(prevState => {
            const currentImage = prevState.find(img => img.id === imageId);
            if (!currentImage) return prevState;
            return prevState.map(img => 
              img.id === imageId 
                ? { ...img, isProcessing: true, error: undefined } 
                : img
            );
          });

          const processedBlob = await cropImage(image.file, { aspectRatio, customCrop });
          const processedDataURL = await blobToDataURL(processedBlob);
          
          const processedFile = new File(
            [processedBlob], 
            image.file.name, 
            { type: image.file.type }
          );
          
          setImages(prevState => {
            const currentImage = prevState.find(img => img.id === imageId);
            if (!currentImage) return prevState;

            // Revoke old URL
            if (currentImage.url.startsWith('blob:')) {
              URL.revokeObjectURL(currentImage.url);
            }

            return prevState.map(img => 
              img.id === imageId 
                ? { 
                    ...img, 
                    file: processedFile,
                    url: processedDataURL,
                    processedUrl: undefined,
                    isProcessing: false,
                    error: undefined,
                    isCustomCropActive: false,
                    cropArea: undefined,
                    cropPreviewAspectRatio: undefined
                  } 
                : img
            );
          });
        } catch (error) {
          console.error('Failed to crop image:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to crop image';
          
          setImages(prevState => prevState.map(img => 
            img.id === imageId 
              ? { 
                  ...img, 
                  isProcessing: false,
                  error: errorMessage
                } 
              : img
          ));
        }
      })();

      return prev.map(img => 
        img.id === imageId 
          ? { ...img, isProcessing: true, error: undefined } 
          : img
      );
    });
  }, []);

  const applyCropToSelected = useCallback(async (aspectRatio: number | null, customCrop?: CropArea) => {
    if (selectedImages.length === 0) return;

    // Show preview for preset crops
    if (aspectRatio !== null && !customCrop) {
      setImages(prev => prev.map(img => 
        img.selected 
          ? { ...img, cropPreviewAspectRatio: aspectRatio, cropArea: undefined } 
          : img
      ));
      return;
    }

    // Apply crop immediately for custom crops or when explicitly applying
    const selectedIds = selectedImages.map(img => img.id);
    
    // Apply crop to each selected image
    selectedIds.forEach(imageId => {
      setImages(prev => {
        const image = prev.find(img => img.id === imageId);
        if (!image) return prev;

        // Process asynchronously
        (async () => {
          try {
            setImages(prevState => {
              const currentImage = prevState.find(img => img.id === imageId);
              if (!currentImage) return prevState;
              return prevState.map(img => 
                img.id === imageId 
                  ? { ...img, isProcessing: true, error: undefined } 
                  : img
              );
            });

            const processedBlob = await cropImage(image.file, { aspectRatio, customCrop });
            const processedDataURL = await blobToDataURL(processedBlob);
            
            const processedFile = new File(
              [processedBlob], 
              image.file.name, 
              { type: image.file.type }
            );
            
            setImages(prevState => {
              const currentImage = prevState.find(img => img.id === imageId);
              if (!currentImage) return prevState;

              // Revoke old URL
              if (currentImage.url.startsWith('blob:')) {
                URL.revokeObjectURL(currentImage.url);
              }

              return prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      file: processedFile,
                      url: processedDataURL,
                      processedUrl: undefined,
                      isProcessing: false,
                      error: undefined,
                      isCustomCropActive: false,
                      cropArea: undefined,
                      cropPreviewAspectRatio: undefined
                    } 
                  : img
              );
            });
          } catch (error) {
            console.error('Failed to crop image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to crop image';
            
            setImages(prevState => prevState.map(img => 
              img.id === imageId 
                ? { 
                    ...img, 
                    isProcessing: false,
                    error: errorMessage
                  } 
                : img
            ));
          }
        })();

        return prev.map(img => 
          img.id === imageId 
            ? { ...img, isProcessing: true, error: undefined } 
            : img
        );
      });
    });

    setImages(prev => prev.map(img => 
      img.selected && !customCrop
        ? { ...img, cropPreviewAspectRatio: undefined } 
        : img
    ));
  }, [selectedImages]);

  const handleCustomCrop = useCallback(() => {
    setCustomCropMode(true);
    setImages(prev => prev.map(img => 
      img.selected 
        ? { ...img, isCustomCropActive: true } 
        : img
    ));
  }, []);

  const handleCustomCropApply = useCallback((imageId: string, cropArea: CropArea) => {
    setCustomCropMode(false);
    setImages(prev => prev.map(img => 
      img.id === imageId 
        ? { ...img, isCustomCropActive: false } 
        : img
    ));
    
    // Apply the crop to this specific image
    applyCropToImage(imageId, null, cropArea);
  }, [applyCropToImage]);

  const handleCustomCropCancel = useCallback(() => {
    setCustomCropMode(false);
    setImages(prev => prev.map(img => 
      img.selected 
        ? { ...img, isCustomCropActive: false, cropArea: undefined } 
        : img
    ));
  }, []);

  const applyRotateToSelected = useCallback(async (direction: '90' | '-90' | '180') => {
    if (selectedImages.length === 0) return;

    setImages(prev => {
      const selectedIds = prev.filter(img => img.selected).map(img => img.id);
      
      // Process each selected image
      selectedIds.forEach(async (imageId) => {
        setImages(current => {
          const image = current.find(img => img.id === imageId);
          if (!image) return current;

          // Process asynchronously
          (async () => {
            try {
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;
                return prevState.map(img => 
                  img.id === imageId 
                    ? { ...img, isProcessing: true, error: undefined } 
                    : img
                );
              });

              const processedBlob = await rotateImage(image.file, direction);
              const processedDataURL = await blobToDataURL(processedBlob);
              
              const processedFile = new File(
                [processedBlob], 
                image.file.name, 
                { type: image.file.type }
              );
              
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;

                // Revoke old URL
                if (currentImage.url.startsWith('blob:')) {
                  URL.revokeObjectURL(currentImage.url);
                }

                return prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        file: processedFile,
                        url: processedDataURL,
                        processedUrl: undefined,
                        isProcessing: false,
                        error: undefined
                      } 
                    : img
                );
              });
            } catch (error) {
              console.error('Failed to rotate image:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to rotate image';
              
              setImages(prevState => prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isProcessing: false,
                      error: errorMessage
                    } 
                  : img
              ));
            }
          })();

          return current;
        });
      });

      return prev.map(img => 
        img.selected ? { ...img, isProcessing: true, error: undefined } : img
      );
    });
  }, [selectedImages]);

  const applyFlipToSelected = useCallback(async (direction: 'horizontal' | 'vertical') => {
    if (selectedImages.length === 0) return;

    setImages(prev => {
      const selectedIds = prev.filter(img => img.selected).map(img => img.id);
      
      // Process each selected image
      selectedIds.forEach(async (imageId) => {
        setImages(current => {
          const image = current.find(img => img.id === imageId);
          if (!image) return current;

          // Process asynchronously
          (async () => {
            try {
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;
                return prevState.map(img => 
                  img.id === imageId 
                    ? { ...img, isProcessing: true, error: undefined } 
                    : img
                );
              });

              const processedBlob = await flipImage(image.file, direction);
              const processedDataURL = await blobToDataURL(processedBlob);
              
              const processedFile = new File(
                [processedBlob], 
                image.file.name, 
                { type: image.file.type }
              );
              
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;

                // Revoke old URL
                if (currentImage.url.startsWith('blob:')) {
                  URL.revokeObjectURL(currentImage.url);
                }

                return prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        file: processedFile,
                        url: processedDataURL,
                        processedUrl: undefined,
                        isProcessing: false,
                        error: undefined
                      } 
                    : img
                );
              });
            } catch (error) {
              console.error('Failed to flip image:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to flip image';
              
              setImages(prevState => prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isProcessing: false,
                      error: errorMessage
                    } 
                  : img
              ));
            }
          })();

          return current;
        });
      });

      return prev.map(img => 
        img.selected ? { ...img, isProcessing: true, error: undefined } : img
      );
    });
  }, [selectedImages]);

  const applyResizeToSelected = useCallback(async (width: number, height: number) => {
    if (selectedImages.length === 0) return;

    setImages(prev => {
      const selectedIds = prev.filter(img => img.selected).map(img => img.id);
      
      // Process each selected image
      selectedIds.forEach(async (imageId) => {
        setImages(current => {
          const image = current.find(img => img.id === imageId);
          if (!image) return current;

          // Process asynchronously
          (async () => {
            try {
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;
                return prevState.map(img => 
                  img.id === imageId 
                    ? { ...img, isProcessing: true, error: undefined } 
                    : img
                );
              });

              // Get original dimensions from the image file
              const originalDimensions = await new Promise<{ width: number; height: number }>((resolve) => {
                const img = new Image();
                img.onload = () => {
                  resolve({ width: img.width, height: img.height });
                  URL.revokeObjectURL(img.src);
                };
                img.src = URL.createObjectURL(image.file);
              });

              const processedBlob = await resizeImageFile(image.file, width, height);
              const processedDataURL = await blobToDataURL(processedBlob);
              
              const processedFile = new File(
                [processedBlob], 
                image.file.name, 
                { type: image.file.type }
              );
              
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;

                // Revoke old URL
                if (currentImage.url.startsWith('blob:')) {
                  URL.revokeObjectURL(currentImage.url);
                }

                return prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        file: processedFile,
                        url: processedDataURL,
                        processedUrl: undefined,
                        isProcessing: false,
                        error: undefined,
                        originalWidth: originalDimensions.width,
                        originalHeight: originalDimensions.height,
                        resizeWidth: width,
                        resizeHeight: height
                      } 
                    : img
                );
              });
            } catch (error) {
              console.error('Failed to resize image:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to resize image';
              
              setImages(prevState => prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isProcessing: false,
                      error: errorMessage
                    } 
                  : img
              ));
            }
          })();

          return current;
        });
      });

      return prev.map(img => 
        img.selected ? { ...img, isProcessing: true, error: undefined } : img
      );
    });
  }, [selectedImages]);

  const applyCompressToSelected = useCallback(async (
    mode: 'quality' | 'size' | 'custom',
    quality?: number,
    targetSizeKB?: number,
    outputFormat?: 'original' | 'webp'
  ) => {
    if (selectedImages.length === 0) return;

    setImages(prev => {
      const selectedIds = prev.filter(img => img.selected).map(img => img.id);
      
      selectedIds.forEach(async (imageId) => {
        setImages(current => {
          const image = current.find(img => img.id === imageId);
          if (!image) return current;

          (async () => {
            try {
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;
                return prevState.map(img => 
                  img.id === imageId 
                    ? { ...img, isProcessing: true, error: undefined } 
                    : img
                );
              });

              const processedBlob = await compressImage(image.file, {
                mode,
                quality,
                targetSizeKB,
                outputFormat
              });
              const processedDataURL = await blobToDataURL(processedBlob);
              
              const processedFile = new File(
                [processedBlob], 
                image.file.name, 
                { type: processedBlob.type }
              );
              
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;

                if (currentImage.url.startsWith('blob:')) {
                  URL.revokeObjectURL(currentImage.url);
                }

                return prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        file: processedFile,
                        url: processedDataURL,
                        processedUrl: undefined,
                        isProcessing: false,
                        error: undefined
                      } 
                    : img
                );
              });
            } catch (error) {
              console.error('Failed to compress image:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to compress image';
              
              setImages(prevState => prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isProcessing: false,
                      error: errorMessage
                    } 
                  : img
              ));
            }
          })();

          return current;
        });
      });

      return prev.map(img => 
        img.selected ? { ...img, isProcessing: true, error: undefined } : img
      );
    });
  }, [selectedImages]);

  const applyConvertToSelected = useCallback(async (
    format: ImageFormat,
    maintainQuality?: boolean
  ) => {
    if (selectedImages.length === 0) return;

    setImages(prev => {
      const selectedIds = prev.filter(img => img.selected).map(img => img.id);
      
      selectedIds.forEach(async (imageId) => {
        setImages(current => {
          const image = current.find(img => img.id === imageId);
          if (!image) return current;

          (async () => {
            try {
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;
                return prevState.map(img => 
                  img.id === imageId 
                    ? { ...img, isProcessing: true, error: undefined } 
                    : img
                );
              });

              const processedBlob = await convertImage(image.file, {
                format,
                maintainQuality
              });
              const processedDataURL = await blobToDataURL(processedBlob);
              
              const extension = format === 'jpg' ? '.jpg' : format === 'png' ? '.png' : format === 'webp' ? '.webp' : format === 'gif' ? '.gif' : format === 'bmp' ? '.bmp' : '.tiff';
              const newFileName = image.file.name.replace(/\.[^/.]+$/, '') + extension;
              
              const processedFile = new File(
                [processedBlob], 
                newFileName, 
                { type: processedBlob.type }
              );
              
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;

                if (currentImage.url.startsWith('blob:')) {
                  URL.revokeObjectURL(currentImage.url);
                }

                return prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        file: processedFile,
                        url: processedDataURL,
                        processedUrl: undefined,
                        isProcessing: false,
                        error: undefined
                      } 
                    : img
                );
              });
            } catch (error) {
              console.error('Failed to convert image:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to convert image';
              
              setImages(prevState => prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isProcessing: false,
                      error: errorMessage
                    } 
                  : img
              ));
            }
          })();

          return current;
        });
      });

      return prev.map(img => 
        img.selected ? { ...img, isProcessing: true, error: undefined } : img
      );
    });
  }, [selectedImages]);

  const applyUpscaleToSelected = useCallback(async (
    level: UpscaleLevel,
    enhanceDetails?: boolean,
    removeNoise?: boolean,
    sharpenEdges?: boolean
  ) => {
    if (selectedImages.length === 0) return;

    setImages(prev => {
      const selectedIds = prev.filter(img => img.selected).map(img => img.id);
      
      selectedIds.forEach(async (imageId) => {
        setImages(current => {
          const image = current.find(img => img.id === imageId);
          if (!image) return current;

          (async () => {
            try {
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;
                return prevState.map(img => 
                  img.id === imageId 
                    ? { ...img, isProcessing: true, error: undefined } 
                    : img
                );
              });

              const processedBlob = await upscaleImage(image.file, {
                level,
                enhanceDetails,
                removeNoise,
                sharpenEdges
              });
              const processedDataURL = await blobToDataURL(processedBlob);
              
              const processedFile = new File(
                [processedBlob], 
                image.file.name, 
                { type: processedBlob.type }
              );
              
              setImages(prevState => {
                const currentImage = prevState.find(img => img.id === imageId);
                if (!currentImage) return prevState;

                if (currentImage.url.startsWith('blob:')) {
                  URL.revokeObjectURL(currentImage.url);
                }

                return prevState.map(img => 
                  img.id === imageId 
                    ? { 
                        ...img, 
                        file: processedFile,
                        url: processedDataURL,
                        processedUrl: undefined,
                        isProcessing: false,
                        error: undefined
                      } 
                    : img
                );
              });
            } catch (error) {
              console.error('Failed to upscale image:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to upscale image';
              
              setImages(prevState => prevState.map(img => 
                img.id === imageId 
                  ? { 
                      ...img, 
                      isProcessing: false,
                      error: errorMessage
                    } 
                  : img
              ));
            }
          })();

          return current;
        });
      });

      return prev.map(img => 
        img.selected ? { ...img, isProcessing: true, error: undefined } : img
      );
    });
  }, [selectedImages]);

  // Sidebar navigation handler
  const handleSectionChange = useCallback((section: SidebarSection) => {
    setActiveSection(section);
  }, []);

  const getAspectRatioPreview = (width: number, height: number, maxSize: number = 36) => {
    const aspectRatio = width / height;
    if (aspectRatio > 1) {
      return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
    } else {
      return { width: Math.round(maxSize * aspectRatio), height: maxSize };
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <nav 
        className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-2"
        aria-label="Editor navigation"
      >
        {SIDEBAR_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all w-16",
                isActive
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.id === 'resize' ? (
                resizePreview.width && resizePreview.height ? (
                  (() => {
                    const dims = getAspectRatioPreview(resizePreview.width!, resizePreview.height!, 20);
                    return (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <div className="bg-gray-300 border border-gray-400 rounded" style={{ width: `${dims.width}px`, height: `${dims.height}px` }} />
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-300 rounded" />
                    <div className="w-4 h-2 bg-gray-300 rounded" />
                    <div className="w-2 h-4 bg-gray-300 rounded" />
                  </div>
                )
              ) : (
                <Icon className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Side Panel */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        {activeSection === 'resize' && (
          <div className="p-4 flex items-center justify-center">
            {!resizePreview.width || !resizePreview.height ? (
              <div className="text-sm text-gray-500">Select a preset to preview shape</div>
            ) : null}
          </div>
        )}
        {activeSection === 'home' && (
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-900">Editor</h2>
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-[10px] font-medium">Back</span>
              </button>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="text-xs font-semibold text-blue-900 mb-1">Welcome to the Editor</h3>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Upload images to get started. Use the tools on the left to edit your images.
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-gray-900">Quick Start:</h4>
                <ul className="text-[10px] text-gray-600 space-y-0 leading-tight">
                  <li>• Add backgrounds to your images</li>
                  <li>• Crop to different aspect ratios</li>
                  <li>• Resize for multiple platforms at once</li>

                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'background' && (
          <BackgroundPanel 
            selectedCount={selectedCount}
            onApplyBackground={applyBackgroundToSelected}
          />
        )}

        {activeSection === 'crop' && (
          <CropPanel 
            selectedImages={selectedImages}
            onApplyCrop={(aspectRatio) => applyCropToSelected(aspectRatio)}
            onRotate={applyRotateToSelected}
            onFlip={applyFlipToSelected}
            onCustomCrop={handleCustomCrop}
            customCropActive={customCropMode}
          />
        )}

        {activeSection === 'resize' && (
          <ResizePanel 
            selectedImages={selectedImages}
            onApplyResize={applyResizeToSelected}
            onPreviewResize={(w, h) => setResizePreview({ width: w, height: h })}
          />
        )}


        {activeSection === 'compress' && (
          <CompressPanel 
            selectedImages={selectedImages}
            onApplyCompress={applyCompressToSelected}
          />
        )}

        {activeSection === 'convert' && (
          <ConvertPanel 
            selectedImages={selectedImages}
            onApplyConvert={applyConvertToSelected}
          />
        )}

        {activeSection === 'upscaler' && (
          <UpscalerPanel 
            selectedImages={selectedImages}
            onApplyUpscale={applyUpscaleToSelected}
          />
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <button
            onClick={selectAll}
            disabled={images.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Select all images"
          >
            <CheckSquare className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-medium">Select all</span>
          </button>
          
          <button
            onClick={deleteSelected}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Delete ${selectedCount} selected image${selectedCount !== 1 ? 's' : ''}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-medium">Delete selected</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
            aria-label="Reset changes (coming soon)"
            title="Reset changes (coming soon)"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-medium">Reset changes</span>
          </button>

          {selectedCount > 0 && (
            <div className="ml-auto text-xs text-gray-600">
              {selectedCount} image{selectedCount !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Canvas */}
        <div 
          className="flex-1 overflow-auto p-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {/* Upload Area */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1.5 group"
                aria-label="Upload images"
                type="button"
              >
                <div className="text-center">
                  <div className="text-gray-400 mb-1">
                    <Upload className="w-5 h-5 mx-auto" aria-hidden="true" />
                  </div>
                  <p className="text-[10px] text-gray-600 font-medium mb-0.5">
                    Drag and drop images,
                  </p>
                  <p className="text-[10px] text-gray-600 font-medium mb-1">
                    or add from your device
                  </p>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-semibold rounded-full">
                    <Upload className="w-3 h-3" aria-hidden="true" />
                    Upload
                  </div>
                </div>
              </button>
            </div>

            {/* Uploaded Images */}
            {images.map(image => (
              <ImageItem
                key={image.id}
                image={image}
                backgroundStyle={getBackgroundStyle(image)}
                onToggleSelection={toggleImageSelection}
                onDelete={deleteImage}
                onCustomCropApply={handleCustomCropApply}
                onCustomCropCancel={handleCustomCropCancel}
                onApplyCropToImage={applyCropToImage}
                onSetImages={setImages}
                resizePreview={resizePreview}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const handleBack = () => {
    window.history.back();
  };

  return <EditorWorkspace onBack={handleBack} />;
}