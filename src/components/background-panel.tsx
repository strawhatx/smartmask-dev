import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Eraser, Palette, Image as ImageIcon, Sparkles } from 'lucide-react';

interface BackgroundPanelProps {
  selectedCount: number;
  selectedImages: Array<{ id: string; url: string; background?: string; backgroundType?: 'blur' | 'color' | 'texture' | 'transparent' }>;
  onApplyBackground: (background: string, type: 'blur' | 'color' | 'texture' | 'transparent') => void | Promise<void>;
}

interface BackgroundOption {
  id: string;
  name: string;
  thumbnail: string;
  type: 'texture';
}

const springBackgrounds: BackgroundOption[] = [
  {
    id: 'bloom',
    name: 'Bloom',
    thumbnail: 'https://images.unsplash.com/photo-1716392775780-a96c32c4d4d3?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'light-wood',
    name: 'Light Wood',
    thumbnail: 'https://images.unsplash.com/photo-1725330785143-ce43bff100d3?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    thumbnail: 'https://images.unsplash.com/photo-1709700556873-8a15c9c9f755?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'wild',
    name: 'Wild',
    thumbnail: 'https://images.unsplash.com/photo-1658550893603-935a5314e4d5?w=200&h=200&fit=crop',
    type: 'texture'
  }
];

const textureBackgrounds: BackgroundOption[] = [
  {
    id: 'concrete',
    name: 'Concrete Countertop',
    thumbnail: 'https://images.unsplash.com/photo-1617713965103-9fda56c89fad?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'marble',
    name: 'Marble Countertop',
    thumbnail: 'https://images.unsplash.com/photo-1550053808-52a75a05955d?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'dark-marble',
    name: 'Dark Marble',
    thumbnail: 'https://images.unsplash.com/photo-1747696766706-5485b39bf358?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'dark-wood',
    name: 'Dark Wood',
    thumbnail: 'https://images.unsplash.com/photo-1525947088131-b701cd0f6dc3?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'white-marble',
    name: 'White Marble',
    thumbnail: 'https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'cracked-wall',
    name: 'Cracked Wall',
    thumbnail: 'https://images.unsplash.com/photo-1624675753405-94332dec7f7f?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'white-brick',
    name: 'White Brick',
    thumbnail: 'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=200&h=200&fit=crop',
    type: 'texture'
  }
];

const eventBackgrounds: BackgroundOption[] = [
  {
    id: 'birthday',
    name: 'Birthday',
    thumbnail: 'https://images.unsplash.com/photo-1626149136691-78e3977b3d69?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'flowers',
    name: 'Flowers',
    thumbnail: 'https://images.unsplash.com/photo-1623001650315-65324d5aae16?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'hearts',
    name: 'Hearts',
    thumbnail: 'https://images.unsplash.com/photo-1676337777918-03e96f0747e4?w=200&h=200&fit=crop',
    type: 'texture'
  },
  {
    id: 'wedding',
    name: 'Wedding',
    thumbnail: 'https://images.unsplash.com/photo-1664530140722-7e3bdbf2b870?w=200&h=200&fit=crop',
    type: 'texture'
  }
];

const solidColors = [
  { id: 'white', name: 'White', value: '#FFFFFF' },
  { id: 'black', name: 'Black', value: '#000000' },
  { id: 'gray', name: 'Gray', value: '#808080' },
  { id: 'light-gray', name: 'Light Gray', value: '#E5E5E5' },
  { id: 'dark-gray', name: 'Dark Gray', value: '#404040' },
  { id: 'red', name: 'Red', value: '#EF4444' },
  { id: 'blue', name: 'Blue', value: '#3B82F6' },
  { id: 'green', name: 'Green', value: '#10B981' },
];

export function BackgroundPanel({ selectedCount, selectedImages, onApplyBackground }: BackgroundPanelProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#FFFFFF');

  const hasImages = selectedCount > 0;

  const handleRemoveBackground = () => {
    if (!hasImages) return;
    onApplyBackground('transparent', 'transparent');
  };

  const handleBlurBackground = () => {
    if (!hasImages) return;
    onApplyBackground('blur', 'blur');
  };

  const handleSolidColor = (color: string) => {
    if (!hasImages) return;
    onApplyBackground(color, 'color');
  };

  const handleCustomColor = () => {
    if (!hasImages) return;
    onApplyBackground(customColor, 'color');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900">Background</h2>
          {selectedCount > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedCount} image{selectedCount !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {selectedCount === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select one or more images to apply backgrounds
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className={cn("mb-6 space-y-2", !hasImages && "opacity-50 pointer-events-none")}>
          {/* Remove Background */}
          <button
            onClick={handleRemoveBackground}
            disabled={!hasImages}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left",
              !hasImages && "cursor-not-allowed"
            )}
          >
            <div className="shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-600">
              <Eraser className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">Remove Background</div>
              <div className="text-xs text-gray-500">Make background transparent (PNG)</div>
            </div>
          </button>

          {/* Blur Background */}
          <button
            onClick={handleBlurBackground}
            disabled={!hasImages}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all text-left",
              !hasImages && "cursor-not-allowed"
            )}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-gray-100 text-gray-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">Blur Background</div>
              <div className="text-xs text-gray-500">Apply blur effect to background</div>
            </div>
          </button>
        </div>

        {/* Solid Colors */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Solid Colors</h3>
          </div>
          <div className={cn("grid grid-cols-4 gap-3", !hasImages && "opacity-50 pointer-events-none")}>
            {solidColors.map(color => (
              <button
                key={color.id}
                onClick={() => handleSolidColor(color.value)}
                disabled={!hasImages}
                className={cn(
                  "aspect-square rounded-lg border-2 border-transparent hover:border-blue-500 transition-all disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          
          {/* Custom Color Picker */}
          {showColorPicker ? (
            <div className="mt-3 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Custom Color</span>
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  disabled={!hasImages}
                  className="w-12 h-12 rounded border-2 border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  disabled={!hasImages}
                  placeholder="#FFFFFF"
                  className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleCustomColor}
                  disabled={!hasImages}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowColorPicker(true)}
              disabled={!hasImages}
              className={cn(
                "w-full mt-3 flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-600",
                !hasImages && "opacity-50 cursor-not-allowed"
              )}
            >
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Custom Color</span>
            </button>
          )}
        </div>

        {/* Textures Collection */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Textures & Images</h3>
          </div>
          
          {/* Spring Collection */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Spring</h4>
            <div className={cn("grid grid-cols-4 gap-3", !hasImages && "opacity-50 pointer-events-none")}>
              {springBackgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => onApplyBackground(bg.thumbnail, bg.type)}
                  disabled={!hasImages}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  <img
                    src={bg.thumbnail}
                    alt={bg.name}
                    className="w-full h-full object-fill"
                  />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {springBackgrounds.map(bg => (
                <p key={bg.id} className="text-xs text-center text-gray-600 truncate">
                  {bg.name}
                </p>
              ))}
            </div>
          </div>

          {/* Textures Collection */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Textures</h4>
            <div className={cn("grid grid-cols-4 gap-3", !hasImages && "opacity-50 pointer-events-none")}>
              {textureBackgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => onApplyBackground(bg.thumbnail, bg.type)}
                  disabled={!hasImages}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  <img
                    src={bg.thumbnail}
                    alt={bg.name}
                    className="w-full h-full object-fill"
                  />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {textureBackgrounds.slice(0, 4).map(bg => (
                <p key={bg.id} className="text-xs text-center text-gray-600 truncate">
                  {bg.name}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {textureBackgrounds.slice(4).map(bg => (
                <p key={bg.id} className="text-xs text-center text-gray-600 truncate">
                  {bg.name}
                </p>
              ))}
            </div>
          </div>

          {/* Events Collection */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Events</h4>
            <div className={cn("grid grid-cols-4 gap-3", !hasImages && "opacity-50 pointer-events-none")}>
              {eventBackgrounds.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => onApplyBackground(bg.thumbnail, bg.type)}
                  disabled={!hasImages}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all disabled:cursor-not-allowed",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  )}
                >
                  <img
                    src={bg.thumbnail}
                    alt={bg.name}
                    className="w-full h-full object-fill"
                  />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-2">
              {eventBackgrounds.map(bg => (
                <p key={bg.id} className="text-xs text-center text-gray-600 truncate">
                  {bg.name}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
