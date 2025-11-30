import { useState, useCallback, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RGB, GradientType } from '@/utils/colorUtils';

interface GradientPreviewProps {
  gradient: string;
  cssCode: string;
  colors: RGB[];
  gradientType: GradientType;
  blur: number;
}

const blobPositions = [
  { top: '5%', left: '-10%', width: '70%', height: '70%', delay: '0s', duration: '8s' },
  { top: '-15%', right: '-5%', width: '65%', height: '65%', delay: '1s', duration: '10s' },
  { bottom: '-10%', left: '20%', width: '60%', height: '60%', delay: '2s', duration: '9s' },
  { top: '30%', right: '-15%', width: '55%', height: '55%', delay: '0.5s', duration: '11s' },
  { bottom: '-20%', right: '10%', width: '50%', height: '50%', delay: '1.5s', duration: '7s' },
  { top: '50%', left: '-5%', width: '45%', height: '45%', delay: '2.5s', duration: '12s' },
];

export function GradientPreview({ gradient, cssCode, colors, gradientType, blur }: GradientPreviewProps) {
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
    await navigator.clipboard.writeText(`background: ${cssCode};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cssCode]);

  // Generate shadow colors from gradient colors
  const shadowColor1 = colors[0] ? `rgba(${colors[0].join(',')}, 0.4)` : 'rgba(99, 102, 241, 0.4)';
  const shadowColor2 = colors[2] ? `rgba(${colors[2].join(',')}, 0.3)` : 'rgba(168, 85, 247, 0.3)';
  const shadowColor3 = colors[4] ? `rgba(${colors[4].join(',')}, 0.2)` : 'rgba(236, 72, 153, 0.2)';

  const renderMeshGradient = () => {
    const baseColor = colors[0] || [99, 102, 241];
    
    return (
      <div className="relative w-full h-full overflow-hidden">
        {/* Base background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `rgb(${baseColor.join(',')})`,
          }}
        />
        
        {/* Animated blobs */}
        {colors.map((color, index) => {
          const pos = blobPositions[index] || blobPositions[0];
          return (
            <div
              key={index}
              className="absolute rounded-full"
              style={{
                background: `rgb(${color.join(',')})`,
                filter: `blur(${blur + 30 + index * 5}px)`,
                width: pos.width,
                height: pos.height,
                top: pos.top,
                left: pos.left,
                right: pos.right,
                bottom: pos.bottom,
                animation: `float${index} ${pos.duration} ease-in-out infinite`,
                animationDelay: pos.delay,
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
        
        {/* Additional fine grain layer */}
        <div 
          className="absolute inset-0 opacity-[0.08] mix-blend-soft-light pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
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
        className="flex-1 min-h-[300px] perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <Card 
          className="w-full h-full rounded-2xl overflow-hidden border-0 transition-transform duration-200 ease-out"
          style={{
            transform: `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg) translateZ(10px)`,
            boxShadow: `
              0 10px 30px -10px ${shadowColor1},
              0 20px 50px -15px ${shadowColor2},
              0 30px 70px -20px ${shadowColor3},
              0 0 80px -20px ${shadowColor1}
            `,
            animation: 'levitate 4s ease-in-out infinite',
          }}
        >
          {gradientType === 'mesh' ? (
            renderMeshGradient()
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
        </Card>
      </div>
      
      <Card className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 overflow-hidden mt-4">
        <div className="p-3 flex items-center justify-between gap-3">
          <code className="text-xs text-emerald-400 truncate flex-1 font-mono">
            {cssCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0 h-8"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
