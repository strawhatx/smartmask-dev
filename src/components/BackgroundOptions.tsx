import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackgroundFillType, backgroundFillOptions } from '@/lib/presets';

interface BackgroundOptionsProps {
  selectedFill: BackgroundFillType;
  onSelect: (fill: BackgroundFillType) => void;
  solidColor: string;
  onSolidColorChange: (color: string) => void;
  gradientColors: [string, string];
  onGradientChange: (colors: [string, string]) => void;
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

export function BackgroundOptions({
  selectedFill,
  onSelect,
  solidColor,
  onSolidColorChange,
  gradientColors,
  onGradientChange,
}: BackgroundOptionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Background Fill</h3>
        <p className="text-sm text-muted-foreground">How to fill empty space</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {backgroundFillOptions.map((option) => {
          const isSelected = selectedFill === option.id;
          return (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <span className="text-2xl">{option.icon}</span>
              <div className="text-sm font-medium text-foreground">{option.name}</div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Color picker for solid */}
      {selectedFill === 'solid' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-muted-foreground">Pick a color</label>
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
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <label className="text-sm font-medium text-muted-foreground">Pick a gradient</label>
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
    </motion.div>
  );
}
