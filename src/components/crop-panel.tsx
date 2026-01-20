import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RotateCw, ChevronLeft } from 'lucide-react';

interface CropPanelProps {
  selectedImages: Array<{ id: string; file: File; url: string; selected: boolean }>;
  onApplyCrop?: (aspectRatio: number | null, targetWidth?: number, targetHeight?: number) => void | Promise<void>;
  onRotate?: (direction: '90' | '-90' | '180') => void | Promise<void>;
  onFlip?: (direction: 'horizontal' | 'vertical') => void | Promise<void>;
  onCustomCrop?: () => void;
  customCropActive?: boolean;
}

interface AspectRatioPreset {
  id: string;
  name: string;
  ratio: number | null; // null for "Original"
  width?: number; // Fixed width for specific dimensions
  height?: number; // Fixed height for specific dimensions
  icon?: string;
}

const aspectRatioPresets: AspectRatioPreset[] = [
  { id: 'custom', name: 'Custom', ratio: null },
  { id: 'original', name: 'Original', ratio: null },
  { id: 'square', name: 'Square', ratio: 1, width: 1080, height: 1080 },
  { id: 'landscape', name: 'Landscape', ratio: 16 / 9, width: 1080, height: 608 }, // 1080 / (16/9) = 607.5, rounded to 608
  { id: 'portrait', name: 'Portrait', ratio: 9 / 16, width: 1080, height: 1920 }, // 1080 / (9/16) = 1920
  { id: 'ig-story', name: 'IG Story', ratio: 9 / 16, width: 1080, height: 1920 },
  { id: 'ig-post', name: 'IG Post', ratio: 1, width: 1080, height: 1080 },
  { id: 'ig-reel', name: 'IG Reel', ratio: 9 / 16, width: 1080, height: 1920 },
  { id: 'tiktok', name: 'TikTok Post', ratio: 9 / 16, width: 1080, height: 1920 },
  { id: 'ebay', name: 'Ebay', ratio: 1, width: 1080, height: 1080 },
  { id: 'etsy', name: 'Etsy', ratio: 1, width: 1080, height: 1080 },
  { id: 'fb-shop', name: 'FB Shop', ratio: 1, width: 1080, height: 1080 },
  { id: 'amazon', name: 'Amazon', ratio: 1, width: 1080, height: 1080 },
  { id: 'poshmark', name: 'Poshmark', ratio: 3 / 4, width: 1080, height: 1440 }, // 1080 / (3/4) = 1440
  { id: 'depop', name: 'Depop', ratio: 4 / 5, width: 1080, height: 1350 }, // 1080 / (4/5) = 1350
  { id: 'mercari', name: 'Mercari', ratio: 1, width: 1080, height: 1080 }
];

export function CropPanel({ selectedImages, onApplyCrop, onRotate, onFlip, onCustomCrop, customCropActive }: CropPanelProps) {
  const [activeTab, setActiveTab] = useState<'crop' | 'rotate'>('crop');
  const [selectedRatio, setSelectedRatio] = useState<string>('original');

  const handleCrop = (presetId: string) => {
    if (selectedImages.length === 0) return;
    
    setSelectedRatio(presetId);
    
    if (presetId === 'custom') {
      // Enable custom crop mode
      if (onCustomCrop) {
        onCustomCrop();
      }
    } else {
      // Apply preset crop
      const preset = aspectRatioPresets.find(p => p.id === presetId);
      if (preset && onApplyCrop) {
        // Pass aspect ratio and target dimensions if specified
        onApplyCrop(preset.ratio, preset.width, preset.height);
      }
    }
  };

  const handleRotate = (direction: '90' | '-90' | '180') => {
    if (selectedImages.length === 0 || !onRotate) return;
    onRotate(direction);
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    if (selectedImages.length === 0 || !onFlip) return;
    onFlip(direction);
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
          <h2 className="text-xl font-bold text-gray-900">Crop</h2>
          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {selectedImages.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select one or more images to apply crop ratios
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('crop')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === 'crop'
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Crop
          </button>
          <button
            onClick={() => setActiveTab('rotate')}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === 'rotate'
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            Rotate
          </button>
        </div>

        {/* Crop Tab */}
        {activeTab === 'crop' && (
          <div className="space-y-2">
            {aspectRatioPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleCrop(preset.id)}
                disabled={selectedImages.length === 0}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedRatio === preset.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {/* Icon representation */}
                <div className={cn(
                  "flex items-center justify-center bg-gray-100 rounded",
                  preset.ratio === null || preset.ratio === 1 
                    ? "w-10 h-10" 
                    : preset.ratio > 1
                    ? "w-12 h-8"
                    : "w-8 h-12"
                )}>
                  {preset.icon ? (
                    <span className="text-xs font-bold text-gray-600">{preset.icon}</span>
                  ) : (
                    <div className={cn(
                      "border-2 border-gray-400 rounded",
                      preset.ratio === null || preset.ratio === 1
                        ? "w-5 h-5"
                        : preset.ratio > 1
                        ? "w-6 h-4"
                        : "w-4 h-6"
                    )} />
                  )}
                </div>
                <span className="font-medium text-gray-900">{preset.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Rotate Tab */}
        {activeTab === 'rotate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4 p-6 bg-gray-50 rounded-lg">
              <button
                onClick={() => handleRotate('90')}
                disabled={selectedImages.length === 0}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw className="w-8 h-8 text-gray-700" />
                <span className="text-sm font-medium text-gray-900">Rotate 90°</span>
              </button>
              <button
                onClick={() => handleFlip('horizontal')}
                disabled={selectedImages.length === 0}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCw className="w-8 h-8 text-gray-700 scale-x-[-1]" />
                <span className="text-sm font-medium text-gray-900">Flip</span>
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Rotation and flipping will be applied to all selected images
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
