export type RGB = [number, number, number];
export type HSL = [number, number, number];



export function saturateColor(rgb: RGB, amount: number = 15): RGB {
  const [h, s, l] = rgbToHsl(rgb);
  const newS = Math.min(100, s + amount);
  return hslToRgb([h, newS, l]);
}

export function getColorName(rgb: RGB): string {
  const [h, s, l] = rgbToHsl(rgb);
  
  // Grays and neutrals - dreamy names
  if (s < 12) {
    if (l < 15) return 'Midnight';
    if (l < 30) return 'Storm Cloud';
    if (l < 45) return 'Twilight Mist';
    if (l < 60) return 'Silver Lining';
    if (l < 75) return 'Morning Fog';
    if (l < 90) return 'Cloud Nine';
    return 'Stardust';
  }
  
  // Low saturation (muted/pastel) colors
  if (s < 30) {
    if (h < 30 || h >= 330) return l > 60 ? 'Blush Whisper' : 'Dusty Rose';
    if (h < 60) return l > 60 ? 'Honeyglow' : 'Amber Haze';
    if (h < 90) return l > 60 ? 'Buttercream' : 'Golden Hour';
    if (h < 150) return l > 60 ? 'Sage Dream' : 'Forest Mist';
    if (h < 210) return l > 60 ? 'Sea Glass' : 'Ocean Whisper';
    if (h < 270) return l > 60 ? 'Lavender Sky' : 'Dusk Blue';
    return l > 60 ? 'Lilac Dusk' : 'Plum Shadow';
  }
  
  // Vibrant colors - sunset/sky themed names
  
  // Reds (0-15, 345-360)
  if (h < 15 || h >= 345) {
    if (l > 70) return 'Flamingo Kiss';
    if (l > 50) return 'Sunset Blaze';
    if (l > 30) return 'Ember Glow';
    return 'Crimson Dusk';
  }
  
  // Oranges (15-45)
  if (h < 45) {
    if (l > 70) return 'Peach Horizon';
    if (l > 50) return 'Tangerine Dream';
    if (l > 30) return 'Amber Fire';
    return 'Burnt Sienna';
  }
  
  // Yellows (45-75)
  if (h < 75) {
    if (l > 70) return 'Lemon Sorbet';
    if (l > 50) return 'Golden Sun';
    if (l > 30) return 'Honey Drip';
    return 'Mustard Seed';
  }
  
  // Yellow-greens (75-105)
  if (h < 105) {
    if (l > 60) return 'Spring Meadow';
    return 'Olive Grove';
  }
  
  // Greens (105-150)
  if (h < 150) {
    if (l > 60) return 'Mint Breeze';
    if (l > 40) return 'Forest Canopy';
    return 'Evergreen';
  }
  
  // Teals (150-180)
  if (h < 180) {
    if (l > 60) return 'Aqua Splash';
    return 'Deep Lagoon';
  }
  
  // Cyans (180-210)
  if (h < 210) {
    if (l > 70) return 'Crystal Pool';
    if (l > 50) return 'Tropical Wave';
    return 'Ocean Deep';
  }
  
  // Sky blues (210-240)
  if (h < 240) {
    if (l > 70) return 'Baby Blue Sky';
    if (l > 50) return 'Horizon Blue';
    if (l > 30) return 'Twilight Azure';
    return 'Midnight Ocean';
  }
  
  // Blues/Indigos (240-270)
  if (h < 270) {
    if (l > 60) return 'Periwinkle Dream';
    if (l > 40) return 'Electric Dusk';
    return 'Deep Indigo';
  }
  
  // Purples (270-300)
  if (h < 300) {
    if (l > 60) return 'Orchid Bloom';
    if (l > 40) return 'Violet Hour';
    return 'Royal Plum';
  }
  
  // Magentas/Pinks (300-345)
  if (l > 70) return 'Cotton Candy';
  if (l > 50) return 'Fuchsia Sunset';
  if (l > 30) return 'Magenta Twilight';
  return 'Berry Wine';
}

export function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgb([h, s, l]: HSL): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export function sortByHue(colors: RGB[]): RGB[] {
  return [...colors].sort((a, b) => {
    const hslA = rgbToHsl(a);
    const hslB = rgbToHsl(b);
    return hslA[0] - hslB[0];
  });
}

export function sortByLuminance(colors: RGB[], ascending = true): RGB[] {
  return [...colors].sort((a, b) => {
    const lA = rgbToHsl(a)[2];
    const lB = rgbToHsl(b)[2];
    return ascending ? lA - lB : lB - lA;
  });
}

export function generateAnalogous(baseRgb: RGB): RGB[] {
  const [h, s, l] = rgbToHsl(baseRgb);
  return [
    hslToRgb([(h - 30 + 360) % 360, s, l]),
    baseRgb,
    hslToRgb([(h + 30) % 360, s, l]),
  ];
}

export function generateComplementary(baseRgb: RGB): RGB[] {
  const [h, s, l] = rgbToHsl(baseRgb);
  const complementH = (h + 180) % 360;
  const midH = (h + 90) % 360;
  return [
    baseRgb,
    hslToRgb([midH, s, l]),
    hslToRgb([complementH, s, l]),
  ];
}

export function generateTriadic(baseRgb: RGB): RGB[] {
  const [h, s, l] = rgbToHsl(baseRgb);
  return [
    baseRgb,
    hslToRgb([(h + 120) % 360, s, l]),
    hslToRgb([(h + 240) % 360, s, l]),
  ];
}

export function generateMonochromatic(baseRgb: RGB): RGB[] {
  const [h, s, l] = rgbToHsl(baseRgb);
  const lightL = Math.min(l + 25, 90);
  const darkL = Math.max(l - 25, 10);
  return [
    hslToRgb([h, s, lightL]),
    baseRgb,
    hslToRgb([h, s, darkL]),
  ];
}

export function generateSplitComplementary(baseRgb: RGB): RGB[] {
  const [h, s, l] = rgbToHsl(baseRgb);
  return [
    hslToRgb([(h + 150) % 360, s, l]),
    baseRgb,
    hslToRgb([(h + 210) % 360, s, l]),
  ];
}

export type HarmonyMode = 
  | 'original' 
  | 'sorted-hue' 
  | 'sorted-luminance' 
  | 'analogous' 
  | 'complementary' 
  | 'triadic' 
  | 'monochromatic' 
  | 'split-complementary';

export function applyHarmonyMode(extractedColors: RGB[], harmonyMode: HarmonyMode): RGB[] {
  if (!extractedColors || extractedColors.length === 0) {
    return extractedColors;
  }

  const baseColor = extractedColors[0];

  switch (harmonyMode) {
    case 'original':
      return extractedColors;
    case 'sorted-hue':
      return sortByHue(extractedColors);
    case 'sorted-luminance':
      return sortByLuminance(extractedColors);
    case 'analogous':
      return generateAnalogous(baseColor);
    case 'complementary':
      return generateComplementary(baseColor);
    case 'triadic':
      return generateTriadic(baseColor);
    case 'monochromatic':
      return generateMonochromatic(baseColor);
    case 'split-complementary':
      return generateSplitComplementary(baseColor);
    default:
      return extractedColors;
  }
}

export const HARMONY_MODES: { value: HarmonyMode; label: string; description: string }[] = [
  { value: 'original', label: 'Original', description: 'Use extracted colors as-is' },
  { value: 'sorted-hue', label: 'Sorted by Hue', description: 'Sort colors along the color wheel' },
  { value: 'sorted-luminance', label: 'Sorted by Light', description: 'Sort colors by brightness' },
  { value: 'analogous', label: 'Analogous', description: 'Adjacent colors on the wheel' },
  { value: 'complementary', label: 'Complementary', description: 'Opposite colors with blend' },
  { value: 'triadic', label: 'Triadic', description: 'Three equally spaced colors' },
  { value: 'monochromatic', label: 'Monochromatic', description: 'Same hue, different brightness' },
  { value: 'split-complementary', label: 'Split Complementary', description: 'Base + two adjacent to complement' },
];

export const DIRECTIONS = [
  { value: 'to right', label: 'Right' },
  { value: 'to left', label: 'Left' },
  { value: 'to bottom', label: 'Down' },
  { value: 'to top', label: 'Up' },
  { value: 'to bottom right', label: 'Diagonal ↘' },
  { value: 'to top right', label: 'Diagonal ↗' },
  { value: 'to bottom left', label: 'Diagonal ↙' },
  { value: 'to top left', label: 'Diagonal ↖' },
] as const;

export type GradientDirection = typeof DIRECTIONS[number]['value'];
export type GradientType = 'linear' | 'radial' | 'mesh';

export function generateRandomColor(): RGB {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 40) + 60; // 60-100% saturation
  const l = Math.floor(Math.random() * 40) + 30; // 30-70% lightness
  return hslToRgb([h, s, l]);
}

export function generateRandomGradient(): RGB[] {
  const baseHue = Math.floor(Math.random() * 360);
  const harmony = Math.random();
  
  if (harmony < 0.33) {
    // Analogous - nearby hues spreading across 6 colors
    return [
      hslToRgb([baseHue, 70 + Math.random() * 30, 35 + Math.random() * 25]),
      hslToRgb([(baseHue + 18) % 360, 65 + Math.random() * 30, 42 + Math.random() * 20]),
      hslToRgb([(baseHue + 36) % 360, 70 + Math.random() * 30, 50 + Math.random() * 20]),
      hslToRgb([(baseHue + 54) % 360, 65 + Math.random() * 30, 48 + Math.random() * 20]),
      hslToRgb([(baseHue + 72) % 360, 70 + Math.random() * 30, 42 + Math.random() * 20]),
      hslToRgb([(baseHue + 90) % 360, 65 + Math.random() * 30, 38 + Math.random() * 25]),
    ];
  } else if (harmony < 0.66) {
    // Split complementary with transitions - 6 colors
    return [
      hslToRgb([baseHue, 70 + Math.random() * 30, 40 + Math.random() * 20]),
      hslToRgb([(baseHue + 36) % 360, 60 + Math.random() * 30, 48 + Math.random() * 20]),
      hslToRgb([(baseHue + 72) % 360, 65 + Math.random() * 30, 52 + Math.random() * 18]),
      hslToRgb([(baseHue + 150) % 360, 65 + Math.random() * 30, 45 + Math.random() * 20]),
      hslToRgb([(baseHue + 180) % 360, 70 + Math.random() * 30, 50 + Math.random() * 15]),
      hslToRgb([(baseHue + 210) % 360, 65 + Math.random() * 30, 40 + Math.random() * 25]),
    ];
  } else {
    // Hexadic - 6 colors evenly spaced (60 degrees apart)
    return [
      hslToRgb([baseHue, 65 + Math.random() * 35, 45 + Math.random() * 20]),
      hslToRgb([(baseHue + 60) % 360, 60 + Math.random() * 35, 50 + Math.random() * 20]),
      hslToRgb([(baseHue + 120) % 360, 65 + Math.random() * 35, 48 + Math.random() * 22]),
      hslToRgb([(baseHue + 180) % 360, 60 + Math.random() * 35, 52 + Math.random() * 18]),
      hslToRgb([(baseHue + 240) % 360, 65 + Math.random() * 35, 46 + Math.random() * 20]),
      hslToRgb([(baseHue + 300) % 360, 60 + Math.random() * 35, 44 + Math.random() * 22]),
    ];
  }
}
