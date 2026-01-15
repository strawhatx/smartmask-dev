import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Download, Info } from 'lucide-react';

interface CompressPanelProps {
  selectedImages: Array<{ id: string; file: File; url: string; selected: boolean; isUpscaled?: boolean }>;
  onApplyCompress?: (mode: 'quality' | 'size' | 'custom', quality?: number, targetSizeKB?: number, outputFormat?: 'original' | 'webp') => void;
}

type CompressionMode = 'quality' | 'size' | 'custom';

export function CompressPanel({ selectedImages, onApplyCompress }: CompressPanelProps) {
  const [mode, setMode] = useState<CompressionMode>('quality');
  const [quality, setQuality] = useState(80);
  const [targetSizeKB, setTargetSizeKB] = useState(500);
  const [outputFormat, setOutputFormat] = useState<'original' | 'webp'>('original');
  const [imageDimensions, setImageDimensions] = useState<Array<{ width: number; height: number; size: number }>>([]);

  // Load image dimensions
  useEffect(() => {
    const loadDimensions = async () => {
      const dims = await Promise.all(
        selectedImages.map(img => 
          new Promise<{ width: number; height: number; size: number }>((resolve) => {
            const image = new Image();
            image.onload = () => {
              resolve({
                width: image.width,
                height: image.height,
                size: img.file.size
              });
            };
            image.onerror = () => resolve({ width: 0, height: 0, size: img.file.size });
            image.src = img.url;
          })
        )
      );
      setImageDimensions(dims);
    };

    if (selectedImages.length > 0) {
      loadDimensions();
    } else {
      setImageDimensions([]);
    }
  }, [selectedImages]);

  // Calculate estimated compression
  const compressionPreview = useMemo(() => {
    if (imageDimensions.length === 0) return null;

    const totalOriginalSize = imageDimensions.reduce((sum, dim) => sum + dim.size, 0);
    
    let estimatedSize: number;
    if (mode === 'size' && targetSizeKB) {
      estimatedSize = targetSizeKB * 1024 * selectedImages.length;
    } else if (mode === 'custom' && quality !== undefined) {
      // Estimate based on quality (lower quality = smaller size)
      const compressionRatio = quality / 100;
      estimatedSize = totalOriginalSize * (0.3 + (1 - compressionRatio) * 0.5);
    } else if (mode === 'quality') {
      // High quality mode: 30-50% reduction
      estimatedSize = totalOriginalSize * 0.6;
    } else {
      estimatedSize = totalOriginalSize * 0.6;
    }

    // WebP typically offers 25-35% better compression
    if (outputFormat === 'webp') {
      estimatedSize = estimatedSize * 0.7;
    }

    const reduction = ((totalOriginalSize - estimatedSize) / totalOriginalSize) * 100;
    
    return {
      originalSize: totalOriginalSize,
      estimatedSize: Math.round(estimatedSize),
      reduction: Math.round(reduction)
    };
  }, [imageDimensions, mode, quality, targetSizeKB, outputFormat, selectedImages.length]);

  const hasUpscaledImages = selectedImages.some(img => img.isUpscaled);

  const handleCompress = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to compress');
      return;
    }
    
    if (hasUpscaledImages) {
      alert('Cannot compress upscaled images. Please deselect upscaled images first.');
      return;
    }
    
    if (onApplyCompress) {
      onApplyCompress(
        mode,
        mode === 'custom' ? quality : undefined,
        mode === 'size' ? targetSizeKB : undefined,
        outputFormat
      );
    }
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

        {/* Warning if images are upscaled */}
        {selectedImages.length > 0 && selectedImages.some(img => img.isUpscaled) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium mb-1">Cannot compress upscaled images</p>
            <p className="text-xs text-red-700">
              Some selected images have been upscaled. Please deselect upscaled images or upscale different images. Compression and upscaling are mutually exclusive.
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
            <button 
              onClick={() => setOutputFormat('original')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                outputFormat === 'original'
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Keep Original
            </button>
            <button 
              onClick={() => setOutputFormat('webp')}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-colors",
                outputFormat === 'webp'
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
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
          disabled={selectedImages.length === 0 || hasUpscaledImages}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          Compress {selectedImages.length > 0 ? `${selectedImages.length} ` : ''}Image
          {selectedImages.length !== 1 ? 's' : ''}
        </button>

        {/* Compression Preview */}
        {compressionPreview && selectedImages.length > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-2">Compression Preview</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Original Size:</span>
                <span className="font-semibold text-green-900">
                  {(compressionPreview.originalSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Estimated Size:</span>
                <span className="font-semibold text-green-900">
                  {(compressionPreview.estimatedSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-green-200">
                <span className="text-green-700 font-medium">Size Reduction:</span>
                <span className="font-bold text-green-900">
                  {compressionPreview.reduction}% ({((compressionPreview.originalSize - compressionPreview.estimatedSize) / 1024).toFixed(1)} KB saved)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
