/**
 * Color utility functions for NaildBySteph Nail Design Studio
 * Handles color conversions, blending, and palette management
 */

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string (e.g., '#ff00aa')
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb(hex) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Convert RGB values to hex string
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {string} Hex color string
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {{ h: number, s: number, l: number }}
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
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
      default:
        h = 0;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Blend two colors together
 * @param {string} color1 - First hex color
 * @param {string} color2 - Second hex color
 * @param {number} ratio - Blend ratio (0 = all color1, 1 = all color2)
 * @returns {string} Blended hex color
 */
export function blendColors(color1, color2, ratio) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
  const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
  const b = Math.round(c1.b + (c2.b - c1.b) * ratio);

  return rgbToHex(r, g, b);
}

/**
 * Check if two colors match within a tolerance
 * @param {object} color1 - RGB color object
 * @param {object} color2 - RGB color object
 * @param {number} tolerance - Matching tolerance (0-255)
 * @returns {boolean}
 */
export function colorsMatch(color1, color2, tolerance = 32) {
  return (
    Math.abs(color1.r - color2.r) <= tolerance &&
    Math.abs(color1.g - color2.g) <= tolerance &&
    Math.abs(color1.b - color2.b) <= tolerance
  );
}

/**
 * Generate a complementary color
 * @param {string} hex - Input hex color
 * @returns {string} Complementary hex color
 */
export function getComplementary(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

/**
 * Darken a color by a percentage
 * @param {string} hex - Hex color
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string}
 */
export function darkenColor(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.round(r * factor),
    Math.round(g * factor),
    Math.round(b * factor)
  );
}

/**
 * Lighten a color by a percentage
 * @param {string} hex - Hex color
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string}
 */
export function lightenColor(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;
  return rgbToHex(
    Math.round(r + (255 - r) * factor),
    Math.round(g + (255 - g) * factor),
    Math.round(b + (255 - b) * factor)
  );
}

/**
 * NaildBySteph brand color palette
 */
export const BRAND_PALETTE = {
  primary: '#e91e8c',
  secondary: '#9b59b6',
  dark: '#1a1a2e',
  darkAlt: '#16213e',
  accent: '#f472b6',
  light: '#fce4ec',
  gold: '#f59e0b',
  white: '#ffffff',
};

/**
 * Nail polish color presets
 */
export const NAIL_COLORS = [
  { name: 'Hot Pink', hex: '#e91e8c' },
  { name: 'Berry', hex: '#8b1a4a' },
  { name: 'Lavender', hex: '#b388ff' },
  { name: 'Deep Purple', hex: '#6a1b9a' },
  { name: 'Rose Gold', hex: '#f4a8c1' },
  { name: 'Coral', hex: '#ff6b6b' },
  { name: 'Nude', hex: '#e8c4a8' },
  { name: 'French White', hex: '#fdf5e6' },
  { name: 'Midnight Blue', hex: '#1a237e' },
  { name: 'Emerald', hex: '#00796b' },
  { name: 'Gold Glitter', hex: '#ffd700' },
  { name: 'Silver Chrome', hex: '#c0c0c0' },
  { name: 'Classic Red', hex: '#c62828' },
  { name: 'Black Onyx', hex: '#212121' },
  { name: 'Baby Blue', hex: '#81d4fa' },
  { name: 'Peach', hex: '#ffab91' },
  { name: 'Mint', hex: '#80cbc4' },
  { name: 'Burgundy', hex: '#4a0e2e' },
  { name: 'Champagne', hex: '#f7e7ce' },
  { name: 'Holographic', hex: '#e0b0ff' },
];

export default {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  blendColors,
  colorsMatch,
  getComplementary,
  darkenColor,
  lightenColor,
  BRAND_PALETTE,
  NAIL_COLORS,
};
