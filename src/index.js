/**
 * NaildBySteph Nail Design Studio - Main Export Bundle
 * 
 * Complete overhaul of the nail design experience featuring:
 * - Interactive 3D hand model with real-time nail color/shape updates
 * - Freehand pen tool with multiple brush styles
 * - Flood fill tool for instant nail region coloring
 * - Emoji-free gallery with proper image cards and Instagram links
 * 
 * @module naildbysteph-studio
 * @version 2.0.0
 */

// === Components ===
export { NailStudio3D } from './components/NailStudio3D';
export { PenTool } from './components/PenTool';
export { FloodFill, useFloodFillState } from './components/FloodFill';
export { NailCanvas } from './components/NailCanvas';
export { NailGallery } from './components/NailGallery';

// === Hooks ===
export { useNailDesign } from './hooks/useNailDesign';
export { use3DHand } from './hooks/use3DHand';

// === Utilities ===
export {
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
} from './utils/colorUtils';

export {
  floodFill,
  floodFillMasked,
  getPixelColor,
  setPixelColor,
} from './utils/floodFill';

export {
  smoothPoints,
  simplifyPath,
  distance,
  angle,
  drawStroke,
  eraseStroke,
  BRUSH_STYLES,
} from './utils/penTool';

// === Data ===
export {
  NAIL_SHAPES,
  NAIL_LENGTHS,
  FINGER_POSITIONS,
  NAIL_DECORATIONS,
  getScaledPath,
  createNailPath2D,
} from './data/nailShapes';

// === Styles ===
import './styles/studio.css';

// === Default Export: Full Studio Application ===
import React from 'react';
import { NailStudio3D } from './components/NailStudio3D';
import { NailCanvas } from './components/NailCanvas';
import { NailGallery } from './components/NailGallery';
import { useNailDesign } from './hooks/useNailDesign';
import { NAIL_SHAPES, NAIL_LENGTHS, NAIL_DECORATIONS } from './data/nailShapes';
import { NAIL_COLORS } from './utils/colorUtils';

/**
 * NailDesignStudio - Complete integrated studio experience
 * Drop this component into your page for the full nail design tool
 */
export function NailDesignStudio({ className = '' }) {
  const design = useNailDesign();

  return (
    <div className={`min-h-screen bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f0f23] ${className}`}>
      {/* Header */}
      <header className="text-center py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          Nail'd By
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            {' '}Steph
          </span>
        </h1>
        <p className="text-white/50 text-lg">Design your dream nails in 3D</p>
      </header>

      {/* Main Studio Area */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {/* Shape & Length Selectors */}
        <section className="mb-8">
          <div className="flex flex-wrap justify-center gap-6">
            {/* Shape selector */}
            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 text-center">
                Nail Shape
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.values(NAIL_SHAPES).map((shape) => (
                  <button
                    key={shape.id}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      design.selectedShape === shape.id
                        ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                    onClick={() => design.setShape(shape.id)}
                    title={shape.description}
                  >
                    {shape.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Length selector */}
            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 text-center">
                Length
              </h3>
              <div className="flex gap-2 justify-center">
                {Object.values(NAIL_LENGTHS).map((length) => (
                  <button
                    key={length.id}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      design.selectedLength === length.id
                        ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                    onClick={() => design.setLength(length.id)}
                    title={length.label}
                  >
                    {length.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3D Hand + Canvas Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 3D Hand Model */}
          <div className="flex flex-col items-center">
            <h2 className="text-sm text-white/40 uppercase tracking-wider mb-4">
              3D Preview
            </h2>
            <NailStudio3D
              nailDesigns={design.nailDesigns}
              selectedShape={design.selectedShape}
              selectedLength={design.selectedLength}
              activeNail={design.activeNail}
              onSelectNail={design.setActiveNail}
            />
          </div>

          {/* Drawing Canvas */}
          <div className="flex flex-col items-center">
            <h2 className="text-sm text-white/40 uppercase tracking-wider mb-4">
              Nail Art Canvas
            </h2>
            <NailCanvas
              selectedColor={design.selectedColor}
              selectedShape={design.selectedShape}
              selectedLength={design.selectedLength}
              activeTool={design.activeTool}
              brushSize={design.brushSize}
              brushStyle={design.brushStyle}
              opacity={design.opacity}
              onToolChange={design.setActiveTool}
              onBrushSizeChange={design.setBrushSize}
              onBrushStyleChange={design.setBrushStyle}
              onOpacityChange={design.setOpacity}
              onColorChange={design.setColor}
              onStrokeComplete={design.addStroke}
            />
          </div>
        </section>

        {/* Decorations */}
        <section className="mb-12">
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3 text-center">
            Decorations
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {NAIL_DECORATIONS.map((dec) => (
              <button
                key={dec.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  design.selectedDecoration === dec.id
                    ? 'bg-pink-500/20 border border-pink-500/50 text-pink-300'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
                onClick={() => design.setDecoration(dec.id)}
              >
                <span>{dec.icon}</span>
                <span>{dec.name}</span>
              </button>
            ))}
          </div>

          {/* Apply to all button */}
          <div className="text-center mt-4">
            <button
              className="px-6 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full text-sm text-pink-300 font-medium hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
              onClick={design.applyToAll}
            >
              Apply to All Nails
            </button>
          </div>
        </section>

        {/* Gallery */}
        <NailGallery />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-white/30 text-sm">
          &copy; {new Date().getFullYear()} Nail'd By Steph. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default NailDesignStudio;
