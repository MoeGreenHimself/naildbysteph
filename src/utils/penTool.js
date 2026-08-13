/**
 * Pen Tool utility for NaildBySteph Nail Design Studio
 * Handles freehand drawing with pressure sensitivity, smoothing, and brush styles
 */

/**
 * Smooth a set of points using Catmull-Rom spline interpolation
 * @param {Array<{x: number, y: number}>} points - Raw input points
 * @param {number} tension - Spline tension (0-1, lower = smoother)
 * @param {number} segments - Number of interpolation segments between each pair
 * @returns {Array<{x: number, y: number}>}
 */
export function smoothPoints(points, tension = 0.5, segments = 8) {
  if (points.length < 3) return points;

  const smoothed = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let t = 0; t < segments; t++) {
      const s = t / segments;
      const s2 = s * s;
      const s3 = s2 * s;

      const x =
        0.5 *
        ((2 * p1.x) +
          (-p0.x + p2.x) * s +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3);

      const y =
        0.5 *
        ((2 * p1.y) +
          (-p0.y + p2.y) * s +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3);

      smoothed.push({ x, y });
    }
  }

  smoothed.push(points[points.length - 1]);
  return smoothed;
}

/**
 * Calculate distance between two points
 * @param {{x: number, y: number}} p1 
 * @param {{x: number, y: number}} p2 
 * @returns {number}
 */
export function distance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate the angle between two points
 * @param {{x: number, y: number}} p1 
 * @param {{x: number, y: number}} p2 
 * @returns {number} Angle in radians
 */
export function angle(p1, p2) {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Simplify a path using the Ramer-Douglas-Peucker algorithm
 * @param {Array<{x: number, y: number}>} points 
 * @param {number} epsilon - Simplification tolerance
 * @returns {Array<{x: number, y: number}>}
 */
export function simplifyPath(points, epsilon = 1.5) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], start, end);
    if (d > maxDist) {
      maxDist = d;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPath(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
}

/**
 * Calculate perpendicular distance from a point to a line segment
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));

  const projX = lineStart.x + clampedT * dx;
  const projY = lineStart.y + clampedT * dy;

  return distance(point, { x: projX, y: projY });
}

/**
 * Brush style definitions
 */
export const BRUSH_STYLES = {
  round: {
    name: 'Round',
    lineCap: 'round',
    lineJoin: 'round',
    opacity: 1,
    smoothing: 0.5,
  },
  flat: {
    name: 'Flat',
    lineCap: 'butt',
    lineJoin: 'miter',
    opacity: 1,
    smoothing: 0.3,
  },
  marker: {
    name: 'Marker',
    lineCap: 'round',
    lineJoin: 'round',
    opacity: 0.7,
    smoothing: 0.4,
  },
  airbrush: {
    name: 'Airbrush',
    lineCap: 'round',
    lineJoin: 'round',
    opacity: 0.3,
    smoothing: 0.8,
  },
  glitter: {
    name: 'Glitter',
    lineCap: 'round',
    lineJoin: 'round',
    opacity: 1,
    smoothing: 0.2,
    special: 'glitter',
  },
  dotted: {
    name: 'Dotted',
    lineCap: 'round',
    lineJoin: 'round',
    opacity: 1,
    smoothing: 0.1,
    special: 'dotted',
  },
};

/**
 * Draw a stroke on canvas with the specified brush style
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<{x: number, y: number, pressure?: number}>} points - Stroke points
 * @param {object} options - Drawing options
 */
export function drawStroke(ctx, points, options = {}) {
  const {
    color = '#e91e8c',
    size = 4,
    brushStyle = 'round',
    opacity = 1,
  } = options;

  if (points.length < 2) return;

  const brush = BRUSH_STYLES[brushStyle] || BRUSH_STYLES.round;
  const effectiveOpacity = opacity * brush.opacity;

  ctx.save();
  ctx.globalAlpha = effectiveOpacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = brush.lineCap;
  ctx.lineJoin = brush.lineJoin;

  // Handle special brush types
  if (brush.special === 'glitter') {
    drawGlitterStroke(ctx, points, color, size);
  } else if (brush.special === 'dotted') {
    drawDottedStroke(ctx, points, color, size);
  } else {
    // Smooth the points
    const smoothed = smoothPoints(points, brush.smoothing);
    
    ctx.beginPath();
    ctx.moveTo(smoothed[0].x, smoothed[0].y);

    for (let i = 1; i < smoothed.length - 1; i++) {
      const midX = (smoothed[i].x + smoothed[i + 1].x) / 2;
      const midY = (smoothed[i].y + smoothed[i + 1].y) / 2;
      ctx.quadraticCurveTo(smoothed[i].x, smoothed[i].y, midX, midY);
    }

    const last = smoothed[smoothed.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw a glitter-effect stroke
 */
function drawGlitterStroke(ctx, points, color, size) {
  const smoothed = smoothPoints(points, 0.3);
  
  for (let i = 0; i < smoothed.length; i += 2) {
    const point = smoothed[i];
    const numParticles = Math.ceil(size / 2);
    
    for (let j = 0; j < numParticles; j++) {
      const offsetX = (Math.random() - 0.5) * size * 2;
      const offsetY = (Math.random() - 0.5) * size * 2;
      const particleSize = Math.random() * (size / 3) + 1;
      
      ctx.globalAlpha = Math.random() * 0.8 + 0.2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        point.x + offsetX,
        point.y + offsetY,
        particleSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

/**
 * Draw a dotted stroke
 */
function drawDottedStroke(ctx, points, color, size) {
  const smoothed = smoothPoints(points, 0.2);
  const spacing = size * 2.5;
  let distanceSinceLastDot = spacing;

  for (let i = 1; i < smoothed.length; i++) {
    const segDist = distance(smoothed[i - 1], smoothed[i]);
    distanceSinceLastDot += segDist;

    if (distanceSinceLastDot >= spacing) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(smoothed[i].x, smoothed[i].y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      distanceSinceLastDot = 0;
    }
  }
}

/**
 * Create an eraser stroke (draws with composite operation)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<{x: number, y: number}>} points 
 * @param {number} size - Eraser size
 */
export function eraseStroke(ctx, points, size = 20) {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.strokeStyle = 'rgba(0,0,0,1)';
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const smoothed = smoothPoints(points, 0.5);

  ctx.beginPath();
  ctx.moveTo(smoothed[0].x, smoothed[0].y);

  for (let i = 1; i < smoothed.length - 1; i++) {
    const midX = (smoothed[i].x + smoothed[i + 1].x) / 2;
    const midY = (smoothed[i].y + smoothed[i + 1].y) / 2;
    ctx.quadraticCurveTo(smoothed[i].x, smoothed[i].y, midX, midY);
  }

  ctx.lineTo(smoothed[smoothed.length - 1].x, smoothed[smoothed.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

export default {
  smoothPoints,
  simplifyPath,
  distance,
  angle,
  drawStroke,
  eraseStroke,
  BRUSH_STYLES,
};
