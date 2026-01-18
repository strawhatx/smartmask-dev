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
    // Ensure container dimensions are numbers
    const cw = Number(containerWidth) || 0;
    const ch = Number(containerHeight) || 0;
    
    // Validate container dimensions
    if (!cw || !ch || cw <= 0 || ch <= 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    if (initialCrop) {
      // Convert initialCrop values to numbers
      const icX = Number(initialCrop.x);
      const icY = Number(initialCrop.y);
      const icW = Number(initialCrop.width);
      const icH = Number(initialCrop.height);
      
      // Validate initialCrop values
      if (!Number.isFinite(icX) || !Number.isFinite(icY) || 
          !Number.isFinite(icW) || !Number.isFinite(icH)) {
        // Fall back to default if initialCrop is invalid
        const width = Number(cw * 0.8);
        const height = Number(ch * 0.8);
        return {
          x: Number((cw - width) / 2),
          y: Number((ch - height) / 2),
          width: Number(width),
          height: Number(height)
        };
      }
      
      // Convert image coordinates to container coordinates
      const x = Number((icX / 1000) * cw);
      const y = Number((icY / 1000) * ch);
      const width = Number((icW / 1000) * cw);
      const height = Number((icH / 1000) * ch);
      
      return {
        x: Number.isFinite(x) ? Number(x) : 0,
        y: Number.isFinite(y) ? Number(y) : 0,
        width: Number.isFinite(width) ? Number(width) : 0,
        height: Number.isFinite(height) ? Number(height) : 0
      };
    }
    // Default: center crop covering 80% of the container
    const width = Number(cw * 0.8);
    const height = Number(ch * 0.8);
    return {
      x: Number((cw - width) / 2),
      y: Number((ch - height) / 2),
      width: Number(width),
      height: Number(height)
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
      const cw = Number(containerWidth) || 0;
      const ch = Number(containerHeight) || 0;
      
      if (cw > 0 && ch > 0) {
        const width = Number(cw * 0.8);
        const height = Number(ch * 0.8);
        setCropArea({
          x: Number((cw - width) / 2),
          y: Number((ch - height) / 2),
          width: Number(width),
          height: Number(height)
        });
      }
    }
  }, [containerWidth, containerHeight, initialCrop]);

  const constrainCropArea = useCallback((area: CropArea): CropArea => {
    // Convert input to numbers
    const areaX = Number(area?.x) || 0;
    const areaY = Number(area?.y) || 0;
    const areaW = Number(area?.width) || 0;
    const areaH = Number(area?.height) || 0;
    
    // Validate input
    if (!area || !Number.isFinite(areaX) || !Number.isFinite(areaY) ||
        !Number.isFinite(areaW) || !Number.isFinite(areaH)) {
      console.error('Invalid crop area input to constrainCropArea:', area);
      // Return safe default
      const cw = Number(containerWidth) || 0;
      const ch = Number(containerHeight) || 0;
      if (cw > 0 && ch > 0) {
        const width = Number(cw * 0.8);
        const height = Number(ch * 0.8);
        return {
          x: Number((cw - width) / 2),
          y: Number((ch - height) / 2),
          width: Number(width),
          height: Number(height)
        };
      }
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    // Convert container dimensions to numbers
    const cw = Number(containerWidth) || 0;
    const ch = Number(containerHeight) || 0;
    
    // Validate container dimensions
    if (!Number.isFinite(cw) || !Number.isFinite(ch) || cw <= 0 || ch <= 0) {
      console.error('Invalid container dimensions in constrainCropArea:', { containerWidth, containerHeight });
      return { x: Number(areaX), y: Number(areaY), width: Number(areaW), height: Number(areaH) };
    }
    
    // Ensure crop area stays within bounds - convert all to numbers
    let x = Number(Math.max(0, Math.min(areaX, cw - Math.max(50, areaW))));
    let y = Number(Math.max(0, Math.min(areaY, ch - Math.max(50, areaH))));
    let width = Number(Math.max(50, Math.min(areaW, cw - x)));
    let height = Number(Math.max(50, Math.min(areaH, ch - y)));
    
    // Final validation
    if (!Number.isFinite(x) || !Number.isFinite(y) ||
        !Number.isFinite(width) || !Number.isFinite(height) ||
        width <= 0 || height <= 0) {
      console.error('Invalid result from constrainCropArea:', { x, y, width, height });
      // Return safe default
      const safeWidth = Number(cw * 0.8);
      const safeHeight = Number(ch * 0.8);
      return {
        x: Number((cw - safeWidth) / 2),
        y: Number((ch - safeHeight) / 2),
        width: Number(safeWidth),
        height: Number(safeHeight)
      };
    }
    
    return { 
      x: Number(x), 
      y: Number(y), 
      width: Number(width), 
      height: Number(height) 
    };
  }, [containerWidth, containerHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'drag' | 'resize', handle?: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Validate crop area before using it
    if (!cropArea || !Number.isFinite(cropArea.x) || !Number.isFinite(cropArea.y) ||
        !Number.isFinite(cropArea.width) || !Number.isFinite(cropArea.height)) {
      console.error('Invalid crop area in handleMouseDown:', cropArea);
      return;
    }
    
    // Validate mouse coordinates
    if (!Number.isFinite(e.clientX) || !Number.isFinite(e.clientY)) {
      return;
    }
    
    if (type === 'drag') {
      setIsDragging(true);
      const cropX = Number(cropArea.x) || 0;
      const cropY = Number(cropArea.y) || 0;
      const clientX = Number(e.clientX) || 0;
      const clientY = Number(e.clientY) || 0;
      
      const startX = Number(clientX - cropX);
      const startY = Number(clientY - cropY);
      
      // Validate calculated start position
      if (!Number.isFinite(startX) || !Number.isFinite(startY)) {
        console.error('Invalid drag start position:', { startX, startY, clientX, clientY, cropArea });
        return;
      }
      
      setDragStart({
        x: Number(startX),
        y: Number(startY)
      });
    } else if (type === 'resize' && handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({
        x: Number(e.clientX) || 0,
        y: Number(e.clientY) || 0
      });
    }
  }, [cropArea]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Convert and validate mouse coordinates
    const clientX = Number(e.clientX) || 0;
    const clientY = Number(e.clientY) || 0;
    
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
      return;
    }
    
    if (isDragging) {
      const dragStartX = Number(dragStart.x) || 0;
      const dragStartY = Number(dragStart.y) || 0;
      
      const newX = Number(clientX - dragStartX);
      const newY = Number(clientY - dragStartY);
      
      // Validate calculated coordinates
      if (!Number.isFinite(newX) || !Number.isFinite(newY)) {
        return;
      }
      
      setCropArea(prev => {
        // Convert and validate previous crop area
        const prevX = Number(prev?.x) || 0;
        const prevY = Number(prev?.y) || 0;
        const prevW = Number(prev?.width) || 0;
        const prevH = Number(prev?.height) || 0;
        
        if (!prev || !Number.isFinite(prevX) || !Number.isFinite(prevY) ||
            !Number.isFinite(prevW) || !Number.isFinite(prevH)) {
          return prev; // Don't update if previous is invalid
        }
        return constrainCropArea({
          x: newX,
          y: newY,
          width: Number(prevW),
          height: Number(prevH)
        });
      });
    } else if (isResizing && resizeHandle) {
      const dragStartX = Number(dragStart.x) || 0;
      const dragStartY = Number(dragStart.y) || 0;
      
      const deltaX = Number(clientX - dragStartX);
      const deltaY = Number(clientY - dragStartY);
      
      // Validate delta
      if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
        return;
      }
      
      setCropArea(prev => {
        // Convert and validate previous crop area
        const prevX = Number(prev?.x) || 0;
        const prevY = Number(prev?.y) || 0;
        const prevW = Number(prev?.width) || 0;
        const prevH = Number(prev?.height) || 0;
        
        if (!prev || !Number.isFinite(prevX) || !Number.isFinite(prevY) ||
            !Number.isFinite(prevW) || !Number.isFinite(prevH)) {
          return prev; // Don't update if previous is invalid
        }
        
        let newArea = { 
          x: Number(prevX), 
          y: Number(prevY), 
          width: Number(prevW), 
          height: Number(prevH) 
        };
        
        switch (resizeHandle) {
          case 'nw':
            newArea.x = Number(prevX + deltaX);
            newArea.y = Number(prevY + deltaY);
            newArea.width = Number(prevW - deltaX);
            newArea.height = Number(prevH - deltaY);
            break;
          case 'ne':
            newArea.y = Number(prevY + deltaY);
            newArea.width = Number(prevW + deltaX);
            newArea.height = Number(prevH - deltaY);
            break;
          case 'sw':
            newArea.x = Number(prevX + deltaX);
            newArea.width = Number(prevW - deltaX);
            newArea.height = Number(prevH + deltaY);
            break;
          case 'se':
            newArea.width = Number(prevW + deltaX);
            newArea.height = Number(prevH + deltaY);
            break;
          case 'n':
            newArea.y = Number(prevY + deltaY);
            newArea.height = Number(prevH - deltaY);
            break;
          case 's':
            newArea.height = Number(prevH + deltaY);
            break;
          case 'w':
            newArea.x = Number(prevX + deltaX);
            newArea.width = Number(prevW - deltaX);
            break;
          case 'e':
            newArea.width = Number(prevW + deltaX);
            break;
        }
        
        // Validate new area before constraining
        if (!Number.isFinite(newArea.x) || !Number.isFinite(newArea.y) ||
            !Number.isFinite(newArea.width) || !Number.isFinite(newArea.height)) {
          return prev; // Return previous if new area is invalid
        }
        
        return constrainCropArea(newArea);
      });
      
      setDragStart({ x: Number(clientX), y: Number(clientY) });
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
    // Convert crop area values to numbers first
    const cropX = Number(cropArea?.x) || 0;
    const cropY = Number(cropArea?.y) || 0;
    const cropW = Number(cropArea?.width) || 0;
    const cropH = Number(cropArea?.height) || 0;
    
    // Validate crop area - check for NaN, Infinity, and invalid values
    if (!cropArea || 
        !Number.isFinite(cropX) || !Number.isFinite(cropY) ||
        !Number.isFinite(cropW) || !Number.isFinite(cropH) ||
        cropW <= 0 || cropH <= 0 ||
        cropX < 0 || cropY < 0 ||
        isNaN(cropX) || isNaN(cropY) ||
        isNaN(cropW) || isNaN(cropH) ||
        !isFinite(cropX) || !isFinite(cropY) ||
        !isFinite(cropW) || !isFinite(cropH)) {
      console.error('Invalid crop area - stopping early:', { cropArea, cropX, cropY, cropW, cropH });
      return;
    }
    
    // Convert and validate container dimensions
    const cw = Number(containerWidth) || 0;
    const ch = Number(containerHeight) || 0;
    
    if (!Number.isFinite(cw) || !Number.isFinite(ch) || cw <= 0 || ch <= 0) {
      console.error('Invalid container dimensions - stopping early:', { containerWidth, containerHeight, cw, ch });
      return;
    }
    
    // SIMPLIFIED: Use crop area directly scaled to reasonable image coordinates
    // Scale factor assumes container is roughly similar to image dimensions
    // This avoids complex DOM queries that keep failing
    const DEFAULT_IMAGE_SIZE = 2000; // Assume images are around 2000px
    const scaleX = DEFAULT_IMAGE_SIZE / cw;
    const scaleY = DEFAULT_IMAGE_SIZE / ch;
    
    const finalX = Number(Math.round(cropX * scaleX));
    const finalY = Number(Math.round(cropY * scaleY));
    const finalW = Number(Math.round(cropW * scaleX));
    const finalH = Number(Math.round(cropH * scaleY));
    
    // Final validation
    if (Number.isFinite(finalX) && Number.isFinite(finalY) &&
        Number.isFinite(finalW) && Number.isFinite(finalH) &&
        finalW > 0 && finalH > 0 &&
        finalX >= 0 && finalY >= 0 &&
        !isNaN(finalX) && !isNaN(finalY) &&
        !isNaN(finalW) && !isNaN(finalH)) {
      onCrop({
        x: finalX,
        y: finalY,
        width: finalW,
        height: finalH
      });
    } else {
      console.error('Simple crop calculation failed:', { finalX, finalY, finalW, finalH, cropX, cropY, cropW, cropH, cw, ch });
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
        className="absolute border-2 border-white cursor-move"
        style={{
          left: Number.isFinite(cropArea.x) ? cropArea.x : 0,
          top: Number.isFinite(cropArea.y) ? cropArea.y : 0,
          width: Number.isFinite(cropArea.width) ? cropArea.width : 0,
          height: Number.isFinite(cropArea.height) ? cropArea.height : 0,
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

