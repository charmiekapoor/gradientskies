import { useState, useEffect, useRef, useMemo } from 'react';
import ColorThief from 'colorthief';
import { Copy } from 'lucide-react';
import { rgbToHex, getColorName, saturateColor, sortByHue } from '@/utils/colorUtils';
import type { RGB } from '@/utils/colorUtils';

interface ColorWithWeight {
  color: RGB;
  weight: number;
}

interface ImageData {
  url: string;
  city: string;
}

interface ManifestImage {
  file: string;
  location: string;
}

interface Manifest {
  [key: string]: ManifestImage[];
}

export interface MonthAlbum {
  month: string;
  monthKey: string;
  year: number;
  images: ImageData[];
}

const MONTH_ORDER = [
  { name: 'December', key: 'dec' },
  { name: 'November', key: 'nov' },
  { name: 'October', key: 'oct' },
  { name: 'September', key: 'sep' },
  { name: 'August', key: 'aug' },
  { name: 'July', key: 'jul' },
  { name: 'June', key: 'jun' },
  { name: 'May', key: 'may' },
  { name: 'April', key: 'apr' },
  { name: 'March', key: 'mar' },
  { name: 'February', key: 'feb' },
  { name: 'January', key: 'jan' },
];

export async function fetchAlbums(): Promise<MonthAlbum[]> {
  try {
    const response = await fetch('/sunsets/manifest.json');
    const manifest: Manifest = await response.json();
    
    return MONTH_ORDER
      .filter(m => manifest[m.key] && manifest[m.key].length > 0)
      .map(m => ({
        month: m.name,
        monthKey: m.key,
        year: 2025,
        images: manifest[m.key].map(img => ({
          url: `/sunsets/${img.file}`,
          city: img.location,
        })),
      }));
  } catch (error) {
    console.error('Failed to load manifest:', error);
    return [];
  }
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
            const palette = colorThief.getPalette(skyImg, 10) as RGB[];
            
            // Only filter out very green colors (foliage)
            const isVeryGreen = (color: RGB): boolean => {
              const [r, g, b] = color;
              return g > r * 1.3 && g > b * 1.3;
            };
            
            // Analyze colors for saturation and brightness
            const analyzed = palette.map(color => ({
              color,
              sat: (Math.max(...color) - Math.min(...color)) / (Math.max(...color) || 1),
              brightness: (color[0] + color[1] + color[2]) / 3
            }))
            .filter(c => c.brightness > 25 && !isVeryGreen(c.color));
            
            // Sort by saturation to get most vibrant colors first
            const sortedBySat = [...analyzed].sort((a, b) => b.sat - a.sat);
            
            // Take top 5 most saturated colors
            const top5 = sortedBySat.slice(0, 5);
            
            // Apply 30% saturation boost + 30% brightness increase
            const brightenColor = (c: RGB): RGB => {
              const factor = 1.3;
              return [
                Math.min(255, Math.round(c[0] * factor)),
                Math.min(255, Math.round(c[1] * factor)),
                Math.min(255, Math.round(c[2] * factor)),
              ];
            };
            
            const extractedColors: ColorWithWeight[] = top5.map(({ color }, i) => ({
              color: saturateColor(brightenColor(color), 30),
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

  return (
    <div className="relative aspect-video overflow-hidden rounded-[6px] shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
      {/* Mesh Gradient Background (default) */}
      <div className="absolute inset-0 transition-opacity duration-150 ease-out group-hover:opacity-0">
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
  const [monthColors, setMonthColors] = useState<RGB[]>([]);
  const colorsMapRef = useRef<Map<number, RGB[]>>(new Map());

  const handleColorsExtracted = useMemo(() => {
    return (index: number) => (colors: RGB[]) => {
      colorsMapRef.current.set(index, colors);
      
      const allColors: RGB[] = [];
      colorsMapRef.current.forEach((c) => allColors.push(...c));
      
      const uniqueColors = allColors.reduce((acc: RGB[], color) => {
        const exists = acc.some(
          (c) => Math.abs(c[0] - color[0]) < 30 && Math.abs(c[1] - color[1]) < 30 && Math.abs(c[2] - color[2]) < 30
        );
        if (!exists) acc.push(color);
        return acc;
      }, []);
      
      setMonthColors(sortByHue(uniqueColors).slice(0, 3));
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Month Header with Colors */}
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-semibold text-white drop-shadow-lg">
          {album.month}
        </h2>
        {monthColors.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[20px] text-zinc-400">Top month colors</span>
            <div className="flex gap-2">
              {monthColors.map((color, i) => {
                const hex = rgbToHex(color);
                const name = getColorName(color);
                return (
                  <div
                    key={i}
                    className="relative group"
                  >
                    <div
                      className="w-6 h-6 rounded-[6px] shadow-sm cursor-pointer hover:scale-125 transition-transform"
                      style={{ 
                        backgroundColor: `rgb(${color.join(',')})`,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(hex);
                      }}
                      title={`${name} - ${hex}`}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded-[6px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="font-medium">{name}</div>
                      <div className="text-zinc-400">{hex}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {album.images.map((image, imageIndex) => (
          <GradientImage
            key={`${album.month}-${imageIndex}`}
            imageUrl={image.url}
            city={image.city}
            alt={`${album.month} - ${image.city}`}
            onColorsExtracted={handleColorsExtracted(imageIndex)}
          />
        ))}
      </div>
    </div>
  );
}

export function PhotoAlbum({ albums }: PhotoAlbumProps) {
  return (
    <div className="space-y-16">
      {albums.map((album) => (
        <MonthSection key={`${album.month}-${album.year}`} album={album} />
      ))}
    </div>
  );
}

