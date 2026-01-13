import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatformPreset, platformPresets } from '@/lib/presets';

interface PresetSelectorProps {
  selectedPreset: PlatformPreset | null;
  onSelect: (preset: PlatformPreset) => void;
}

export function PresetSelector({ selectedPreset, onSelect }: PresetSelectorProps) {
  // Group presets by platform
  const platforms = [...new Set(platformPresets.map(p => p.platform))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Choose Platform</h3>
        <p className="text-sm text-muted-foreground">Select the social media size preset</p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {platform}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {platformPresets
                .filter(p => p.platform === platform)
                .map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <motion.button
                      key={preset.id}
                      onClick={() => onSelect(preset)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      )}
                    >
                      <span className="text-2xl">{preset.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">
                          {preset.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {preset.width} × {preset.height}
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
