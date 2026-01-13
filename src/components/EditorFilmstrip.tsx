import { motion } from 'framer-motion';
import { Plus, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadedImage } from '@/hooks/useImageUpload';

interface EditorFilmstripProps {
  images: UploadedImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
}

export function EditorFilmstrip({
  images,
  selectedId,
  onSelect,
  onRemove,
  onAddMore,
}: EditorFilmstripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-3 py-4 px-6 bg-card border-t border-border"
    >
      {/* Add button */}
      <button
        onClick={onAddMore}
        className="w-14 h-14 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Thumbnails */}
      {images.map((image, index) => (
        <motion.div
          key={image.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="relative group"
        >
          <button
            onClick={() => onSelect(image.id)}
            className={cn(
              "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all",
              selectedId === image.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            )}
          >
            <img
              src={image.preview}
              alt={image.file.name}
              className="w-full h-full object-cover"
            />
            {/* Selected indicator */}
            {selectedId === image.id && (
              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <ChevronUp className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
            )}
          </button>
          
          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(image.id);
            }}
            className={cn(
              "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full",
              "bg-destructive text-destructive-foreground",
              "flex items-center justify-center",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-destructive/90"
            )}
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
