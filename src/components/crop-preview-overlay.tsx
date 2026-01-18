import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropPreviewOverlayProps {
  containerWidth: number;
  containerHeight: number;
  aspectRatio: number;
  displayedImageRect: { x: number; y: number; width: number; height: number } | null;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  onCropAreaChange?: (cropArea: CropArea) => void;
  imageUrl?: string;
}

export function CropPreviewOverlay({ 
  containerWidth, 
  containerHeight, 
  aspectRatio,
  displayedImageRect,
  imageNaturalWidth,
  imageNaturalHeight,
  onCropAreaChange,
  imageUrl
}: CropPreviewOverlayProps) {
  const calculateInitialCropArea = useCallback(() => {
    // Calculate crop dimensions based on aspect ratio, ensuring it fits within displayed image
    if (!displayedImageRect || displayedImageRect.width <= 0 || displayedImageRect.height <= 0) {
      // Fallback to container-based calculation if displayedImageRect is not available
      const containerRatio = containerWidth / containerHeight;
      
      let cropWidth: number;
      let cropHeight: number;
      
      if (containerRatio > aspectRatio) {
        cropHeight = Math.min(containerHeight * 0.8, containerHeight - 20);
        cropWidth = cropHeight * aspectRatio;
        if (cropWidth > containerWidth - 20) {
          cropWidth = containerWidth - 20;
          cropHeight = cropWidth / aspectRatio;
        }
      } else {
        cropWidth = Math.min(containerWidth * 0.8, containerWidth - 20);
        cropHeight = cropWidth / aspectRatio;
        if (cropHeight > containerHeight - 20) {
          cropHeight = containerHeight - 20;
          cropWidth = cropHeight * aspectRatio;
        }
      }
      
      return {
        x: Math.max(0, (containerWidth - cropWidth) / 2),
        y: Math.max(0, (containerHeight - cropHeight) / 2),
        width: cropWidth,
        height: cropHeight
      };
    }
    
    // Use displayedImageRect for accurate cropping
    const imgRect = displayedImageRect;
    const imgRatio = imgRect.width / imgRect.height;
    
    let cropWidth: number;
    let cropHeight: number;
    
    // Calculate crop size to fit within displayed image
    // Use larger size (90-95%) for better visibility, especially for portrait ratios
    const sizeFactor = aspectRatio < 1 ? 0.95 : 0.9; // Portrait gets 95%, landscape gets 90%
    
    if (imgRatio > aspectRatio) {
      // Displayed image is wider than crop aspect ratio - fit to height
      cropHeight = imgRect.height * sizeFactor;
      cropWidth = cropHeight * aspectRatio;
      // Ensure it doesn't exceed width
      if (cropWidth > imgRect.width * sizeFactor) {
        cropWidth = imgRect.width * sizeFactor;
        cropHeight = cropWidth / aspectRatio;
      }
    } else {
      // Displayed image is taller than crop aspect ratio - fit to width
      cropWidth = imgRect.width * sizeFactor;
      cropHeight = cropWidth / aspectRatio;
      // Ensure it doesn't exceed height
      if (cropHeight > imgRect.height * sizeFactor) {
        cropHeight = imgRect.height * sizeFactor;
        cropWidth = cropHeight * aspectRatio;
      }
    }
    
    // Center the crop area within the displayed image
    const cropX = imgRect.x + (imgRect.width - cropWidth) / 2;
    const cropY = imgRect.y + (imgRect.height - cropHeight) / 2;

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  }, [containerWidth, containerHeight, aspectRatio, displayedImageRect]);

  const [cropArea, setCropArea] = useState<CropArea>(calculateInitialCropArea);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastNotifiedCropArea = useRef<CropArea | null>(null);

  // Update crop area when container size changes
  useEffect(() => {
    setCropArea(calculateInitialCropArea());
  }, [calculateInitialCropArea]);

  const constrainCropArea = useCallback((area: CropArea, maintainAspectRatio: boolean = true): CropArea => {
    let { x, y, width, height } = area;
    
    // Constrain to displayed image bounds if available, otherwise use container
    const minX = displayedImageRect ? displayedImageRect.x : 0;
    const minY = displayedImageRect ? displayedImageRect.y : 0;
    const maxWidth = displayedImageRect ? displayedImageRect.width : containerWidth;
    const maxHeight = displayedImageRect ? displayedImageRect.height : containerHeight;
    const maxX = minX + maxWidth;
    const maxY = minY + maxHeight;
    
    if (maintainAspectRatio) {
      // Always maintain aspect ratio - recalculate based on width
      height = width / aspectRatio;
      
      // Ensure crop area stays within displayed image bounds
      // First, constrain width
      width = Math.max(50, Math.min(width, maxWidth));
      height = width / aspectRatio;
      
      // If height exceeds bounds, adjust width
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Free resize - just constrain to bounds
      width = Math.max(50, Math.min(width, maxWidth));
      height = Math.max(50, Math.min(height, maxHeight));
    }
    
    // Now constrain position to displayed image bounds
    x = Math.max(minX, Math.min(x, maxX - width));
    y = Math.max(minY, Math.min(y, maxY - height));
    
    return { x, y, width, height };
  }, [containerWidth, containerHeight, aspectRatio, displayedImageRect]);

  const cropStartRef = useRef<CropArea | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't handle if clicking on buttons or other UI elements
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking inside crop area
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width &&
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      cropStartRef.current = { ...cropArea };
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.stopPropagation();
      e.preventDefault();
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !cropStartRef.current) return;
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    
    // Move the crop area while maintaining aspect ratio and dimensions
    const newCrop = {
      ...cropStartRef.current,
      x: cropStartRef.current.x + dx,
      y: cropStartRef.current.y + dy
    };
    
    // Constrain to displayed image bounds
    setCropArea(constrainCropArea(newCrop, true));
  }, [isDragging, dragStart, constrainCropArea]);

  // Notify parent of crop area changes with canvas coordinates
  // Crop coordinates are already in canvas/container pixels - pass them directly
  useEffect(() => {
    if (!onCropAreaChange) {
      return;
    }
    
    // Validate crop area
    if (!isFinite(cropArea.x) || !isFinite(cropArea.y) ||
        !isFinite(cropArea.width) || !isFinite(cropArea.height) ||
        cropArea.width <= 0 || cropArea.height <= 0) {
      return;
    }
    
    // Pass canvas coordinates directly (cropArea is already in container/canvas pixels)
    const canvasCrop: CropArea = {
      x: cropArea.x,
      y: cropArea.y,
      width: cropArea.width,
      height: cropArea.height
    };
    
    // Only notify if the crop area has actually changed (prevent infinite loops)
    const last = lastNotifiedCropArea.current;
    if (!last || 
        Math.abs(last.x - canvasCrop.x) > 0.1 ||
        Math.abs(last.y - canvasCrop.y) > 0.1 ||
        Math.abs(last.width - canvasCrop.width) > 0.1 ||
        Math.abs(last.height - canvasCrop.height) > 0.1) {
      lastNotifiedCropArea.current = canvasCrop;
      onCropAreaChange(canvasCrop);
    }
  }, [cropArea, onCropAreaChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    cropStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Grid lines for rule of thirds
  const gridLines = [];
  for (let i = 1; i < 3; i++) {
    gridLines.push(
      <div
        key={`v-${i}`}
        className="absolute top-0 bottom-0 w-0.5 bg-white bg-opacity-70 z-10"
        style={{ left: `${(i / 3) * 100}%` }}
      />
    );
    gridLines.push(
      <div
        key={`h-${i}`}
        className="absolute left-0 right-0 h-0.5 bg-white bg-opacity-70 z-10"
        style={{ top: `${(i / 3) * 100}%` }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 z-50"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Dark overlay outside crop area */}
      <div
        className="absolute inset-0 bg-black bg-opacity-25"
        style={{
          clipPath: `polygon(
            0% 0%,
            0% 100%,
            ${(cropArea.x / containerWidth) * 100}% 100%,
            ${(cropArea.x / containerWidth) * 100}% ${(cropArea.y / containerHeight) * 100}%,
            ${((cropArea.x + cropArea.width) / containerWidth) * 100}% ${(cropArea.y / containerHeight) * 100}%,
            ${((cropArea.x + cropArea.width) / containerWidth) * 100}% ${((cropArea.y + cropArea.height) / containerHeight) * 100}%,
            ${(cropArea.x / containerWidth) * 100}% ${((cropArea.y + cropArea.height) / containerHeight) * 100}%,
            ${(cropArea.x / containerWidth) * 100}% 100%,
            100% 100%,
            100% 0%
          )`
        }}
      />

      {/* Crop area border */}
      <div
        ref={overlayRef}
        className="absolute border-2 border-white"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3)',
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {gridLines}
        </div>

        {/* No resize handles for preset crops - only movable, not resizable */}
      </div>
    </div>
  );
}

