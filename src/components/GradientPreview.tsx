import { useState, useCallback, useRef, useMemo } from 'react';
import { Copy, Check, Shuffle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { boostColor, rgbToHex, saturateColor, type RGB } from '@/utils/colorUtils';

interface GradientPreviewProps {
  colors: RGB[] | null;
  allColors: RGB[] | null;
  blur: number;
  noise: number;
  hasImage: boolean;
  onBlurChange: (blur: number) => void;
  onNoiseChange: (noise: number) => void;
  onRandomize: () => void;
  onColorToggle: (index: number) => void;
  activeColorIndices: number[];
  randomSeed: number;
}

const blobPositions = [
  { top: '5%', left: '-10%', width: '70%', height: '70%', delay: '0s', duration: '8s' },
  { top: '-15%', right: '-5%', width: '65%', height: '65%', delay: '1s', duration: '10s' },
  { bottom: '-10%', left: '20%', width: '60%', height: '60%', delay: '2s', duration: '9s' },
  { top: '30%', right: '-15%', width: '55%', height: '55%', delay: '0.5s', duration: '11s' },
  { bottom: '-20%', right: '10%', width: '50%', height: '50%', delay: '1.5s', duration: '7s' },
  { top: '50%', left: '-5%', width: '45%', height: '45%', delay: '2.5s', duration: '12s' },
];

// Seeded random function for deterministic randomness
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function GradientPreview({ 
  colors, 
  allColors,
  blur, 
  noise,
  hasImage,
  onBlurChange,
  onNoiseChange,
  onRandomize,
  onColorToggle,
  activeColorIndices,
  randomSeed,
}: GradientPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x: x * 8, y: y * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 0, y: 0 });
  }, []);

  const handleCopy = useCallback(async () => {
    if (!colors) return;
    const hexColors = colors.map(c => rgbToHex(c)).join(', ');
    await navigator.clipboard.writeText(hexColors);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [colors]);



  const renderPlaceholder = () => (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center">
      {/* Slow moving blurred blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blob 1 - larger, slower */}
        <div
          className="absolute rounded-full"
          style={{
            width: '50%',
            height: '50%',
            background: 'rgba(59, 130, 246, 0.08)',
            filter: 'blur(50px)',
            animation: 'blob1 12s ease-in-out infinite',
          }}
        />
        {/* Blob 2 - medium, different timing */}
        <div
          className="absolute rounded-full"
          style={{
            width: '40%',
            height: '40%',
            background: 'rgba(99, 102, 241, 0.06)',
            filter: 'blur(45px)',
            animation: 'blob2 15s ease-in-out infinite',
          }}
        />
        {/* Blob 3 - smaller accent */}
        <div
          className="absolute rounded-full"
          style={{
            width: '30%',
            height: '30%',
            background: 'rgba(30, 64, 175, 0.07)',
            filter: 'blur(40px)',
            animation: 'blob3 18s ease-in-out infinite',
          }}
        />
      </div>
      <p className="relative text-zinc-500 text-sm font-medium">Your gradient will be generated here</p>
      <style>{`
        @keyframes blob1 {
          0%, 100% { top: 10%; left: 10%; transform: scale(1); }
          25% { top: 50%; left: 60%; transform: scale(1.1); }
          50% { top: 70%; left: 30%; transform: scale(0.95); }
          75% { top: 20%; left: 70%; transform: scale(1.05); }
        }
        @keyframes blob2 {
          0%, 100% { top: 60%; left: 60%; transform: scale(1); }
          33% { top: 20%; left: 20%; transform: scale(1.15); }
          66% { top: 40%; left: 80%; transform: scale(0.9); }
        }
        @keyframes blob3 {
          0%, 100% { top: 30%; left: 40%; transform: scale(1); }
          50% { top: 60%; left: 10%; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );

  // Boost colors for vibrancy - increased saturation and brightness
  const boostedColors = useMemo(() => {
    if (!colors) return null;
    return colors.map(c => boostColor(c, 30, 25, 20));
  }, [colors]);

  // Randomized blob positions - big variation when randomSeed changes
  const randomizedPositions = useMemo(() => {
    return blobPositions.map((pos, i) => {
      // Create big variation positions across the entire canvas using seeded random
      const randomTop = seededRandom(randomSeed + i * 100) * 120 - 40; // -40% to 80%
      const randomLeft = seededRandom(randomSeed + i * 100 + 50) * 120 - 40; // -40% to 80%
      return {
        ...pos,
        top: `${randomTop}%`,
        left: `${randomLeft}%`,
        right: undefined,
        bottom: undefined,
      };
    });
  }, [randomSeed]);
  
  // Stable blob sizes - only change on randomSeed
  const blobSizes = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((i) => 40 + seededRandom(randomSeed + i * 200) * 50); // 40-90%
  }, [randomSeed]);
  
  
  // Randomized color weights/opacity for each blob
  const colorWeights = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((i) => 0.5 + seededRandom(randomSeed + i * 400) * 0.5); // 0.5-1.0
  }, [randomSeed]);

  const renderMeshGradient = () => {
    if (!boostedColors || boostedColors.length < 3) return null;
    
    // Top 3 colors with 15% added saturation for base gradient
    const baseColors = boostedColors.slice(0, 3).map(c => saturateColor(c, 1.15));
    // All colors for animated blobs
    const blobColors = boostedColors;
    
    // Randomized gradient angle based on seed
    const gradientAngle = Math.floor(seededRandom(randomSeed + 1000) * 360);
    
    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Base gradient with randomized angle */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(${gradientAngle}deg, rgb(${baseColors[0].join(',')}) 0%, rgb(${baseColors[1].join(',')}) 50%, rgb(${baseColors[2].join(',')}) 100%)`,
          }}
        />
        
        {/* Large blurred base blobs for organic feel */}
        {baseColors.map((color, index) => {
          const baseX = seededRandom(randomSeed + index * 50) * 100;
          const baseY = seededRandom(randomSeed + index * 50 + 25) * 100;
          return (
            <div
              key={`base-blob-${index}`}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${color.join(',')}, 0.8) 0%, rgba(${color.join(',')}, 0.4) 40%, transparent 70%)`,
                filter: `blur(${blur + 40}px)`,
                width: '80%',
                height: '80%',
                top: `${baseY - 40}%`,
                left: `${baseX - 40}%`,
              }}
            />
          );
        })}
        
        {/* Animated blobs with all colors - more prominent */}
        {blobColors.map((color, index) => {
          const pos = randomizedPositions[index] || randomizedPositions[0];
          const size = blobSizes[index] || 60;
          const weight = colorWeights[index] || 0.8;
          return (
            <div
              key={`${index}-${randomSeed}`}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${color.join(',')}, ${weight * 0.9}) 0%, rgba(${color.join(',')}, ${weight * 0.5}) 40%, transparent 70%)`,
                filter: `blur(${blur * 0.6 + 15 + index * 3}px)`,
                width: `${size + 20}%`,
                height: `${size + 20}%`,
                top: pos.top,
                left: pos.left,
                animation: `float${index % 6} ${pos.duration} ease-in-out infinite`,
                animationDelay: pos.delay,
                opacity: weight,
              }}
            />
          );
        })}
        
        {/* Extra vibrancy blobs - duplicates of first 3 colors */}
        {baseColors.map((color, index) => {
          const extraX = seededRandom(randomSeed + index * 999) * 80 + 10;
          const extraY = seededRandom(randomSeed + index * 999 + 50) * 80 + 10;
          const extraSize = 40 + seededRandom(randomSeed + index * 888) * 30;
          return (
            <div
              key={`extra-${index}`}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${color.join(',')}, 0.7) 0%, rgba(${color.join(',')}, 0) 60%)`,
                filter: `blur(${blur * 0.5 + 20}px)`,
                width: `${extraSize}%`,
                height: `${extraSize}%`,
                top: `${extraY}%`,
                left: `${extraX}%`,
              }}
            />
          );
        })}

        {/* Additional mesh layer for blending */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 80% at ${30 + seededRandom(randomSeed + 600) * 20}% ${20 + seededRandom(randomSeed + 601) * 30}%, rgba(${baseColors[0].join(',')}, 0.5) 0%, transparent 50%),
              radial-gradient(ellipse 70% 60% at ${60 + seededRandom(randomSeed + 602) * 30}% ${70 + seededRandom(randomSeed + 603) * 20}%, rgba(${baseColors[1].join(',')}, 0.4) 0%, transparent 45%),
              radial-gradient(ellipse 50% 70% at ${80 + seededRandom(randomSeed + 604) * 15}% ${30 + seededRandom(randomSeed + 605) * 40}%, rgba(${baseColors[2].join(',')}, 0.45) 0%, transparent 40%)
            `,
            filter: `blur(${blur * 0.4 + 15}px)`,
            mixBlendMode: 'soft-light',
          }}
        />
        
        {/* Noise/Grain overlay - always visible with minimum */}
        <div 
          className="absolute inset-0 mix-blend-overlay pointer-events-none"
          style={{
            opacity: Math.max(0.08, noise / 100 * 0.35),
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
        
        <style>{`
          @keyframes float0 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.05); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
          }
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-25px, 25px) scale(1.08); }
            66% { transform: translate(25px, -15px) scale(0.92); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, 30px) scale(0.95); }
            66% { transform: translate(-30px, -20px) scale(1.05); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-20px, -25px) scale(1.03); }
            66% { transform: translate(15px, 25px) scale(0.97); }
          }
          @keyframes float4 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(25px, 15px) scale(0.96); }
            66% { transform: translate(-15px, -30px) scale(1.04); }
          }
          @keyframes float5 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-30px, 10px) scale(1.02); }
            66% { transform: translate(20px, -25px) scale(0.98); }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex-1 min-h-[250px] md:min-h-[420px] perspective-1000 relative border-2 border-zinc-700 rounded-[6px]"
        style={{ perspective: '1000px' }}
      >
        {/* Slow moving blue gradient shadow */}
        {!hasImage && (
          <>
            <div 
              className="absolute -inset-10 -z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 33%, rgba(30, 64, 175, 0.1) 66%, rgba(59, 130, 246, 0.1) 100%)',
                backgroundSize: '400% 400%',
                animation: 'slowGradient 30s ease-in-out infinite',
                filter: 'blur(60px)',
                borderRadius: '6px',
              }}
            />
            <style>{`
              @keyframes slowGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
            `}</style>
          </>
        )}
        <div 
          className="w-full h-full rounded-[6px] overflow-hidden transition-transform duration-500 ease-out group/card"
          style={{
            transform: `rotateY(${mousePosition.x * 0.3}deg) rotateX(${-mousePosition.y * 0.3}deg)`,
            borderRadius: '6px',
          }}
        >
          {!hasImage ? (
            renderPlaceholder()
          ) : (
            <>
              {renderMeshGradient()}
              {/* Copy hex button on hover */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 flex justify-end">
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy();
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy hex
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {hasImage && (
        <>
          {/* Controls Panel */}
          <Card className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 overflow-hidden mt-4 rounded-[6px]">
            <div className="p-4 space-y-4">
              {/* Colors */}
              <div>
                <label className="text-[14px] text-zinc-400 mb-2 block">Tap on the colors you want to remove.</label>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex gap-2">
                    {allColors?.slice(0, 6).map((color, index) => {
                      const brightColor = boostColor(color, 30, 25, 20);
                      return (
                        <button
                          key={index}
                          onClick={() => onColorToggle(index)}
                          className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                            activeColorIndices.includes(index) 
                              ? 'border-white/50' 
                              : 'border-transparent opacity-40'
                          }`}
                          style={{ background: `rgb(${brightColor.join(',')})` }}
                          aria-label={`${activeColorIndices.includes(index) ? 'Remove' : 'Add'} color ${index + 1}`}
                        >
                          {activeColorIndices.includes(index) && (
                            <Check className="w-3 h-3 text-white drop-shadow-md" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={onRandomize}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-[14px] w-fit"
                    aria-label="Randomize gradient"
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Randomize gradient</span>
                  </button>
                </div>
              </div>
              
              {/* Blur Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[14px] text-zinc-400">Blur</label>
                  <span className="text-[14px] text-zinc-500">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={blur}
                  onChange={(e) => onBlurChange(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
              
              {/* Noise Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[14px] text-zinc-400">Noise</label>
                  <span className="text-[14px] text-zinc-500">{noise}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={noise}
                  onChange={(e) => onNoiseChange(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>
          </Card>
          

        </>
      )}
    </div>
  );
}
