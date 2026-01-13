import { motion } from 'framer-motion';
import { Check, Wand2, MinusCircle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundFillType, backgroundFillOptions, PlatformPreset, platformPresets } from '@/lib/presets';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { EditorTab } from './EditorToolbar';

interface EditorSidebarProps {
  activeTab: EditorTab;
  selectedFill: BackgroundFillType;
  onSelectFill: (fill: BackgroundFillType) => void;
  solidColor: string;
  onSolidColorChange: (color: string) => void;
  gradientColors: [string, string];
  onGradientChange: (colors: [string, string]) => void;
  smartCrop: boolean;
  onSmartCropChange: (enabled: boolean) => void;
  selectedPreset: PlatformPreset | null;
  onSelectPreset: (preset: PlatformPreset) => void;
}

const presetColors = [
  '#ffffff', '#f8f9fa', '#e9ecef', '#212529', '#000000',
  '#0ea5e9', '#8b5cf6', '#ec4899', '#f97316', '#22c55e',
];

const presetGradients: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a8edea', '#fed6e3'],
];

export function EditorSidebar({
  activeTab,
  selectedFill,
  onSelectFill,
  solidColor,
  onSolidColorChange,
  gradientColors,
  onGradientChange,
  smartCrop,
  onSmartCropChange,
  selectedPreset,
  onSelectPreset,
}: EditorSidebarProps) {
  const renderBackgroundPanel = () => (
    <div className="space-y-6">
      {/* Background Type Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Fill Type</h4>
        <div className="grid grid-cols-2 gap-2">
          {backgroundFillOptions.map((option) => {
            const isSelected = selectedFill === option.id;
            return (
              <button
                key={option.id}
                onClick={() => onSelectFill(option.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <span className="text-xl">{option.icon}</span>
                <span className="text-xs font-medium text-foreground">{option.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color picker for solid */}
      {selectedFill === 'solid' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <h4 className="text-sm font-medium text-muted-foreground">Pick a color</h4>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => onSolidColorChange(color)}
                className={cn(
                  "w-8 h-8 rounded-lg border-2 transition-all",
                  solidColor === color ? "border-primary scale-110" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={solidColor}
              onChange={(e) => onSolidColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0"
            />
          </div>
        </motion.div>
      )}

      {/* Gradient picker */}
      {selectedFill === 'gradient' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <h4 className="text-sm font-medium text-muted-foreground">Pick a gradient</h4>
          <div className="grid grid-cols-3 gap-2">
            {presetGradients.map((gradient, index) => (
              <button
                key={index}
                onClick={() => onGradientChange(gradient)}
                className={cn(
                  "h-10 rounded-lg border-2 transition-all",
                  gradientColors[0] === gradient[0] && gradientColors[1] === gradient[1]
                    ? "border-primary scale-105"
                    : "border-transparent hover:scale-105"
                )}
                style={{
                  background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderDesignPanel = () => (
    <div className="space-y-6">
      {/* Smart Crop Feature Card */}
      <div className="p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Smart Crop</h4>
            <p className="text-xs text-muted-foreground">AI-powered composition</p>
          </div>
        </div>

        {/* Erase/Restore Toggle Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-primary bg-primary/5">
            <MinusCircle className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary">Erase</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-border hover:border-primary/30">
            <PlusCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Restore</span>
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Brush Size</span>
          </div>
          <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-sm font-medium text-foreground">Magic Brush</span>
          <Switch checked={smartCrop} onCheckedChange={onSmartCropChange} />
        </div>
      </div>

      {/* Platform Presets */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Platform Size</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {platformPresets.slice(0, 6).map((preset) => {
            const isSelected = selectedPreset?.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-xl">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {preset.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {preset.width} × {preset.height}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCutoutPanel = () => (
    <div className="space-y-6">
      <div className="p-4 rounded-xl border border-border bg-muted/30">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Magic Brush</h4>
            <p className="text-xs text-muted-foreground">Easily Erase or Restore Anything</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-primary bg-primary/5">
            <MinusCircle className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-primary">Erase</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-border hover:border-primary/30">
            <PlusCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Restore</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Brush Size</span>
          </div>
          <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-sm font-medium text-foreground">Magic Brush</span>
          <Switch checked={smartCrop} onCheckedChange={onSmartCropChange} />
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/30 text-muted-foreground hover:text-foreground transition-colors">
        <Wand2 className="w-4 h-4" />
        <span className="text-sm font-medium">Erase distractions</span>
        <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Open</span>
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'cutout':
        return renderCutoutPanel();
      case 'background':
        return renderBackgroundPanel();
      case 'design':
        return renderDesignPanel();
      case 'effects':
      case 'adjust':
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wand2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-1">Coming Soon</h4>
            <p className="text-sm text-muted-foreground">This feature is under development</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-80 bg-card border-l border-border p-4 overflow-y-auto"
    >
      {renderContent()}
    </motion.div>
  );
}
