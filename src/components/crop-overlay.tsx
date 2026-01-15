import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { CropArea } from '@/lib/imageProcessor';

interface CropOverlayProps {
  imageId: string;
  imageUrl: string;
  containerWidth: number;
  containerHeight: number;
  onCrop: (cropArea: CropArea) => void;
  onCancel: () => void;
  initialCrop?: CropArea;
}

export interface CropOverlayHandle {
  apply: () => void;
}

const CropOverlayComponent = forwardRef<CropOverlayHandle, CropOverlayProps>(({ 
  imageId, 
  imageUrl, 
  containerWidth, 
  containerHeight, 
  onCrop, 
  onCancel,
  initialCrop
}, ref) => {
  const [cropArea, setCropArea] = useState<CropArea>(() => {
    if (initialCrop) {
      // Convert image coordinates to container coordinates
      // This is a simplified conversion - in practice, we'd need the actual image display size
      return {
        x: (initialCrop.x / 1000) * containerWidth, // Rough approximation
        y: (initialCrop.y / 1000) * containerHeight,
        width: (initialCrop.width / 1000) * containerWidth,
        height: (initialCrop.height / 1000) * containerHeight
      };
    }
    // Default: center crop covering 80% of the container
    const width = containerWidth * 0.8;
    const height = containerHeight * 0.8;
    return {
      x: (containerWidth - width) / 2,
      y: (containerHeight - height) / 2,
      width,
      height
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Update crop area when container size changes
  useEffect(() => {
    if (!initialCrop) {
      const width = containerWidth * 0.8;
      const height = containerHeight * 0.8;
      setCropArea({
        x: (containerWidth - width) / 2,
        y: (containerHeight - height) / 2,
        width,
        height
      });
    }
  }, [containerWidth, containerHeight, initialCrop]);

  const constrainCropArea = useCallback((area: CropArea): CropArea => {
    let { x, y, width, height } = area;
    
    // Ensure crop area stays within bounds
    x = Math.max(0, Math.min(x, containerWidth - width));
    y = Math.max(0, Math.min(y, containerHeight - height));
    width = Math.max(50, Math.min(width, containerWidth - x));
    height = Math.max(50, Math.min(height, containerHeight - y));
    
    return { x, y, width, height };
  }, [containerWidth, containerHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'drag' | 'resize', handle?: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (type === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - cropArea.x,
        y: e.clientY - cropArea.y
      });
    } else if (type === 'resize' && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setCropArea(prev => constrainCropArea({
        ...prev,
        x: newX,
        y: newY
      }));
    } else if (isResizing && resizeHandle) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setCropArea(prev => {
        let newArea = { ...prev };
        
        switch (resizeHandle) {
          case 'nw':
            newArea.x = prev.x + deltaX;
            newArea.y = prev.y + deltaY;
            newArea.width = prev.width - deltaX;
            newArea.height = prev.height - deltaY;
            break;
          case 'ne':
            newArea.y = prev.y + deltaY;
            newArea.width = prev.width + deltaX;
            newArea.height = prev.height - deltaY;
            break;
          case 'sw':
            newArea.x = prev.x + deltaX;
            newArea.width = prev.width - deltaX;
            newArea.height = prev.height + deltaY;
            break;
          case 'se':
            newArea.width = prev.width + deltaX;
            newArea.height = prev.height + deltaY;
            break;
          case 'n':
            newArea.y = prev.y + deltaY;
            newArea.height = prev.height - deltaY;
            break;
          case 's':
            newArea.height = prev.height + deltaY;
            break;
          case 'w':
            newArea.x = prev.x + deltaX;
            newArea.width = prev.width - deltaX;
            break;
          case 'e':
            newArea.width = prev.width + deltaX;
            break;
        }
        
        return constrainCropArea(newArea);
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, constrainCropArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleApply = useCallback(() => {
    // Get the actual image dimensions to calculate relative crop coordinates
    if (overlayRef.current) {
      const container = overlayRef.current.parentElement;
      
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const imgElement = container.querySelector('img') as HTMLImageElement;
        
        if (imgElement && imgElement.complete) {
          const imgRect = imgElement.getBoundingClientRect();
          
          // Calculate the image's displayed size and position within container
          const imgDisplayWidth = imgRect.width;
          const imgDisplayHeight = imgRect.height;
          const imgDisplayX = imgRect.left - containerRect.left;
          const imgDisplayY = imgRect.top - containerRect.top;
          
          // Calculate scale factors from displayed size to natural size
          const scaleX = imgElement.naturalWidth / imgDisplayWidth;
          const scaleY = imgElement.naturalHeight / imgDisplayHeight;
          
          // Convert crop area (relative to container) to image coordinates
          // Crop area is relative to container, but we need to account for image position
          const cropXInContainer = cropArea.x;
          const cropYInContainer = cropArea.y;
          
          // Calculate crop area relative to the displayed image
          const cropXRelativeToImage = cropXInContainer - imgDisplayX;
          const cropYRelativeToImage = cropYInContainer - imgDisplayY;
          
          // Clamp to image bounds
          const clampedX = Math.max(0, Math.min(cropXRelativeToImage, imgDisplayWidth));
          const clampedY = Math.max(0, Math.min(cropYRelativeToImage, imgDisplayHeight));
          const clampedWidth = Math.max(1, Math.min(cropArea.width, imgDisplayWidth - clampedX));
          const clampedHeight = Math.max(1, Math.min(cropArea.height, imgDisplayHeight - clampedY));
          
          // Convert to natural image coordinates
          onCrop({
            x: clampedX * scaleX,
            y: clampedY * scaleY,
            width: clampedWidth * scaleX,
            height: clampedHeight * scaleY
          });
        } else {
          // Fallback: use container-relative coordinates with approximation
          // This is less accurate but works if image hasn't loaded yet
          const scale = Math.min(containerWidth / 1000, containerHeight / 1000);
          onCrop({
            x: cropArea.x * scale,
            y: cropArea.y * scale,
            width: cropArea.width * scale,
            height: cropArea.height * scale
          });
        }
      }
    }
  }, [cropArea, containerWidth, containerHeight, onCrop]);

  // Expose apply method via ref
  useImperativeHandle(ref, () => ({
    apply: handleApply
  }), [handleApply]);

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
      ref={overlayRef}
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
        className="absolute border-2 border-white cursor-move relative"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
          boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3)'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {gridLines}
        </div>

        {/* Resize handles */}
        {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map(handle => (
          <div
            key={handle}
            className={cn(
              "absolute bg-white border border-gray-400 rounded",
              handle === 'nw' || handle === 'se' ? "w-4 h-4 cursor-nwse-resize" :
              handle === 'ne' || handle === 'sw' ? "w-4 h-4 cursor-nesw-resize" :
              handle === 'n' || handle === 's' ? "w-4 h-2 cursor-ns-resize" :
              "h-4 w-2 cursor-ew-resize",
              handle === 'nw' && "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
              handle === 'ne' && "top-0 right-0 translate-x-1/2 -translate-y-1/2",
              handle === 'sw' && "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
              handle === 'se' && "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
              handle === 'n' && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
              handle === 's' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
              handle === 'w' && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
              handle === 'e' && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'resize', handle)}
          />
        ))}
      </div>


    </div>
  );
});

CropOverlayComponent.displayName = 'CropOverlay';

export const CropOverlay = CropOverlayComponent;
export default CropOverlay;

