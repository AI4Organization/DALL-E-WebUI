import {
  ZoomInOutlined,
  ZoomOutOutlined,
  CompressOutlined,
  ExpandOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Modal, Button, Tooltip, Slider } from 'antd';
import { motion } from 'framer-motion';
import { memo, useEffect } from 'react';

import type { OpenAIImageResult } from '../../types';
import type { FitMode } from '../../types';
import { useImagePreview } from '../hooks/useImagePreview';
import { useTheme } from '../lib/theme';

export interface PreviewModalProps {
  /** Array of images for navigation */
  navigationImages: OpenAIImageResult[];
  /** Current navigation index */
  currentNavIndex: number;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback to navigate to previous image */
  onNavigatePrevious: () => void;
  /** Callback to navigate to next image */
  onNavigateNext: () => void;
  /** Callback to get display URL for an image */
  getDisplayUrl: (result: OpenAIImageResult) => string | null;
}

/**
 * PreviewModal - Image preview modal with zoom, pan, and navigation controls
 *
 * Features:
 * - Zoom controls (50%-500%) via slider, mouse wheel, and keyboard
 * - Pan by dragging when zoomed in or in actual size mode
 * - Fit modes: Contain, Actual (100%), Fill
 * - Fullscreen toggle (F11)
 * - Image navigation with arrow keys or swipe gestures
 * - Keyboard shortcuts: ESC (close), +/- (zoom), 0 (reset), F (fit mode)
 */
export const PreviewModal = memo<PreviewModalProps>(({
  navigationImages,
  currentNavIndex,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
  getDisplayUrl,
}) => {
  const { theme } = useTheme();

  const {
    previewState,
    closePreview,
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
  } = useImagePreview();

  // Sync closePreview with onClose prop
  useEffect(() => {
    if (previewState === null) {
      onClose?.();
    }
  }, [previewState, onClose]);

  // Handle keyboard shortcuts
  const handleKeyDownWrapper = (e: React.KeyboardEvent) => {
    // Handle arrow key navigation through parent callbacks
    if (e.key === 'ArrowLeft') {
      if (currentNavIndex > 0) {
        onNavigatePrevious();
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowRight') {
      if (currentNavIndex < navigationImages.length - 1) {
        onNavigateNext();
      }
      e.preventDefault();
      return;
    }
    // Handle other keyboard shortcuts through the hook
    handleKeyDown(e);
  };

  // Handle fit mode change
  const handleFitModeChange = (mode: FitMode) => {
    setFitMode(mode);
  };

  // Current image display
  const currentImage = navigationImages[currentNavIndex];
  const currentImageUrl = currentImage ? getDisplayUrl(currentImage) : null;

  return (
    <Modal
      open={previewState !== null}
      onCancel={closePreview}
      footer={null}
      centered
      width="95vw"
      style={{ maxWidth: '1920px', top: 20 }}
      className="image-preview-modal"
      closeIcon={null}
      title={null}
      rootClassName="image-preview-modal-root"
      wrapClassName="image-preview-modal-wrap"
    >
      {/* Image Container with Zoom/Pan */}
      <div
        className="relative preview-image-container"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(10, 10, 18, 0.3)' : 'rgba(248, 249, 252, 0.3)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          height: '90vh',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : (zoomLevel > 100 || fitMode === 'actual') ? 'grab' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDownWrapper}
        tabIndex={0}
      >
        {currentImageUrl && (
          <motion.div
            key={currentImageUrl}
            className="preview-image-wrapper"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.img
              src={currentImageUrl}
              alt={`Preview ${currentNavIndex + 1}`}
              draggable={false}
              className="preview-image"
              style={{
                maxWidth: fitMode === 'fill' ? '100%' : '100%',
                maxHeight: fitMode === 'fill' ? '100%' : '100%',
                objectFit: fitMode === 'contain' ? 'contain' : fitMode === 'fill' ? 'fill' : 'none',
                transform: `scale(${zoomLevel / 100}) translate(${panPosition.x / (zoomLevel / 100)}px, ${panPosition.y / (zoomLevel / 100)}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                userSelect: 'none',
              }}
              onDoubleClick={zoomReset}
            />
          </motion.div>
        )}

        {/* Floating Control Bar - Always Visible */}
        <div
          className="preview-floating-controls absolute bottom-0 left-0 right-0 flex items-center gap-3 px-6 py-3 rounded-t-[12px] rounded-b-0 backdrop-blur-xl"
          style={{
            flexWrap: 'wrap',
            justifyContent: 'center',
            backgroundColor: theme === 'dark' ? 'rgba(10, 10, 18, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            border: 'none',
            outline: 'none',
          }}
        >
          {/* Zoom Controls */}
          <div className="control-button-group flex items-center gap-2">
            <Tooltip title="Zoom Out (-)">
              <Button
                type="text"
                icon={<ZoomOutOutlined />}
                onClick={zoomOut}
                disabled={zoomLevel <= 50}
                className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
              />
            </Tooltip>

            <div className="flex items-center gap-2 px-2">
              <Slider
                min={50}
                max={500}
                value={zoomLevel}
                onChange={setZoomLevel}
                step={25}
                className="!w-24"
                tooltip={{ formatter: (value) => `${value}%` }}
                styles={{
                  rail: { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' },
                  track: { backgroundColor: 'rgba(168, 85, 247, 0.8)' },
                  handle: { borderColor: '#a855f7', backgroundColor: '#a855f7' },
                }}
              />
              <span className={!theme || theme === 'dark' ? 'text-white' : 'text-gray-900'} style={{ fontSize: '14px', fontWeight: 500, minWidth: '50px', textAlign: 'center' } as React.CSSProperties}>
                {zoomLevel}%
              </span>
            </div>

            <Tooltip title="Zoom In (+)">
              <Button
                type="text"
                icon={<ZoomInOutlined />}
                onClick={zoomIn}
                disabled={zoomLevel >= 500}
                className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
              />
            </Tooltip>

            <Tooltip title="Reset Zoom (0 or Double-click)">
              <Button
                type="text"
                icon={<CompressOutlined />}
                onClick={zoomReset}
                className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
              />
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

          {/* Fit Mode Toggle */}
          <Tooltip title={`Fit Mode: ${fitMode} (Press F to cycle)`}>
            <Button
              type="text"
              icon={fitMode === 'contain' ? <CompressOutlined /> : fitMode === 'actual' ? <ExpandOutlined /> : <ExpandOutlined />}
              onClick={() => {
                const modes: Array<'contain' | 'actual' | 'fill'> = ['contain', 'actual', 'fill'];
                const currentIdx = modes.indexOf(fitMode);
                if (currentIdx >= 0) {
                  handleFitModeChange(modes[(currentIdx + 1) % modes.length]!);
                }
              }}
              className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none !font-medium' : '!text-gray-900 hover:!bg-gray-900/10 !border-none !font-medium'}
            >
              {fitMode === 'contain' ? 'Fit' : fitMode === 'actual' ? '100%' : 'Fill'}
            </Button>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

          {/* Navigation */}
          <div className="control-button-group flex items-center gap-1">
            <Tooltip title="Previous Image (Left Arrow)">
              <Button
                type="text"
                icon={<LeftOutlined />}
                onClick={onNavigatePrevious}
                disabled={currentNavIndex === 0}
                className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
              />
            </Tooltip>

            <span className={!theme || theme === 'dark' ? 'text-white' : 'text-gray-900'} style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px', textAlign: 'center' } as React.CSSProperties}>
              {navigationImages.length > 0 ? `${currentNavIndex + 1} / ${navigationImages.length}` : 'Preview'}
            </span>

            <Tooltip title="Next Image (Right Arrow)">
              <Button
                type="text"
                icon={<RightOutlined />}
                onClick={onNavigateNext}
                disabled={currentNavIndex >= navigationImages.length - 1 || navigationImages.length === 0}
                className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
              />
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

          {/* Fullscreen Toggle */}
          <Tooltip title="Fullscreen (F11)">
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
            />
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

          {/* Close Button */}
          <Tooltip title="Close (ESC)">
            <Button
              type="text"
              onClick={closePreview}
              className={!theme || theme === 'dark' ? '!text-white hover:!bg-red-500/20 !border-none !text-lg' : '!text-gray-900 hover:!bg-red-500/20 !border-none !text-lg'}
            >
              ✕
            </Button>
          </Tooltip>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-full px-4 py-2 text-xs pointer-events-none"
          style={{
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
            color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          }}
        >
          +/-: Zoom • 0: Reset • F: Fit Mode • F11: Fullscreen • ESC: Close
        </div>
      </div>

      {/* Modal Styles */}
      <style>{`
        .image-preview-modal-root .ant-modal-content {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        .image-preview-modal-root .ant-modal-body {
          padding: 0;
          background: transparent;
        }
        .image-preview-modal-wrap .ant-modal-mask {
          background: rgba(10, 10, 18, 0.95) !important;
          backdrop-filter: blur(10px);
        }

        /* Enhanced Preview Modal Styles */
        .preview-image-container {
          position: relative;
          overflow: hidden;
        }

        .preview-image-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }

        .preview-image {
          display: block;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          pointer-events: none;
        }

        .preview-floating-controls {
          z-index: 1000;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .preview-floating-controls .ant-slider {
          margin: 0;
        }

        .preview-floating-controls .ant-slider-rail {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .preview-floating-controls .ant-slider-track {
          background-color: rgba(168, 85, 247, 0.8) !important;
        }

        .preview-floating-controls .ant-slider-handle {
          border: none !important;
          background-color: #a855f7 !important;
          box-shadow: none !important;
        }

        .control-button-group {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .control-button-group .ant-btn {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          transition: background-color 0.2s ease, transform 0.1s ease;
        }

        .control-button-group .ant-btn:active {
          transform: scale(0.95);
        }

        .control-button-group .ant-btn:focus,
        .control-button-group .ant-btn:focus-visible {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .control-button-group .ant-btn-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  );
}, (prevProps, nextProps) => {
  // Only re-render if navigationImages or currentNavIndex changes
  return (
    prevProps.navigationImages === nextProps.navigationImages &&
    prevProps.currentNavIndex === nextProps.currentNavIndex
  );
});

PreviewModal.displayName = 'PreviewModal';
