import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, Download, Grid3X3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { rgbToHex, type RGB } from '@/utils/colorUtils';

interface PixelatedPreviewProps {
  colors: RGB[];
  imageData: string | null;
}

const MIN_PIXELS = 100;
const MAX_PIXELS = 10000;
const DEFAULT_PIXELS = 2000;

function findClosestColor(pixel: RGB, palette: RGB[]): RGB {
  let minDistance = Infinity;
  let closest = palette[0];
  
  for (const color of palette) {
    const distance = Math.sqrt(
      Math.pow(pixel[0] - color[0], 2) +
      Math.pow(pixel[1] - color[1], 2) +
      Math.pow(pixel[2] - color[2], 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closest = color;
    }
  }
  return closest;
}

export function PixelatedPreview({ colors, imageData }: PixelatedPreviewProps) {
  const [copied, setCopied] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [pixelatedCanvas, setPixelatedCanvas] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [targetPixels, setTargetPixels] = useState(DEFAULT_PIXELS);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process image when imageData, colors, or targetPixels change
  useEffect(() => {
    if (!imageData || colors.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPixelatedCanvas(null);
      setDimensions({ width: 0, height: 0 });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      const pixelHeight = Math.round(Math.sqrt(targetPixels / aspectRatio));
      const pixelWidth = Math.round(Math.sqrt(targetPixels * aspectRatio));

      // Set canvas to calculated pixel grid size
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;

      // Draw image to fill canvas
      ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);

      // Get pixel data
      const imageDataObj = ctx.getImageData(0, 0, pixelWidth, pixelHeight);
      const data = imageDataObj.data;

      // Replace each pixel with closest palette color
      for (let i = 0; i < data.length; i += 4) {
        const pixel: RGB = [data[i], data[i + 1], data[i + 2]];
        const closest = findClosestColor(pixel, colors);
        data[i] = closest[0];
        data[i + 1] = closest[1];
        data[i + 2] = closest[2];
      }

      // Put modified data back
      ctx.putImageData(imageDataObj, 0, 0);

      // Scale up for display while maintaining aspect ratio
      const displayCanvas = document.createElement('canvas');
      const displayCtx = displayCanvas.getContext('2d');
      if (!displayCtx) return;

      // Scale to a reasonable display size (max 600px on longest side)
      const maxDisplaySize = 600;
      let displayWidth, displayHeight;
      
      if (aspectRatio > 1) {
        displayWidth = maxDisplaySize;
        displayHeight = Math.round(maxDisplaySize / aspectRatio);
      } else {
        displayHeight = maxDisplaySize;
        displayWidth = Math.round(maxDisplaySize * aspectRatio);
      }

      displayCanvas.width = displayWidth;
      displayCanvas.height = displayHeight;
      displayCtx.imageSmoothingEnabled = false;
      displayCtx.drawImage(canvas, 0, 0, displayWidth, displayHeight);

      setPixelatedCanvas(displayCanvas.toDataURL());
      setDimensions({ width: pixelWidth, height: pixelHeight });
    };
    img.src = imageData;
  }, [imageData, colors, targetPixels]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setMousePosition({ x: x * 5, y: y * 5 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 0, y: 0 });
  }, []);

  const handleCopyColor = useCallback(async (index: number, hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleDownload = useCallback(() => {
    if (!pixelatedCanvas) return;
    const link = document.createElement('a');
    link.download = 'pixelated-image.png';
    link.href = pixelatedCanvas;
    link.click();
  }, [pixelatedCanvas]);

  // Generate shadow colors
  const shadowColor1 = colors[0] ? `rgba(${colors[0].join(',')}, 0.3)` : 'rgba(99, 102, 241, 0.3)';
  const shadowColor2 = colors[4] ? `rgba(${colors[4].join(',')}, 0.2)` : 'rgba(168, 85, 247, 0.2)';

  const totalPixels = dimensions.width * dimensions.height;

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex-1 min-h-[280px] flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        <Card 
          className="rounded-2xl overflow-hidden border-0 transition-transform duration-200 ease-out bg-zinc-900"
          style={{
            transform: `rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg) translateZ(10px)`,
            boxShadow: `
              0 10px 30px -10px ${shadowColor1},
              0 20px 50px -15px ${shadowColor2},
              0 0 60px -20px ${shadowColor1}
            `,
            animation: 'levitate 4s ease-in-out infinite',
          }}
        >
          {pixelatedCanvas ? (
            <div className="relative">
              <img 
                src={pixelatedCanvas} 
                alt="Pixelated preview"
                className="block max-h-[280px] w-auto"
                style={{ imageRendering: 'pixelated' }}
              />
              {/* Noise overlay */}
              <div 
                className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '128px 128px',
                }}
              />
            </div>
          ) : (
            <div className="w-[400px] h-[280px] flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <p className="text-lg mb-2">Upload an image</p>
                <p className="text-sm">to see pixelated preview</p>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Pixelation slider */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 overflow-hidden mt-4 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Grid3X3 className="w-4 h-4 text-zinc-400" />
          <Label className="text-zinc-300 text-sm">Pixelation Level</Label>
          <span className="ml-auto text-xs font-mono text-emerald-400">
            {targetPixels.toLocaleString()} px
          </span>
        </div>
        <Slider
          value={[targetPixels]}
          onValueChange={(v) => setTargetPixels(v[0])}
          min={MIN_PIXELS}
          max={MAX_PIXELS}
          step={100}
          className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-zinc-600"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-500">More pixelated</span>
          <span className="text-[10px] text-zinc-500">More detailed</span>
        </div>
      </Card>
      
      {/* Info and colors */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 overflow-hidden mt-3">
        <div className="p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <code className="text-xs text-emerald-400 font-mono">
              {dimensions.width > 0 
                ? `${dimensions.width}×${dimensions.height} = ${totalPixels.toLocaleString()} pixels`
                : 'Upload an image'
              }
            </code>
            {pixelatedCanvas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 text-xs gap-1"
              >
                <Download className="w-3 h-3" />
                Download
              </Button>
            )}
          </div>
          <div className="flex gap-1">
            {colors.slice(0, 10).map((color, index) => {
              const hex = rgbToHex(color);
              return (
                <div
                  key={index}
                  className="flex-1 h-8 rounded cursor-pointer transition-all hover:scale-110 hover:z-10 relative group"
                  style={{ backgroundColor: `rgb(${color.join(',')})` }}
                  onClick={() => handleCopyColor(index, hex)}
                  title={hex}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {copied === index ? (
                      <Check className="w-3 h-3 text-white drop-shadow-lg" />
                    ) : (
                      <span className="text-[8px] font-mono text-white drop-shadow-lg">{index + 1}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
