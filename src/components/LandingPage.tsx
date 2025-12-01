import { useState, useEffect, useCallback } from 'react';
import { PhotoAlbum } from './PhotoAlbum';
import { fetchAlbums } from '@/utils/albumUtils';
import type { MonthAlbum } from '@/utils/albumUtils';
import { CloudSun, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

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

export function LandingPage() {
  const [albums, setAlbums] = useState<MonthAlbum[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  

  const createSparkle = useCallback((x: number, y: number) => {
    const sparkle: Sparkle = {
      id: Date.now() + Math.random(),
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      size: Math.random() * 4 + 2,
      opacity: 1,
    };
    return sparkle;
  }, []);

  useEffect(() => {
    let lastTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastTime < 50) return;
      lastTime = now;

      const newSparkle = createSparkle(e.clientX, e.clientY);
      setSparkles(prev => [...prev.slice(-15), newSparkle]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [createSparkle]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSparkles(prev => prev.filter(s => Date.now() - s.id < 800));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAlbums().then(setAlbums);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,weather_code'
        );
        const data = await res.json();
        setWeather({
          temperature: Math.round(data.current.temperature_2m),
          weatherCode: data.current.weather_code,
        });
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
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

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            width: sparkle.size,
            height: sparkle.size,
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.6)',
            animation: 'sparkle-fade 0.8s ease-out forwards',
          }}
        />
      ))}

      <style>{`
        @keyframes sparkle-fade {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.3); }
        }
      `}</style>

      <div className="relative py-16">
        {/* Photo Album Section */}
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with Title and CTA */}
          <header className="flex items-start justify-between mb-16">
            <div>
              <h1 
                className="text-5xl md:text-7xl font-bold mb-3 tracking-tight drop-shadow-2xl bg-clip-text text-transparent pb-1"
                style={{
                  backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(186,230,253,0.9) 40%, rgba(251,207,232,0.9) 70%, rgba(255,255,255,0.95) 100%)',
                }}
              >
                Colors in the Sky
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

          <PhotoAlbum albums={albums} />

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
    </div>
  );
}

