import { useRef, useState, useCallback } from 'react';
import ColorThief from 'colorthief';
import { Upload, ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { RGB } from '@/utils/colorUtils';

interface ImageUploaderProps {
  onColorsExtracted: (colors: RGB[], allColors: RGB[], imageData: string | null) => void;
}

export function ImageUploader({ onColorsExtracted }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractColors = useCallback((imgElement: HTMLImageElement, imageDataUrl: string) => {
    const colorThief = new ColorThief();
    try {
      const allColors = colorThief.getPalette(imgElement, 10) as RGB[];
      const gradientColors = allColors.slice(0, 6);
      onColorsExtracted(gradientColors, allColors, imageDataUrl);
    } catch (error) {
      console.error('Failed to extract colors:', error);
    }
  }, [onColorsExtracted]);

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = result;
      img.onload = () => extractColors(img, result);
    };
    reader.readAsDataURL(file);
  }, [extractColors]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Card
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        cursor-pointer transition-all duration-300 border-2 border-dashed h-full min-h-[500px]
        flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm
        ${isDragging 
          ? 'border-violet-500 bg-violet-500/10' 
          : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
        }
      `}
    >
      <div className="p-8 text-center w-full">
        {preview ? (
          <div className="space-y-4">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-xl shadow-2xl object-cover"
            />
            <p className="text-sm text-zinc-500">Click or drop to change image</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
              {isDragging ? (
                <Upload className="w-10 h-10 text-violet-400" />
              ) : (
                <ImageIcon className="w-10 h-10 text-violet-400" />
              )}
            </div>
            <div>
              <p className="text-xl font-medium text-zinc-200">Drop an image here</p>
              <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </Card>
  );
}
