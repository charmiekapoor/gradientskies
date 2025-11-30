import { Shuffle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  rgbToHex,
  hexToRgb,
  HARMONY_MODES,
  DIRECTIONS,
  type RGB,
  type HarmonyMode,
  type GradientDirection,
  type GradientType,
} from '@/utils/colorUtils';

interface GradientControlsProps {
  colors: RGB[];
  positions: number[];
  direction: GradientDirection;
  gradientType: GradientType;
  harmonyMode: HarmonyMode;
  blur: number;
  onColorsChange: (colors: RGB[]) => void;
  onPositionsChange: (positions: number[]) => void;
  onDirectionChange: (direction: GradientDirection) => void;
  onGradientTypeChange: (type: GradientType) => void;
  onHarmonyModeChange: (mode: HarmonyMode) => void;
  onBlurChange: (blur: number) => void;
  onRandomize: () => void;
}

export function GradientControls({
  colors,
  positions,
  direction,
  gradientType,
  harmonyMode,
  blur,
  onColorsChange,
  onPositionsChange,
  onDirectionChange,
  onGradientTypeChange,
  onHarmonyModeChange,
  onBlurChange,
  onRandomize,
}: GradientControlsProps) {
  const handleColorChange = (index: number, hex: string) => {
    const newColors = [...colors];
    newColors[index] = hexToRgb(hex);
    onColorsChange(newColors);
  };

  const handlePositionChange = (index: number, value: number[]) => {
    const newPositions = [...positions];
    newPositions[index] = value[0];
    onPositionsChange(newPositions);
  };

  const selectedHarmony = HARMONY_MODES.find(m => m.value === harmonyMode);

  return (
    <Card className="bg-zinc-900/50 backdrop-blur-sm border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-zinc-100">Customize Gradient</CardTitle>
        <Button
          onClick={onRandomize}
          variant="outline"
          size="sm"
          className="gap-2 border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-white"
        >
          <Shuffle className="w-4 h-4" />
          Randomize
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <Label className="text-zinc-300">Color Harmony</Label>
          <Select value={harmonyMode} onValueChange={(v) => onHarmonyModeChange(v as HarmonyMode)}>
            <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-700 text-zinc-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              {HARMONY_MODES.map(mode => (
                <SelectItem key={mode.value} value={mode.value} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedHarmony && (
            <p className="text-xs text-zinc-500">{selectedHarmony.description}</p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-zinc-300">Gradient Type</Label>
          <div className="flex gap-2">
            <Button
              variant={gradientType === 'linear' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onGradientTypeChange('linear')}
              className={`flex-1 ${gradientType !== 'linear' ? 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white' : ''}`}
            >
              Linear
            </Button>
            <Button
              variant={gradientType === 'radial' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onGradientTypeChange('radial')}
              className={`flex-1 ${gradientType !== 'radial' ? 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white' : ''}`}
            >
              Radial
            </Button>
            <Button
              variant={gradientType === 'mesh' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onGradientTypeChange('mesh')}
              className={`flex-1 ${gradientType !== 'mesh' ? 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white' : ''}`}
            >
              Mesh
            </Button>
          </div>
        </div>

        {gradientType === 'linear' && (
          <div className="space-y-3">
            <Label className="text-zinc-300">Direction</Label>
            <Select value={direction} onValueChange={(v) => onDirectionChange(v as GradientDirection)}>
              <SelectTrigger className="w-full bg-zinc-800/50 border-zinc-700 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {DIRECTIONS.map(dir => (
                  <SelectItem key={dir.value} value={dir.value} className="text-zinc-200 focus:bg-zinc-700 focus:text-white">
                    {dir.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">Blur Effect</Label>
            <span className="text-sm font-medium text-zinc-400">{blur}px</span>
          </div>
          <Slider
            value={[blur]}
            onValueChange={(v) => onBlurChange(v[0])}
            max={50}
            step={1}
            className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-zinc-600"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-zinc-300">Colors & Positions</Label>
          <div className="space-y-4">
            {colors.map((color, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={rgbToHex(color)}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-11 h-11 rounded-lg cursor-pointer border-2 border-zinc-700 p-0.5 bg-zinc-800"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono text-zinc-500">
                      {rgbToHex(color).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-zinc-300">
                      {positions[index]}%
                    </span>
                  </div>
                  <Slider
                    value={[positions[index]]}
                    onValueChange={(v) => handlePositionChange(index, v)}
                    max={100}
                    step={1}
                    className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-zinc-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
