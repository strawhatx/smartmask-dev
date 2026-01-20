'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { 
  Home, Image as ImageIcon, Crop as CropIcon, Maximize2,
  FileText, Upload, Trash2, CheckSquare, Square, RotateCw,
  ZoomIn, Tag, ArrowLeft, Minimize2, RefreshCw, TrendingUp, Loader2, Check, X, Download, ChevronDown
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
import { CropOverlay, DisplayCrop } from '@/components/crop-overlay';
import { CropPreviewOverlay } from '@/components/crop-preview-overlay';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// Types
export type BackgroundType = 'blur' | 'color' | 'texture' | 'transparent';
export type SidebarSection = 'home' | 'background' | 'crop' | 'resize' | 'compress' | 'convert' | 'upscaler';
export type ExportType = 'convert' | 'compress' | 'upscale' | null;

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
  cropPreviewWidth?: number;
  cropPreviewHeight?: number;
  originalWidth?: number;
  originalHeight?: number;
  resizeWidth?: number;
  resizeHeight?: number;
  convertedFormat?: ImageFormat;
  isCompressed?: boolean;
  isUpscaled?: boolean;
  originalFile?: File; // Store original file for export
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

// Helper function to resize image - stretches to exact dimensions (no aspect ratio preservation)
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

        // Set canvas to exact dimensions
        canvas.width = width;
        canvas.height = height;

        // Stretch image to fill entire canvas (exact dimensions, no aspect ratio preservation)
        ctx.drawImage(img, 0, 0, width, height);

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
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
  onCustomCropCancel: () => void;
  onApplyCropToImage: (imageId: string, aspectRatio: number | null, customCrop?: CropArea, targetWidth?: number, targetHeight?: number) => void;
  onSetImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  resizePreview?: { width: number | null; height: number | null };
}

function ImageItem({ 
  image, 
  onToggleSelection, 
  onDelete,
  onCustomCropCancel,
  onApplyCropToImage,
  onSetImages,
  resizePreview
}: ImageItemProps) {
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const sourceImgRef = useRef<HTMLImageElement>(null);
  const cropModeImgRef = useRef<HTMLImageElement>(null); // Visible img during crop mode
  const sourceImgUrlRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Track displayed image rect - single source of truth for where image is actually drawn
  const displayedImageRectRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Calculate displayed image rect for <img> during crop mode
  // Use actual rendered bounds of the img element (via getBoundingClientRect)
  // This ensures perfect match with CSS object-contain
  const getDisplayedImageRectForImg = useCallback(() => {
    if (!sourceImgRef.current || !imageContainerRef.current) {
      return null;
    }
    
    const img = sourceImgRef.current;
    const container = imageContainerRef.current;
    
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
      return null;
    }
    
    // Get actual rendered bounds of the img element (respects CSS object-contain)
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Convert to container-relative coordinates
    const x = imgRect.left - containerRect.left;
    const y = imgRect.top - containerRect.top;
    const width = imgRect.width;
    const height = imgRect.height;
    
    // Validate
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height) ||
        width <= 0 || height <= 0) {
      // Fallback to calculated rect if getBoundingClientRect fails
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = containerRect.width / containerRect.height;
      
      let drawWidth: number;
      let drawHeight: number;
      
      if (imgRatio > containerRatio) {
        drawWidth = containerRect.width;
        drawHeight = containerRect.width / imgRatio;
      } else {
        drawHeight = containerRect.height;
        drawWidth = containerRect.height * imgRatio;
      }
      
      const offsetX = (containerRect.width - drawWidth) / 2;
      const offsetY = (containerRect.height - drawHeight) / 2;
      
      return {
        x: offsetX,
        y: offsetY,
        width: drawWidth,
        height: drawHeight
      };
    }
    
    return {
      x,
      y,
      width,
      height
    };
  }, []);

  // Memoize callbacks to prevent infinite loops
  const handleCropAreaChange = useCallback((cropArea: CropArea) => {
    // Store the crop area (in canvas coordinates for preset crops)
    onSetImages(prev => prev.map(img => 
      img.id === image.id 
        ? { ...img, cropArea } 
        : img
    ));
  }, [image.id, onSetImages]);
  
  // Apply display crop - crops the entire canvas (image + background)
  // Crop coordinates are in container/canvas pixels
  const applyDisplayCrop = useCallback((displayCrop: DisplayCrop) => {
    // Validate display crop first
    if (!displayCrop ||
        !isFinite(displayCrop.x) || !isFinite(displayCrop.y) ||
        !isFinite(displayCrop.width) || !isFinite(displayCrop.height) ||
        displayCrop.width <= 0 || displayCrop.height <= 0) {
      console.error('Invalid display crop:', displayCrop);
      return;
    }
    
    const canvas = canvasElementRef.current;
    if (!canvas) {
      console.error('Canvas not found for crop');
      return;
    }
    
    // Crop coordinates are in container pixels, which match canvas pixels
    // Clamp to canvas bounds
    const canvasCrop: CropArea = {
      x: Math.max(0, Math.min(Math.round(displayCrop.x), canvas.width)),
      y: Math.max(0, Math.min(Math.round(displayCrop.y), canvas.height)),
      width: Math.min(Math.round(displayCrop.width), canvas.width - Math.round(displayCrop.x)),
      height: Math.min(Math.round(displayCrop.height), canvas.height - Math.round(displayCrop.y))
    };
    
    // Final validation
    if (
      !isFinite(canvasCrop.x) || !isFinite(canvasCrop.y) ||
      !isFinite(canvasCrop.width) || !isFinite(canvasCrop.height) ||
      canvasCrop.width <= 0 || canvasCrop.height <= 0 ||
      canvasCrop.x < 0 || canvasCrop.y < 0 ||
      canvasCrop.x + canvasCrop.width > canvas.width ||
      canvasCrop.y + canvasCrop.height > canvas.height
    ) {
      console.error('Invalid canvas crop:', { canvasCrop, canvasWidth: canvas.width, canvasHeight: canvas.height });
      return;
    }
    
    // Apply the crop to canvas (includes image + background)
    onApplyCropToImage(image.id, null, canvasCrop);
  }, [image.id, onApplyCropToImage]);

  // Update container size when image is displayed (needed for both custom crop and preview)
  useEffect(() => {
    const needsContainerSize = image.isCustomCropActive || image.cropPreviewAspectRatio !== undefined;
    
    if (imageContainerRef.current) {
      const updateSize = () => {
        const rect = imageContainerRef.current?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      };
      
      // Always update size if container exists (don't reset to 0)
      updateSize();
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(imageContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [image.isCustomCropActive, image.cropPreviewAspectRatio]);


  // Helper function to draw image with contain logic (scale to fit, center)
  // Stores displayed image rect as single source of truth
  const drawImageContained = useCallback((
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    sourceX: number,
    sourceY: number,
    sourceWidth: number,
    sourceHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Calculate aspect ratios
    const imgRatio = sourceWidth / sourceHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth: number;
    let drawHeight: number;
    
    // Scale to fit (contain logic)
    if (imgRatio > canvasRatio) {
      // Image is wider - fit to width
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
    } else {
      // Image is taller - fit to height
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
    }
    
    // Center the image
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;
    
    // Store displayed image rect - single source of truth
    displayedImageRectRef.current = {
      x: offsetX,
      y: offsetY,
      width: drawWidth,
      height: drawHeight
    };
    
    // Draw image centered
    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      offsetX, offsetY, drawWidth, drawHeight
    );
  }, []);

  // Render image to canvas with all edits applied
  const renderToCanvas = useCallback(() => {
    if (!sourceImgRef.current || !canvasElementRef.current || !imageContainerRef.current) return;
    
    const img = sourceImgRef.current;
    const canvas = canvasElementRef.current;
    const container = imageContainerRef.current;
    
    // Wait for image to load
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      return;
    }
    
    // Determine canvas dimensions
    // If resize dimensions are set, use those (actual pixel dimensions)
    // Otherwise, use container dimensions for display
    let canvasWidth: number;
    let canvasHeight: number;
    
    if (image.resizeWidth && image.resizeHeight) {
      // Use actual resize dimensions
      canvasWidth = image.resizeWidth;
      canvasHeight = image.resizeHeight;
    } else {
      // Use container dimensions for display
      const containerRect = container.getBoundingClientRect();
      canvasWidth = containerRect.width;
      canvasHeight = containerRect.height;
    }
    
    if (canvasWidth === 0 || canvasHeight === 0) {
      return;
    }
    
    // Determine source crop area
    // Note: After crop is applied, the file is already cropped, so cropArea should be undefined
    // We only use cropArea during preview (when isCustomCropActive is true)
    // Once applied, the file itself is cropped, so we render the full image from the cropped file
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = img.naturalWidth;
    let sourceHeight = img.naturalHeight;
    
    // Don't apply cropArea here - if crop was applied, the file is already cropped
    // cropArea is only for preview/overlay display, not for canvas rendering
    
    // Set canvas pixel dimensions (this clears the canvas automatically)
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // If resize dimensions are set, we need to scale the canvas display size to fit container
    // But keep the pixel dimensions at the resize size
    if (image.resizeWidth && image.resizeHeight) {
      const containerRect = container.getBoundingClientRect();
      const resizeAspectRatio = image.resizeWidth / image.resizeHeight;
      const containerAspectRatio = containerRect.width / containerRect.height;
      
      // Scale canvas CSS to fit container while maintaining aspect ratio
      if (resizeAspectRatio > containerAspectRatio) {
        // Resize is wider - fit to container width
        canvas.style.width = `${containerRect.width}px`;
        canvas.style.height = `${containerRect.width / resizeAspectRatio}px`;
      } else {
        // Resize is taller - fit to container height
        canvas.style.width = `${containerRect.height * resizeAspectRatio}px`;
        canvas.style.height = `${containerRect.height}px`;
      }
    } else {
      // No resize - fill container
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    
    // Get fresh context after resizing (setting width/height resets context)
    const context = canvas.getContext('2d');
    if (!context) return;
    
    // Fill background first - fill entire canvas
    if (image.backgroundType && image.background) {
      switch (image.backgroundType) {
        case 'color':
          context.fillStyle = image.background;
          context.fillRect(0, 0, canvas.width, canvas.height);
          break;
        case 'blur':
          // Draw blurred version as background
          context.filter = 'blur(20px)';
          context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, -50, -50, canvas.width + 100, canvas.height + 100);
          context.filter = 'none';
          context.fillStyle = 'rgba(0, 0, 0, 0.1)';
          context.fillRect(0, 0, canvas.width, canvas.height);
          break;
        case 'texture':
          const textureImg = new Image();
          textureImg.crossOrigin = 'anonymous';
          textureImg.onload = () => {
            // Get fresh context
            const texCtx = canvas.getContext('2d');
            if (!texCtx) return;
            
            // Fill background with texture
            const pattern = texCtx.createPattern(textureImg, 'repeat');
            if (pattern) {
              texCtx.fillStyle = pattern;
              texCtx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Draw image - if resize is applied, stretch to fill canvas; otherwise use contain logic
            if (image.resizeWidth && image.resizeHeight) {
              // Resize is applied - stretch image to fill entire canvas (exact dimensions)
              texCtx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
            } else {
              // No resize - use contain logic
              drawImageContained(texCtx, img, sourceX, sourceY, sourceWidth, sourceHeight, canvas.width, canvas.height);
            }
          };
          textureImg.src = image.background;
          return; // Texture handles drawing in onload
        case 'transparent':
          // Canvas is already transparent, no background fill needed
          break;
      }
    }
    
    // Draw image - if resize is applied, stretch to fill canvas; otherwise use contain logic
    if (image.resizeWidth && image.resizeHeight) {
      // Resize is applied - stretch image to fill entire canvas (exact dimensions)
      context.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    } else {
      // No resize - use contain logic (scale to fit, center it)
      // This ensures background is visible around the image
      if (image.backgroundType !== 'texture') {
        drawImageContained(context, img, sourceX, sourceY, sourceWidth, sourceHeight, canvas.width, canvas.height);
      }
    }
    
    // Update dimensions for display
    // Always use the actual source image dimensions (not resize dimensions for display calculation)
    // Resize dimensions will be shown in the label separately
    setDimensions({
      width: sourceWidth,
      height: sourceHeight
    });
  }, [image.cropArea, image.resizeWidth, image.resizeHeight, image.backgroundType, image.background, drawImageContained]);
  
  // Set up source image URL - always use the current file (which is already cropped if crop was applied)
  useEffect(() => {
    // Use the current file (already processed/cropped), not originalFile
    // The canvas should render what the user sees, which is the processed file
    const file = image.file;
    const url = URL.createObjectURL(file);
    
    // Revoke old URL
    if (sourceImgUrlRef.current) {
      URL.revokeObjectURL(sourceImgUrlRef.current);
    }
    
    sourceImgUrlRef.current = url;
    
    if (sourceImgRef.current) {
      // Clear the old image first to force reload
      sourceImgRef.current.src = '';
      sourceImgRef.current.onload = null;
      
      // Set new image source
      sourceImgRef.current.src = url;
      
      // Force canvas re-render after image loads
      const handleLoad = () => {
        // Small delay to ensure image is fully loaded
        setTimeout(() => {
          renderToCanvas();
        }, 0);
      };
      
      // Always add load listener (even if complete) to handle new images
      sourceImgRef.current.addEventListener('load', handleLoad, { once: true });
      
      // If already loaded, trigger render immediately
      if (sourceImgRef.current.complete && sourceImgRef.current.naturalWidth > 0) {
        handleLoad();
      }
      
      return () => {
        sourceImgRef.current?.removeEventListener('load', handleLoad);
      };
    }
    
    return () => {
      if (sourceImgUrlRef.current) {
        URL.revokeObjectURL(sourceImgUrlRef.current);
        sourceImgUrlRef.current = null;
      }
    };
  }, [image.file, renderToCanvas]);

  // Update canvas when container size changes
  useEffect(() => {
    if (!imageContainerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      // Debounce canvas re-render on resize
      const timer = setTimeout(() => {
        if (sourceImgRef.current?.complete) {
          renderToCanvas();
        }
      }, 100);
      return () => clearTimeout(timer);
    });
    
    resizeObserver.observe(imageContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [renderToCanvas]);

  // Re-render canvas when edits change
  useEffect(() => {
    const updateCanvas = () => {
      if (sourceImgRef.current && canvasElementRef.current) {
        // If image is already loaded, render immediately
        if (sourceImgRef.current.complete && sourceImgRef.current.naturalWidth > 0) {
          renderToCanvas();
        } else {
          // Otherwise wait for image to load
          sourceImgRef.current.onload = () => {
            renderToCanvas();
          };
        }
      }
    };
    
    updateCanvas();
  }, [image.backgroundType, image.background, image.cropArea, image.resizeWidth, image.resizeHeight, renderToCanvas]);

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
          className="w-full h-full relative"
        >
          {/* Canvas always visible - shows image + background */}
          <canvas
            ref={canvasElementRef}
            className={cn(
              "absolute inset-0 w-full h-full",
              image.backgroundType === 'transparent' && "drop-shadow-lg"
            )}
          />
          {/* Custom crop overlay - works on entire canvas area */}
          {image.isCustomCropActive && containerSize.width > 0 && containerSize.height > 0 && (
            <CropOverlay
              containerWidth={containerSize.width}
              containerHeight={containerSize.height}
              imageUrl={sourceImgRef.current?.src || image.url}
              displayedImageRect={{
                x: 0,
                y: 0,
                width: containerSize.width,
                height: containerSize.height
              }}
              onCrop={applyDisplayCrop}
              onCancel={onCustomCropCancel}
            />
          )}
          {/* Processing and error overlays */}
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
          {/* Hidden img for loading source image - use original file */}
          <img
            ref={sourceImgRef}
            alt={image.file.name}
            className="hidden"
            onLoad={() => {
              renderToCanvas();
            }}
          />
          {image.cropPreviewAspectRatio !== undefined && 
           image.cropPreviewAspectRatio !== null && 
           !image.isCustomCropActive &&
           containerSize.width > 0 && (() => {
             // Get displayed image rect - use canvas rect if available
             const displayedRect = displayedImageRectRef.current;
             const img = sourceImgRef.current;
             
             if (!displayedRect || !img || !img.naturalWidth || !img.naturalHeight) {
               return null;
             }
             
             return (
               <CropPreviewOverlay
                 key={`${image.id}-${image.cropPreviewAspectRatio}`}
                 containerWidth={containerSize.width}
                 containerHeight={containerSize.height}
                 aspectRatio={image.cropPreviewAspectRatio}
                 displayedImageRect={displayedRect}
                 imageNaturalWidth={img.naturalWidth}
                 imageNaturalHeight={img.naturalHeight}
                 imageUrl={image.url}
                 onCropAreaChange={handleCropAreaChange}
               />
             );
           })()}
        </div>

        {/* Format and Compression Tags */}
        {!image.isCustomCropActive && (
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-30">
            {image.convertedFormat && (
              <div className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-md uppercase">
                {image.convertedFormat}
              </div>
            )}
            {image.isCompressed && (
              <div className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-md">
                Compressed
              </div>
            )}
            {image.isUpscaled && (
              <div className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-semibold rounded-md">
                Upscaled
              </div>
            )}
          </div>
        )}

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
      {(() => {
        // Calculate dimensions to display
        let displayText = '';
        if (image.resizeWidth && image.resizeHeight) {
          // Show: original → new
          // Use originalWidth/Height from state (set during resize), fallback to current natural dimensions only if not set
          const origW = image.originalWidth ?? dimensions.width ?? sourceImgRef.current?.naturalWidth ?? 0;
          const origH = image.originalHeight ?? dimensions.height ?? sourceImgRef.current?.naturalHeight ?? 0;
          displayText = `${origW} x ${origH} → ${image.resizeWidth} x ${image.resizeHeight}`;
        } else {
          // Show current dimensions
          const currentW = dimensions.width || sourceImgRef.current?.naturalWidth || 0;
          const currentH = dimensions.height || sourceImgRef.current?.naturalHeight || 0;
          displayText = `${currentW} x ${currentH}`;
        }
        
        return (displayText && displayText !== '0 x 0') ? (
          <div className="mt-2 px-3 py-1.5 bg-gray-800 bg-opacity-75 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {displayText}
            </span>
          </div>
        ) : null;
      })()}

      {/* Crop Control Buttons - Below Image */}
      {image.cropPreviewAspectRatio !== undefined && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (image.cropPreviewAspectRatio !== undefined && image.cropArea) {
                // Apply preset crop with custom position/size
                onApplyCropToImage(image.id, image.cropPreviewAspectRatio, image.cropArea, image.cropPreviewWidth, image.cropPreviewHeight);
                onSetImages(prev => prev.map(img => 
                  img.id === image.id 
                    ? { ...img, cropPreviewAspectRatio: undefined, cropPreviewWidth: undefined, cropPreviewHeight: undefined, cropArea: undefined } 
                    : img
                ));
              } else if (image.cropPreviewAspectRatio !== undefined) {
                // Apply preset crop with default position
                onApplyCropToImage(image.id, image.cropPreviewAspectRatio, undefined, image.cropPreviewWidth, image.cropPreviewHeight);
                onSetImages(prev => prev.map(img => 
                  img.id === image.id 
                    ? { ...img, cropPreviewAspectRatio: undefined, cropPreviewWidth: undefined, cropPreviewHeight: undefined } 
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

// Sidebar navigation items
const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'background', icon: ImageIcon, label: 'Background' },
  { id: 'crop', icon: CropIcon, label: 'Crop' },
  { id: 'resize', icon: Maximize2, label: 'Resize' },
];

export function EditorWorkspace({ onBack }: EditorWorkspaceProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>('home');
  const [resizePreview, setResizePreview] = useState<{ width: number | null; height: number | null }>({ width: null, height: null });
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customCropMode, setCustomCropMode] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportModalOpen(false);
      }
    };
    if (exportModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [exportModalOpen]);

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

  const applyCropToImage = useCallback(async (imageId: string, aspectRatio: number | null, customCrop?: CropArea, targetWidth?: number, targetHeight?: number) => {
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

          // If customCrop is provided, it's in canvas coordinates - crop the canvas
          if (customCrop && 
              Number.isFinite(customCrop.x) &&
              Number.isFinite(customCrop.y) &&
              Number.isFinite(customCrop.width) &&
              Number.isFinite(customCrop.height) &&
              customCrop.width > 0 &&
              customCrop.height > 0) {
            
            // Get the canvas element
            const container = document.querySelector(`[data-image-id="${imageId}"]`);
            const canvas = container?.querySelector('canvas') as HTMLCanvasElement;
            
            if (!canvas) {
              throw new Error('Canvas not found');
            }
            
            // Create a new canvas with the cropped dimensions
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = Math.round(customCrop.width);
            croppedCanvas.height = Math.round(customCrop.height);
            const ctx = croppedCanvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Could not get canvas context');
            }
            
            // Draw the cropped portion of the original canvas
            ctx.drawImage(
              canvas,
              customCrop.x, customCrop.y, customCrop.width, customCrop.height, // Source rect
              0, 0, croppedCanvas.width, croppedCanvas.height // Destination rect
            );
            
            // Convert to blob
            const processedBlob = await new Promise<Blob>((resolve, reject) => {
              croppedCanvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create blob'));
                }
              }, image.file.type || 'image/png', 0.95);
            });
            
            const processedDataURL = await blobToDataURL(processedBlob);
            const processedFile = new File(
              [processedBlob], 
              image.file.name, 
              { type: image.file.type || 'image/png' }
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
                      cropPreviewAspectRatio: undefined,
                      originalFile: img.originalFile || img.file, // Preserve original file
                      // Preserve originalWidth/Height if they exist (from previous resize)
                      // They will be used for dimension display
                      originalWidth: img.originalWidth,
                      originalHeight: img.originalHeight,
                      // Clear resize dimensions since crop changes the actual canvas size
                      resizeWidth: undefined,
                      resizeHeight: undefined
                    } 
                  : img
              );
            });
          } else if (aspectRatio !== null) {
            // Preset aspect ratio crop - use image processor
            let processedBlob = await cropImage(image.file, { aspectRatio, customCrop: undefined });
            
            // If target dimensions are specified, resize the cropped image to those exact dimensions
            if (targetWidth && targetHeight) {
              const croppedFile = new File([processedBlob], image.file.name, { type: image.file.type });
              processedBlob = await resizeImageFile(croppedFile, targetWidth, targetHeight);
            }
            
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
                      cropPreviewAspectRatio: undefined,
                      originalFile: img.originalFile || img.file, // Preserve original file
                      // Preserve originalWidth/Height if they exist (from previous resize)
                      // They will be used for dimension display
                      originalWidth: img.originalWidth,
                      originalHeight: img.originalHeight,
                      // Clear resize dimensions since crop changes the actual canvas size
                      resizeWidth: undefined,
                      resizeHeight: undefined
                    } 
                  : img
              );
            });
          }
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

  const applyCropToSelected = useCallback(async (aspectRatio: number | null, customCrop?: CropArea, targetWidth?: number, targetHeight?: number) => {
    if (selectedImages.length === 0) return;

    // Show preview for preset crops
    if (aspectRatio !== null && !customCrop) {
      setImages(prev => prev.map(img => 
        img.selected 
          ? { 
              ...img, 
              cropPreviewAspectRatio: aspectRatio, 
              cropPreviewWidth: targetWidth,
              cropPreviewHeight: targetHeight,
              cropArea: undefined 
            } 
          : img
      ));
      return;
    }

    // Apply crop immediately for custom crops or when explicitly applying
    const selectedIds = selectedImages.map(img => img.id);
    
    // Apply crop to each selected image
    selectedIds.forEach(imageId => {
      applyCropToImage(imageId, aspectRatio, customCrop, targetWidth, targetHeight);
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

              // Get current dimensions from the image file BEFORE resize
              // This will be the "original" if no resize was done before, or the previous resize dimensions
              const currentDimensions = await new Promise<{ width: number; height: number }>((resolve) => {
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

                return prevState.map(img => {
                  if (img.id !== imageId) return img;
                  
                  // Determine original dimensions:
                  // - If originalWidth/Height already exist (from previous resize), preserve them
                  // - Otherwise, use current dimensions (which are the true original on first resize)
                  const finalOriginalWidth = img.originalWidth ?? currentDimensions.width;
                  const finalOriginalHeight = img.originalHeight ?? currentDimensions.height;
                  
                  return {
                    ...img, 
                    file: processedFile,
                    url: processedDataURL,
                    processedUrl: undefined,
                    isProcessing: false,
                    error: undefined,
                    originalWidth: finalOriginalWidth,
                    originalHeight: finalOriginalHeight,
                    resizeWidth: width,
                    resizeHeight: height
                  };
                });
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
                        error: undefined,
                        isCompressed: true,
                        isUpscaled: false // Clear upscale when compressing
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
                        error: undefined,
                        convertedFormat: format
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
                        error: undefined,
                        isUpscaled: true,
                        isCompressed: false // Clear compression when upscaling
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

  // Export function - exports from canvas
  const exportImageToCanvas = useCallback((image: UploadedImage, format?: string, quality?: number, upscaleFactor?: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const container = document.querySelector(`[data-image-id="${image.id}"]`);
      if (!container) {
        reject(new Error('Canvas not found'));
        return;
      }
      
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        reject(new Error('Canvas element not found'));
        return;
      }

      // If upscale, create a larger canvas
      if (upscaleFactor && upscaleFactor > 1) {
        const upscaledCanvas = document.createElement('canvas');
        upscaledCanvas.width = canvas.width * upscaleFactor;
        upscaledCanvas.height = canvas.height * upscaleFactor;
        const ctx = upscaledCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(canvas, 0, 0, upscaledCanvas.width, upscaledCanvas.height);
        upscaledCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format || 'image/png',
          quality || 0.9
        );
      } else {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format || 'image/png',
          quality || 0.9
        );
      }
    });
  }, []);

  // Download blob helper
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // Regular export
  const handleExport = useCallback(async () => {
    const selected = images.filter(img => img.selected);
    if (selected.length === 0) return;

    for (const image of selected) {
      try {
        const blob = await exportImageToCanvas(image);
        const extension = image.file.name.split('.').pop() || 'png';
        const baseName = image.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_exported.${extension}`;
        downloadBlob(blob, filename);
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  }, [images, exportImageToCanvas, downloadBlob]);

  // Export with convert
  const handleConvertExport = useCallback(async (format: ImageFormat, maintainQuality?: boolean) => {
    const selected = images.filter(img => img.selected);
    if (selected.length === 0) return;

    const formatMap: Record<ImageFormat, string> = {
      jpg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      bmp: 'image/bmp',
      tiff: 'image/tiff'
    };

    for (const image of selected) {
      try {
        const blob = await exportImageToCanvas(image, formatMap[format], maintainQuality ? 0.95 : 0.85);
        const extension = format === 'jpg' ? 'jpg' : format;
        const baseName = image.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_exported.${extension}`;
        downloadBlob(blob, filename);
      } catch (error) {
        console.error('Convert export failed:', error);
      }
    }
    setExportModalOpen(false);
  }, [images, exportImageToCanvas, downloadBlob]);

  // Export with compress
  const handleCompressExport = useCallback(async (mode: 'quality' | 'size' | 'custom', quality?: number, targetSizeKB?: number, outputFormat?: 'original' | 'webp') => {
    const selected = images.filter(img => img.selected);
    if (selected.length === 0) return;

    for (const image of selected) {
      try {
        let exportQuality = 0.8;
        let exportFormat = 'image/jpeg';
        
        if (mode === 'quality') {
          exportQuality = 0.7;
        } else if (mode === 'custom' && quality !== undefined) {
          exportQuality = quality / 100;
        } else {
          exportQuality = 0.6;
        }

        if (outputFormat === 'webp') {
          exportFormat = 'image/webp';
        } else {
          exportFormat = image.file.type || 'image/jpeg';
        }

        const blob = await exportImageToCanvas(image, exportFormat, exportQuality);
        const extension = outputFormat === 'webp' ? 'webp' : image.file.name.split('.').pop() || 'jpg';
        const baseName = image.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_exported.${extension}`;
        downloadBlob(blob, filename);
      } catch (error) {
        console.error('Compress export failed:', error);
      }
    }
    setExportModalOpen(false);
  }, [images, exportImageToCanvas, downloadBlob]);

  // Export with upscale
  const handleUpscaleExport = useCallback(async (level: UpscaleLevel) => {
    const selected = images.filter(img => img.selected);
    if (selected.length === 0) return;

    const factorMap: Record<UpscaleLevel, number> = {
      '2x': 2,
      '4x': 4,
      '8x': 8
    };

    for (const image of selected) {
      try {
        const blob = await exportImageToCanvas(image, 'image/png', 0.95, factorMap[level]);
        const baseName = image.file.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_exported.png`;
        downloadBlob(blob, filename);
      } catch (error) {
        console.error('Upscale export failed:', error);
      }
    }
    setExportModalOpen(false);
  }, [images, exportImageToCanvas, downloadBlob]);

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
                  : "text-gray-700 hover:bg-gray-50"
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
            selectedImages={selectedImages}
            onApplyBackground={applyBackgroundToSelected}
          />
        )}

        {activeSection === 'crop' && (
          <CropPanel 
            selectedImages={selectedImages}
            onApplyCrop={(aspectRatio, targetWidth, targetHeight) => applyCropToSelected(aspectRatio, undefined, targetWidth, targetHeight)}
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="ml-auto flex items-center gap-2">
            {selectedCount > 0 && (
              <div className="text-xs text-gray-600 mr-2">
                {selectedCount} image{selectedCount !== 1 ? 's' : ''} selected
              </div>
            )}
            
            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                onClick={() => setExportModalOpen(!exportModalOpen)}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Export options"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span className="text-xs font-medium">Export</span>
                <ChevronDown className="w-3 h-3" aria-hidden="true" />
              </button>
              
              {exportModalOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                  <button
                    onClick={handleExport}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportType('convert');
                      setExportModalOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Convert & Export</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportType('compress');
                      setExportModalOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Compress & Export</span>
                  </button>
                  <button
                    onClick={() => {
                      setExportType('upscale');
                      setExportModalOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Upscale & Export</span>
                  </button>
                </div>
              )}
            </div>
          </div>
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
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-[10px] font-semibold rounded-full">
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
                onToggleSelection={toggleImageSelection}
                onDelete={deleteImage}
                onCustomCropCancel={handleCustomCropCancel}
                onApplyCropToImage={applyCropToImage}
                onSetImages={setImages}
                resizePreview={resizePreview}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Export Modals */}
      {exportType === 'convert' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setExportType(null)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Convert & Export</h2>
                <button
                  onClick={() => setExportType(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ConvertPanel
                selectedImages={selectedImages}
                onApplyConvert={handleConvertExport}
              />
            </div>
          </div>
        </div>
      )}

      {exportType === 'compress' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setExportType(null)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Compress & Export</h2>
                <button
                  onClick={() => setExportType(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CompressPanel
                selectedImages={selectedImages}
                onApplyCompress={handleCompressExport}
              />
            </div>
          </div>
        </div>
      )}

      {exportType === 'upscale' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setExportType(null)}
          />
          <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Upscale & Export</h2>
                <button
                  onClick={() => setExportType(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <UpscalerPanel
                selectedImages={selectedImages}
                onApplyUpscale={(level) => handleUpscaleExport(level)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  const handleBack = () => {
    window.history.back();
  };

  return <EditorWorkspace onBack={handleBack} />;
}