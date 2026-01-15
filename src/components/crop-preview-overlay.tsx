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
  onCropAreaChange?: (cropArea: CropArea) => void;
  imageUrl?: string;
}

export function CropPreviewOverlay({ 
  containerWidth, 
  containerHeight, 
  aspectRatio,
  onCropAreaChange,
  imageUrl
}: CropPreviewOverlayProps) {
  const calculateInitialCropArea = useCallback(() => {
    // Calculate crop dimensions based on aspect ratio, ensuring it fits within container
    const containerRatio = containerWidth / containerHeight;
    
    let cropWidth: number;
    let cropHeight: number;
    let cropX: number;
    let cropY: number;

    if (containerRatio > aspectRatio) {
      // Container is wider - fit height (aspect ratio is taller than container)
      cropHeight = Math.min(containerHeight * 0.8, containerHeight - 20); // Leave some margin
      cropWidth = cropHeight * aspectRatio;
      
      // Ensure width doesn't exceed container
      if (cropWidth > containerWidth - 20) {
        cropWidth = containerWidth - 20;
        cropHeight = cropWidth / aspectRatio;
      }
    } else {
      // Container is taller - fit width (aspect ratio is wider than container)
      cropWidth = Math.min(containerWidth * 0.8, containerWidth - 20); // Leave some margin
      cropHeight = cropWidth / aspectRatio;
      
      // Ensure height doesn't exceed container
      if (cropHeight > containerHeight - 20) {
        cropHeight = containerHeight - 20;
        cropWidth = cropHeight * aspectRatio;
      }
    }

    // Center the crop area
    cropX = Math.max(0, (containerWidth - cropWidth) / 2);
    cropY = Math.max(0, (containerHeight - cropHeight) / 2);

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  }, [containerWidth, containerHeight, aspectRatio]);

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
    
    if (maintainAspectRatio) {
      // Always maintain aspect ratio - recalculate based on width
      height = width / aspectRatio;
      
      // Ensure crop area stays within bounds
      // First, constrain width
      width = Math.max(50, Math.min(width, containerWidth));
      height = width / aspectRatio;
      
      // If height exceeds container, adjust width
      if (height > containerHeight) {
        height = containerHeight;
        width = height * aspectRatio;
      }
    } else {
      // Free resize - just constrain to bounds
      width = Math.max(50, Math.min(width, containerWidth));
      height = Math.max(50, Math.min(height, containerHeight));
    }
    
    // Now constrain position
    x = Math.max(0, Math.min(x, containerWidth - width));
    y = Math.max(0, Math.min(y, containerHeight - height));
    
    return { x, y, width, height };
  }, [containerWidth, containerHeight, aspectRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Only allow dragging for preset crops (no resizing)
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropArea.x,
      y: e.clientY - cropArea.y
    });
  }, [cropArea]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // For preset crops, only allow moving - keep dimensions, only constrain position
      setCropArea(prev => {
        // Keep the same width/height, only update position and clamp it
        const clampedX = Math.max(0, Math.min(newX, containerWidth - prev.width));
        const clampedY = Math.max(0, Math.min(newY, containerHeight - prev.height));
        
        return {
          ...prev,
          x: clampedX,
          y: clampedY
        };
      });
    }
    // Resizing is disabled for preset crops - removed resize logic
  }, [isDragging, dragStart, containerWidth, containerHeight]);

  // Notify parent of crop area changes with image coordinates
  useEffect(() => {
    if (!onCropAreaChange || !imageUrl || !overlayRef.current) return;
    
    // overlayRef is on the crop area border, parent is overlay root, parent.parent is container
    const overlayRoot = overlayRef.current.parentElement;
    const container = overlayRoot?.parentElement;
    
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const imgElement = container.querySelector('img') as HTMLImageElement;
    
    let convertedCropArea: CropArea;
    
    if (imgElement && imgElement.complete) {
      const imgRect = imgElement.getBoundingClientRect();
      const scaleX = imgElement.naturalWidth / imgRect.width;
      const scaleY = imgElement.naturalHeight / imgRect.height;
      
      const imgDisplayX = imgRect.left - containerRect.left;
      const imgDisplayY = imgRect.top - containerRect.top;
      
      const cropXRelativeToImage = cropArea.x - imgDisplayX;
      const cropYRelativeToImage = cropArea.y - imgDisplayY;
      
      const clampedX = Math.max(0, Math.min(cropXRelativeToImage, imgRect.width));
      const clampedY = Math.max(0, Math.min(cropYRelativeToImage, imgRect.height));
      const clampedWidth = Math.max(1, Math.min(cropArea.width, imgRect.width - clampedX));
      const clampedHeight = Math.max(1, Math.min(cropArea.height, imgRect.height - clampedY));
      
      convertedCropArea = {
        x: clampedX * scaleX,
        y: clampedY * scaleY,
        width: clampedWidth * scaleX,
        height: clampedHeight * scaleY
      };
    } else {
      // Fallback: pass container coordinates
      convertedCropArea = cropArea;
    }
    
    // Only notify if the crop area has actually changed (prevent infinite loops)
    const last = lastNotifiedCropArea.current;
    if (!last || 
        Math.abs(last.x - convertedCropArea.x) > 0.1 ||
        Math.abs(last.y - convertedCropArea.y) > 0.1 ||
        Math.abs(last.width - convertedCropArea.width) > 0.1 ||
        Math.abs(last.height - convertedCropArea.height) > 0.1) {
      lastNotifiedCropArea.current = convertedCropArea;
      onCropAreaChange(convertedCropArea);
    }
  }, [cropArea, onCropAreaChange, imageUrl]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
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
        className="absolute border-2 border-white cursor-move"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3)'
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

