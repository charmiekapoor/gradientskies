import { useState, useEffect, useRef, useMemo } from 'react';
import ColorThief from 'colorthief';
import { sortByHue } from '@/utils/colorUtils';
import type { RGB } from '@/utils/colorUtils';

interface ImageData {
  url: string;
  city: string;
}

const NOVEMBER_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Swiss Alps' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop', city: 'Maldives' },
  { url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop', city: 'San Francisco' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', city: 'Ireland' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', city: 'Mount Fuji' },
  { url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop', city: 'Bali' },
];

const OCTOBER_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Santorini' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Swiss Alps' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop', city: 'Maldives' },
  { url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop', city: 'San Francisco' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', city: 'Ireland' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop', city: 'Mount Fuji' },
  { url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop', city: 'Bali' },
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Santorini' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Dolomites' },
];

export interface MonthAlbum {
  month: string;
  year: number;
  images: ImageData[];
}

export function generateAlbums(): MonthAlbum[] {
  const currentDate = new Date();
  return [
    {
      month: 'November',
      year: currentDate.getFullYear(),
      images: NOVEMBER_IMAGES,
    },
    {
      month: 'October',
      year: currentDate.getFullYear(),
      images: OCTOBER_IMAGES,
    },
  ];
}

interface GradientImageProps {
  imageUrl: string;
  city: string;
  alt: string;
  onColorsExtracted?: (colors: RGB[]) => void;
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

// Generate stable blob positions based on seed
function generateBlobPositions(seed: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const s = seed + i * 1000;
    return {
      top: `${seededRandom(s) * 80}%`,
      left: `${seededRandom(s + 1) * 80}%`,
      width: `${50 + seededRandom(s + 2) * 40}%`,
      height: `${50 + seededRandom(s + 3) * 40}%`,
    };
  });
}

function GradientImage({ imageUrl, city, alt, onColorsExtracted }: GradientImageProps) {
  const [colors, setColors] = useState<RGB[] | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const onColorsExtractedRef = useRef(onColorsExtracted);
  onColorsExtractedRef.current = onColorsExtracted;

  // Stable random values based on imageUrl
  const seed = useMemo(() => hashString(imageUrl), [imageUrl]);
  const blur = useMemo(() => 25 + Math.floor(seededRandom(seed) * 20), [seed]);
  const blobPositions = useMemo(() => generateBlobPositions(seed, 4), [seed]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 6) as RGB[];
        const sortedColors = sortByHue(palette);
        setColors(sortedColors.slice(0, 4));
        onColorsExtractedRef.current?.(sortedColors.slice(0, 3));
      } catch (error) {
        console.error('Failed to extract colors:', error);
        const fallback: RGB[] = [
          [30, 58, 138],
          [124, 58, 237],
          [236, 72, 153],
          [249, 115, 22],
        ];
        setColors(fallback);
        onColorsExtractedRef.current?.(fallback.slice(0, 3));
      }
    };
    
    img.onerror = () => {
      const fallback: RGB[] = [
        [30, 58, 138],
        [124, 58, 237],
        [236, 72, 153],
        [249, 115, 22],
      ];
      setColors(fallback);
      onColorsExtractedRef.current?.(fallback.slice(0, 3));
    };
  }, [imageUrl]);

  const baseColor = colors?.[0] || [30, 58, 138];

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
      {/* Mesh Gradient Background (default) */}
      <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-0">
        {/* Base background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `rgb(${baseColor.join(',')})`,
          }}
        />
        
        {/* Mesh blobs with blur */}
        {colors && colors.map((color, index) => {
          const pos = blobPositions[index];
          if (!pos) return null;
          
          return (
            <div
              key={index}
              className="absolute rounded-full"
              style={{
                background: `rgb(${color.join(',')})`,
                filter: `blur(${blur + 15 + index * 8}px)`,
                width: pos.width,
                height: pos.height,
                top: pos.top,
                left: pos.left,
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
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <img
          ref={imgRef}
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          crossOrigin="anonymous"
        />
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          <span className="text-white text-sm font-medium">{city}</span>
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
      <div className="flex items-center gap-4">
        <h2 className="text-3xl md:text-4xl font-semibold text-white drop-shadow-lg">
          {album.month} {album.year}
        </h2>
        {monthColors.length > 0 && (
          <div className="flex gap-1.5">
            {monthColors.map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: `rgb(${color.join(',')})` }}
              />
            ))}
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

