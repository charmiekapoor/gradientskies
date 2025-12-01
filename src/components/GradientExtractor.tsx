import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, Sun, Cloud } from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { GradientPreview } from '@/components/GradientPreview';
import {
  applyHarmonyMode,
  type RGB,
} from '@/utils/colorUtils';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
}



interface GradientExtractorProps {
  onBack: () => void;
}

export function GradientExtractor({ onBack }: GradientExtractorProps) {
  const [colors, setColors] = useState<RGB[] | null>(null);
  const [allColors, setAllColors] = useState<RGB[] | null>(null);
  const [activeColorIndices, setActiveColorIndices] = useState<number[]>([0, 1, 2, 3, 4]);
  const [blur, setBlur] = useState<number>(20);
  const [noise, setNoise] = useState<number>(50);
  const [weather, setWeather] = useState<{ temperature: number; weatherCode: number; sunset: string; minsToSunset: number } | null>(null);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);

  // Cursor trail effect
  useEffect(() => {
    let animationId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newPoint: TrailPoint = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };
      trailRef.current = [...trailRef.current.slice(-12), newPoint];
    };

    const animate = () => {
      const now = Date.now();
      trailRef.current = trailRef.current.filter(p => now - p.id < 400);
      setTrailPoints([...trailRef.current]);
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,weather_code&daily=sunset&timezone=Asia/Kolkata'
        );
        const data = await res.json();
        
        const sunsetTime = data.daily?.sunset?.[0] || '';
        const sunsetDate = new Date(sunsetTime);
        const now = new Date();
        
        const diffMs = sunsetDate.getTime() - now.getTime();
        const minsToSunset = Math.round(diffMs / 60000);
        
        const sunsetFormatted = sunsetDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
          sunset: sunsetFormatted,
          minsToSunset: minsToSunset,
        });
      } catch {
        // ignore
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, []);



  const handleColorsExtracted = useCallback((gradientColors: RGB[], extractedAllColors: RGB[]) => {
    const processedColors = applyHarmonyMode(gradientColors, 'original');
    setColors(processedColors);
    setAllColors(extractedAllColors.slice(0, 6));
    setActiveColorIndices([0, 1, 2, 3, 4, 5].filter(i => i < extractedAllColors.length));
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

      {/* Gradient Trail - Fairy Wand Glow (Desktop only) */}
      {trailPoints.length > 0 && (
        <svg className="fixed inset-0 pointer-events-none z-50 hidden md:block" style={{ width: '100vw', height: '100vh' }}>
          <defs>
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(100, 180, 255, 0)" />
              <stop offset="25%" stopColor="rgba(180, 120, 255, 0.2)" />
              <stop offset="60%" stopColor="rgba(255, 180, 120, 0.4)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.8)" />
            </linearGradient>
            <filter id="trailBlur">
              <feGaussianBlur stdDeviation="3" />
            </filter>
            <filter id="sparkleGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Trail path */}
          {trailPoints.length > 1 && (
            <path
              d={trailPoints.reduce((path, point, i) => {
                if (i === 0) return `M ${point.x} ${point.y}`;
                const prev = trailPoints[i - 1];
                const cpX = (prev.x + point.x) / 2;
                const cpY = (prev.y + point.y) / 2;
                return `${path} Q ${prev.x} ${prev.y} ${cpX} ${cpY}`;
              }, '')}
              fill="none"
              stroke="url(#trailGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#trailBlur)"
              style={{ opacity: 0.6 }}
            />
          )}
          {/* Sparkle tip */}
          {(() => {
            const tip = trailPoints[trailPoints.length - 1];
            return (
              <g filter="url(#sparkleGlow)">
                <circle cx={tip.x} cy={tip.y} r="3" fill="rgba(255, 255, 255, 0.95)" />
                <line x1={tip.x - 6} y1={tip.y} x2={tip.x + 6} y2={tip.y} stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
                <line x1={tip.x} y1={tip.y - 6} x2={tip.x} y2={tip.y + 6} stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" />
                <line x1={tip.x - 4} y1={tip.y - 4} x2={tip.x + 4} y2={tip.y + 4} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
                <line x1={tip.x + 4} y1={tip.y - 4} x2={tip.x - 4} y2={tip.y + 4} stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1" />
              </g>
            );
          })()}
        </svg>
      )}
      
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

        <header className="text-left md:text-center mb-8">
          <h1 className="text-[28px] md:text-[36px] font-medium tracking-tight text-white leading-[110%]">
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
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-zinc-400 text-[15px] md:text-[16px]">
              Captured and created by sunset enthusiast,{' '}
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
              <div className="flex items-center gap-2 text-zinc-400 text-[15px] md:text-[16px] whitespace-nowrap">
                <span>Bangalore</span>
                <span>•</span>
                <Cloud className="w-5 h-5 text-zinc-400" />
                <span>{weather.temperature}°C</span>
                <span>•</span>
                <Sun className="w-5 h-5 text-zinc-400" />
                <span>{weather.sunset}</span>
                <span className="text-zinc-500 whitespace-nowrap">
                  ({weather.minsToSunset > 0 
                    ? `${weather.minsToSunset} mins to sunset`
                    : weather.minsToSunset > -60 
                      ? 'sunset now!' 
                      : 'after sunset'})
                </span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

