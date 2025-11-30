import { PhotoAlbum, generateAlbums } from './PhotoAlbum';
import { Sparkles } from 'lucide-react';

export function LandingPage() {
  const albums = generateAlbums();

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

      <div className="relative container mx-auto px-4 py-16">
        {/* Header with Title and CTA */}
        <header className="flex items-start justify-between mb-16">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight drop-shadow-2xl">
              Beautiful Sunsets
            </h1>
            <p className="text-lg md:text-xl text-zinc-400">
              A collection of gradient memories from around the world
            </p>
          </div>
          <a
            href="/?view=extractor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Gradient Extractor</span>
          </a>
        </header>

        {/* Photo Album Section */}
        <div className="max-w-7xl mx-auto">
          <PhotoAlbum albums={albums} />
        </div>
      </div>
    </div>
  );
}

