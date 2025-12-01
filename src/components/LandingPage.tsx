import { useState, useEffect, useCallback } from 'react';
import { PhotoAlbum, fetchAlbums } from './PhotoAlbum';
import type { MonthAlbum } from './PhotoAlbum';
import { CloudSun } from 'lucide-react';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export function LandingPage() {
  const [albums, setAlbums] = useState<MonthAlbum[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  

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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle Gradient Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(168, 85, 247, 0.06) 25%, rgba(251, 191, 36, 0.05) 50%, rgba(249, 115, 22, 0.07) 75%, rgba(59, 130, 246, 0.08) 100%)',
          backgroundSize: '400% 400%',
          animation: 'subtle-gradient 25s ease-in-out infinite',
        }}
      />
      
      {/* Additional subtle layer for depth */}
      <div 
        className="fixed inset-0 -z-10 opacity-60"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(249, 115, 22, 0.04) 0%, transparent 50%)',
          animation: 'subtle-gradient 30s ease-in-out infinite reverse',
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
                className="text-5xl md:text-7xl font-bold mb-3 tracking-tight drop-shadow-2xl bg-clip-text text-transparent"
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
        </div>
      </div>
    </div>
  );
}

