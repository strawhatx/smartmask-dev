'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export type DisplayCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface CropOverlayProps {
  containerWidth: number;
  containerHeight: number;
  imageUrl: string;
  displayedImageRect: { x: number; y: number; width: number; height: number } | null;
  onCrop: (cropArea: DisplayCrop) => void;
  onCancel: () => void;
}

export function CropOverlay({
  containerWidth,
  containerHeight,
  imageUrl,
  displayedImageRect,
  onCrop,
  onCancel
}: CropOverlayProps) {
  // Guard: Never allow crop when container is invalid
  if (containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  // Use displayedImageRect if provided, otherwise use full container
  const cropBounds = displayedImageRect || {
    x: 0,
    y: 0,
    width: containerWidth,
    height: containerHeight
  };

  // Validate crop bounds
  if (!cropBounds || 
      !isFinite(cropBounds.x) || !isFinite(cropBounds.y) ||
      !isFinite(cropBounds.width) || !isFinite(cropBounds.height) ||
      cropBounds.width <= 0 || cropBounds.height <= 0) {
    return null;
  }

  // Initial crop area - 80% of crop bounds, centered
  const initialCrop: DisplayCrop = {
    x: cropBounds.x + cropBounds.width * 0.1,
    y: cropBounds.y + cropBounds.height * 0.1,
    width: cropBounds.width * 0.8,
    height: cropBounds.height * 0.8
  };
  
  // Validate initial crop
  if (!isFinite(initialCrop.x) || !isFinite(initialCrop.y) ||
      !isFinite(initialCrop.width) || !isFinite(initialCrop.height) ||
      initialCrop.width <= 0 || initialCrop.height <= 0) {
    console.error('Invalid initial crop calculated:', { initialCrop, cropBounds });
    return null;
  }

  const [cropArea, setCropArea] = useState<DisplayCrop>(initialCrop);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cropStartRef = useRef<DisplayCrop | null>(null);

  // Clamp crop to bounds (can be full container or displayed image rect)
  const clampCrop = useCallback((crop: DisplayCrop): DisplayCrop => {
    // Use displayedImageRect if provided, otherwise use full container
    const bounds = displayedImageRect || {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight
    };
    
    const minX = bounds.x;
    const minY = bounds.y;
    const maxX = bounds.x + bounds.width;
    const maxY = bounds.y + bounds.height;
    const minSize = 20;

    // First, ensure minimum size
    let width = Math.max(minSize, crop.width);
    let height = Math.max(minSize, crop.height);

    // Clamp position and adjust size if needed
    let x = Math.max(minX, Math.min(crop.x, maxX - minSize));
    let y = Math.max(minY, Math.min(crop.y, maxY - minSize));

    // Ensure crop doesn't go outside bounds
    if (x + width > maxX) {
      width = maxX - x;
    }
    if (y + height > maxY) {
      height = maxY - y;
    }

    // Ensure minimum size after clamping
    if (width < minSize) {
      width = minSize;
      x = Math.max(minX, Math.min(x, maxX - minSize));
    }
    if (height < minSize) {
      height = minSize;
      y = Math.max(minY, Math.min(y, maxY - minSize));
    }

    return { x, y, width, height };
  }, [displayedImageRect, containerWidth, containerHeight]);

  const getHandleAt = useCallback((x: number, y: number): string | null => {
    const handleSize = 20; // Larger hit area
    const { x: cx, y: cy, width: cw, height: ch } = cropArea;
    
    // Check corners first (they have priority)
    if (Math.abs(x - cx) < handleSize && Math.abs(y - cy) < handleSize) return 'nw';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - cy) < handleSize) return 'ne';
    if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'sw';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch)) < handleSize) return 'se';
    
    // Check edges (with larger hit area for edges)
    const edgeHitSize = 20;
    if (Math.abs(x - (cx + cw / 2)) < edgeHitSize && Math.abs(y - cy) < handleSize) return 'n';
    if (Math.abs(x - (cx + cw / 2)) < edgeHitSize && Math.abs(y - (cy + ch)) < handleSize) return 's';
    if (Math.abs(x - cx) < handleSize && Math.abs(y - (cy + ch / 2)) < edgeHitSize) return 'w';
    if (Math.abs(x - (cx + cw)) < handleSize && Math.abs(y - (cy + ch / 2)) < edgeHitSize) return 'e';
    
    return null;
  }, [cropArea]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't handle if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on resize handle first (handles have priority)
    const handle = getHandleAt(x, y);
    
    if (handle) {
      setResizeHandle(handle);
      cropStartRef.current = { ...cropArea };
      setDragStart({ x, y });
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Check if clicking inside crop area (for dragging)
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width && 
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true);
      cropStartRef.current = { ...cropArea };
      setDragStart({ x, y });
      e.preventDefault();
      e.stopPropagation();
    }
  }, [cropArea, getHandleAt]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !resizeHandle) return;
    if (!cropStartRef.current) return;

    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    let newCrop = { ...cropStartRef.current };

    if (resizeHandle) {
      // Resize from specific handle
      const start = cropStartRef.current;
      switch (resizeHandle) {
        case 'nw':
          newCrop.x = start.x + dx;
          newCrop.y = start.y + dy;
          newCrop.width = start.width - dx;
          newCrop.height = start.height - dy;
          break;
        case 'ne':
          newCrop.y = start.y + dy;
          newCrop.width = start.width + dx;
          newCrop.height = start.height - dy;
          break;
        case 'sw':
          newCrop.x = start.x + dx;
          newCrop.width = start.width - dx;
          newCrop.height = start.height + dy;
          break;
        case 'se':
          newCrop.width = start.width + dx;
          newCrop.height = start.height + dy;
          break;
        case 'n':
          newCrop.y = start.y + dy;
          newCrop.height = start.height - dy;
          break;
        case 's':
          newCrop.height = start.height + dy;
          break;
        case 'w':
          newCrop.x = start.x + dx;
          newCrop.width = start.width - dx;
          break;
        case 'e':
          newCrop.width = start.width + dx;
          break;
      }
      
      // Ensure minimum size
      if (newCrop.width < 20) {
        if (resizeHandle.includes('w')) {
          newCrop.x = start.x + start.width - 20;
        }
        newCrop.width = 20;
      }
      if (newCrop.height < 20) {
        if (resizeHandle.includes('n')) {
          newCrop.y = start.y + start.height - 20;
        }
        newCrop.height = 20;
      }
    } else if (isDragging) {
      // Move the entire crop area
      newCrop.x = cropStartRef.current.x + dx;
      newCrop.y = cropStartRef.current.y + dy;
    }

    setCropArea(clampCrop(newCrop));
  }, [isDragging, resizeHandle, dragStart, clampCrop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeHandle(null);
    cropStartRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging || resizeHandle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, resizeHandle, handleMouseMove, handleMouseUp]);

  const handleApply = useCallback(() => {
    // Validate display crop before passing to onCrop
    if (!cropArea ||
        !isFinite(cropArea.x) || !isFinite(cropArea.y) ||
        !isFinite(cropArea.width) || !isFinite(cropArea.height) ||
        cropArea.width <= 0 || cropArea.height <= 0) {
      console.error('Invalid crop area - cannot apply:', cropArea);
      return;
    }
    
    // Validate displayedImageRect
    if (!displayedImageRect ||
        !isFinite(displayedImageRect.x) || !isFinite(displayedImageRect.y) ||
        !isFinite(displayedImageRect.width) || !isFinite(displayedImageRect.height) ||
        displayedImageRect.width <= 0 || displayedImageRect.height <= 0) {
      console.error('Invalid displayedImageRect - cannot convert crop:', displayedImageRect);
      return;
    }

    // Pass validated display crop (conversion happens in page.tsx)
    onCrop(cropArea);
  }, [cropArea, displayedImageRect, onCrop]);

  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (resizeHandle) {
      const cursors: Record<string, string> = {
        'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize',
        'n': 'n-resize', 's': 's-resize', 'w': 'w-resize', 'e': 'e-resize'
      };
      return cursors[resizeHandle] || 'default';
    }
    return 'default';
  };

  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 z-50 flex flex-col"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
    >
     

      {/* Dark overlay with crop window */}
      <div className="flex-1 relative" style={{ width: containerWidth, height: containerHeight }}>
        {/* Dark overlay outside crop area */}
        <div 
          className="absolute inset-0 bg-black/60"
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

        {/* Crop rectangle border */}
        <div
          className="absolute border-2 border-white shadow-2xl"
          style={{
            left: `${cropArea.x}px`,
            top: `${cropArea.y}px`,
            width: `${cropArea.width}px`,
            height: `${cropArea.height}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.5) inset',
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => {
            // Only handle if not clicking on a handle (handles have their own handlers)
            const target = e.target as HTMLElement;
            if (target.closest('[data-handle]')) {
              return; // Let handle handle it
            }
            
            // Allow dragging from the crop area itself
            setIsDragging(true);
            cropStartRef.current = { ...cropArea };
            const rect = overlayRef.current?.getBoundingClientRect();
            if (rect) {
              setDragStart({ 
                x: e.clientX - rect.left, 
                y: e.clientY - rect.top 
              });
            }
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
          </div>

          {/* Resize handles - all 8 handles */}
          {(['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'] as const).map((handle) => {
            const isCorner = ['nw', 'ne', 'sw', 'se'].includes(handle);
            const style: React.CSSProperties = {
              position: 'absolute',
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
              width: isCorner ? '14px' : handle === 'n' || handle === 's' ? '40px' : '14px',
              height: isCorner ? '14px' : handle === 'w' || handle === 'e' ? '40px' : '14px',
              cursor: `${handle}-resize`,
              zIndex: 10,
              pointerEvents: 'auto'
            };

            if (handle === 'nw') {
              style.left = '-7px';
              style.top = '-7px';
            } else if (handle === 'ne') {
              style.right = '-7px';
              style.top = '-7px';
            } else if (handle === 'sw') {
              style.left = '-7px';
              style.bottom = '-7px';
            } else if (handle === 'se') {
              style.right = '-7px';
              style.bottom = '-7px';
            } else if (handle === 'n') {
              style.left = '50%';
              style.top = '-7px';
              style.transform = 'translateX(-50%)';
            } else if (handle === 's') {
              style.left = '50%';
              style.bottom = '-7px';
              style.transform = 'translateX(-50%)';
            } else if (handle === 'w') {
              style.left = '-7px';
              style.top = '50%';
              style.transform = 'translateY(-50%)';
            } else if (handle === 'e') {
              style.right = '-7px';
              style.top = '50%';
              style.transform = 'translateY(-50%)';
            }

            return (
              <div 
                key={handle} 
                data-handle={handle}
                style={style}
                onMouseDown={(e) => {
                  setResizeHandle(handle);
                  cropStartRef.current = { ...cropArea };
                  const rect = overlayRef.current?.getBoundingClientRect();
                  if (rect) {
                    setDragStart({ 
                      x: e.clientX - rect.left, 
                      y: e.clientY - rect.top 
                    });
                  }
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
