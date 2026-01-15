import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, CheckCircle2, Download, Sparkles, Plus, X } from 'lucide-react';
import { platformPresets } from './platform-presets';

interface ResizePanelProps {
  selectedImages: Array<{ id: string; file: File; url: string; selected: boolean }>;
}

interface CustomSize {
  id: string;
  width: number;
  height: number;
  name: string;
}

export function ResizePanel({ selectedImages }: ResizePanelProps) {
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [customSizes, setCustomSizes] = useState<CustomSize[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  const hasImages = selectedImages.length > 0;

  const togglePreset = (presetId: string) => {
    if (!hasImages) return;
    
    const newSelection = new Set(selectedPresets);

    if (newSelection.has(presetId)) {
      newSelection.delete(presetId);
    } else {
      newSelection.add(presetId);
    }

    setSelectedPresets(newSelection);
  };

  const toggleCustomSize = (customId: string) => {
    if (!hasImages) return;
    setCustomSizes(prev => prev.filter(size => size.id !== customId));
  };

  const addCustomSize = () => {
    if (!hasImages) return;
    
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);

    if (width > 0 && height > 0) {
      const newSize: CustomSize = {
        id: `custom-${Date.now()}`,
        width,
        height,
        name: `Custom (${width}×${height})`
      };
      setCustomSizes(prev => [...prev, newSize]);
      setCustomWidth('');
      setCustomHeight('');
      setShowCustomInput(false);
    }
  };

  const handleExport = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to resize');
      return;
    }
    const totalSizes = selectedPresets.size + customSizes.length;
    if (totalSizes === 0) {
      alert('Please select at least one size to export');
      return;
    }
    // Would trigger actual export logic
    alert(`Exporting ${selectedImages.length} image(s) to ${totalSizes} size(s)`);
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
          <h2 className="text-xl font-bold text-gray-900">Resize</h2>
          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {selectedImages.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select one or more images to export to multiple sizes
            </p>
          </div>
        )}

        {/* Feature Highlight */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Multi-Size Export</h3>
              <p className="text-sm text-gray-700">
                Select multiple platform sizes and export all at once. AI smart crop runs once!
              </p>
            </div>
          </div>
        </div>

        {/* Platform Size Selection */}
        <div className={cn("space-y-2 mb-4", !hasImages && "opacity-50 pointer-events-none")}>
          {platformPresets.map((preset) => {
            const isSelected = selectedPresets.has(preset.id);

            return (
              <button
                key={preset.id}
                onClick={() => togglePreset(preset.id)}
                disabled={!hasImages}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                  !hasImages && "cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded flex items-center justify-center",
                  isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                )}>
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-current rounded" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {preset.width} × {preset.height}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Sizes */}
        {customSizes.map((customSize) => {
          const isSelected = true; // Custom sizes are always "selected" until removed
          return (
            <div
              key={customSize.id}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border-2 mb-2",
                "border-blue-500 bg-blue-50"
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-blue-500 text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {customSize.name}
                </div>
                <div className="text-xs text-gray-500">
                  {customSize.width} × {customSize.height}
                </div>
              </div>
              <button
                onClick={() => toggleCustomSize(customSize.id)}
                disabled={!hasImages}
                className="flex-shrink-0 p-1 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          );
        })}

        {/* Add Custom Size */}
        {showCustomInput ? (
          <div className={cn("mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50", !hasImages && "opacity-50")}>
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Custom Size</span>
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomWidth('');
                    setCustomHeight('');
                  }}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="1080"
                    disabled={!hasImages}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="1920"
                    disabled={!hasImages}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                onClick={addCustomSize}
                disabled={!hasImages || !customWidth || !customHeight || parseInt(customWidth) <= 0 || parseInt(customHeight) <= 0}
                className="w-full mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Size
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            disabled={!hasImages}
            className={cn(
              "w-full mb-4 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-600",
              !hasImages && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Custom Size</span>
          </button>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={selectedImages.length === 0 || (selectedPresets.size === 0 && customSizes.length === 0)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          Export to {selectedPresets.size + customSizes.length || 0} Size{(selectedPresets.size + customSizes.length) !== 1 ? 's' : ''}
        </button>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">How it works:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• AI detects the focal point once</li>
            <li>• Smart crop applied to all selected sizes</li>
            <li>• Download all sizes at once</li>
            <li>• Select unlimited sizes or create custom dimensions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
