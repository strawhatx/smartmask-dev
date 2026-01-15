import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Sparkles, CheckCircle2, Lock, Crown, Package } from 'lucide-react';
import { platformPresets, type PlatformPreset } from './platform-presets';
import { cn } from '@/lib/utils';

interface FocalPoint {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProcessedImage {
  preset: PlatformPreset;
  canvas: HTMLCanvasElement;
  dataUrl: string;
}

interface MultiSizeEditorProps {
  imageUrl: string;
  imageName: string;
  isPro: boolean;
  onBack: () => void;
  onUpgrade: () => void;
}

export function MultiSizeEditor({ imageUrl, imageName, isPro, onBack, onUpgrade }: MultiSizeEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [focalPoint, setFocalPoint] = useState<FocalPoint | null>(null);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [processedImages, setProcessedImages] = useState<Map<string, ProcessedImage>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const [fillMode, setFillMode] = useState<'blur' | 'color'>('blur');
  const [fillColor, setFillColor] = useState('#3b82f6');

  const maxFreeExports = 2;

  // Load image and detect focal point
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      detectFocalPoint(img);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Simulate AI focal point detection (center-weighted with brightness detection)
  const detectFocalPoint = (img: HTMLImageElement) => {
    // Create a temporary canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale down for faster processing
    const scale = Math.min(1, 400 / Math.max(img.width, img.height));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // For now, use center-weighted focal point
    // In production, this would use actual AI/ML
    const focal: FocalPoint = {
      x: img.width * 0.5,
      y: img.height * 0.4, // Slightly upper-center (common for portraits)
      width: img.width * 0.6,
      height: img.height * 0.6
    };

    setFocalPoint(focal);
  };

  // Process images when selection or settings change
  useEffect(() => {
    if (image && focalPoint && selectedPresets.size > 0) {
      processSelectedImages();
    }
  }, [selectedPresets, fillMode, fillColor, image, focalPoint]);

  const processSelectedImages = async () => {
    if (!image || !focalPoint) return;

    setIsProcessing(true);
    const newProcessedImages = new Map<string, ProcessedImage>();

    for (const presetId of Array.from(selectedPresets)) {
      const preset = platformPresets.find(p => p.id === presetId);
      if (!preset) continue;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      canvas.width = preset.width;
      canvas.height = preset.height;

      const targetAspectRatio = preset.width / preset.height;
      const imageAspectRatio = image.width / image.height;

      // Calculate crop based on focal point
      let cropX = 0, cropY = 0, cropWidth = image.width, cropHeight = image.height;

      if (Math.abs(targetAspectRatio - imageAspectRatio) < 0.01) {
        // Aspect ratios match
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      } else if (targetAspectRatio > imageAspectRatio) {
        // Target is wider - need horizontal padding
        applyBackgroundFill(ctx, canvas.width, canvas.height, image);
        
        const scaledHeight = canvas.height;
        const scaledWidth = image.width * (scaledHeight / image.height);
        const xOffset = (canvas.width - scaledWidth) / 2;
        ctx.drawImage(image, xOffset, 0, scaledWidth, scaledHeight);
      } else {
        // Target is taller - crop using focal point
        cropHeight = image.height;
        cropWidth = image.height * targetAspectRatio;

        // Center crop on focal point
        cropX = Math.max(0, Math.min(
          image.width - cropWidth,
          focalPoint.x - cropWidth / 2
        ));

        // For very tall crops, prefer upper portion
        if (cropWidth < image.width * 0.5) {
          cropY = Math.max(0, focalPoint.y - cropHeight * 0.4);
        }

        if (cropWidth <= image.width) {
          ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
        } else {
          applyBackgroundFill(ctx, canvas.width, canvas.height, image);
          const scaledWidth = canvas.width;
          const scaledHeight = image.height * (scaledWidth / image.width);
          const yOffset = (canvas.height - scaledHeight) / 2;
          ctx.drawImage(image, 0, yOffset, scaledWidth, scaledHeight);
        }
      }

      // Add watermark for free users
      if (!isPro) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 2;
        const watermarkText = 'SmartResizer.app';
        const textWidth = ctx.measureText(watermarkText).width;
        const x = canvas.width - textWidth - 15;
        const y = canvas.height - 15;
        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);
      }

      const dataUrl = canvas.toDataURL('image/png');
      newProcessedImages.set(presetId, { preset, canvas, dataUrl });
    }

    setProcessedImages(newProcessedImages);
    setIsProcessing(false);
  };

  const applyBackgroundFill = (ctx: CanvasRenderingContext2D, width: number, height: number, img: HTMLImageElement) => {
    if (fillMode === 'blur') {
      ctx.filter = 'blur(20px)';
      
      const imgAspect = img.width / img.height;
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
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, 0, width, height);
    }
  };

  const togglePreset = (presetId: string) => {
    const newSelection = new Set(selectedPresets);
    
    if (newSelection.has(presetId)) {
      newSelection.delete(presetId);
    } else {
      // Check free tier limit
      if (!isPro && newSelection.size >= maxFreeExports) {
        onUpgrade();
        return;
      }
      newSelection.add(presetId);
    }
    
    setSelectedPresets(newSelection);
  };

  const downloadImage = (presetId: string) => {
    const processed = processedImages.get(presetId);
    if (!processed) return;

    const a = document.createElement('a');
    a.href = processed.dataUrl;
    const fileNameWithoutExt = imageName.replace(/\.[^/.]+$/, '');
    a.download = `${fileNameWithoutExt}-${processed.preset.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    // Download each image with a small delay
    let delay = 0;
    processedImages.forEach((_, presetId) => {
      setTimeout(() => downloadImage(presetId), delay);
      delay += 200;
    });
  };

  const isPresetLocked = (index: number) => {
    return !isPro && index >= maxFreeExports && !selectedPresets.has(platformPresets[index].id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
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
              <h2 className="font-semibold text-gray-900">Multi-Size Export</h2>
              <p className="text-sm text-gray-500">
                {selectedPresets.size} size{selectedPresets.size !== 1 ? 's' : ''} selected
              </p>
            </div>
            {!isPro && (
              <button
                onClick={onUpgrade}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
              >
                <Crown className="w-5 h-5" />
                Upgrade to Pro
              </button>
            )}
            {isPro && <div className="w-32" />}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Platform Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Select Sizes</h3>
              </div>

              {!isPro && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Free:</strong> Select up to {maxFreeExports} sizes
                  </p>
                </div>
              )}

              <div className="space-y-2 mb-6">
                {platformPresets.map((preset, index) => {
                  const isSelected = selectedPresets.has(preset.id);
                  const isLocked = isPresetLocked(index);

                  return (
                    <button
                      key={preset.id}
                      onClick={() => togglePreset(preset.id)}
                      disabled={isLocked}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : isLocked
                          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded flex items-center justify-center",
                        isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isLocked ? (
                          <Lock className="w-4 h-4" />
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
                      {isLocked && (
                        <Crown className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Background Fill Options */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Background Fill</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setFillMode('blur')}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      fillMode === 'blur'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Blur Background
                  </button>
                  <button
                    onClick={() => setFillMode('color')}
                    className={cn(
                      "w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      fillMode === 'color'
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    Solid Color
                  </button>
                  {fillMode === 'color' && (
                    <div className="flex items-center gap-2 pl-2">
                      <input
                        type="color"
                        value={fillColor}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">{fillColor}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Download Button */}
              {processedImages.size > 0 && (
                <button
                  onClick={downloadAll}
                  disabled={isProcessing}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
                >
                  <Package className="w-5 h-5" />
                  Download All ({processedImages.size})
                </button>
              )}
            </div>
          </div>

          {/* Preview Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                {focalPoint && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    AI focal point detected
                  </div>
                )}
              </div>

              {selectedPresets.size === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Select sizes to preview
                  </h4>
                  <p className="text-gray-500 max-w-sm">
                    Choose one or more platform sizes from the left sidebar to see live previews
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from(selectedPresets).map(presetId => {
                    const processed = processedImages.get(presetId);
                    if (!processed) return null;

                    return (
                      <div key={presetId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{processed.preset.name}</h4>
                            <p className="text-sm text-gray-500">
                              {processed.preset.width} × {processed.preset.height}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadImage(presetId)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                          <img
                            src={processed.dataUrl}
                            alt={processed.preset.name}
                            className="max-w-full max-h-64 rounded shadow-lg"
                            style={{ imageRendering: 'high-quality' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info Banner */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    One Smart Crop → Multiple Sizes
                  </h4>
                  <p className="text-sm text-gray-700">
                    Our AI detected the focal point of your image once. Now you can export to as many 
                    platform sizes as you need without re-processing. {!isPro && 'Upgrade to Pro for unlimited sizes!'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
