import { useState, useEffect, useRef, useMemo } from 'react';
import ColorThief from 'colorthief';
import { Copy } from 'lucide-react';
import { sortByHue, rgbToHex, getColorName } from '@/utils/colorUtils';
import type { RGB } from '@/utils/colorUtils';

interface ImageData {
  url: string;
  city: string;
}

const JANUARY_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Santorini' },
  { url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=600&fit=crop', city: 'Maldives' },
  { url: 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=600&fit=crop', city: 'California' },
  { url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=600&fit=crop', city: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=600&fit=crop', city: 'Ocean' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Swiss Alps' },
];

const FEBRUARY_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Greece' },
  { url: 'https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?w=800&h=600&fit=crop', city: 'Beach' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
  { url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop', city: 'Malibu' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop', city: 'Maldives' },
  { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=600&fit=crop', city: 'Desert' },
];

const MARCH_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1489914099268-1dad649f76bf?w=800&h=600&fit=crop', city: 'Tokyo' },
  { url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop', city: 'Croatia' },
  { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=600&fit=crop', city: 'Countryside' },
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Santorini' },
  { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop', city: 'Austria' },
  { url: 'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&h=600&fit=crop', city: 'Thailand' },
];

const APRIL_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&h=600&fit=crop', city: 'Paris' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
  { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop', city: 'Lake' },
  { url: 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=600&fit=crop', city: 'California' },
  { url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&h=600&fit=crop', city: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop', city: 'Bali' },
];

const MAY_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop', city: 'Beach' },
  { url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=600&fit=crop', city: 'Valley' },
  { url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=600&fit=crop', city: 'Ocean' },
  { url: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&h=600&fit=crop', city: 'Morocco' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Alps' },
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Greece' },
];

const JUNE_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
  { url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop', city: 'Bali' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop', city: 'Maldives' },
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Santorini' },
  { url: 'https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?w=800&h=600&fit=crop', city: 'Coast' },
  { url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop', city: 'Malibu' },
];

const JULY_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=600&fit=crop', city: 'San Francisco' },
  { url: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=600&fit=crop', city: 'Beach' },
  { url: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?w=800&h=600&fit=crop', city: 'Paris' },
  { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=600&fit=crop', city: 'Desert' },
  { url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=600&fit=crop', city: 'Tropics' },
  { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=600&fit=crop', city: 'Fields' },
];

const AUGUST_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&h=600&fit=crop', city: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop', city: 'Coast' },
  { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop', city: 'Lake' },
  { url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop', city: 'Croatia' },
  { url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=600&fit=crop', city: 'Valley' },
  { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop', city: 'Austria' },
];

const SEPTEMBER_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&h=600&fit=crop', city: 'Malibu' },
  { url: 'https://images.unsplash.com/photo-1532978379173-523e16f371f2?w=800&h=600&fit=crop', city: 'Thailand' },
  { url: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&h=600&fit=crop', city: 'Morocco' },
  { url: 'https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?w=800&h=600&fit=crop', city: 'Ocean' },
  { url: 'https://images.unsplash.com/photo-1489914099268-1dad649f76bf?w=800&h=600&fit=crop', city: 'Japan' },
  { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=600&fit=crop', city: 'Desert' },
];

const OCTOBER_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Santorini' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Swiss Alps' },
  { url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop', city: 'Maldives' },
  { url: 'https://images.unsplash.com/photo-1472120435266-53107fd0c44a?w=800&h=600&fit=crop', city: 'California' },
  { url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&h=600&fit=crop', city: 'Countryside' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
];

const NOVEMBER_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', city: 'Swiss Alps' },
  { url: 'https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=800&h=600&fit=crop', city: 'Beach' },
  { url: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&h=600&fit=crop', city: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=600&fit=crop', city: 'Tropics' },
  { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', city: 'Hawaii' },
  { url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop', city: 'Bali' },
];

const DECEMBER_IMAGES: ImageData[] = [
  { url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&h=600&fit=crop', city: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&h=600&fit=crop', city: 'Desert' },
  { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop', city: 'Austria' },
  { url: 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop', city: 'Coast' },
  { url: 'https://images.unsplash.com/photo-1468413253725-0d5181091126?w=800&h=600&fit=crop', city: 'Morocco' },
  { url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&h=600&fit=crop', city: 'Greece' },
];

export interface MonthAlbum {
  month: string;
  year: number;
  images: ImageData[];
}

export function generateAlbums(): MonthAlbum[] {
  return [
    { month: 'December', year: 2025, images: DECEMBER_IMAGES },
    { month: 'November', year: 2025, images: NOVEMBER_IMAGES },
    { month: 'October', year: 2025, images: OCTOBER_IMAGES },
    { month: 'September', year: 2025, images: SEPTEMBER_IMAGES },
    { month: 'August', year: 2025, images: AUGUST_IMAGES },
    { month: 'July', year: 2025, images: JULY_IMAGES },
    { month: 'June', year: 2025, images: JUNE_IMAGES },
    { month: 'May', year: 2025, images: MAY_IMAGES },
    { month: 'April', year: 2025, images: APRIL_IMAGES },
    { month: 'March', year: 2025, images: MARCH_IMAGES },
    { month: 'February', year: 2025, images: FEBRUARY_IMAGES },
    { month: 'January', year: 2025, images: JANUARY_IMAGES },
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
    <div className="relative aspect-video overflow-hidden rounded-[6px] shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
      {/* Mesh Gradient Background (default) */}
      <div className="absolute inset-0 transition-opacity duration-500 ease-in-out group-hover:opacity-0">
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
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out">
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

