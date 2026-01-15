import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, Download, Sparkles, Info, Zap, Crown } from 'lucide-react';

interface UpscalerPanelProps {
  selectedImages: Array<{ id: string; file: File; url: string; selected: boolean }>;
}

type UpscaleLevel = '2x' | '4x' | '8x';

interface UpscaleOption {
  id: UpscaleLevel;
  multiplier: string;
  name: string;
  description: string;
  isPro?: boolean;
}

const upscaleOptions: UpscaleOption[] = [
  {
    id: '2x',
    multiplier: '2×',
    name: 'Double Resolution',
    description: 'Perfect for social media and web'
  },
  {
    id: '4x',
    multiplier: '4×',
    name: 'Quadruple Resolution',
    description: 'Great for print and high-res displays',
    isPro: true
  },
  {
    id: '8x',
    multiplier: '8×',
    name: 'Ultra Resolution',
    description: 'Professional print quality',
    isPro: true
  }
];

export function UpscalerPanel({ selectedImages }: UpscalerPanelProps) {
  const [selectedLevel, setSelectedLevel] = useState<UpscaleLevel>('2x');
  const [enhanceDetails, setEnhanceDetails] = useState(true);
  const [removeNoise, setRemoveNoise] = useState(true);
  const [sharpenEdges, setSharpenEdges] = useState(false);

  const handleUpscale = () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to upscale');
      return;
    }
    
    const option = upscaleOptions.find(o => o.id === selectedLevel);
    alert(`Upscaling ${selectedImages.length} image(s) to ${option?.multiplier} resolution`);
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
          <h2 className="text-xl font-bold text-gray-900">AI Upscaler</h2>
          {selectedImages.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {selectedImages.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Select one or more images to upscale
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">AI-Powered Upscaling</h3>
              <p className="text-sm text-purple-700">
                Use advanced AI to increase image resolution while maintaining quality and detail.
              </p>
            </div>
          </div>
        </div>

        {/* Upscale Level Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Upscale Level</h3>
          <div className="space-y-2">
            {upscaleOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedLevel(option.id)}
                disabled={selectedImages.length === 0}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedLevel === option.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold",
                    selectedLevel === option.id 
                      ? "bg-purple-600 text-white" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    {option.multiplier}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{option.name}</span>
                      {option.isPro && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                          <Crown className="w-3 h-3" />
                          PRO
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Enhancement Options */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">AI Enhancements</h3>
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={enhanceDetails}
                onChange={(e) => setEnhanceDetails(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">Enhance Details</span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">
                  AI recovers and enhances fine details
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={removeNoise}
                onChange={(e) => setRemoveNoise(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">Remove Noise</span>
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Reduce grain and artifacts during upscaling
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={sharpenEdges}
                onChange={(e) => setSharpenEdges(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">Sharpen Edges</span>
                </div>
                <p className="text-sm text-gray-600">
                  Make edges and text more crisp
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Resolution Preview */}
        {selectedImages.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Resolution Preview</h4>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>Original: 1920 × 1080 px</p>
                  <p className="font-semibold">
                    Upscaled ({upscaleOptions.find(o => o.id === selectedLevel)?.multiplier}): 
                    {selectedLevel === '2x' && ' 3840 × 2160 px'}
                    {selectedLevel === '4x' && ' 7680 × 4320 px'}
                    {selectedLevel === '8x' && ' 15360 × 8640 px'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upscale Button */}
        <button
          onClick={handleUpscale}
          disabled={selectedImages.length === 0}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Sparkles className="w-5 h-5" />
          Upscale to {upscaleOptions.find(o => o.id === selectedLevel)?.multiplier}
        </button>

        {/* Processing Time Estimate */}
        {selectedImages.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Estimated Processing Time</h4>
            <p className="text-sm text-gray-600">
              ~{selectedImages.length * (selectedLevel === '2x' ? 10 : selectedLevel === '4x' ? 30 : 60)} seconds
            </p>
          </div>
        )}

        {/* Pro Upgrade Banner */}
        {(selectedLevel === '4x' || selectedLevel === '8x') && (
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold mb-1">Pro Feature</h4>
                <p className="text-sm opacity-90 mb-3">
                  {selectedLevel === '4x' ? '4×' : '8×'} upscaling requires a Pro subscription
                </p>
                <button className="px-4 py-1.5 bg-white text-orange-600 text-sm font-semibold rounded hover:bg-gray-100 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Use Cases */}
        <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-900 mb-3">Perfect For:</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Enlarging photos for print</li>
            <li>• Improving low-resolution images</li>
            <li>• Creating high-DPI assets</li>
            <li>• Upscaling product photos</li>
            <li>• Preparing images for large displays</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
