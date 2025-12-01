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

// Generate a color name based on RGB values
function getColorName(color: RGB): string {
  const [r, g, b] = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  
  // Determine dominant hue
  if (max - min < 30) {
    if (brightness > 200) return 'Soft Glow';
    if (brightness > 150) return 'Gentle Mist';
    return 'Twilight Shade';
  }
  
  if (r >= g && r >= b) {
    if (g > b + 50) return 'Golden Hour';
    if (r > 200 && g > 100) return 'Sunset Blaze';
    if (r > 200) return 'Crimson Sky';
    return 'Warm Ember';
  }
  
  if (g >= r && g >= b) {
    if (b > r) return 'Teal Dream';
    return 'Meadow Light';
  }
  
  if (b >= r && b >= g) {
    if (r > g + 30) return 'Lavender Dusk';
    if (b > 180) return 'Azure Sky';
    return 'Twilight Blue';
  }
  
  return 'Sky Whisper';
}

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

function GradientImage({ imageUrl, city, alt, onColorsExtracted, gradientMethod = 'sky-high-sat' }: GradientImageProps) {
  const [colorsWithWeights, setColorsWithWeights] = useState<ColorWithWeight[] | null>(null);
  const [showImage, setShowImage] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const onColorsExtractedRef = useRef(onColorsExtracted);
  const { showSnackbar } = useSnackbar();
  onColorsExtractedRef.current = onColorsExtracted;

  // Stable random values based on imageUrl + method for unique gradients
  const seed = useMemo(() => hashString(imageUrl + gradientMethod), [imageUrl, gradientMethod]);

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
            
            // Filter unwanted colors and keep in dominance order
            const analyzed = palette
              .filter(color => !isUnwanted(color))
              .map(color => ({ color }));
            
            // Pick colors based purely on dominance in original image
            // ColorThief returns colors in order of dominance, so we preserve that order
            const selected = analyzed.slice(0, 6);
            
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

  // Top 3 colors for base gradient (equal weight)
  const baseColors = useMemo(() => {
    if (!colors || colors.length < 3) {
      return colors?.slice(0, 3).map(c => saturateColor(c, 1.25)) || [[255, 180, 150] as RGB];
    }
    return colors.slice(0, 3).map(c => saturateColor(c, 1.25));
  }, [colors]);
  
  // Next 3 colors for mesh blobs
  const blobColors = useMemo(() => {
    if (!colors || colors.length < 6) {
      return colors?.slice(3, 6).map(c => saturateColor(c, 1.2)) || [];
    }
    return colors.slice(3, 6).map(c => saturateColor(c, 1.2));
  }, [colors]);

  const transitionDelay = useMemo(() => Math.random() * 150, []);
  
  const handleTap = () => {
    setShowImage(prev => !prev);
  };

  return (
    <div 
      className="relative aspect-video overflow-hidden rounded-[6px] shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
      onClick={handleTap}
    >
      {/* Mesh Gradient Background (default) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${showImage ? 'opacity-0' : 'opacity-100'} md:group-hover:opacity-0`}
        style={{ transitionDelay: `${transitionDelay}ms` }}
      >
        {/* BASE: 3 equal radial gradients from top 3 colors */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: baseColors.length >= 3
              ? `
                radial-gradient(ellipse 80% 80% at 15% 20%, rgb(${baseColors[0].join(',')}) 0%, transparent 50%),
                radial-gradient(ellipse 80% 80% at 85% 25%, rgb(${baseColors[1].join(',')}) 0%, transparent 50%),
                radial-gradient(ellipse 80% 80% at 50% 85%, rgb(${baseColors[2].join(',')}) 0%, transparent 50%),
                linear-gradient(180deg, rgb(${baseColors[0].join(',')}) 0%, rgb(${baseColors[1].join(',')}) 50%, rgb(${baseColors[2].join(',')}) 100%)
              `
              : `rgb(${baseColors[0]?.join(',') || '255,180,150'})`,
          }}
        />
        
        {/* MESH BLOBS: 6 animated blobs with random positions, sizes, angles, and blur */}
        {blobColors.length > 0 && (
          <>
            {/* Blob 1 - random position, elliptical, sharp */}
            <div
              className="absolute"
              style={{
                background: `radial-gradient(ellipse ${50 + seededRandom(seed + 10) * 30}% ${60 + seededRandom(seed + 11) * 40}%, rgba(${blobColors[0]?.join(',') || baseColors[0].join(',')}, 0.85) 0%, rgba(${blobColors[0]?.join(',') || baseColors[0].join(',')}, 0.3) 45%, transparent 70%)`,
                filter: `blur(${12 + seededRandom(seed + 12) * 20}px)`,
                width: `${45 + seededRandom(seed + 13) * 35}%`,
                height: `${50 + seededRandom(seed + 14) * 30}%`,
                top: `${-20 + seededRandom(seed) * 70}%`,
                left: `${-15 + seededRandom(seed + 1) * 60}%`,
                transform: `rotate(${seededRandom(seed + 15) * 360}deg)`,
                borderRadius: `${30 + seededRandom(seed + 16) * 40}% ${50 + seededRandom(seed + 17) * 30}%`,
                animation: 'meshFloat1 8s ease-in-out infinite',
              }}
            />
            {/* Blob 2 - random position, varying sharpness */}
            <div
              className="absolute"
              style={{
                background: `radial-gradient(ellipse ${60 + seededRandom(seed + 20) * 40}% ${50 + seededRandom(seed + 21) * 30}%, rgba(${blobColors[1]?.join(',') || baseColors[1].join(',')}, 0.8) 0%, rgba(${blobColors[1]?.join(',') || baseColors[1].join(',')}, 0.2) 50%, transparent 75%)`,
                filter: `blur(${18 + seededRandom(seed + 22) * 25}px)`,
                width: `${40 + seededRandom(seed + 23) * 40}%`,
                height: `${45 + seededRandom(seed + 24) * 35}%`,
                top: `${seededRandom(seed + 2) * 50}%`,
                right: `${-10 + seededRandom(seed + 3) * 50}%`,
                transform: `rotate(${seededRandom(seed + 25) * 360}deg)`,
                borderRadius: `${40 + seededRandom(seed + 26) * 35}% ${25 + seededRandom(seed + 27) * 50}%`,
                animation: 'meshFloat2 10s ease-in-out infinite',
              }}
            />
            {/* Blob 3 - bottom area, organic shape */}
            <div
              className="absolute"
              style={{
                background: `radial-gradient(ellipse ${55 + seededRandom(seed + 30) * 35}% ${65 + seededRandom(seed + 31) * 25}%, rgba(${blobColors[2]?.join(',') || baseColors[2].join(',')}, 0.75) 0%, rgba(${blobColors[2]?.join(',') || baseColors[2].join(',')}, 0.15) 55%, transparent 80%)`,
                filter: `blur(${15 + seededRandom(seed + 32) * 22}px)`,
                width: `${50 + seededRandom(seed + 33) * 35}%`,
                height: `${55 + seededRandom(seed + 34) * 30}%`,
                bottom: `${-25 + seededRandom(seed + 4) * 60}%`,
                left: `${seededRandom(seed + 5) * 60}%`,
                transform: `rotate(${seededRandom(seed + 35) * 360}deg)`,
                borderRadius: `${35 + seededRandom(seed + 36) * 45}% ${45 + seededRandom(seed + 37) * 35}%`,
                animation: 'meshFloat3 9s ease-in-out infinite',
              }}
            />
            {/* Blob 4 - center area, sharper edges */}
            <div
              className="absolute"
              style={{
                background: `radial-gradient(ellipse ${45 + seededRandom(seed + 40) * 30}% ${55 + seededRandom(seed + 41) * 25}%, rgba(${blobColors[0]?.join(',') || baseColors[0].join(',')}, 0.7) 0%, transparent 60%)`,
                filter: `blur(${8 + seededRandom(seed + 42) * 18}px)`,
                width: `${35 + seededRandom(seed + 43) * 30}%`,
                height: `${40 + seededRandom(seed + 44) * 30}%`,
                top: `${15 + seededRandom(seed + 6) * 50}%`,
                left: `${10 + seededRandom(seed + 7) * 55}%`,
                transform: `rotate(${seededRandom(seed + 45) * 360}deg)`,
                borderRadius: `${50 + seededRandom(seed + 46) * 30}% ${30 + seededRandom(seed + 47) * 45}%`,
                animation: 'meshFloat4 11s ease-in-out infinite',
              }}
            />
            {/* Blob 5 - accent, small and sharp */}
            <div
              className="absolute"
              style={{
                background: `radial-gradient(ellipse ${50 + seededRandom(seed + 50) * 35}% ${45 + seededRandom(seed + 51) * 40}%, rgba(${blobColors[1]?.join(',') || baseColors[1].join(',')}, 0.8) 0%, transparent 55%)`,
                filter: `blur(${6 + seededRandom(seed + 52) * 15}px)`,
                width: `${30 + seededRandom(seed + 53) * 25}%`,
                height: `${35 + seededRandom(seed + 54) * 25}%`,
                top: `${seededRandom(seed + 8) * 70}%`,
                right: `${seededRandom(seed + 9) * 60}%`,
                transform: `rotate(${seededRandom(seed + 55) * 360}deg)`,
                borderRadius: `${25 + seededRandom(seed + 56) * 50}% ${55 + seededRandom(seed + 57) * 30}%`,
                animation: 'meshFloat5 12s ease-in-out infinite',
              }}
            />
            {/* Blob 6 - extra accent, very soft */}
            <div
              className="absolute"
              style={{
                background: `radial-gradient(ellipse ${55 + seededRandom(seed + 60) * 30}% ${50 + seededRandom(seed + 61) * 35}%, rgba(${blobColors[2]?.join(',') || baseColors[2].join(',')}, 0.6) 0%, transparent 65%)`,
                filter: `blur(${25 + seededRandom(seed + 62) * 20}px)`,
                width: `${40 + seededRandom(seed + 63) * 30}%`,
                height: `${45 + seededRandom(seed + 64) * 25}%`,
                bottom: `${seededRandom(seed + 65) * 50}%`,
                right: `${-5 + seededRandom(seed + 66) * 55}%`,
                transform: `rotate(${seededRandom(seed + 67) * 360}deg)`,
                borderRadius: `${45 + seededRandom(seed + 68) * 35}% ${35 + seededRandom(seed + 69) * 40}%`,
                animation: 'meshFloat6 14s ease-in-out infinite',
              }}
            />
          </>
        )}
        
        {/* Flowing animation styles */}
        <style>{`
          @keyframes meshFloat1 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(${seededRandom(seed + 15) * 360}deg); }
            25% { transform: translate(20px, 15px) scale(1.08) rotate(${seededRandom(seed + 15) * 360 + 5}deg); }
            50% { transform: translate(-10px, 25px) scale(0.95) rotate(${seededRandom(seed + 15) * 360 - 3}deg); }
            75% { transform: translate(-15px, -10px) scale(1.03) rotate(${seededRandom(seed + 15) * 360 + 2}deg); }
          }
          @keyframes meshFloat2 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(${seededRandom(seed + 25) * 360}deg); }
            33% { transform: translate(-25px, 20px) scale(1.1) rotate(${seededRandom(seed + 25) * 360 + 8}deg); }
            66% { transform: translate(15px, -15px) scale(0.92) rotate(${seededRandom(seed + 25) * 360 - 5}deg); }
          }
          @keyframes meshFloat3 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(${seededRandom(seed + 35) * 360}deg); }
            50% { transform: translate(-20px, -25px) scale(1.12) rotate(${seededRandom(seed + 35) * 360 + 10}deg); }
          }
          @keyframes meshFloat4 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(${seededRandom(seed + 45) * 360}deg); }
            33% { transform: translate(30px, -20px) scale(1.08) rotate(${seededRandom(seed + 45) * 360 + 6}deg); }
            66% { transform: translate(-15px, 25px) scale(0.9) rotate(${seededRandom(seed + 45) * 360 - 8}deg); }
          }
          @keyframes meshFloat5 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(${seededRandom(seed + 55) * 360}deg); }
            25% { transform: translate(-25px, 15px) scale(1.15) rotate(${seededRandom(seed + 55) * 360 + 12}deg); }
            75% { transform: translate(20px, -20px) scale(0.88) rotate(${seededRandom(seed + 55) * 360 - 6}deg); }
          }
          @keyframes meshFloat6 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(${seededRandom(seed + 67) * 360}deg); }
            40% { transform: translate(15px, 30px) scale(1.05) rotate(${seededRandom(seed + 67) * 360 + 4}deg); }
            80% { transform: translate(-20px, -15px) scale(0.95) rotate(${seededRandom(seed + 67) * 360 - 7}deg); }
          }
        `}</style>
        
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

// Brighten a color by increasing lightness
function brightenColor(rgb: RGB, amount: number): RGB {
  const [r, g, b] = rgb;
  const factor = 1 + amount;
  return [
    Math.min(255, Math.round(r * factor)),
    Math.min(255, Math.round(g * factor)),
    Math.min(255, Math.round(b * factor)),
  ];
}

// Calculate color distance for uniqueness check
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

// Shift hue to make color more unique
function shiftHue(rgb: RGB, degrees: number): RGB {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = (max - min) / 255;
    s = l > 0.5 ? d / (2 - max/255 - min/255) : d / (max/255 + min/255);
    
    if (max === r) h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / (max - min) + 2) / 6;
    else h = ((r - g) / (max - min) + 4) / 6;
  }
  
  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;
  
  // HSL to RGB
  if (s === 0) {
    const val = Math.round(l * 255);
    return [val, val, val];
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const hueToRgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  return [
    Math.round(hueToRgb(h + 1/3) * 255),
    Math.round(hueToRgb(h) * 255),
    Math.round(hueToRgb(h - 1/3) * 255),
  ];
}

interface MonthSectionProps {
  album: MonthAlbum;
  monthColor: RGB | null;
}

function MonthSection({ album, monthColor }: MonthSectionProps) {
  const { showSnackbar } = useSnackbar();
  
  const monthColorData = monthColor ? { color: monthColor, name: getColorName(monthColor) } : null;
  
  const uniqueCities = [...new Set(album.images.map(img => img.city))].sort().join(', ');

  return (
    <div className="space-y-4">
      {/* Month Header with Colors */}
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
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
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        <h2 className="text-[24px] font-semibold text-white drop-shadow-lg">
          {album.month}
        </h2>
        <p className="text-[15px] text-zinc-400">{uniqueCities}</p>
        {monthColorData && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[12px] text-zinc-500">Color of the month</span>
            <div className="relative group">
              <div
                className="w-4 h-4 rounded-[4px] shadow-sm cursor-pointer hover:scale-125 transition-transform"
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
  const [monthColors, setMonthColors] = useState<Record<string, RGB>>({});

  // Extract unique colors for all months
  useEffect(() => {
    const extractedColors: Record<string, RGB> = {};
    const usedColors: RGB[] = [];
    let processed = 0;
    
    albums.forEach((album) => {
      if (album.images.length === 0) {
        processed++;
        return;
      }
      
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = album.images[0].url;
      
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          let dominantColor = colorThief.getColor(img) as RGB;
          
          // Boost saturation and brightness (30% brighter)
          dominantColor = saturateColor(dominantColor, 1.3);
          dominantColor = brightenColor(dominantColor, 0.3);
          
          // Ensure uniqueness - if too similar to existing color, shift hue
          let attempts = 0;
          const MIN_DISTANCE = 50; // Minimum color distance for uniqueness
          
          while (attempts < 8) {
            const isTooSimilar = usedColors.some(c => colorDistance(dominantColor, c) < MIN_DISTANCE);
            if (!isTooSimilar) break;
            
            // Shift hue by 30 degrees each attempt
            dominantColor = shiftHue(dominantColor, 30 * (attempts + 1));
            attempts++;
          }
          
          usedColors.push(dominantColor);
          extractedColors[album.monthKey] = dominantColor;
        } catch {
          extractedColors[album.monthKey] = brightenColor([255, 150, 100], 0.3);
        }
        
        processed++;
        if (processed === albums.length) {
          setMonthColors(extractedColors);
        }
      };
      
      img.onerror = () => {
        extractedColors[album.monthKey] = brightenColor([255, 150, 100], 0.3);
        processed++;
        if (processed === albums.length) {
          setMonthColors(extractedColors);
        }
      };
    });
  }, [albums]);

  const showSnackbar = (message: string) => {
    setSnackbar(message);
    setTimeout(() => setSnackbar(null), 2000);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      <div className="space-y-16">
        {albums.map((album) => (
          <MonthSection 
            key={`${album.month}-${album.year}`} 
            album={album} 
            monthColor={monthColors[album.monthKey] || null}
          />
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

