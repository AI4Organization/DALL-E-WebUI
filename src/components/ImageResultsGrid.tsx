import {
  LoadingOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  StarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  Card,
  Button,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { memo, useState, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';

import type {
  ImageGenerationItem,
  OpenAIImageResult,
} from '../../types';

// ============ Progress Bar Component ============
const GenerationProgress = memo<{
  completed: number;
  total: number;
  failed: number;
}>(({ completed, total, failed }) => {
  const percentage = (completed / total) * 100;
  const isComplete = completed + failed >= total;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-xl glass-card mb-6"
    >
      {/* Circular progress */}
      <div className="relative w-16 h-16 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={isComplete ? '#22d3d3' : '#a855f7'}
            strokeWidth="3"
            strokeDasharray={`${percentage}, 100`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">
            {isComplete ? '✓' : completed}
          </span>
        </div>
      </div>

      {/* Status text */}
      <div className="flex-1">
        <h4 className="text-white font-semibold">
          {isComplete ? 'Generation Complete!' : 'Generating Images...'}
        </h4>
        <p className="text-sm text-gray-400">
          {completed} of {total} images ready
          {failed > 0 && ` • ${failed} failed`}
        </p>
      </div>

      {/* Animated activity indicator */}
      {!isComplete && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-3 h-3 rounded-full bg-accent-purple shrink-0"
        />
      )}
    </motion.div>
  );
});
GenerationProgress.displayName = 'GenerationProgress';

// ============ Tilt Card Component ============
const TiltCard = memo<{
  children: React.ReactNode;
  className?: string;
}>(({ children, className }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateXValue = ((y - centerY) / centerY) * -5;
    const rotateYValue = ((x - centerX) / centerX) * 5;
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
});
TiltCard.displayName = 'TiltCard';

export interface ImageResultsGridProps {
  /** Array of image generation items */
  items: ImageGenerationItem[];
  /** Original prompt for display */
  prompt: string;
  /** Callback to download an image */
  onDownload: (imageUrl: string) => void;
  /** Callback to open preview modal */
  onPreview: (result: OpenAIImageResult, index: number) => void;
  /** Callback to retry a failed image */
  onRetry: (id: number) => void;
  /** Helper function to get display URL for an image result */
  getDisplayUrl: (result: OpenAIImageResult) => string | null;
  /** Helper function to check if image can be downloaded */
  hasDownloadableImage: (result: OpenAIImageResult) => boolean;
}

// Memoized individual card components
const LoadingCard = memo<{ id: number }>(({ id }) => (
  <Card className="glass-card overflow-hidden border-0!">
    <div className="flex flex-col items-center justify-center py-12" style={{ minHeight: 360 }}>
      <div className="relative">
        <motion.div
          className="w-16 h-16 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingOutlined className="text-2xl text-white" />
        </div>
      </div>
      <h4 className="text-white font-semibold text-lg mt-4 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Image #{id + 1}
      </h4>
      <p className="text-gray-400 text-sm">
        Generating...
      </p>
    </div>
  </Card>
));
LoadingCard.displayName = 'LoadingCard';

const ErrorCard = memo<{ id: number; error?: string; onRetry: () => void }>(({ id, error, onRetry }) => (
  <Card className="glass-card overflow-hidden border-0! border-red-500/30!">
    <div className="flex flex-col items-center justify-center py-8 text-center" style={{ minHeight: 360 }}>
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <CloseCircleOutlined className="text-4xl text-red-400" />
      </div>
      <h4 className="text-white font-semibold text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Image #{id + 1}
      </h4>
      <p className="text-red-400 text-sm mb-4 px-4">
        {error || 'Generation failed'}
      </p>
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        onClick={onRetry}
        className="bg-accent-purple! border-accent-purple! hover:bg-accent-purple/80!"
      >
        Retry
      </Button>
    </div>
  </Card>
));
ErrorCard.displayName = 'ErrorCard';

const SuccessCard = memo<{
  id: number;
  result: OpenAIImageResult;
  prompt: string;
  imageUrl: string;
  canDownload: boolean;
  onPreview: () => void;
  onDownload: () => void;
}>(({ id, result: _result, prompt: _prompt, imageUrl, canDownload, onPreview, onDownload }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewTooltipVisible, setPreviewTooltipVisible] = useState(false);
  const [downloadTooltipVisible, setDownloadTooltipVisible] = useState(false);

  const handleDownload = async () => {
    if (!canDownload || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
  <Card
    hoverable
    className="glass-card overflow-hidden border-0! transition-all duration-300"
    bodyStyle={{ padding: 0 }}
    style={{
      boxShadow: isHovered ? '0 20px 40px rgba(168, 85, 247, 0.15)' : 'none',
      transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    }}
    cover={
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ backgroundColor: 'var(--color-card-bg)' }}
        onClick={onPreview}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Skeleton placeholder */}
        {!isLoaded && (
          <div
            className="absolute inset-0 skeleton-loading"
            style={{
              height: 280,
              background: 'linear-gradient(90deg, var(--color-card-bg) 0%, rgba(255,255,255,0.05) 50%, var(--color-card-bg) 100%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
            }}
          />
        )}

        {/* Lazy loaded image with blur effect */}
        <LazyLoadImage
          src={imageUrl}
          alt={`Generated image ${id + 1}`}
          effect="blur"
          threshold={200}
          className="w-full! transition-all duration-500 ease-out"
          style={{
            height: 280,
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            filter: isDownloading ? 'blur(8px)' : 'none',
          }}
          afterLoad={() => setIsLoaded(true)}
          wrapperClassName="w-full h-full"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 opacity-60 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to top, var(--color-background), transparent, transparent)',
          }}
        />

        {/* Download loading overlay */}
        {isDownloading && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm font-medium" style={{ fontFamily: "'Outfit', sans-serif", color: 'var(--color-text-primary)' }}>
                Downloading...
              </span>
            </motion.div>
          </div>
        )}

        {/* Image label at bottom */}
        <div className="absolute bottom-3 left-3">
          <h4 className="text-primary font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Image #{id + 1}
          </h4>
        </div>

        {/* Enhanced Action Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2
                     px-3 py-2 rounded-full backdrop-blur-md z-10"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          {/* Preview Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors relative"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.8)';
              setPreviewTooltipVisible(true);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              setPreviewTooltipVisible(false);
            }}
          >
            <EyeOutlined style={{ color: 'var(--color-text-primary)' }} className="text-lg" />
            <span
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5
                             rounded text-xs whitespace-nowrap transition-opacity duration-200 pointer-events-none"
              style={{
                opacity: previewTooltipVisible ? 1 : 0,
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              Preview
            </span>
          </motion.button>

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              void handleDownload();
            }}
            disabled={!canDownload || isDownloading}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors relative"
            style={{
              backgroundColor: canDownload && !isDownloading ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              opacity: canDownload && !isDownloading ? 1 : 0.5,
              cursor: canDownload && !isDownloading ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (canDownload && !isDownloading) {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.8)';
                setDownloadTooltipVisible(true);
              }
            }}
            onMouseLeave={(e) => {
              if (canDownload && !isDownloading) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }
              setDownloadTooltipVisible(false);
            }}
          >
            {isDownloading ? (
              <LoadingOutlined style={{ color: 'var(--color-text-primary)' }} className="text-lg animate-spin" />
            ) : (
              <DownloadOutlined style={{ color: 'var(--color-text-primary)' }} className="text-lg" />
            )}
            <span
              className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5
                             rounded text-xs whitespace-nowrap transition-opacity duration-200 pointer-events-none"
              style={{
                opacity: downloadTooltipVisible ? 1 : 0,
                backgroundColor: 'var(--color-card-bg)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-glass-border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              Download
            </span>
          </motion.button>
        </motion.div>

        {/* Glow effect on hover */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          }}
        />
      </div>
    }
  />
);
});
SuccessCard.displayName = 'SuccessCard';

/**
 * ImageResultsGrid - Displays generated images with high-performance virtual scrolling
 *
 * Features:
 * - Virtual scrolling with react-window for large grids (100+ images)
 * - Lazy loading with Intersection Observer API
 * - Blur-up effect for smooth image appearance
 * - Skeleton placeholders during load
 * - Enhanced hover effects with glow and scale
 * - Progress counter showing completed/failed images
 * - Loading cards with animated spinner
 * - Error cards with retry button
 * - Success cards with preview and download actions
 * - Responsive grid with dynamic column calculation
 */
export const ImageResultsGrid = memo<ImageResultsGridProps>(({
  items,
  prompt,
  onDownload,
  onPreview,
  onRetry,
  getDisplayUrl,
  hasDownloadableImage,
}) => {
  // Calculate column count based on window width
  const [columnCount, setColumnCount] = useState(3);

  // Calculate column count based on window width
  useEffect(() => {
    const updateColumnCount = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 576) {
          setColumnCount(1); // xs
        } else if (width < 992) {
          setColumnCount(2); // sm
        } else {
          setColumnCount(3); // lg
        }
      }
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  // Calculate progress stats
  const completedCount = items.filter(i => i.status === 'success').length;
  const failedCount = items.filter(i => i.status === 'error').length;
  const totalCount = items.length;
  const inProgress = items.some(i => i.status === 'pending' || i.status === 'loading');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-8"
    >
      {/* Visual Progress Bar */}
      {inProgress && (
        <GenerationProgress
          completed={completedCount}
          total={totalCount}
          failed={failedCount}
        />
      )}

      {/* Progress Counter */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <StarOutlined className="text-accent-cyan" />
          Generated Images
          <span className="text-sm font-normal text-gray-500">
            ({totalCount} image{totalCount !== 1 ? 's' : ''})
          </span>
        </h3>
        {/* Progress Counter */}
        {(inProgress || completedCount > 0 || failedCount > 0) && (
          <div className="flex items-center gap-2">
            <motion.span
              key={`progress-${completedCount}-${failedCount}`}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-sm font-medium px-4 py-2 rounded-full backdrop-blur-md border"
              style={{
                backgroundColor: 'var(--color-glass-light)',
                borderColor: 'var(--color-glass-border)',
              }}
            >
              <span className="text-gray-300">
                Generated: <span className="text-accent-cyan font-bold">{completedCount}</span>/{totalCount}
              </span>
              {failedCount > 0 && (
                <span className="ml-3 text-red-400">
                  ({failedCount} failed)
                </span>
              )}
            </motion.span>
          </div>
        )}
      </div>

      {/* Images Grid Container - Standard CSS Grid */}
      <div className="w-full">
        {items.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-4"
            style={{
              gridTemplateColumns: columnCount === 1 ? 'repeat(1, 1fr)' :
                                   columnCount === 2 ? 'repeat(2, 1fr)' :
                                   'repeat(3, 1fr)',
            }}
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  {item.status === 'pending' || item.status === 'loading' ? (
                    <LoadingCard id={item.id} />
                  ) : item.status === 'error' ? (
                    <ErrorCard
                      id={item.id}
                      error={item.error}
                      onRetry={() => onRetry(item.id)}
                    />
                  ) : item.status === 'success' && item.result ? (
                    <TiltCard className="perspective-1000">
                      <SuccessCard
                        id={item.id}
                        result={item.result}
                        prompt={prompt}
                        imageUrl={getDisplayUrl(item.result) || ''}
                        canDownload={hasDownloadableImage(item.result)}
                        onPreview={() => onPreview(item.result!, index)}
                        onDownload={() => onDownload(getDisplayUrl(item.result!) || '')}
                      />
                    </TiltCard>
                  ) : null}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Empty state placeholder
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">No images to display</p>
          </div>
        )}
      </div>

      {/* Custom CSS for skeleton shimmer animation */}
      <style>{`
        @keyframes skeleton-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Lazy load image blur effect customization */
        .image-with-blur {
          filter: blur(15px);
          transition: filter 0.5s ease-in-out;
        }

        .image-with-blur.loaded {
          filter: blur(0);
        }

        /* Glass card enhancement */
        .glass-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          transform: translateY(-8px);
        }

        /* Content visibility for image cards */
        .glass-card {
          content-visibility: auto;
          contain-intrinsic-size: 0 300px;
        }
      `}</style>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if items or prompt change
  return (
    prevProps.items === nextProps.items &&
    prevProps.prompt === nextProps.prompt
  );
});

ImageResultsGrid.displayName = 'ImageResultsGrid';
