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

function formatTimeToSunset(mins: number): string {
  const totalMins = Math.max(0, mins);
  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMins}m to sunset`;
  }
  return `${totalMins} mins to sunset`;
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
          'https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,weather_code&daily=sunset&timezone=Asia/Kolkata&forecast_days=2'
        );
        const data = await res.json();
        
        // Parse sunset times (today and tomorrow)
        const todaySunset = data.daily?.sunset?.[0] || '';
        const tomorrowSunset = data.daily?.sunset?.[1] || '';
        const todaySunsetDate = new Date(todaySunset);
        const tomorrowSunsetDate = new Date(tomorrowSunset);
        const now = new Date();
        
        // Always use next upcoming sunset
        let targetSunset = todaySunsetDate;
        if (now.getTime() >= todaySunsetDate.getTime()) {
          targetSunset = tomorrowSunsetDate;
        }
        
        const diffMs = targetSunset.getTime() - now.getTime();
        const minsToSunset = Math.max(0, Math.round(diffMs / 60000));
        
        // Format the next sunset time in AM/PM
        const sunsetFormatted = targetSunset.toLocaleTimeString('en-US', {
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



      {/* Sticky Header for Mobile */}
      <header className="sticky top-0 z-50 bg-[hsl(222,47%,5%)]/80 backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <img src="/gradient-wheel.png" alt="Logo" className="w-8 h-8" />
          <a
            href="/?view=extractor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/5 border border-white/5 text-white text-sm hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-colors"
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
                className="text-[48px] md:text-[48px] mb-3 drop-shadow-2xl bg-clip-text text-transparent pb-1 cursor-default title-gradient"
                style={{
                  fontFamily: '"Boldonse", sans-serif',
                  letterSpacing: '1px',
                }}
              >
                Colors of the Sky
              </h1>
              {weather && (
                <div className="flex items-center gap-2 text-zinc-400 text-[16px]">
                  <span>Bangalore</span>
                  <span>•</span>
                  {getWeatherIcon()}
                  <span>{weather.temperature}°C</span>
                  <span>•</span>
                  <Sun className="w-5 h-5 text-zinc-400" />
                  <span>{weather.sunset}</span>
                  <span className="text-zinc-500">
                    ({formatTimeToSunset(weather.minsToSunset)})
                  </span>
                </div>
              )}
            </div>
            <a
              href="/?view=extractor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-white/5 border border-white/5 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-colors"
            >
              <CloudSun className="w-4 h-4" />
              <span>Create your own gradient</span>
            </a>
          </header>
          
          {/* Mobile Title */}
          <div className="md:hidden mb-8">
            <h1 
              className="text-[44px] mb-2 drop-shadow-2xl bg-clip-text text-transparent pb-1 cursor-default title-gradient"
              style={{
                fontFamily: '"Boldonse", sans-serif',
                letterSpacing: '1px',
              }}
            >
              Colors of the Sky
            </h1>
            {weather && (
              <div className="flex items-center gap-2 text-zinc-400 text-[15px]">
                <span>Bangalore</span>
                <span>•</span>
                {getWeatherIcon()}
                <span>{weather.temperature}°C</span>
                <span>•</span>
                <Sun className="w-5 h-5 text-zinc-400" />
                <span>{weather.sunset}</span>
                <span className="text-zinc-500 whitespace-nowrap">
                  ({formatTimeToSunset(weather.minsToSunset)})
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-12" />

          <PhotoAlbum albums={albums} />

          {/* Footer */}
          <footer className="mt-20 py-8 border-t border-white/10">
            <div className="flex justify-center">
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
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

