import { useState, useEffect, useRef } from 'react';
import { PhotoAlbum } from './PhotoAlbum';
import { fetchAlbums } from '@/utils/albumUtils';
import type { MonthAlbum } from '@/utils/albumUtils';
import { Sun, Cloud, CloudSun } from 'lucide-react';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  sunset: string;
  minsToSunset: number;
}

function getWeatherIcon() {
  return <Cloud className="w-5 h-5 text-zinc-400" />;
}

export function LandingPage() {
  const [albums, setAlbums] = useState<MonthAlbum[]>([]);
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const trailRef = useRef<TrailPoint[]>([]);

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
    fetchAlbums().then(setAlbums);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,weather_code&daily=sunset&timezone=Asia/Kolkata'
        );
        const data = await res.json();
        
        // Parse sunset time
        const sunsetTime = data.daily?.sunset?.[0] || '';
        const sunsetDate = new Date(sunsetTime);
        const now = new Date();
        
        // Calculate minutes to sunset
        const diffMs = sunsetDate.getTime() - now.getTime();
        const minsToSunset = Math.round(diffMs / 60000);
        
        // Format sunset time in AM/PM
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
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000); // Update every minute for countdown
    return () => clearInterval(interval);
  }, []);

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

      {/* Gradient Trail - Fairy Wand Glow */}
      {trailPoints.length > 0 && (
        <svg className="fixed inset-0 pointer-events-none z-50" style={{ width: '100vw', height: '100vh' }}>
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



      {/* Sticky Header for Mobile */}
      <header className="sticky top-0 z-50 bg-[hsl(222,47%,5%)]/80 backdrop-blur-md border-b border-white/5 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <img src="/gradient-wheel.png" alt="Logo" className="w-8 h-8" />
          <a
            href="/?view=extractor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-colors"
          >
            <CloudSun className="w-3.5 h-3.5" />
            <span>Create your own gradient</span>
          </a>
        </div>
      </header>

      <div className="relative py-8 md:py-16">
        {/* Photo Album Section */}
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with Title and CTA - Desktop */}
          <header className="hidden md:flex items-start justify-between mb-16">
            <div>
              <h1 
                className="text-5xl md:text-7xl font-bold mb-3 tracking-tight drop-shadow-2xl bg-clip-text text-transparent pb-1"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(186,230,253,0.9) 40%, rgba(251,207,232,0.9) 70%, rgba(255,255,255,0.95) 100%)',
                }}
              >
                Colors of the Sky
              </h1>
              <p className="text-lg md:text-xl text-zinc-400">
                A reminder that the sky changes every minute. Pause, look up and enjoy its colors.
              </p>
            </div>
            <a
              href="/?view=extractor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-colors"
            >
              <CloudSun className="w-4 h-4" />
              <span>Create your own gradient</span>
            </a>
          </header>
          
          {/* Mobile Title */}
          <div className="md:hidden mb-8">
            <h1 
              className="text-4xl font-bold mb-2 tracking-tight drop-shadow-2xl bg-clip-text text-transparent pb-1"
              style={{
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(186,230,253,0.9) 40%, rgba(251,207,232,0.9) 70%, rgba(255,255,255,0.95) 100%)',
              }}
            >
              Colors of the Sky
            </h1>
            <p className="text-base text-zinc-400">
              A reminder that the sky changes every minute. Pause, look up and enjoy its colors.
            </p>
          </div>

          <PhotoAlbum albums={albums} />

          {/* Footer */}
          <footer className="mt-20 py-8 border-t border-white/10">
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
              <p className="text-zinc-400 text-[13px] md:text-[14px]">
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
                <div className="flex items-center gap-2 text-zinc-400 text-[13px] md:text-[14px] whitespace-nowrap">
                  <span>Bangalore</span>
                  <span>•</span>
                  {getWeatherIcon()}
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
    </div>
  );
}

