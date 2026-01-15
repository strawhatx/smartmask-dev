import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Download, FileImage, Info } from 'lucide-react';
import { ImageFormat } from '@/lib/imageProcessor';

interface ConvertPanelProps {
  selectedImages: Array<{ id: string; file: File; url: string; selected: boolean }>;
  onApplyConvert?: (format: ImageFormat, maintainQuality?: boolean) => void;
}

interface FormatOption {
  id: ImageFormat;
  name: string;
  extension: string;
  description: string;
  recommended?: boolean;
}

const formats: FormatOption[] = [
  {
    id: 'jpg',
    name: 'JPG',
    extension: '.jpg',
    description: 'Best for photos, smaller file size',
    recommended: true
  },
  {
    id: 'png',
    name: 'PNG',
    extension: '.png',
    description: 'Supports transparency, lossless quality'
  },
  {
    id: 'webp',
    name: 'WebP',
    extension: '.webp',
    description: 'Modern format, great compression',
    recommended: true
  },
  {
    id: 'gif',
    name: 'GIF',
    extension: '.gif',
    description: 'For animations, limited colors'
  },
  {
    id: 'bmp',
    name: 'BMP',
    extension: '.bmp',
    description: 'Uncompressed, large file size'
  },
  {
    id: 'tiff',
    name: 'TIFF',
    extension: '.tiff',
    description: 'Professional, high quality'
  }
];

export function ConvertPanel({ selectedImages }: ConvertPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>('jpg');
  const [maintainQuality, setMaintainQuality] = useState(true);

  const handleConvert = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to convert');
      return;
    }
    
    if (onApplyConvert) {
      onApplyConvert(selectedFormat, maintainQuality);
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
          <h2 className="text-xl font-bold text-gray-900">Convert</h2>
          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {selectedImages.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select one or more images to convert formats
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Format Conversion</h3>
              <p className="text-sm text-blue-700">
                Convert images between different formats. Each format has unique benefits.
              </p>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Output Format</h3>
          <div className="space-y-2">
            {formats.map(format => (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                disabled={selectedImages.length === 0}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedFormat === format.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    selectedFormat === format.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
                  )}>
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{format.name}</span>
                      <span className="text-xs text-gray-500">{format.extension}</span>
                      {format.recommended && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{format.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quality Options */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversion Options</h3>
          <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={maintainQuality}
              onChange={(e) => setMaintainQuality(e.target.checked)}
              className="mt-0.5 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900 mb-1">Maintain Quality</div>
              <p className="text-sm text-gray-600">
                Preserve original image quality during conversion (larger file size)
              </p>
            </div>
          </label>
        </div>

        {/* Format Info Cards */}
        <div className="mb-6 space-y-3">
          {selectedFormat === 'jpg' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">About JPG</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Best for photographs and images with many colors</li>
                <li>• Lossy compression (some quality loss)</li>
                <li>• Does not support transparency</li>
                <li>• Widely supported across all platforms</li>
              </ul>
            </div>
          )}
          
          {selectedFormat === 'png' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">About PNG</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Supports transparency (alpha channel)</li>
                <li>• Lossless compression (no quality loss)</li>
                <li>• Larger file size than JPG</li>
                <li>• Best for graphics, logos, and screenshots</li>
              </ul>
            </div>
          )}

          {selectedFormat === 'webp' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">About WebP</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Modern format with superior compression</li>
                <li>• Supports both lossy and lossless compression</li>
                <li>• Supports transparency like PNG</li>
                <li>• 25-35% smaller than JPG at same quality</li>
              </ul>
            </div>
          )}

          {selectedFormat === 'gif' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">About GIF</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Supports animation</li>
                <li>• Limited to 256 colors</li>
                <li>• Supports transparency</li>
                <li>• Not recommended for photos</li>
              </ul>
            </div>
          )}

          {selectedFormat === 'bmp' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">About BMP</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Uncompressed bitmap format</li>
                <li>• Very large file sizes</li>
                <li>• No quality loss</li>
                <li>• Primarily used in Windows applications</li>
              </ul>
            </div>
          )}

          {selectedFormat === 'tiff' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">About TIFF</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Professional photography format</li>
                <li>• Supports layers and high bit depth</li>
                <li>• Lossless compression</li>
                <li>• Large file sizes</li>
              </ul>
            </div>
          )}
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={selectedImages.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Download className="w-5 h-5" />
          Convert to {formats.find(f => f.id === selectedFormat)?.name || 'Format'}
        </button>

        {/* Output Preview */}
        {selectedImages.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Output Files</h4>
            <div className="space-y-1">
              {selectedImages.slice(0, 3).map((img, index) => (
                <p key={index} className="text-sm text-gray-600 truncate">
                  {img.file.name.replace(/\.[^/.]+$/, '')}{formats.find(f => f.id === selectedFormat)?.extension}
                </p>
              ))}
              {selectedImages.length > 3 && (
                <p className="text-sm text-gray-500">
                  + {selectedImages.length - 3} more file{selectedImages.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
