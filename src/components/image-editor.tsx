import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Sparkles, Palette, Droplet } from 'lucide-react';
import { type PlatformPreset } from './platform-presets';
import { DownloadModal } from './download-modal';
import { cn } from '@/lib/utils';

interface ImageEditorProps {
  imageUrl: string;
  preset: PlatformPreset;
  imageName: string;
  isPro: boolean;
  onBack: () => void;
}

type FillMode = 'blur' | 'color' | 'gradient';
type CropMode = 'smart' | 'center' | 'manual';

export function ImageEditor({ imageUrl, preset, imageName, isPro, onBack }: ImageEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fillMode, setFillMode] = useState<FillMode>('blur');
  const [cropMode, setCropMode] = useState<CropMode>('smart');
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [blurAmount, setBlurAmount] = useState(20);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Process image when parameters change
  useEffect(() => {
    if (image && canvasRef.current) {
      processImage();
    }
  }, [image, preset, fillMode, fillColor, blurAmount, cropMode]);

  const processImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);

    // Set canvas to target dimensions
    canvas.width = preset.width;
    canvas.height = preset.height;

    const targetAspectRatio = preset.width / preset.height;
    const imageAspectRatio = image.width / image.height;

    // Calculate crop region
    let cropX = 0, cropY = 0, cropWidth = image.width, cropHeight = image.height;

    if (Math.abs(targetAspectRatio - imageAspectRatio) < 0.01) {
      // Aspect ratios match, just scale
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else if (imageAspectRatio > targetAspectRatio) {
      // Image is wider - need to crop width or add height padding
      const neededHeight = image.width / targetAspectRatio;
      
      if (neededHeight <= image.height) {
        // Crop height
        cropWidth = image.width;
        cropHeight = image.width / targetAspectRatio;
        
        // Smart crop: try to keep center or upper portion
        if (cropMode === 'smart') {
          cropY = Math.min(image.height * 0.25, (image.height - cropHeight) / 2);
        } else {
          cropY = (image.height - cropHeight) / 2;
        }
        
        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      } else {
        // Add background fill
        applyBackgroundFill(ctx, canvas.width, canvas.height);
        
        // Center the image
        const scaledHeight = canvas.height;
        const scaledWidth = image.width * (scaledHeight / image.height);
        const xOffset = (canvas.width - scaledWidth) / 2;
        
        ctx.drawImage(image, xOffset, 0, scaledWidth, scaledHeight);
      }
    } else {
      // Image is taller - need to crop height or add width padding
      const neededWidth = image.height * targetAspectRatio;
      
      if (neededWidth <= image.width) {
        // Crop width
        cropHeight = image.height;
        cropWidth = image.height * targetAspectRatio;
        
        // Smart crop: try to keep center
        if (cropMode === 'smart') {
          cropX = Math.max(0, (image.width - cropWidth) / 2);
        } else {
          cropX = (image.width - cropWidth) / 2;
        }
        
        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      } else {
        // Add background fill
        applyBackgroundFill(ctx, canvas.width, canvas.height);
        
        // Center the image
        const scaledWidth = canvas.width;
        const scaledHeight = image.height * (scaledWidth / image.width);
        const yOffset = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(image, 0, yOffset, scaledWidth, scaledHeight);
      }
    }

    setIsProcessing(false);
  };

  const applyBackgroundFill = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (fillMode === 'blur') {
      // Draw blurred version as background
      ctx.filter = `blur(${blurAmount}px)`;
      
      // Fill entire canvas with scaled image
      const imgAspect = image!.width / image!.height;
      const canvasAspect = width / height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(image!, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
      
      // Add slight darkening overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);
    } else if (fillMode === 'color') {
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, width, height);
    } else if (fillMode === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, fillColor);
      gradient.addColorStop(1, adjustColorBrightness(fillColor, -30));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const adjustColorBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const downloadCanvas = document.createElement('canvas');
    const ctx = downloadCanvas.getContext('2d');
    if (!ctx) return;

    // Set download canvas size
    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;

    // Copy the main canvas
    ctx.drawImage(canvas, 0, 0);

    // Add watermark for free users
    if (!isPro) {
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      const watermarkText = 'SmartResizer.app';
      const textWidth = ctx.measureText(watermarkText).width;
      const x = downloadCanvas.width - textWidth - 20;
      const y = downloadCanvas.height - 20;
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
    }
    
    // Create download link
    downloadCanvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileNameWithoutExt = imageName.replace(/\.[^/.]+$/, '');
      a.download = `${fileNameWithoutExt}-${preset.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <div className="text-center">
              <h2 className="font-semibold text-gray-900">{preset.name}</h2>
              <p className="text-sm text-gray-500">{preset.width} × {preset.height}</p>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Crop Mode */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Crop Mode</h3>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setCropMode('smart')}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg font-medium transition-colors text-left",
                    cropMode === 'smart'
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <div>Smart Crop (AI)</div>
                  <div className="text-xs opacity-80">Auto-detect focus area</div>
                </button>
                <button
                  onClick={() => setCropMode('center')}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg font-medium transition-colors text-left",
                    cropMode === 'center'
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <div>Center Crop</div>
                  <div className="text-xs opacity-80">Keep center of image</div>
                </button>
              </div>
            </div>

            {/* Background Fill */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Background Fill</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setFillMode('blur')}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg font-medium transition-colors text-left",
                    fillMode === 'blur'
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Blur Background
                </button>
                {fillMode === 'blur' && (
                  <div className="pl-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blur Amount: {blurAmount}px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}
                <button
                  onClick={() => setFillMode('color')}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg font-medium transition-colors text-left",
                    fillMode === 'color'
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Solid Color
                </button>
                <button
                  onClick={() => setFillMode('gradient')}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg font-medium transition-colors text-left",
                    fillMode === 'gradient'
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  Gradient
                </button>
                {(fillMode === 'color' || fillMode === 'gradient') && (
                  <div className="pl-2 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Color:</label>
                    <input
                      type="color"
                      value={fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadClick}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              {isPro ? 'Download HD' : 'Download (Free)'}
            </button>

            {!isPro && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Free version:</strong> Downloads may include a small watermark. 
                  Upgrade to Pro for HD quality and batch processing.
                </p>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 min-h-[500px]">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[600px] shadow-xl rounded"
                  style={{ imageRendering: 'high-quality' }}
                />
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                {imageName} → {preset.width} × {preset.height}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownload={handleDownload}
        isPro={isPro}
        imageName={`${preset.name} (${preset.width}×${preset.height})`}
      />
    </div>
  );
}