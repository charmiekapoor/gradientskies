import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudSun } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { GradientPreview } from '@/components/GradientPreview';
import {
  applyHarmonyMode,
  type RGB,
  type GradientType,
} from '@/utils/colorUtils';

function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="w-5 h-5" />;
  if (code <= 3) return <CloudSun className="w-5 h-5" />;
  if (code <= 48) return <CloudFog className="w-5 h-5" />;
  if (code <= 67) return <CloudRain className="w-5 h-5" />;
  if (code <= 77) return <CloudSnow className="w-5 h-5" />;
  if (code <= 82) return <CloudRain className="w-5 h-5" />;
  if (code <= 99) return <CloudLightning className="w-5 h-5" />;
  return <Cloud className="w-5 h-5" />;
}



interface GradientExtractorProps {
  onBack: () => void;
}

export function GradientExtractor({ onBack }: GradientExtractorProps) {
  const [colors, setColors] = useState<RGB[] | null>(null);
  const [allColors, setAllColors] = useState<RGB[] | null>(null);
  const [activeColorIndices, setActiveColorIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [gradientType, setGradientType] = useState<GradientType>('mesh');
  const [blur, setBlur] = useState<number>(20);
  const [noise, setNoise] = useState<number>(50);
  const [weather, setWeather] = useState<{ temperature: number; weatherCode: number } | null>(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,weather_code')
      .then(res => res.json())
      .then(data => {
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
        });
      })
      .catch(() => {});
  }, []);



  const handleColorsExtracted = useCallback((gradientColors: RGB[], extractedAllColors: RGB[]) => {
    const processedColors = applyHarmonyMode(gradientColors, 'original');
    setColors(processedColors);
    setAllColors(extractedAllColors.slice(0, 6));
    setActiveColorIndices([0, 1, 2, 3, 4, 5].filter(i => i < extractedAllColors.length));
    setGradientType('mesh');
    setBlur(20);
    setNoise(50);
  }, []);

  const handleColorToggle = useCallback((index: number) => {
    setActiveColorIndices(prev => {
      if (prev.includes(index)) {
        // Minimum 1 color must stay selected
        if (prev.length <= 1) return prev;
        return prev.filter(i => i !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  }, []);

  const [randomSeed, setRandomSeed] = useState(0);
  
  const handleRandomize = useCallback(() => {
    setRandomSeed(prev => prev + 1);
  }, []);

  const activeColors = allColors?.filter((_, i) => activeColorIndices.includes(i)) || colors;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Calm Night Sky Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% 20%, rgba(56, 100, 180, 0.15) 0%, rgba(30, 58, 108, 0.08) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Secondary soft glow */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 30% 80%, rgba(45, 85, 150, 0.06) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 80% 30%, rgba(70, 120, 200, 0.04) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-10 flex items-center gap-2 px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Go back to gallery"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Gallery</span>
        </button>

        <header className="text-center mb-8">
          <h1 className="text-[36px] font-medium tracking-tight text-white">
            Generate beautiful gradients of your sky pictures.
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image Upload */}
          <ImageUploader onColorsExtracted={handleColorsExtracted} />
          
          {/* Right: Gradient Preview */}
          <GradientPreview 
            colors={activeColors}
            allColors={allColors}
            gradientType={gradientType}
            blur={blur}
            noise={noise}
            hasImage={colors !== null}
            onBlurChange={setBlur}
            onNoiseChange={setNoise}
            onRandomize={handleRandomize}
            onColorToggle={handleColorToggle}
            activeColorIndices={activeColorIndices}
            randomSeed={randomSeed}
          />
        </div>
        
        {/* Footer */}
        <footer className="mt-20 py-8 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">
              Created by sunset lover,{' '}
              <a
                href="https://x.com/charmiekapoor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-zinc-300 hover:underline underline-offset-2 transition-colors"
              >
                Charmie Kapoor
              </a>
            </p>
            {weather && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                {getWeatherIcon(weather.weatherCode)}
                <span>{weather.temperature}°C in Bangalore</span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

