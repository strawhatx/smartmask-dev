import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full py-4 px-4 md:px-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">
              Smart Resizer
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              AI-Powered Image Resizing
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"
          >
            Pricing
          </a>
          <button className="px-4 py-2 text-sm font-medium rounded-lg gradient-accent text-accent-foreground shadow-accent-glow hover:opacity-90 transition-opacity">
            Go Pro
          </button>
        </nav>
      </div>
    </motion.header>
  );
}
