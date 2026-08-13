/**
 * Flood Fill utility for NaildBySteph Nail Design Studio
 * Implements a scanline-based flood fill algorithm optimized for canvas operations
 */

import { hexToRgb, colorsMatch } from './colorUtils';

/**
 * Get pixel color at a specific position from ImageData
 * @param {ImageData} imageData - Canvas image data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
export function getPixelColor(imageData, x, y) {
  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

/**
 * Set pixel color at a specific position in ImageData
 * @param {ImageData} imageData - Canvas image data
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {{ r: number, g: number, b: number, a?: number }} color - Color to set
 */
export function setPixelColor(imageData, x, y, color) {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = color.r;
  imageData.data[index + 1] = color.g;
  imageData.data[index + 2] = color.b;
  imageData.data[index + 3] = color.a !== undefined ? color.a : 255;
}

/**
 * Perform flood fill on a canvas context
 * Uses an optimized scanline algorithm to avoid stack overflow on large areas
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {string} fillColorHex - Fill color in hex format
 * @param {number} tolerance - Color matching tolerance (0-255)
 * @returns {{ filledPixels: number, bounds: { minX: number, minY: number, maxX: number, maxY: number } }}
 */
export function floodFill(ctx, startX, startY, fillColorHex, tolerance = 32) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  // Clamp start coordinates
  const sx = Math.floor(Math.max(0, Math.min(startX, width - 1)));
  const sy = Math.floor(Math.max(0, Math.min(startY, height - 1)));

  const imageData = ctx.getImageData(0, 0, width, height);
  const targetColor = getPixelColor(imageData, sx, sy);
  const fillColor = { ...hexToRgb(fillColorHex), a: 255 };

  // Don't fill if the target color already matches the fill color
  if (colorsMatch(targetColor, fillColor, 5)) {
    return { filledPixels: 0, bounds: { minX: sx, minY: sy, maxX: sx, maxY: sy } };
  }

  let filledPixels = 0;
  const bounds = { minX: width, minY: height, maxX: 0, maxY: 0 };

  // Scanline flood fill using a queue
  const queue = [];
  const visited = new Uint8Array(width * height);

  queue.push([sx, sy]);
  visited[sy * width + sx] = 1;

  while (queue.length > 0) {
    const [x, y] = queue.pop();

    // Scan left
    let leftX = x;
    while (leftX > 0) {
      const idx = y * width + (leftX - 1);
      if (visited[idx]) break;
      const color = getPixelColor(imageData, leftX - 1, y);
      if (!colorsMatch(color, targetColor, tolerance)) break;
      leftX--;
    }

    // Scan right
    let rightX = x;
    while (rightX < width - 1) {
      const idx = y * width + (rightX + 1);
      if (visited[idx]) break;
      const color = getPixelColor(imageData, rightX + 1, y);
      if (!colorsMatch(color, targetColor, tolerance)) break;
      rightX++;
    }

    // Fill the scanline and check above/below
    for (let px = leftX; px <= rightX; px++) {
      const idx = y * width + px;
      if (!visited[idx]) {
        const color = getPixelColor(imageData, px, y);
        if (!colorsMatch(color, targetColor, tolerance)) {
          visited[idx] = 1;
          continue;
        }
      }
      
      visited[idx] = 1;
      setPixelColor(imageData, px, y, fillColor);
      filledPixels++;

      // Update bounds
      bounds.minX = Math.min(bounds.minX, px);
      bounds.maxX = Math.max(bounds.maxX, px);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxY = Math.max(bounds.maxY, y);

      // Check pixel above
      if (y > 0) {
        const aboveIdx = (y - 1) * width + px;
        if (!visited[aboveIdx]) {
          const aboveColor = getPixelColor(imageData, px, y - 1);
          if (colorsMatch(aboveColor, targetColor, tolerance)) {
            visited[aboveIdx] = 1;
            queue.push([px, y - 1]);
          }
        }
      }

      // Check pixel below
      if (y < height - 1) {
        const belowIdx = (y + 1) * width + px;
        if (!visited[belowIdx]) {
          const belowColor = getPixelColor(imageData, px, y + 1);
          if (colorsMatch(belowColor, targetColor, tolerance)) {
            visited[belowIdx] = 1;
            queue.push([px, y + 1]);
          }
        }
      }
    }
  }

  // Apply the modified image data back to the canvas
  ctx.putImageData(imageData, 0, 0);

  return { filledPixels, bounds };
}

/**
 * Flood fill within a masked region (e.g., only within nail boundaries)
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} startX - Starting X coordinate
 * @param {number} startY - Starting Y coordinate
 * @param {string} fillColorHex - Fill color in hex
 * @param {Path2D|null} mask - Optional Path2D mask to constrain the fill
 * @param {number} tolerance - Color matching tolerance
 * @returns {{ filledPixels: number }}
 */
export function floodFillMasked(ctx, startX, startY, fillColorHex, mask = null, tolerance = 32) {
  if (mask && !ctx.isPointInPath(mask, startX, startY)) {
    return { filledPixels: 0 };
  }

  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  const sx = Math.floor(Math.max(0, Math.min(startX, width - 1)));
  const sy = Math.floor(Math.max(0, Math.min(startY, height - 1)));

  const imageData = ctx.getImageData(0, 0, width, height);
  const targetColor = getPixelColor(imageData, sx, sy);
  const fillColor = { ...hexToRgb(fillColorHex), a: 255 };

  if (colorsMatch(targetColor, fillColor, 5)) {
    return { filledPixels: 0 };
  }

  let filledPixels = 0;
  const visited = new Uint8Array(width * height);
  const queue = [[sx, sy]];
  visited[sy * width + sx] = 1;

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    
    // Check if point is within mask
    if (mask && !ctx.isPointInPath(mask, x, y)) {
      continue;
    }

    const currentColor = getPixelColor(imageData, x, y);
    if (!colorsMatch(currentColor, targetColor, tolerance)) {
      continue;
    }

    setPixelColor(imageData, x, y, fillColor);
    filledPixels++;

    // Check 4 neighbors
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          queue.push([nx, ny]);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { filledPixels };
}

export default { floodFill, floodFillMasked, getPixelColor, setPixelColor };
