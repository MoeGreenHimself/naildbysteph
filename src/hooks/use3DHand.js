/**
 * use3DHand - Hook for managing the 3D hand model state and interactions
 * Handles rotation, zoom, nail selection on the 3D model, and real-time updates
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { FINGER_POSITIONS } from '../data/nailShapes';

const DEFAULT_ROTATION = { x: -15, y: 20, z: 0 };
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ROTATION_SENSITIVITY = 0.5;
const ZOOM_SENSITIVITY = 0.002;

/**
 * @typedef {Object} HandState
 * @property {{ x: number, y: number, z: number }} rotation - Current rotation angles
 * @property {number} zoom - Current zoom level
 * @property {string|null} hoveredFinger - Finger currently hovered
 * @property {string} selectedFinger - Currently selected finger
 * @property {boolean} isDragging - Whether user is dragging to rotate
 * @property {boolean} isAnimating - Whether an animation is in progress
 */

export function use3DHand(options = {}) {
  const {
    initialRotation = DEFAULT_ROTATION,
    initialZoom = DEFAULT_ZOOM,
    onFingerSelect,
    autoRotate = false,
    autoRotateSpeed = 0.3,
  } = options;

  const [rotation, setRotation] = useState(initialRotation);
  const [zoom, setZoom] = useState(initialZoom);
  const [hoveredFinger, setHoveredFinger] = useState(null);
  const [selectedFinger, setSelectedFinger] = useState('middle');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const rotationStartRef = useRef(initialRotation);
  const animationFrameRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate || isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setRotation((prev) => ({
        ...prev,
        y: prev.y + autoRotateSpeed * delta * 60,
      }));

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [autoRotate, autoRotateSpeed, isDragging]);

  // Handle mouse/touch drag start
  const handleDragStart = useCallback((e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    rotationStartRef.current = { ...rotation };
  }, [rotation]);

  // Handle mouse/touch drag move
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = (clientX - dragStartRef.current.x) * ROTATION_SENSITIVITY;
    const deltaY = (clientY - dragStartRef.current.y) * ROTATION_SENSITIVITY;

    setRotation({
      x: Math.max(-60, Math.min(60, rotationStartRef.current.x - deltaY)),
      y: rotationStartRef.current.y + deltaX,
      z: rotationStartRef.current.z,
    });
  }, [isDragging]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle zoom (scroll wheel)
  const handleZoom = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * ZOOM_SENSITIVITY;
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
  }, []);

  // Handle pinch zoom (touch)
  const pinchRef = useRef({ distance: 0 });

  const handlePinchStart = useCallback((e) => {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.distance = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handlePinchMove = useCallback((e) => {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const delta = (newDistance - pinchRef.current.distance) * 0.005;
      pinchRef.current.distance = newDistance;
      setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
    }
  }, []);

  // Select a finger
  const selectFinger = useCallback((finger) => {
    if (!FINGER_POSITIONS[finger]) return;
    setSelectedFinger(finger);
    if (onFingerSelect) onFingerSelect(finger);
  }, [onFingerSelect]);

  // Animate rotation to a target
  const animateToView = useCallback((targetRotation, duration = 500) => {
    setIsAnimating(true);
    const startRotation = { ...rotation };
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setRotation({
        x: startRotation.x + (targetRotation.x - startRotation.x) * eased,
        y: startRotation.y + (targetRotation.y - startRotation.y) * eased,
        z: startRotation.z + (targetRotation.z - startRotation.z) * eased,
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [rotation]);

  // Preset views
  const viewPresets = {
    front: { x: 0, y: 0, z: 0 },
    back: { x: 0, y: 180, z: 0 },
    left: { x: 0, y: -90, z: 0 },
    right: { x: 0, y: 90, z: 0 },
    top: { x: -60, y: 0, z: 0 },
    angle: { x: -15, y: 25, z: 5 },
  };

  const setView = useCallback((viewName) => {
    if (viewPresets[viewName]) {
      animateToView(viewPresets[viewName]);
    }
  }, [animateToView]);

  // Reset view
  const resetView = useCallback(() => {
    animateToView(DEFAULT_ROTATION);
    setZoom(DEFAULT_ZOOM);
  }, [animateToView]);

  // Get CSS transform string for the hand
  const getTransformStyle = useCallback(() => {
    return {
      transform: `
        perspective(1200px)
        scale(${zoom})
        rotateX(${rotation.x}deg)
        rotateY(${rotation.y}deg)
        rotateZ(${rotation.z}deg)
      `,
      transition: isAnimating ? 'none' : isDragging ? 'none' : 'transform 0.1s ease-out',
    };
  }, [rotation, zoom, isDragging, isAnimating]);

  // Get individual nail transform based on finger position and rotation
  const getNailTransform = useCallback((finger) => {
    const pos = FINGER_POSITIONS[finger];
    if (!pos) return {};

    return {
      transform: `
        translate3d(${pos.position.x}px, ${pos.position.y}px, ${pos.position.z}px)
        rotateX(${pos.rotation.x}deg)
        rotateY(${pos.rotation.y}deg)
        rotateZ(${pos.rotation.z}deg)
        scale(${pos.scale})
      `,
    };
  }, []);

  // Attach event listeners to container
  const attachToContainer = useCallback((element) => {
    containerRef.current = element;
    if (!element) return;

    element.addEventListener('wheel', handleZoom, { passive: false });

    return () => {
      element.removeEventListener('wheel', handleZoom);
    };
  }, [handleZoom]);

  return {
    // State
    rotation,
    zoom,
    hoveredFinger,
    selectedFinger,
    isDragging,
    isAnimating,
    containerRef,

    // Event handlers
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleZoom,
    handlePinchStart,
    handlePinchMove,

    // Actions
    selectFinger,
    setHoveredFinger,
    setView,
    resetView,
    animateToView,
    attachToContainer,

    // Computed
    getTransformStyle,
    getNailTransform,
    viewPresets,
  };
}

export default use3DHand;
