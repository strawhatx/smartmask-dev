import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformPreset, BackgroundFillType } from '@/lib/presets';

interface EditorCanvasProps {
  imageSrc: string;
  preset: PlatformPreset | null;
  backgroundFill: BackgroundFillType;
  solidColor: string;
  gradientColors: [string, string];
  isProcessing?: boolean;
  processedPreview?: string | null;
}

export function EditorCanvas({
  imageSrc,
  preset,
  backgroundFill,
  solidColor,
  gradientColors,
  isProcessing,
  processedPreview,
}: EditorCanvasProps) {
  const [scale, setScale] = useState(1);

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
      default:
        return {};
    }
  };

  // Checkerboard pattern for transparent background
  const checkerboardStyle = {
    backgroundImage: `
      linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
      linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
      linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    backgroundColor: '#f5f5f5',
  };

  const aspectRatio = preset ? preset.width / preset.height : 16 / 9;

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 relative overflow-hidden">
      {/* Checkerboard background for the entire canvas area */}
      <div 
        className="absolute inset-0"
        style={checkerboardStyle}
      />

      {/* Canvas container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-2xl w-full"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.2s ease',
        }}
      >
        <div
          className="relative w-full rounded-lg overflow-hidden shadow-lg"
          style={{
            aspectRatio: aspectRatio,
            maxHeight: '70vh',
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
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={imageSrc}
              alt="Original"
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </motion.div>

      {/* Zoom button */}
      <button 
        onClick={() => setScale(s => s === 1 ? 1.5 : 1)}
        className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
      >
        <ZoomIn className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
