import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Download, Info } from 'lucide-react';

interface CompressPanelProps {
  selectedImages: Array<{ id: string; file: File; url: string; selected: boolean }>;
}

type CompressionMode = 'quality' | 'size' | 'custom';

export function CompressPanel({ selectedImages }: CompressPanelProps) {
  const [mode, setMode] = useState<CompressionMode>('quality');
  const [quality, setQuality] = useState(80);
  const [targetSizeKB, setTargetSizeKB] = useState(500);

  const handleCompress = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to compress');
      return;
    }
    
    alert(`Compressing ${selectedImages.length} image(s) with ${mode} mode`);
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
          <h2 className="text-xl font-bold text-gray-900">Compress</h2>
          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {selectedImages.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select one or more images to compress
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Smart Compression</h3>
              <p className="text-sm text-blue-700">
                Reduce file size while maintaining visual quality. Perfect for web and social media.
              </p>
            </div>
          </div>
        </div>

        {/* Compression Mode Tabs */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Compression Mode</h3>
          <div className="space-y-2">
            <button
              onClick={() => setMode('quality')}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all text-left",
                mode === 'quality'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">High Quality</span>
                <span className="text-sm text-gray-500">Recommended</span>
              </div>
              <p className="text-sm text-gray-600">
                Maintain quality while reducing file size by 30-50%
              </p>
            </button>

            <button
              onClick={() => setMode('size')}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all text-left",
                mode === 'size'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">Target Size</span>
                <span className="text-sm text-gray-500">Max compression</span>
              </div>
              <p className="text-sm text-gray-600">
                Compress to a specific file size target
              </p>
            </button>

            <button
              onClick={() => setMode('custom')}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all text-left",
                mode === 'custom'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-900">Custom Quality</span>
                <span className="text-sm text-gray-500">Advanced</span>
              </div>
              <p className="text-sm text-gray-600">
                Set a custom quality level for compression
              </p>
            </button>
          </div>
        </div>

        {/* Custom Quality Slider */}
        {mode === 'custom' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-900">Quality Level</label>
              <span className="text-sm font-bold text-blue-600">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>
        )}

        {/* Target Size Input */}
        {mode === 'size' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <label className="text-sm font-semibold text-gray-900 mb-3 block">
              Target File Size
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={targetSizeKB}
                onChange={(e) => setTargetSizeKB(Number(e.target.value))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="50"
                max="5000"
              />
              <span className="text-sm font-medium text-gray-700">KB</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Images will be compressed to approximately {targetSizeKB}KB
            </p>
          </div>
        )}

        {/* Format Options */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Output Format</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
              Keep Original
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              Convert to WebP
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            WebP format offers better compression than JPG/PNG
          </p>
        </div>

        {/* Compress Button */}
        <button
          onClick={handleCompress}
          disabled={selectedImages.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          Compress {selectedImages.length > 0 ? `${selectedImages.length} ` : ''}Image
          {selectedImages.length !== 1 ? 's' : ''}
        </button>

        {/* Estimated Savings */}
        {selectedImages.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-1">Estimated Savings</h4>
            <p className="text-sm text-green-700">
              ~{mode === 'quality' ? '30-50' : mode === 'size' ? '50-70' : '40-60'}% file size reduction
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
