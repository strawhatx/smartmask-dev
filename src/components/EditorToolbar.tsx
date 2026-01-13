import { motion } from 'framer-motion';
import { Monitor, Crop, Layers, Undo2, Redo2, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type EditorTab = 'platform' | 'crop' | 'background';

interface EditorToolbarProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onDownload: () => void;
  canDownload: boolean;
  isProcessing: boolean;
}

const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
  { id: 'platform', label: 'Platform', icon: <Monitor className="w-4 h-4" /> },
  { id: 'crop', label: 'Crop', icon: <Crop className="w-4 h-4" /> },
  { id: 'background', label: 'Background & Auto Padding', icon: <Layers className="w-4 h-4" /> },
];

export function EditorToolbar({ activeTab, onTabChange, onDownload, canDownload, isProcessing }: EditorToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-6 py-3 bg-background border-b border-border"
    >
      {/* Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Undo2 className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Redo2 className="w-5 h-5" />
        </button>
        
        <Button
          variant="gradient"
          onClick={onDownload}
          disabled={!canDownload || isProcessing}
          className="ml-2"
        >
          {isProcessing ? 'Processing...' : 'Download'}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
