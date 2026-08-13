/**
 * Nail shape definitions for NaildBySteph Nail Design Studio
 * Each shape includes SVG path data, display properties, and 3D mesh coordinates
 */

/**
 * Nail shape configurations
 * path: SVG path for 2D rendering
 * meshPoints: 3D vertex positions for the hand model
 * curvature: How curved the nail surface is (affects 3D rendering)
 */
export const NAIL_SHAPES = {
  round: {
    id: 'round',
    name: 'Round',
    description: 'Classic rounded tip, natural look',
    path: 'M 10,60 Q 10,5 30,5 Q 50,5 50,60 Q 50,65 30,65 Q 10,65 10,60 Z',
    viewBox: '0 0 60 70',
    curvature: 0.3,
    tipRadius: 20,
    width: 40,
    height: 60,
    meshPoints: [
      { x: 0, y: 0, z: 0 },
      { x: 40, y: 0, z: 0 },
      { x: 40, y: 50, z: 0 },
      { x: 20, y: 60, z: 2 },
      { x: 0, y: 50, z: 0 },
    ],
  },
  oval: {
    id: 'oval',
    name: 'Oval',
    description: 'Elongated round shape, elegant',
    path: 'M 12,65 Q 8,30 20,5 Q 30,0 40,5 Q 52,30 48,65 Q 30,68 12,65 Z',
    viewBox: '0 0 60 70',
    curvature: 0.35,
    tipRadius: 18,
    width: 38,
    height: 65,
    meshPoints: [
      { x: 2, y: 0, z: 0 },
      { x: 38, y: 0, z: 0 },
      { x: 42, y: 55, z: 0 },
      { x: 20, y: 65, z: 3 },
      { x: -2, y: 55, z: 0 },
    ],
  },
  square: {
    id: 'square',
    name: 'Square',
    description: 'Flat tip with sharp corners',
    path: 'M 8,65 L 8,10 Q 8,5 13,5 L 47,5 Q 52,5 52,10 L 52,65 Q 30,67 8,65 Z',
    viewBox: '0 0 60 70',
    curvature: 0.2,
    tipRadius: 3,
    width: 44,
    height: 60,
    meshPoints: [
      { x: 0, y: 0, z: 0 },
      { x: 44, y: 0, z: 0 },
      { x: 44, y: 60, z: 0 },
      { x: 0, y: 60, z: 0 },
    ],
  },
  squoval: {
    id: 'squoval',
    name: 'Squoval',
    description: 'Square with rounded edges, versatile',
    path: 'M 8,65 L 8,15 Q 8,5 18,5 L 42,5 Q 52,5 52,15 L 52,65 Q 30,67 8,65 Z',
    viewBox: '0 0 60 70',
    curvature: 0.25,
    tipRadius: 10,
    width: 44,
    height: 62,
    meshPoints: [
      { x: 0, y: 0, z: 0 },
      { x: 44, y: 0, z: 0 },
      { x: 44, y: 52, z: 0 },
      { x: 34, y: 62, z: 1 },
      { x: 10, y: 62, z: 1 },
      { x: 0, y: 52, z: 0 },
    ],
  },
  almond: {
    id: 'almond',
    name: 'Almond',
    description: 'Tapered sides with a soft peak',
    path: 'M 10,68 Q 5,40 15,15 Q 25,0 30,0 Q 35,0 45,15 Q 55,40 50,68 Q 30,70 10,68 Z',
    viewBox: '0 0 60 72',
    curvature: 0.4,
    tipRadius: 8,
    width: 42,
    height: 68,
    meshPoints: [
      { x: 5, y: 0, z: 0 },
      { x: 37, y: 0, z: 0 },
      { x: 42, y: 40, z: 0 },
      { x: 21, y: 68, z: 4 },
      { x: 0, y: 40, z: 0 },
    ],
  },
  stiletto: {
    id: 'stiletto',
    name: 'Stiletto',
    description: 'Dramatic pointed tip, bold statement',
    path: 'M 10,72 Q 5,45 18,20 Q 27,2 30,0 Q 33,2 42,20 Q 55,45 50,72 Q 30,74 10,72 Z',
    viewBox: '0 0 60 76',
    curvature: 0.45,
    tipRadius: 4,
    width: 40,
    height: 72,
    meshPoints: [
      { x: 5, y: 0, z: 0 },
      { x: 35, y: 0, z: 0 },
      { x: 40, y: 35, z: 0 },
      { x: 20, y: 72, z: 5 },
      { x: 0, y: 35, z: 0 },
    ],
  },
  coffin: {
    id: 'coffin',
    name: 'Coffin / Ballerina',
    description: 'Tapered sides with a flat squared-off tip',
    path: 'M 8,72 Q 5,40 15,15 Q 20,5 22,5 L 38,5 Q 40,5 45,15 Q 55,40 52,72 Q 30,74 8,72 Z',
    viewBox: '0 0 60 76',
    curvature: 0.35,
    tipRadius: 5,
    width: 44,
    height: 70,
    meshPoints: [
      { x: 3, y: 0, z: 0 },
      { x: 41, y: 0, z: 0 },
      { x: 47, y: 40, z: 0 },
      { x: 38, y: 70, z: 2 },
      { x: 6, y: 70, z: 2 },
      { x: -3, y: 40, z: 0 },
    ],
  },
  lipstick: {
    id: 'lipstick',
    name: 'Lipstick',
    description: 'Angled flat tip like a lipstick bullet',
    path: 'M 10,70 Q 8,40 12,20 L 20,5 L 48,15 Q 55,40 52,70 Q 30,72 10,70 Z',
    viewBox: '0 0 60 74',
    curvature: 0.3,
    tipRadius: 3,
    width: 42,
    height: 68,
    meshPoints: [
      { x: 2, y: 10, z: 0 },
      { x: 40, y: 0, z: 0 },
      { x: 42, y: 50, z: 0 },
      { x: 35, y: 68, z: 1 },
      { x: 5, y: 68, z: 1 },
      { x: 0, y: 50, z: 0 },
    ],
  },
};

/**
 * Nail length options
 */
export const NAIL_LENGTHS = {
  short: { id: 'short', name: 'Short', scale: 0.75, label: 'Natural & practical' },
  medium: { id: 'medium', name: 'Medium', scale: 1.0, label: 'Versatile & balanced' },
  long: { id: 'long', name: 'Long', scale: 1.25, label: 'Glamorous & bold' },
  extraLong: { id: 'extraLong', name: 'Extra Long', scale: 1.5, label: 'Maximum drama' },
};

/**
 * Finger positions on the 3D hand (left hand, palm down)
 */
export const FINGER_POSITIONS = {
  thumb: {
    id: 'thumb',
    name: 'Thumb',
    position: { x: -45, y: 10, z: 15 },
    rotation: { x: 0, y: 0, z: -30 },
    scale: 1.1,
  },
  index: {
    id: 'index',
    name: 'Index',
    position: { x: -22, y: -55, z: 5 },
    rotation: { x: -5, y: 0, z: -5 },
    scale: 0.95,
  },
  middle: {
    id: 'middle',
    name: 'Middle',
    position: { x: -2, y: -62, z: 3 },
    rotation: { x: -3, y: 0, z: 0 },
    scale: 1.0,
  },
  ring: {
    id: 'ring',
    name: 'Ring',
    position: { x: 18, y: -57, z: 5 },
    rotation: { x: -3, y: 0, z: 5 },
    scale: 0.93,
  },
  pinky: {
    id: 'pinky',
    name: 'Pinky',
    position: { x: 36, y: -45, z: 8 },
    rotation: { x: -2, y: 0, z: 10 },
    scale: 0.8,
  },
};

/**
 * Decoration/embellishment options
 */
export const NAIL_DECORATIONS = [
  { id: 'none', name: 'None', icon: '✨' },
  { id: 'french', name: 'French Tip', icon: '🤍' },
  { id: 'glitter', name: 'Glitter', icon: '✨' },
  { id: 'gems', name: 'Gems', icon: '💎' },
  { id: 'stripes', name: 'Stripes', icon: '📏' },
  { id: 'dots', name: 'Dots', icon: '⚫' },
  { id: 'marble', name: 'Marble', icon: '🪨' },
  { id: 'ombre', name: 'Ombré', icon: '🌅' },
  { id: 'chrome', name: 'Chrome', icon: '🚞' },
  { id: 'matte', name: 'Matte', icon: '🖤' },
];

/**
 * Get nail shape path scaled to a specific size
 * @param {string} shapeId - Shape identifier
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {string} Scaled SVG path
 */
export function getScaledPath(shapeId, width, height) {
  const shape = NAIL_SHAPES[shapeId];
  if (!shape) return '';

  const scaleX = width / shape.width;
  const scaleY = height / shape.height;

  return `scale(${scaleX}, ${scaleY}) ${shape.path}`;
}

/**
 * Generate a canvas-compatible Path2D from a nail shape
 * @param {string} shapeId - Shape identifier
 * @param {number} x - X position offset
 * @param {number} y - Y position offset
 * @param {number} scale - Scale factor
 * @returns {Path2D}
 */
export function createNailPath2D(shapeId, x = 0, y = 0, scale = 1) {
  const shape = NAIL_SHAPES[shapeId];
  if (!shape) return new Path2D();

  const path = new Path2D();
  const transform = new DOMMatrix()
    .translateSelf(x, y)
    .scaleSelf(scale, scale);

  const svgPath = new Path2D(shape.path);
  path.addPath(svgPath, transform);

  return path;
}

export default {
  NAIL_SHAPES,
  NAIL_LENGTHS,
  FINGER_POSITIONS,
  NAIL_DECORATIONS,
  getScaledPath,
  createNailPath2D,
};
