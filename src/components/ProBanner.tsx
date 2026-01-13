import { motion } from 'framer-motion';
import { Sparkles, Crown, Zap, Download, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProBannerProps {
  className?: string;
}

export function ProBanner({ className }: ProBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 md:p-8",
        "bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5",
        "border border-primary/20",
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-accent uppercase tracking-wide">
              Pro Features
            </span>
          </div>
          
          <h3 className="text-xl md:text-2xl font-bold text-foreground">
            Unlock the full power
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>HD Downloads</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImagePlus className="w-4 h-4 text-primary" />
              <span>Batch Processing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Smart Crop</span>
            </div>
          </div>
        </div>

        <Button variant="gradient-accent" size="lg" className="shrink-0">
          <Crown className="w-4 h-4" />
          Upgrade to Pro
        </Button>
      </div>
    </motion.div>
  );
}
