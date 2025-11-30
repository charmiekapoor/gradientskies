import { Shuffle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
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
  onRandomize,
}: GradientControlsProps) {
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
      <CardContent>
      </CardContent>
    </Card>
  );
}
