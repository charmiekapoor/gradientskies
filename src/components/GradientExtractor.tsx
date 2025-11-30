import { useState, useMemo, useCallback, useEffect } from 'react';
import { Palette, Sparkles, Box, ArrowLeft } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { GradientPreview } from '@/components/GradientPreview';
import { GradientControls } from '@/components/GradientControls';
import { PixelatedPreview } from '@/components/PixelatedPreview';
import { CubePreview } from '@/components/CubePreview';
import { Button } from '@/components/ui/button';
import {
  applyHarmonyMode,
  generateRandomGradient,
  type RGB,
  type HarmonyMode,
  type GradientDirection,
  type GradientType,
} from '@/utils/colorUtils';

type ViewMode = 'gradient' | 'pixelated' | 'cube';

const DEFAULT_COLORS: RGB[] = [
  [99, 102, 241],
  [129, 92, 246],
  [168, 85, 247],
  [192, 75, 243],
  [217, 70, 239],
  [236, 72, 153],
];

const DEFAULT_ALL_COLORS: RGB[] = [
  ...DEFAULT_COLORS,
  [244, 63, 94],
  [251, 146, 60],
  [250, 204, 21],
  [74, 222, 128],
];

interface GradientExtractorProps {
  onBack: () => void;
}

export function GradientExtractor({ onBack }: GradientExtractorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('gradient');
  const [extractedColors, setExtractedColors] = useState<RGB[]>(DEFAULT_COLORS);
  const [allColors, setAllColors] = useState<RGB[]>(DEFAULT_ALL_COLORS);
  const [colors, setColors] = useState<RGB[]>(DEFAULT_COLORS);
  const [positions, setPositions] = useState<number[]>([0, 20, 40, 60, 80, 100]);
  const [direction, setDirection] = useState<GradientDirection>('to right');
  const [gradientType, setGradientType] = useState<GradientType>('mesh');
  const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('original');
  const [blur, setBlur] = useState<number>(20);
  const [imageData, setImageData] = useState<string | null>(null);

  // Auto-randomize on first load
  useEffect(() => {
    handleRandomize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { gradient, cssCode } = useMemo(() => {
    const colorStops = colors
      .map((c, i) => `rgb(${c.join(', ')}) ${positions[i]}%`)
      .join(', ');

    if (gradientType === 'radial') {
      return {
        gradient: `radial-gradient(circle, ${colorStops})`,
        cssCode: `radial-gradient(circle, ${colorStops})`,
      };
    }

    if (gradientType === 'mesh') {
      return {
        gradient: `linear-gradient(${direction}, ${colorStops})`,
        cssCode: `/* Mesh gradient with noise - 6 colors */`,
      };
    }

    return {
      gradient: `linear-gradient(${direction}, ${colorStops})`,
      cssCode: `linear-gradient(${direction}, ${colorStops})`,
    };
  }, [colors, positions, direction, gradientType]);

  const handleColorsExtracted = useCallback((gradientColors: RGB[], paletteColors: RGB[], imgData: string | null) => {
    setExtractedColors(gradientColors);
    setAllColors(paletteColors);
    setImageData(imgData);
    const processedColors = applyHarmonyMode(gradientColors, harmonyMode);
    setColors(processedColors);
    setPositions([0, 20, 40, 60, 80, 100]);
    setGradientType('mesh');
    setBlur(20);
  }, [harmonyMode]);

  const handleHarmonyModeChange = useCallback((newMode: HarmonyMode) => {
    setHarmonyMode(newMode);
    const processedColors = applyHarmonyMode(extractedColors, newMode);
    setColors(processedColors);
  }, [extractedColors]);

  const handleColorsChange = useCallback((newColors: RGB[]) => {
    setColors(newColors);
  }, []);

  const handleRandomize = useCallback(() => {
    const randomColors = generateRandomGradient();
    setExtractedColors(randomColors);
    setColors(randomColors);
    setAllColors([...randomColors, ...randomColors.slice(0, 4).map(c => [
      Math.min(255, c[0] + 30),
      Math.min(255, c[1] + 20),
      Math.min(255, c[2] + 40),
    ] as RGB)]);
    setHarmonyMode('original');
    setPositions([0, 20, 40, 60, 80, 100]);
    setGradientType('mesh');
    setBlur(15 + Math.floor(Math.random() * 20));
    setImageData(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle background gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, rgba(${colors[0]?.join(',') || '99,102,241'}, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(${colors[5]?.join(',') || '236,72,153'}, 0.1) 0%, transparent 50%)`
        }}
      />
      
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Gallery
        </Button>

        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Gradient Extractor
          </h1>
          <p className="text-zinc-400 mb-6">
            Upload an image or randomize to create beautiful gradients
          </p>
          
          {/* Mode Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-zinc-800">
            <Button
              variant={viewMode === 'gradient' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('gradient')}
              className={`gap-2 ${viewMode === 'gradient' ? '' : 'text-zinc-400 hover:text-white'}`}
            >
              <Sparkles className="w-4 h-4" />
              Gradient
            </Button>
            <Button
              variant={viewMode === 'pixelated' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('pixelated')}
              className={`gap-2 ${viewMode === 'pixelated' ? '' : 'text-zinc-400 hover:text-white'}`}
            >
              <Palette className="w-4 h-4" />
              Pixelated
            </Button>
            <Button
              variant={viewMode === 'cube' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cube')}
              className={`gap-2 ${viewMode === 'cube' ? '' : 'text-zinc-400 hover:text-white'}`}
            >
              <Box className="w-4 h-4" />
              3D Cube
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Image Upload */}
          <ImageUploader onColorsExtracted={handleColorsExtracted} />
          
          {/* Right: Preview based on mode */}
          {viewMode === 'gradient' && (
            <GradientPreview 
              gradient={gradient} 
              cssCode={cssCode} 
              colors={colors}
              gradientType={gradientType}
              blur={blur}
            />
          )}
          {viewMode === 'pixelated' && (
            <PixelatedPreview colors={allColors} imageData={imageData} />
          )}
          {viewMode === 'cube' && (
            <CubePreview colors={allColors} imageData={imageData} />
          )}
        </div>

        {/* Controls only shown in gradient mode */}
        {viewMode === 'gradient' && (
          <GradientControls
            colors={colors}
            positions={positions}
            direction={direction}
            gradientType={gradientType}
            harmonyMode={harmonyMode}
            blur={blur}
            onColorsChange={handleColorsChange}
            onPositionsChange={setPositions}
            onDirectionChange={setDirection}
            onGradientTypeChange={setGradientType}
            onHarmonyModeChange={handleHarmonyModeChange}
            onBlurChange={setBlur}
            onRandomize={handleRandomize}
          />
        )}
        
        <footer className="mt-12 text-center text-sm text-zinc-600">
          Built with React, Tailwind CSS & shadcn/ui
        </footer>
      </div>
    </div>
  );
}

