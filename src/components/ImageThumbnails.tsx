import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadedImage } from '@/hooks/useImageUpload';

interface ImageThumbnailsProps {
  images: UploadedImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ImageThumbnails({
  images,
  selectedId,
  onSelect,
  onRemove,
}: ImageThumbnailsProps) {
  if (images.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-2"
    >
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
              "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
              selectedId === image.id
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent hover:border-primary/50"
            )}
          >
            <img
              src={image.preview}
              alt={image.file.name}
              className="w-full h-full object-cover"
            />
          </button>
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
