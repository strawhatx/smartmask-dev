import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformPreset } from '@/lib/presets';
import { BackgroundFillType } from '@/lib/presets';

interface ImagePreviewProps {
  imageSrc: string;
  preset: PlatformPreset | null;
  backgroundFill: BackgroundFillType;
  solidColor: string;
  gradientColors: [string, string];
  isProcessing?: boolean;
  processedPreview?: string | null;
}

export function ImagePreview({
  imageSrc,
  preset,
  backgroundFill,
  solidColor,
  gradientColors,
  isProcessing,
  processedPreview,
}: ImagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate display aspect ratio
  const aspectRatio = preset ? preset.width / preset.height : 1;

  const getBackgroundStyle = () => {
    switch (backgroundFill) {
      case 'blur':
        return { backgroundColor: '#e5e5e5' };
      case 'solid':
        return { backgroundColor: solidColor };
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
        };
      case 'transparent':
        return {
          backgroundImage: `
            linear-gradient(45deg, #ccc 25%, transparent 25%),
            linear-gradient(-45deg, #ccc 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #ccc 75%),
            linear-gradient(-45deg, transparent 75%, #ccc 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        };
      default:
        return {};
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Preview</h3>
          {preset && (
            <p className="text-sm text-muted-foreground">
              {preset.width} × {preset.height} • {preset.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.25))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-border bg-muted/30"
        style={{ paddingBottom: `${Math.min(100 / aspectRatio, 100)}%` }}
      >
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center p-4",
            "transition-transform duration-300"
          )}
          style={{ transform: `scale(${scale})` }}
        >
          <div
            className="relative w-full h-full max-w-full max-h-full rounded-lg overflow-hidden shadow-lg"
            style={{
              aspectRatio: aspectRatio,
              maxHeight: '100%',
              ...getBackgroundStyle(),
            }}
          >
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : processedPreview ? (
              <img
                src={processedPreview}
                alt="Processed preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={imageSrc}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {!preset && (
        <p className="text-sm text-muted-foreground text-center">
          Select a platform preset to see the final result
        </p>
      )}
    </motion.div>
  );
}
