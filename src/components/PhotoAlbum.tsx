import { useState, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import ColorThief from 'colorthief';
import { Copy } from 'lucide-react';
import { rgbToHex, saturateColor } from '@/utils/colorUtils';
import type { RGB } from '@/utils/colorUtils';
import type { MonthAlbum } from '@/utils/albumUtils';

interface ColorWithWeight {
  color: RGB;
  weight: number;
}

const MONTH_COLORS: Record<string, { color: RGB; name: string }> = {
  jan: { color: [255, 183, 77], name: 'Golden Ember' },
  feb: { color: [255, 111, 97], name: 'Coral Blush' },
  mar: { color: [186, 85, 211], name: 'Orchid Twilight' },
  apr: { color: [255, 138, 101], name: 'Peach Horizon' },
  may: { color: [64, 224, 208], name: 'Turquoise Dream' },
  jun: { color: [255, 99, 71], name: 'Tomato Sunset' },
  jul: { color: [147, 112, 219], name: 'Lavender Dusk' },
  aug: { color: [255, 165, 0], name: 'Amber Blaze' },
  sep: { color: [100, 149, 237], name: 'Cornflower Sky' },
  oct: { color: [255, 127, 80], name: 'Burnt Sienna' },
  nov: { color: [135, 206, 235], name: 'Sky Whisper' },
  dec: { color: [220, 20, 60], name: 'Crimson Glow' },
};

type GradientMethod = 'sky-high-sat';

interface GradientImageProps {
  imageUrl: string;
  city: string;
  alt: string;
  onColorsExtracted?: (colors: RGB[]) => void;
  gradientMethod?: GradientMethod;
}

// Simple seeded random for stable values
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Generate stable blob positions based on seed, with size proportional to weight
function generateBlobPositions(seed: number, weights: number[]) {
  return weights.map((weight, i) => {
    const s = seed + i * 1000;
    // Larger blobs for more vibrant effect, weight affects size significantly
    const baseSize = 60 + seededRandom(s + 2) * 30;
    const weightBonus = weight * 80;
    const size = baseSize + weightBonus;
    return {
      top: `${-20 + seededRandom(s) * 80}%`,
      left: `${-20 + seededRandom(s + 1) * 80}%`,
      width: `${size}%`,
      height: `${size}%`,
    };
  });
}

function GradientImage({ imageUrl, city, alt, onColorsExtracted, gradientMethod = 'sky-high-sat' }: GradientImageProps) {
  const [colorsWithWeights, setColorsWithWeights] = useState<ColorWithWeight[] | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const onColorsExtractedRef = useRef(onColorsExtracted);
  const { showSnackbar } = useSnackbar();
  onColorsExtractedRef.current = onColorsExtracted;

  // Stable random values based on imageUrl + method for unique gradients
  const seed = useMemo(() => hashString(imageUrl + gradientMethod), [imageUrl, gradientMethod]);
  const weights = useMemo(() => colorsWithWeights?.map(c => c.weight) || [0.3, 0.25, 0.2, 0.15, 0.1, 0.1], [colorsWithWeights]);
  const blobPositions = useMemo(() => generateBlobPositions(seed, weights), [seed, weights]);

  const colors = useMemo(() => colorsWithWeights?.map(c => c.color) || null, [colorsWithWeights]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No canvas context');
        
        const w = 100;
        const h = 100;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
        // Extract from top 70% of image (sky focus)
        const colorThief = new ColorThief();
        
        // Create canvas with top 70% of image
        const skyCanvas = document.createElement('canvas');
        const skyCtx = skyCanvas.getContext('2d');
        if (!skyCtx) throw new Error('No context');
        
        const skyHeight = Math.floor(h * 0.7);
        skyCanvas.width = w;
        skyCanvas.height = skyHeight;
        skyCtx.drawImage(canvas, 0, 0, w, skyHeight, 0, 0, w, skyHeight);
        
        // Create image from sky portion
        const skyImg = new Image();
        skyImg.src = skyCanvas.toDataURL();
        
        skyImg.onload = () => {
          try {
            const palette = colorThief.getPalette(skyImg, 12) as RGB[];
            
            // Filter out unwanted colors
            const isUnwanted = (color: RGB): boolean => {
              const [r, g, b] = color;
              const brightness = (r + g + b) / 3;
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              const sat = max > 0 ? (max - min) / max : 0;
              
              // Filter very green (foliage)
              if (g > r * 1.3 && g > b * 1.3) return true;
              
              // Filter very dark colors
              if (brightness < 30) return true;
              
              // Filter neutral grays/whites (window frames, walls) - low saturation AND not blue-ish
              const isBlueish = b > r * 0.9 && b > g * 0.85;
              if (sat < 0.08 && !isBlueish) return true;
              
              // Filter beige/cream wall colors
              if (r > 180 && g > 160 && b > 140 && sat < 0.15 && r > b) return true;
              
              return false;
            };
            
            // Analyze colors
            const analyzed = palette
              .filter(color => !isUnwanted(color))
              .map(color => {
                const [r, g, b] = color;
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const sat = max > 0 ? (max - min) / max : 0;
                const brightness = (r + g + b) / 3;
                
                // Detect color type - be more lenient for pale sky blues
                const isBlue = (b > r * 0.95 && b > g * 0.9) || (b > 180 && b >= r && b >= g && brightness > 180);
                const isWarm = r > b * 1.1 && (r > g * 0.9 || (r > 200 && g > 150));
                const isPink = r > g && b > g * 0.8 && r > b * 0.8 && !isBlue;
                
                return { color, sat, brightness, isBlue, isWarm, isPink };
              });
            
            // Separate colors by type
            const blues = analyzed.filter(c => c.isBlue);
            const warms = analyzed.filter(c => c.isWarm || c.isPink);
            const others = analyzed.filter(c => !c.isBlue && !c.isWarm && !c.isPink);
            
            // Sort each category by a score (saturation + brightness bonus)
            const score = (c: typeof analyzed[0]) => c.sat * 0.6 + (c.brightness / 255) * 0.4;
            blues.sort((a, b) => score(b) - score(a));
            warms.sort((a, b) => score(b) - score(a));
            others.sort((a, b) => score(b) - score(a));
            
            // Pick colors ensuring variety: prioritize having both warm and cool tones
            const selected: typeof analyzed[0][] = [];
            
            // Take best warm colors (oranges, pinks, yellows)
            if (warms.length > 0) selected.push(warms[0]);
            if (warms.length > 1) selected.push(warms[1]);
            
            // Take best blue/cool colors
            if (blues.length > 0) selected.push(blues[0]);
            if (blues.length > 1 && selected.length < 4) selected.push(blues[1]);
            
            // Fill remaining with any other interesting colors
            for (const c of [...warms.slice(2), ...others]) {
              if (selected.length >= 5) break;
              selected.push(c);
            }
            
            // If we don't have enough, add remaining blues
            for (const c of blues.slice(2)) {
              if (selected.length >= 5) break;
              selected.push(c);
            }
            
            // Apply brightness boost
            const brightenColor = (c: RGB): RGB => {
              const factor = 1.25;
              return [
                Math.min(255, Math.round(c[0] * factor)),
                Math.min(255, Math.round(c[1] * factor)),
                Math.min(255, Math.round(c[2] * factor)),
              ];
            };
            
            const extractedColors: ColorWithWeight[] = selected.map(({ color }, i) => ({
              color: saturateColor(brightenColor(color), 25),
              weight: i < 3 ? (3 - i) * 0.25 : 0.1,
            }));
            
            // Pad if needed
            while (extractedColors.length < 4) {
              extractedColors.push({ color: [255, 180, 120], weight: 0.1 });
            }
            
            setColorsWithWeights(extractedColors);
            onColorsExtractedRef.current?.(extractedColors.slice(0, 3).map(c => c.color));
          } catch (err) {
            console.error('Color extraction failed:', err);
          }
        };
        
        return; // State set in onload
      } catch (error) {
        console.error('Failed to extract colors:', error);
        const fallback: ColorWithWeight[] = [
          { color: [255, 150, 100], weight: 0.3 },
          { color: [255, 180, 120], weight: 0.25 },
          { color: [255, 130, 80], weight: 0.2 },
          { color: [200, 150, 200], weight: 0.15 },
          { color: [150, 180, 255], weight: 0.1 },
        ];
        setColorsWithWeights(fallback);
        onColorsExtractedRef.current?.(fallback.slice(0, 3).map(c => c.color));
      }
    };
    
    img.onerror = () => {
      const fallback: ColorWithWeight[] = [
        { color: [255, 150, 100], weight: 0.3 },
        { color: [255, 180, 120], weight: 0.25 },
        { color: [255, 130, 80], weight: 0.2 },
        { color: [200, 150, 200], weight: 0.15 },
        { color: [150, 180, 255], weight: 0.1 },
      ];
      setColorsWithWeights(fallback);
      onColorsExtractedRef.current?.(fallback.slice(0, 3).map(c => c.color));
    };
  }, [imageUrl, gradientMethod]);

  // Use a brighter base - blend of first two colors or bright fallback
  const baseColor = colors && colors.length >= 2 
    ? [
        Math.round((colors[0][0] + colors[1][0]) / 2),
        Math.round((colors[0][1] + colors[1][1]) / 2),
        Math.round((colors[0][2] + colors[1][2]) / 2),
      ] as RGB
    : colors?.[0] || [255, 180, 150];

  const transitionDelay = useMemo(() => Math.random() * 150, []);
  
  return (
    <div className="relative aspect-video overflow-hidden rounded-[6px] shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
      {/* Mesh Gradient Background (default) */}
      <div 
        className="absolute inset-0 transition-opacity duration-500 ease-in-out group-hover:opacity-0"
        style={{ transitionDelay: `${transitionDelay}ms` }}
      >
        {/* Base background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `rgb(${baseColor.join(',')})`,
          }}
        />
        
        {/* Mesh blobs with blur - larger and more overlapping for vibrant effect */}
        {colors && colors.map((color, index) => {
          const pos = blobPositions[index];
          if (!pos) return null;
          const weight = weights[index] || 0.2;
          
          return (
            <div
              key={index}
              className="absolute rounded-full mix-blend-normal"
              style={{
                background: `radial-gradient(circle, rgba(${color.join(',')}, 0.95) 0%, rgba(${color.join(',')}, 0.6) 50%, rgba(${color.join(',')}, 0) 70%)`,
                filter: `blur(${20 + index * 5}px)`,
                width: pos.width,
                height: pos.height,
                top: pos.top,
                left: pos.left,
                opacity: 0.9 + weight * 0.1,
              }}
            />
          );
        })}
        
        {/* Extra vibrancy layer - duplicate first 3 colors with different positions */}
        {colors && colors.slice(0, 3).map((color, index) => {
          const s = seed + index * 500 + 999;
          return (
            <div
              key={`extra-${index}`}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${color.join(',')}, 0.7) 0%, rgba(${color.join(',')}, 0) 60%)`,
                filter: `blur(${30 + index * 10}px)`,
                width: `${50 + seededRandom(s) * 40}%`,
                height: `${50 + seededRandom(s + 1) * 40}%`,
                top: `${seededRandom(s + 2) * 60}%`,
                left: `${seededRandom(s + 3) * 60}%`,
              }}
            />
          );
        })}
        
        {/* Noise/Grain overlay */}
        <div 
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      </div>
      
      {/* Real Image + City Name (shown on hover) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out">
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          crossOrigin="anonymous"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-end">
          <span className="text-white text-sm font-medium">{city}</span>
          {colors && colors.length > 0 && (
            <button
              className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                const hexCodes = colors.slice(0, 3).map(c => rgbToHex(c)).join(', ');
                navigator.clipboard.writeText(hexCodes);
                showSnackbar('Copied!');
              }}
            >
              <Copy className="w-3 h-3" />
              Copy hex
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PhotoAlbumProps {
  albums: MonthAlbum[];
}

function MonthSection({ album }: { album: MonthAlbum }) {
  const { showSnackbar } = useSnackbar();
  
  const monthColorData = MONTH_COLORS[album.monthKey];
  
  const uniqueCities = [...new Set(album.images.map(img => img.city))].sort().join(', ');

  return (
    <div className="space-y-4">
      {/* Month Header with Colors */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] font-semibold text-white drop-shadow-lg">
            {album.month}
          </h2>
          <p className="text-[17px] text-zinc-400">{uniqueCities}</p>
        </div>
        {monthColorData && (
          <div className="flex items-center gap-3">
            <span className="text-[20px] text-zinc-400">Color of the month</span>
            <div className="relative group">
              <div
                className="w-6 h-6 rounded-[6px] shadow-sm cursor-pointer hover:scale-125 transition-transform"
                style={{ 
                  backgroundColor: `rgb(${monthColorData.color.join(',')})`,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onClick={() => {
                  navigator.clipboard.writeText(rgbToHex(monthColorData.color));
                  showSnackbar('Copied!');
                }}
                title={`${monthColorData.name} - ${rgbToHex(monthColorData.color)}`}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="font-medium">{monthColorData.name}</div>
                <div className="text-zinc-400">{rgbToHex(monthColorData.color)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {album.images.map((image, imageIndex) => (
          <GradientImage
            key={`${album.month}-${imageIndex}`}
            imageUrl={image.url}
            city={image.city}
            alt={`${album.month} - ${image.city}`}
          />
        ))}
      </div>
    </div>
  );
}

interface SnackbarContextType {
  showSnackbar: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) throw new Error('useSnackbar must be used within SnackbarProvider');
  return context;
}

export function PhotoAlbum({ albums }: PhotoAlbumProps) {
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const showSnackbar = (message: string) => {
    setSnackbar(message);
    setTimeout(() => setSnackbar(null), 2000);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      <div className="space-y-16">
        {albums.map((album) => (
          <MonthSection key={`${album.month}-${album.year}`} album={album} />
        ))}
      </div>
      {snackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {snackbar}
        </div>
      )}
    </SnackbarContext.Provider>
  );
}

