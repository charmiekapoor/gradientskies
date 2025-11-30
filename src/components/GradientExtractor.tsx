import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, Sun, Cloud, CloudRain } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { GradientPreview } from '@/components/GradientPreview';
import { Button } from '@/components/ui/button';
import {
  applyHarmonyMode,
  type RGB,
  type GradientType,
} from '@/utils/colorUtils';



interface GradientExtractorProps {
  onBack: () => void;
}

export function GradientExtractor({ onBack }: GradientExtractorProps) {
  const [colors, setColors] = useState<RGB[] | null>(null);
  const [positions] = useState<number[]>([0, 20, 40, 60, 80, 100]);
  const [direction] = useState('to right');
  const [gradientType, setGradientType] = useState<GradientType>('mesh');
  const [blur, setBlur] = useState<number>(20);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current_weather=true')
      .then(res => res.json())
      .then(data => {
        const code = data.current_weather?.weathercode || 0;
        let condition = 'sunny';
        if (code >= 61 && code <= 67) condition = 'rainy';
        else if (code >= 1 && code <= 3) condition = 'cloudy';
        setWeather({
          temp: Math.round(data.current_weather?.temperature || 0),
          condition,
        });
      })
      .catch(() => {});
  }, []);

  const { gradient, cssCode } = useMemo(() => {
    if (!colors) return { gradient: '', cssCode: '' };
    
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

  const handleColorsExtracted = useCallback((gradientColors: RGB[], _allColors: RGB[], _imageData: string | null) => {
    const processedColors = applyHarmonyMode(gradientColors, 'original');
    setColors(processedColors);
    setGradientType('mesh');
    setBlur(20);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Subtle background gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, rgba(${colors?.[0]?.join(',') || '99,102,241'}, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(${colors?.[5]?.join(',') || '236,72,153'}, 0.1) 0%, transparent 50%)`
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
            Generate your gradient ✨
          </h1>
          <p className="text-zinc-400">
            Upload an image to extract beautiful gradients
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Upload */}
          <ImageUploader onColorsExtracted={handleColorsExtracted} />
          
          {/* Right: Gradient Preview */}
          <GradientPreview 
            gradient={gradient} 
            cssCode={cssCode} 
            colors={colors}
            gradientType={gradientType}
            blur={blur}
            hasImage={colors !== null}
          />
        </div>
        
        <footer className="mt-12 text-center text-sm text-zinc-600 flex items-center justify-center gap-2">
          <span>Built with love in a balcony in blr</span>
          {weather && (
            <span className="flex items-center gap-1">
              <span>•</span>
              {weather.condition === 'sunny' && <Sun className="w-4 h-4" />}
              {weather.condition === 'cloudy' && <Cloud className="w-4 h-4" />}
              {weather.condition === 'rainy' && <CloudRain className="w-4 h-4" />}
              <span>{weather.temp}°C</span>
            </span>
          )}
        </footer>
      </div>
    </div>
  );
}

