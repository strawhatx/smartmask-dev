import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  uploadedImage?: File;
  onClear?: () => void;
}

export function ImageUpload({ onImageUpload, uploadedImage, onClear }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onImageUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!uploadedImage ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            isDragging 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          )}
        >
          <Upload className={cn(
            "w-12 h-12 mb-4",
            isDragging ? "text-blue-500" : "text-gray-400"
          )} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload an image
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Drag and drop your image here, or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supports JPEG, PNG, and GIF
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded">
            <ImageIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{uploadedImage.name}</p>
            <p className="text-sm text-gray-500">
              {(uploadedImage.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
