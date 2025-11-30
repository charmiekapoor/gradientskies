export type RGB = [number, number, number];
export type HSL = [number, number, number];

const COLOR_NAMES: { [key: string]: string } = {
  '#FF0000': 'Red', '#FF4500': 'Orange Red', '#FF6347': 'Tomato', '#FF7F50': 'Coral',
  '#FFA500': 'Orange', '#FFD700': 'Gold', '#FFFF00': 'Yellow', '#FFFFE0': 'Light Yellow',
  '#FFFACD': 'Lemon', '#F0E68C': 'Khaki', '#BDB76B': 'Dark Khaki', '#9ACD32': 'Yellow Green',
  '#7CFC00': 'Lawn Green', '#00FF00': 'Lime', '#32CD32': 'Lime Green', '#228B22': 'Forest Green',
  '#006400': 'Dark Green', '#008000': 'Green', '#2E8B57': 'Sea Green', '#3CB371': 'Medium Sea Green',
  '#00FA9A': 'Medium Spring', '#00FF7F': 'Spring Green', '#40E0D0': 'Turquoise', '#20B2AA': 'Light Sea Green',
  '#008B8B': 'Dark Cyan', '#00FFFF': 'Cyan', '#00CED1': 'Dark Turquoise', '#5F9EA0': 'Cadet Blue',
  '#4682B4': 'Steel Blue', '#6495ED': 'Cornflower', '#00BFFF': 'Deep Sky Blue', '#1E90FF': 'Dodger Blue',
  '#0000FF': 'Blue', '#0000CD': 'Medium Blue', '#00008B': 'Dark Blue', '#000080': 'Navy',
  '#191970': 'Midnight Blue', '#4B0082': 'Indigo', '#6A5ACD': 'Slate Blue', '#7B68EE': 'Medium Slate Blue',
  '#8A2BE2': 'Blue Violet', '#9400D3': 'Dark Violet', '#9932CC': 'Dark Orchid', '#BA55D3': 'Medium Orchid',
  '#FF00FF': 'Magenta', '#FF1493': 'Deep Pink', '#FF69B4': 'Hot Pink', '#FFB6C1': 'Light Pink',
  '#FFC0CB': 'Pink', '#DC143C': 'Crimson', '#B22222': 'Fire Brick', '#8B0000': 'Dark Red',
  '#800000': 'Maroon', '#A52A2A': 'Brown', '#D2691E': 'Chocolate', '#CD853F': 'Peru',
  '#DEB887': 'Burlywood', '#F4A460': 'Sandy Brown', '#D2B48C': 'Tan', '#BC8F8F': 'Rosy Brown',
  '#FFE4C4': 'Bisque', '#FFDEAD': 'Navajo White', '#FFE4B5': 'Moccasin', '#FFEFD5': 'Papaya Whip',
  '#FFFFFF': 'White', '#FFFAFA': 'Snow', '#F0FFF0': 'Honeydew', '#F5FFFA': 'Mint Cream',
  '#F0FFFF': 'Azure', '#F0F8FF': 'Alice Blue', '#F8F8FF': 'Ghost White', '#FFF5EE': 'Seashell',
  '#FDF5E6': 'Old Lace', '#FFFFF0': 'Ivory', '#FAFAD2': 'Light Goldenrod', '#FAF0E6': 'Linen',
  '#E6E6FA': 'Lavender', '#D8BFD8': 'Thistle', '#DDA0DD': 'Plum', '#EE82EE': 'Violet',
  '#C0C0C0': 'Silver', '#A9A9A9': 'Dark Gray', '#808080': 'Gray', '#696969': 'Dim Gray',
  '#778899': 'Light Slate Gray', '#708090': 'Slate Gray', '#2F4F4F': 'Dark Slate Gray', '#000000': 'Black',
};

export function getColorName(rgb: RGB): string {
  const hex = rgbToHex(rgb).toUpperCase();
  if (COLOR_NAMES[hex]) return COLOR_NAMES[hex];
  
  const [h, s, l] = rgbToHsl(rgb);
  
  if (s < 10) {
    if (l < 20) return 'Black';
    if (l < 40) return 'Dark Gray';
    if (l < 60) return 'Gray';
    if (l < 80) return 'Light Gray';
    return 'White';
  }
  
  let hueName = '';
  if (h < 15 || h >= 345) hueName = 'Red';
  else if (h < 45) hueName = 'Orange';
  else if (h < 75) hueName = 'Yellow';
  else if (h < 105) hueName = 'Lime';
  else if (h < 135) hueName = 'Green';
  else if (h < 165) hueName = 'Teal';
  else if (h < 195) hueName = 'Cyan';
  else if (h < 225) hueName = 'Sky Blue';
  else if (h < 255) hueName = 'Blue';
  else if (h < 285) hueName = 'Purple';
  else if (h < 315) hueName = 'Magenta';
  else hueName = 'Pink';
  
  let modifier = '';
  if (l < 30) modifier = 'Dark ';
  else if (l > 70) modifier = 'Light ';
  
  return modifier + hueName;
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
