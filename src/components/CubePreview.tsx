import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Check, Box, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { rgbToHex, type RGB } from '@/utils/colorUtils';

interface CubePreviewProps {
  colors: RGB[];
  imageData: string | null;
}

const GRID_SIZE = 20; // 20x20 grid of cubes
const CUBE_SIZE = 14; // Size of each cube in pixels

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

function getLuminance(rgb: RGB): number {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

function darkenColor(rgb: RGB, factor: number): string {
  return `rgb(${Math.round(rgb[0] * factor)}, ${Math.round(rgb[1] * factor)}, ${Math.round(rgb[2] * factor)})`;
}

export function CubePreview({ colors, imageData }: CubePreviewProps) {
  const [copied, setCopied] = useState<number | null>(null);
  const [cubeGrid, setCubeGrid] = useState<RGB[][]>([]);
  const [rotation, setRotation] = useState({ x: -25, y: 35 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cubeHeight, setCubeHeight] = useState(50); // Height factor 0-100
  const containerRef = useRef<HTMLDivElement>(null);

  // Process image to create cube grid
  useEffect(() => {
    if (!imageData || colors.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCubeGrid([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = GRID_SIZE;
      canvas.height = GRID_SIZE;

      // Calculate aspect ratio and draw
      const aspectRatio = img.width / img.height;
      let drawWidth = GRID_SIZE;
      let drawHeight = GRID_SIZE;
      let offsetX = 0;
      let offsetY = 0;

      if (aspectRatio > 1) {
        drawHeight = GRID_SIZE / aspectRatio;
        offsetY = (GRID_SIZE - drawHeight) / 2;
      } else {
        drawWidth = GRID_SIZE * aspectRatio;
        offsetX = (GRID_SIZE - drawWidth) / 2;
      }

      ctx.fillStyle = `rgb(${colors[0].join(',')})`;
      ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // Get pixel data and create grid
      const imageDataObj = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
      const data = imageDataObj.data;
      const grid: RGB[][] = [];

      for (let y = 0; y < GRID_SIZE; y++) {
        const row: RGB[] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
          const i = (y * GRID_SIZE + x) * 4;
          const pixel: RGB = [data[i], data[i + 1], data[i + 2]];
          const closest = findClosestColor(pixel, colors);
          row.push(closest);
        }
        grid.push(row);
      }

      setCubeGrid(grid);
    };
    img.src = imageData;
  }, [imageData, colors]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setRotation(prev => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5,
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    setRotation({ x: -25, y: 35 });
  }, []);

  const handleCopyColor = useCallback(async (index: number, hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  // Generate shadow colors
  const shadowColor1 = colors[0] ? `rgba(${colors[0].join(',')}, 0.3)` : 'rgba(99, 102, 241, 0.3)';

  const cubes = useMemo(() => {
    if (cubeGrid.length === 0) return null;

    return cubeGrid.map((row, y) => 
      row.map((color, x) => {
        const luminance = getLuminance(color);
        const height = (luminance * cubeHeight / 100) * CUBE_SIZE + 2;
        const topColor = `rgb(${color.join(',')})`;
        const rightColor = darkenColor(color, 0.7);
        const frontColor = darkenColor(color, 0.85);

        return (
          <div
            key={`${x}-${y}`}
            className="absolute"
            style={{
              width: CUBE_SIZE,
              height: CUBE_SIZE,
              transformStyle: 'preserve-3d',
              transform: `translate3d(${x * CUBE_SIZE}px, ${y * CUBE_SIZE}px, ${height}px)`,
            }}
          >
            {/* Top face */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                background: topColor,
                transform: 'rotateX(90deg)',
                transformOrigin: 'bottom',
              }}
            />
            {/* Front face */}
            <div
              className="absolute"
              style={{
                width: CUBE_SIZE,
                height: height,
                background: frontColor,
                transform: `translateY(${CUBE_SIZE - height}px)`,
              }}
            />
            {/* Right face */}
            <div
              className="absolute"
              style={{
                width: height,
                height: CUBE_SIZE,
                background: rightColor,
                transform: `rotateY(90deg) translateZ(${CUBE_SIZE - height}px)`,
                transformOrigin: 'left',
              }}
            />
          </div>
        );
      })
    );
  }, [cubeGrid, cubeHeight]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="flex-1 min-h-[280px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '800px' }}
      >
        <Card 
          className="rounded-2xl overflow-hidden border-0 bg-zinc-900 p-4"
          style={{
            boxShadow: `0 20px 60px -20px ${shadowColor1}`,
          }}
        >
          {cubeGrid.length > 0 ? (
            <div
              className="relative"
              style={{
                width: GRID_SIZE * CUBE_SIZE,
                height: GRID_SIZE * CUBE_SIZE,
                transformStyle: 'preserve-3d',
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
            >
              {cubes}
            </div>
          ) : (
            <div className="w-[280px] h-[280px] flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg mb-2">Upload an image</p>
                <p className="text-sm">to see 3D cube preview</p>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Height slider */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 overflow-hidden mt-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Box className="w-4 h-4 text-zinc-400" />
            <Label className="text-zinc-300 text-sm">Cube Height</Label>
            <span className="text-xs font-mono text-emerald-400">{cubeHeight}%</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-7 text-xs gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset View
          </Button>
        </div>
        <Slider
          value={[cubeHeight]}
          onValueChange={(v) => setCubeHeight(v[0])}
          min={0}
          max={100}
          step={5}
          className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-zinc-600"
        />
        <p className="text-[10px] text-zinc-500 mt-2">Drag to rotate • Height based on luminance</p>
      </Card>
      
      {/* Colors */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border-zinc-800 overflow-hidden mt-3">
        <div className="p-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <code className="text-xs text-emerald-400 font-mono">
              {GRID_SIZE}×{GRID_SIZE} = {GRID_SIZE * GRID_SIZE} cubes • 10 colors
            </code>
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
