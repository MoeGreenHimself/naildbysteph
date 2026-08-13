/**
 * useNailDesign - Core state management hook for the Nail Design Studio
 * Manages selected colors, shapes, decorations, tool state, and undo/redo history
 */

import { useState, useCallback, useRef } from 'react';
import { NAIL_COLORS } from '../utils/colorUtils';
import { NAIL_SHAPES, NAIL_LENGTHS, NAIL_DECORATIONS } from '../data/nailShapes';

const MAX_HISTORY = 50;

/**
 * @typedef {Object} NailDesignState
 * @property {string} selectedColor - Current nail color (hex)
 * @property {string} selectedShape - Current nail shape ID
 * @property {string} selectedLength - Current nail length ID
 * @property {string} selectedDecoration - Current decoration ID
 * @property {string} activeTool - Active tool ('pen' | 'fill' | 'eraser' | 'select')
 * @property {number} brushSize - Pen/eraser brush size
 * @property {string} brushStyle - Brush style ID
 * @property {number} opacity - Tool opacity (0-1)
 * @property {string} activeNail - Currently selected finger
 * @property {Object} nailDesigns - Per-finger design data
 */

const DEFAULT_STATE = {
  selectedColor: NAIL_COLORS[0].hex,
  selectedShape: 'almond',
  selectedLength: 'medium',
  selectedDecoration: 'none',
  activeTool: 'pen',
  brushSize: 4,
  brushStyle: 'round',
  opacity: 1,
  activeNail: 'middle',
  nailDesigns: {
    thumb: { color: NAIL_COLORS[0].hex, decoration: 'none', strokes: [] },
    index: { color: NAIL_COLORS[0].hex, decoration: 'none', strokes: [] },
    middle: { color: NAIL_COLORS[0].hex, decoration: 'none', strokes: [] },
    ring: { color: NAIL_COLORS[0].hex, decoration: 'none', strokes: [] },
    pinky: { color: NAIL_COLORS[0].hex, decoration: 'none', strokes: [] },
  },
};

export function useNailDesign(initialState = {}) {
  const [state, setState] = useState({ ...DEFAULT_STATE, ...initialState });
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  // Save state to history for undo/redo
  const saveToHistory = useCallback((newState) => {
    const history = historyRef.current;
    const index = historyIndexRef.current;

    // Trim any future states if we've undone
    const trimmed = history.slice(0, index + 1);
    trimmed.push(JSON.parse(JSON.stringify(newState)));

    // Limit history size
    if (trimmed.length > MAX_HISTORY) {
      trimmed.shift();
    }

    historyRef.current = trimmed;
    historyIndexRef.current = trimmed.length - 1;
  }, []);

  // Set color for active nail
  const setColor = useCallback((color) => {
    setState((prev) => {
      const newState = {
        ...prev,
        selectedColor: color,
        nailDesigns: {
          ...prev.nailDesigns,
          [prev.activeNail]: {
            ...prev.nailDesigns[prev.activeNail],
            color,
          },
        },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Set nail shape
  const setShape = useCallback((shapeId) => {
    if (!NAIL_SHAPES[shapeId]) return;
    setState((prev) => {
      const newState = { ...prev, selectedShape: shapeId };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Set nail length
  const setLength = useCallback((lengthId) => {
    if (!NAIL_LENGTHS[lengthId]) return;
    setState((prev) => {
      const newState = { ...prev, selectedLength: lengthId };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Set decoration
  const setDecoration = useCallback((decorationId) => {
    setState((prev) => {
      const newState = {
        ...prev,
        selectedDecoration: decorationId,
        nailDesigns: {
          ...prev.nailDesigns,
          [prev.activeNail]: {
            ...prev.nailDesigns[prev.activeNail],
            decoration: decorationId,
          },
        },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Set active tool
  const setActiveTool = useCallback((tool) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  // Set brush size
  const setBrushSize = useCallback((size) => {
    setState((prev) => ({ ...prev, brushSize: Math.max(1, Math.min(50, size)) }));
  }, []);

  // Set brush style
  const setBrushStyle = useCallback((style) => {
    setState((prev) => ({ ...prev, brushStyle: style }));
  }, []);

  // Set opacity
  const setOpacity = useCallback((opacity) => {
    setState((prev) => ({ ...prev, opacity: Math.max(0, Math.min(1, opacity)) }));
  }, []);

  // Set active nail (finger)
  const setActiveNail = useCallback((finger) => {
    setState((prev) => ({ ...prev, activeNail: finger }));
  }, []);

  // Add a stroke to the active nail
  const addStroke = useCallback((stroke) => {
    setState((prev) => {
      const newState = {
        ...prev,
        nailDesigns: {
          ...prev.nailDesigns,
          [prev.activeNail]: {
            ...prev.nailDesigns[prev.activeNail],
            strokes: [...prev.nailDesigns[prev.activeNail].strokes, stroke],
          },
        },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Clear all strokes on the active nail
  const clearActiveNail = useCallback(() => {
    setState((prev) => {
      const newState = {
        ...prev,
        nailDesigns: {
          ...prev.nailDesigns,
          [prev.activeNail]: {
            ...prev.nailDesigns[prev.activeNail],
            strokes: [],
          },
        },
      };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Apply color to all nails
  const applyToAll = useCallback(() => {
    setState((prev) => {
      const updatedDesigns = {};
      Object.keys(prev.nailDesigns).forEach((finger) => {
        updatedDesigns[finger] = {
          ...prev.nailDesigns[finger],
          color: prev.selectedColor,
          decoration: prev.selectedDecoration,
        };
      });
      const newState = { ...prev, nailDesigns: updatedDesigns };
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  // Undo
  const undo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index > 0) {
      historyIndexRef.current = index - 1;
      const prevState = historyRef.current[index - 1];
      setState(prevState);
    }
  }, []);

  // Redo
  const redo = useCallback(() => {
    const index = historyIndexRef.current;
    const history = historyRef.current;
    if (index < history.length - 1) {
      historyIndexRef.current = index + 1;
      setState(history[index + 1]);
    }
  }, []);

  // Check if undo/redo are available
  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Reset to defaults
  const resetDesign = useCallback(() => {
    const newState = { ...DEFAULT_STATE };
    setState(newState);
    historyRef.current = [newState];
    historyIndexRef.current = 0;
  }, []);

  return {
    ...state,
    setColor,
    setShape,
    setLength,
    setDecoration,
    setActiveTool,
    setBrushSize,
    setBrushStyle,
    setOpacity,
    setActiveNail,
    addStroke,
    clearActiveNail,
    applyToAll,
    undo,
    redo,
    canUndo,
    canRedo,
    resetDesign,
  };
}

export default useNailDesign;
