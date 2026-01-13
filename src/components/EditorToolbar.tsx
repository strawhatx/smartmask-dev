import { motion } from 'framer-motion';
import { Scissors, ImageIcon, Sparkles, SlidersHorizontal, LayoutGrid, Undo2, Redo2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type EditorTab = 'cutout' | 'background' | 'effects' | 'adjust' | 'design';

interface EditorToolbarProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
  onDownload: () => void;
  canDownload: boolean;
  isProcessing: boolean;
}

const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
  { id: 'cutout', label: 'Cutout', icon: <Scissors className="w-4 h-4" /> },
  { id: 'background', label: 'Background', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'effects', label: 'Effects', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'adjust', label: 'Adjust', icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'design', label: 'Design', icon: <LayoutGrid className="w-4 h-4" /> },
];

export function EditorToolbar({ activeTab, onTabChange, onDownload, canDownload, isProcessing }: EditorToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-4 py-3 bg-card border-b border-border"
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
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
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
