import { useState, useCallback, useRef, useMemo } from 'react';
import { Copy, Check, Shuffle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { boostColor, rgbToHex, type RGB, type GradientType } from '@/utils/colorUtils';

interface GradientPreviewProps {
  gradient: string;
  cssCode: string;
  colors: RGB[] | null;
  allColors: RGB[] | null;
  gradientType: GradientType;
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

export function GradientPreview({ 
  gradient, 
  cssCode, 
  colors, 
  allColors,
  gradientType, 
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

  // Boost colors for vibrancy
  const boostedColors = useMemo(() => {
    if (!colors) return null;
    return colors.map(c => boostColor(c, 15, 15, 10));
  }, [colors]);

  // Randomized blob positions - big variation when randomSeed changes
  const randomizedPositions = useMemo(() => {
    // Use randomSeed to trigger recalculation
    const seed = randomSeed;
    return blobPositions.map((pos, i) => {
      // Create big variation positions across the entire canvas
      const randomTop = Math.random() * 120 - 40; // -40% to 80%
      const randomLeft = Math.random() * 120 - 40; // -40% to 80%
      return {
        ...pos,
        top: `${randomTop}%`,
        left: `${randomLeft}%`,
        right: undefined,
        bottom: undefined,
      };
    });
  }, [randomSeed]); // Only regenerate when randomSeed changes
  
  // Stable blob sizes - only change on randomSeed
  const blobSizes = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map(() => 40 + Math.random() * 50); // 40-90%
  }, [randomSeed]);
  
  // Randomized base gradient positions - change on randomSeed
  const baseGradientPositions = useMemo(() => {
    return [
      { x: 10 + Math.random() * 30, y: 10 + Math.random() * 40 },
      { x: 60 + Math.random() * 30, y: 50 + Math.random() * 40 },
      { x: 30 + Math.random() * 40, y: 70 + Math.random() * 25 },
    ];
  }, [randomSeed]);
  
  // Randomized color weights/opacity for each blob
  const colorWeights = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map(() => 0.5 + Math.random() * 0.5); // 0.5-1.0
  }, [randomSeed]);

  const renderMeshGradient = () => {
    if (!boostedColors || boostedColors.length < 3) return null;
    
    // Top 3 colors for base gradient
    const baseColors = boostedColors.slice(0, 3);
    // All colors for animated blobs
    const blobColors = boostedColors;
    
    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Base gradient with top 3 colors - positions randomized */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `
              radial-gradient(ellipse 80% 60% at ${baseGradientPositions[0].x}% ${baseGradientPositions[0].y}%, rgb(${baseColors[0].join(',')}) 0%, transparent 60%),
              radial-gradient(ellipse 70% 80% at ${baseGradientPositions[1].x}% ${baseGradientPositions[1].y}%, rgb(${baseColors[1].join(',')}) 0%, transparent 55%),
              radial-gradient(ellipse 90% 70% at ${baseGradientPositions[2].x}% ${baseGradientPositions[2].y}%, rgb(${baseColors[2].join(',')}) 0%, transparent 50%),
              linear-gradient(135deg, rgb(${baseColors[0].join(',')}) 0%, rgb(${baseColors[1].join(',')}) 50%, rgb(${baseColors[2].join(',')}) 100%)
            `,
            filter: `blur(${blur * 0.3}px)`,
          }}
        />
        
        {/* Animated blobs with all colors */}
        {blobColors.map((color, index) => {
          const pos = randomizedPositions[index] || randomizedPositions[0];
          const size = blobSizes[index] || 60;
          const weight = colorWeights[index] || 0.8;
          return (
            <div
              key={`${index}-${randomSeed}`}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(${color.join(',')}, ${weight}) 0%, rgba(${color.join(',')}, ${weight * 0.5}) 40%, transparent 70%)`,
                filter: `blur(${blur * 0.8 + 20 + index * 5}px)`,
                width: `${size}%`,
                height: `${size}%`,
                top: pos.top,
                left: pos.left,
                animation: `float${index % 6} ${pos.duration} ease-in-out infinite`,
                animationDelay: pos.delay,
                opacity: weight,
              }}
            />
          );
        })}

        {/* Additional mesh layer for blending */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 20%, rgba(${baseColors[0].join(',')}, 0.4) 0%, transparent 40%),
              radial-gradient(circle at 70% 80%, rgba(${baseColors[1].join(',')}, 0.3) 0%, transparent 45%),
              radial-gradient(circle at 90% 30%, rgba(${baseColors[2].join(',')}, 0.35) 0%, transparent 35%)
            `,
            filter: `blur(${blur * 0.5 + 10}px)`,
            mixBlendMode: 'soft-light',
          }}
        />
        
        {/* Noise/Grain overlay */}
        {noise > 0 && (
          <div 
            className="absolute inset-0 mix-blend-overlay pointer-events-none"
            style={{
              opacity: noise / 100 * 0.3,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundSize: '128px 128px',
            }}
          />
        )}
        
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
        className="flex-1 min-h-[420px] perspective-1000 relative"
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
          ) : gradientType === 'mesh' ? (
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
          ) : (
            <div className="relative w-full h-full">
              <div 
                className="w-full h-full"
                style={{ 
                  background: gradient,
                  filter: blur > 0 ? `blur(${blur}px)` : undefined,
                }}
              />
              {/* Noise overlay for non-mesh gradients too */}
              <div 
                className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '128px 128px',
                }}
              />
            </div>
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
                <label className="text-xs text-zinc-400 mb-2 block">Tap on the colors you want to remove.</label>
                <div className="flex gap-2 items-center justify-between">
                  <div className="flex gap-2">
                    {allColors?.slice(0, 6).map((color, index) => (
                      <button
                        key={index}
                        onClick={() => onColorToggle(index)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          activeColorIndices.includes(index) 
                            ? 'border-white/50' 
                            : 'border-transparent opacity-40'
                        }`}
                        style={{ background: `rgb(${color.join(',')})` }}
                        aria-label={`${activeColorIndices.includes(index) ? 'Remove' : 'Add'} color ${index + 1}`}
                      >
                        {activeColorIndices.includes(index) && (
                          <Check className="w-3 h-3 text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onRandomize}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-sm"
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
                  <label className="text-xs text-zinc-400">Blur</label>
                  <span className="text-xs text-zinc-500">{blur}px</span>
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
                  <label className="text-xs text-zinc-400">Noise</label>
                  <span className="text-xs text-zinc-500">{noise}%</span>
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
