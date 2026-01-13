import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { ProBanner } from '@/components/ProBanner';
import { EditorToolbar, EditorTab } from '@/components/EditorToolbar';
import { EditorCanvas } from '@/components/EditorCanvas';
import { EditorSidebar } from '@/components/EditorSidebar';
import { EditorFilmstrip } from '@/components/EditorFilmstrip';
import { useImageUpload } from '@/hooks/useImageUpload';
import { PlatformPreset, BackgroundFillType, platformPresets } from '@/lib/presets';
import { resizeImage, downloadBlob, generatePreviewUrl } from '@/lib/imageProcessor';

const Index = () => {
  const { images, isLoading, uploadImages, removeImage, clearImages } = useImageUpload();
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PlatformPreset | null>(platformPresets[0]);
  const [backgroundFill, setBackgroundFill] = useState<BackgroundFillType>('transparent');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#667eea', '#764ba2']);
  const [smartCrop, setSmartCrop] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPreview, setProcessedPreview] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('cutout');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedImage = images.find(img => img.id === selectedImageId);

  // Auto-select first image when uploaded
  useEffect(() => {
    if (images.length > 0 && !selectedImageId) {
      setSelectedImageId(images[0].id);
    }
    if (images.length === 0) {
      setSelectedImageId(null);
    }
  }, [images, selectedImageId]);

  // Process image when settings change
  const processImage = useCallback(async () => {
    if (!selectedImage || !selectedPreset) return;

    setIsProcessing(true);
    try {
      const blob = await resizeImage(selectedImage.file, {
        preset: selectedPreset,
        backgroundFill,
        solidColor,
        gradientColors,
        smartCrop,
      });
      
      if (processedPreview) {
        URL.revokeObjectURL(processedPreview);
      }
      
      const previewUrl = generatePreviewUrl(blob);
      setProcessedPreview(previewUrl);
      setProcessedBlob(blob);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, selectedPreset, backgroundFill, solidColor, gradientColors, smartCrop]);

  useEffect(() => {
    if (selectedImage && selectedPreset) {
      const debounce = setTimeout(processImage, 300);
      return () => clearTimeout(debounce);
    }
  }, [selectedImage, selectedPreset, backgroundFill, solidColor, gradientColors, smartCrop, processImage]);

  const handleDownload = () => {
    if (!processedBlob || !selectedPreset || !selectedImage) return;
    
    const extension = backgroundFill === 'transparent' ? 'png' : 'jpg';
    const filename = `${selectedImage.file.name.split('.')[0]}_${selectedPreset.id}.${extension}`;
    downloadBlob(processedBlob, filename);
  };

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadImages(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {images.length === 0 ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col gradient-hero"
          >
            {/* Header */}
            <header className="py-4 px-6">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-foreground">Smart Resizer</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">AI-Powered Image Resizing</p>
                  </div>
                </div>
                <button className="px-4 py-2 text-sm font-medium rounded-lg gradient-accent text-accent-foreground shadow-accent-glow hover:opacity-90 transition-opacity">
                  Go Pro
                </button>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
              <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground"
                >
                  Resize images for{' '}
                  <span className="text-gradient-primary">social media</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg md:text-xl text-muted-foreground"
                >
                  AI-powered smart cropping, auto background fill, and instant presets
                  for Instagram, YouTube, TikTok, and more.
                </motion.p>
              </div>

              <ImageUploader onUpload={uploadImages} isLoading={isLoading} className="max-w-2xl w-full" />

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
              >
                {[
                  { icon: '🎯', title: 'Smart Crop', description: 'AI detects faces and key objects' },
                  { icon: '🎨', title: 'Auto Background', description: 'Blur, solid, or gradient fills' },
                  { icon: '⚡', title: 'Instant Presets', description: 'One-click platform sizing' },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <ProBanner className="max-w-4xl mx-auto mt-12" />
            </main>

            {/* Footer */}
            <footer className="py-8 px-4 text-center text-sm text-muted-foreground">
              <p>
                Free to use • No signup required •{' '}
                <a href="#" className="text-primary hover:underline">Go Pro</a>{' '}
                for HD & batch processing
              </p>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-screen"
          >
            {/* Hidden file input for adding more images */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Top Toolbar */}
            <EditorToolbar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onDownload={handleDownload}
              canDownload={!!processedBlob}
              isProcessing={isProcessing}
            />

            {/* Main Editor Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Canvas */}
              {selectedImage && (
                <EditorCanvas
                  imageSrc={selectedImage.preview}
                  preset={selectedPreset}
                  backgroundFill={backgroundFill}
                  solidColor={solidColor}
                  gradientColors={gradientColors}
                  isProcessing={isProcessing}
                  processedPreview={processedPreview}
                />
              )}

              {/* Right Sidebar */}
              <EditorSidebar
                activeTab={activeTab}
                selectedFill={backgroundFill}
                onSelectFill={setBackgroundFill}
                solidColor={solidColor}
                onSolidColorChange={setSolidColor}
                gradientColors={gradientColors}
                onGradientChange={setGradientColors}
                smartCrop={smartCrop}
                onSmartCropChange={setSmartCrop}
                selectedPreset={selectedPreset}
                onSelectPreset={setSelectedPreset}
              />
            </div>

            {/* Bottom Filmstrip */}
            <EditorFilmstrip
              images={images}
              selectedId={selectedImageId}
              onSelect={setSelectedImageId}
              onRemove={removeImage}
              onAddMore={handleAddMore}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
