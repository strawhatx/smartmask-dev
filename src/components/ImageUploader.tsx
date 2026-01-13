import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
  isLoading?: boolean;
  className?: string;
}

export function ImageUploader({ onUpload, isLoading, className }: ImageUploaderProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    disabled: isLoading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300",
          "p-8 md:p-12 text-center",
          isDragActive && !isDragReject && "border-primary bg-primary/5 scale-[1.02]",
          isDragReject && "border-destructive bg-destructive/5",
          !isDragActive && "border-border hover:border-primary/50 hover:bg-muted/50",
          isLoading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        
        {/* Decorative gradient background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br from-primary/10 to-primary/20",
              "group-hover:from-primary/20 group-hover:to-primary/30 transition-colors"
            )}
          >
            {isLoading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-foreground">
              {isDragActive ? 'Drop your images here' : 'Upload your images'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select • JPEG, PNG, GIF, WebP
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <ImageIcon className="w-4 h-4" />
            <span>Supports multiple files</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
