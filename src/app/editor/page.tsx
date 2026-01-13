'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { EditorToolbar, EditorTab } from '@/components/EditorToolbar';
import { EditorCanvas } from '@/components/EditorCanvas';
import { EditorSidebar } from '@/components/EditorSidebar';
import { EditorFilmstrip } from '@/components/EditorFilmstrip';
import { useImageUpload, UploadedImage } from '@/hooks/useImageUpload';
import { PlatformPreset, BackgroundFillType, platformPresets } from '@/lib/presets';
import { resizeImage, downloadBlob, generatePreviewUrl } from '@/lib/imageProcessor';

// Constants
const BRAND_NAME = 'Smart Resizer';
const BRAND_TAGLINE = 'AI-Powered Image Resizing';
const PROCESS_DEBOUNCE_MS = 300;
const DEFAULT_SOLID_COLOR = '#ffffff';
const DEFAULT_GRADIENT_COLORS: [string, string] = ['#667eea', '#764ba2'];
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp';

const ANIMATION_VARIANTS = {
  upload: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  editor: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  heroTitle: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  heroDescription: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.1 },
  },
} as const;

// Types
interface ProcessImageOptions {
  preset: PlatformPreset;
  backgroundFill: BackgroundFillType;
  solidColor: string;
  gradientColors: [string, string];
  smartCrop: boolean;
}

interface EditorState {
  selectedImageId: string | null;
  selectedPreset: PlatformPreset | null;
  backgroundFill: BackgroundFillType;
  solidColor: string;
  gradientColors: [string, string];
  smartCrop: boolean;
  activeTab: EditorTab;
  isProcessing: boolean;
  processedPreview: string | null;
  processedBlob: Blob | null;
}

// Components
const EditorHeader = () => (
  <header className="py-4 px-6">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">{BRAND_NAME}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{BRAND_TAGLINE}</p>
        </div>
      </div>
      <button className="px-4 py-2 text-sm font-medium rounded-lg gradient-accent text-accent-foreground shadow-accent-glow hover:opacity-90 transition-opacity">
        Go Pro
      </button>
    </div>
    </header>
);

interface UploadViewProps {
  onUpload: (files: File[]) => void;
  isLoading: boolean;
}

const UploadView = ({ onUpload, isLoading }: UploadViewProps) => (
  <motion.div
    key="upload"
    {...ANIMATION_VARIANTS.upload}
    className="flex-1 flex flex-col gradient-hero"
  >
    <EditorHeader />

    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
        <motion.h1
          {...ANIMATION_VARIANTS.heroTitle}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground"
        >
          Resize images for <span className="text-gradient-primary">social media</span>
        </motion.h1>
        <motion.p
          {...ANIMATION_VARIANTS.heroDescription}
          className="text-lg md:text-xl text-muted-foreground"
        >
          AI-powered smart cropping, auto background fill, and instant presets for Instagram,
          YouTube, TikTok, and more.
        </motion.p>
      </div>

      <ImageUploader onUpload={onUpload} isLoading={isLoading} className="max-w-2xl w-full" />
    </main>
  </motion.div>
);

interface EditorViewProps {
  images: UploadedImage[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onAddMoreImages: () => void;
  state: EditorState;
  onStateChange: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  onDownload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EditorView = ({
  images,
  selectedImageId,
  onSelectImage,
  onRemoveImage,
  onAddMoreImages,
  state,
  onStateChange,
  onDownload,
  fileInputRef,
  onFileInputChange,
}: EditorViewProps) => {
  const selectedImage = useMemo(
    () => images.find((img) => img.id === selectedImageId),
    [images, selectedImageId]
  );

  return (
    <motion.div
      key="editor"
      {...ANIMATION_VARIANTS.editor}
      className="flex-1 flex flex-col h-screen"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        onChange={onFileInputChange}
        className="hidden"
        aria-label="Add more images"
      />

      <EditorToolbar
        activeTab={state.activeTab}
        onTabChange={(tab) => onStateChange('activeTab', tab)}
        onDownload={onDownload}
        canDownload={!!state.processedBlob}
        isProcessing={state.isProcessing}
      />

      <div className="flex-1 flex overflow-hidden">
        {selectedImage && state.selectedPreset && (
          <EditorCanvas
            imageSrc={selectedImage.preview}
            preset={state.selectedPreset}
            backgroundFill={state.backgroundFill}
            solidColor={state.solidColor}
            gradientColors={state.gradientColors}
            isProcessing={state.isProcessing}
            processedPreview={state.processedPreview}
          />
        )}

        <EditorSidebar
          activeTab={state.activeTab}
          selectedFill={state.backgroundFill}
          onSelectFill={(fill) => onStateChange('backgroundFill', fill)}
          solidColor={state.solidColor}
          onSolidColorChange={(color) => onStateChange('solidColor', color)}
          gradientColors={state.gradientColors}
          onGradientChange={(colors) => onStateChange('gradientColors', colors)}
          smartCrop={state.smartCrop}
          onSmartCropChange={(crop) => onStateChange('smartCrop', crop)}
          selectedPreset={state.selectedPreset}
          onSelectPreset={(preset) => onStateChange('selectedPreset', preset)}
        />
      </div>

      <EditorFilmstrip
        images={images}
        selectedId={selectedImageId}
        onSelect={onSelectImage}
        onRemove={onRemoveImage}
        onAddMore={onAddMoreImages}
      />
    </motion.div>
  );
};

// Main Component
const EditorPage = () => {
  const { images, isLoading, uploadImages, removeImage } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<EditorState>({
    selectedImageId: null,
    selectedPreset: platformPresets[0] ?? null,
    backgroundFill: 'transparent',
    solidColor: DEFAULT_SOLID_COLOR,
    gradientColors: DEFAULT_GRADIENT_COLORS,
    smartCrop: true,
    activeTab: 'platform',
    isProcessing: false,
    processedPreview: null,
    processedBlob: null,
  });

  const selectedImage = useMemo(
    () => images.find((img) => img.id === state.selectedImageId),
    [images, state.selectedImageId]
  );

  // Auto-select first image when uploaded
  useEffect(() => {
    if (images.length > 0 && !state.selectedImageId) {
      setState((prev) => ({ ...prev, selectedImageId: images[0].id }));
    }
    if (images.length === 0) {
      setState((prev) => ({ ...prev, selectedImageId: null }));
    }
  }, [images, state.selectedImageId]);

  // Process image when settings change
  const processImage = useCallback(async () => {
    if (!selectedImage || !state.selectedPreset) return;

    // Clean up previous preview URL before processing
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      const options: ProcessImageOptions = {
        preset: state.selectedPreset,
        backgroundFill: state.backgroundFill,
        solidColor: state.solidColor,
        gradientColors: state.gradientColors,
        smartCrop: state.smartCrop,
      };

      const blob = await resizeImage(selectedImage.file, options);
      const previewUrl = generatePreviewUrl(blob);
      previewUrlRef.current = previewUrl;

      setState((prev) => ({
        ...prev,
        processedPreview: previewUrl,
        processedBlob: blob,
        isProcessing: false,
      }));
    } catch (error) {
      console.error('Error processing image:', error);
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [
    selectedImage,
    state.selectedPreset,
    state.backgroundFill,
    state.solidColor,
    state.gradientColors,
    state.smartCrop,
  ]);

  // Debounced image processing
  useEffect(() => {
    if (selectedImage && state.selectedPreset) {
      const timeoutId = setTimeout(processImage, PROCESS_DEBOUNCE_MS);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedImage, state.selectedPreset, processImage]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleStateChange = useCallback(
    <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleDownload = useCallback(() => {
    if (!state.processedBlob || !state.selectedPreset || !selectedImage) return;

    const extension = state.backgroundFill === 'transparent' ? 'png' : 'jpg';
    const baseName = selectedImage.file.name.split('.')[0];
    const filename = `${baseName}_${state.selectedPreset.id}.${extension}`;

    downloadBlob(state.processedBlob, filename);
  }, [state.processedBlob, state.selectedPreset, state.backgroundFill, selectedImage]);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        uploadImages(Array.from(e.target.files));
      }
      e.target.value = '';
    },
    [uploadImages]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {images.length === 0 ? (
          <UploadView onUpload={uploadImages} isLoading={isLoading} />
        ) : (
          <EditorView
            images={images}
            selectedImageId={state.selectedImageId}
            onSelectImage={(id) => handleStateChange('selectedImageId', id)}
            onRemoveImage={removeImage}
            onAddMoreImages={handleAddMore}
            state={state}
            onStateChange={handleStateChange}
            onDownload={handleDownload}
            fileInputRef={fileInputRef}
            onFileInputChange={handleFileInputChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditorPage;
