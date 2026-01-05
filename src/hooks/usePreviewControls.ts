import { useCallback, useRef, useState, useEffect } from 'react';

export type FitMode = 'contain' | 'actual' | 'fill';

const ZOOM_MIN = 50;
const ZOOM_MAX = 500;
const ZOOM_STEP = 25;

/**
 * Custom hook for managing image preview UI controls (zoom, pan, fit mode, fullscreen)
 *
 * This hook does NOT manage navigation state - only the UI interactions.
 * Navigation should be managed by the parent component via props.
 *
 * Features:
 * - Zoom (50-500%) with mouse wheel and keyboard shortcuts
 * - Pan (drag when zoomed in or actual size mode)
 * - Fit modes (contain, actual, fill)
 * - Keyboard shortcuts for all actions
 * - Touch gestures for mobile
 */
export function usePreviewControls() {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, ZOOM_MAX));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, ZOOM_MIN));
  }, []);

  const zoomReset = useCallback(() => {
    setZoomLevel(100);
    setPanPosition({ x: 0, y: 0 });
    setFitMode('contain');
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 100 || fitMode === 'actual') {
      setIsDragging(true);
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [zoomLevel, fitMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStartPosRef.current) return;

    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;

    setPanPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartPosRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only zoom if Ctrl/Cmd key is pressed
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    } else {
      // Pan with scroll wheel
      setPanPosition(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  }, [zoomIn, zoomOut]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
    // State is updated by the fullscreenchange event listener
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, onClose?: () => void) => {
    switch (e.key) {
      case 'Escape':
        onClose?.();
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
      case '_':
        zoomOut();
        break;
      case '0':
        zoomReset();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  }, [zoomIn, zoomOut, zoomReset, toggleFullscreen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      setTouchStart(touch.clientX);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, onNavigatePrevious?: () => void, onNavigateNext?: () => void) => {
    if (!touchStart) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStart;

    // Swipe threshold
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        onNavigatePrevious?.();
      } else {
        onNavigateNext?.();
      }
    }

    setTouchStart(null);
  }, [touchStart]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    zoomReset,
    panPosition,
    fitMode,
    setFitMode,
    isFullscreen,
    toggleFullscreen,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleKeyDown,
    handleTouchStart,
    handleTouchEnd,
  };
}
