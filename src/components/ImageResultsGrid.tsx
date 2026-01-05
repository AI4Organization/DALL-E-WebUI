import {
  LoadingOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
  ZoomInOutlined,
  ReloadOutlined,
  StarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  Card,
  Button,
} from 'antd';
import { motion } from 'framer-motion';
import { memo, useState, useRef, useEffect } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Grid } from 'react-window';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';

import type {
  ImageGenerationItem,
  OpenAIImageResult,
} from '../../types';

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
  <Card className="glass-card overflow-hidden !border-0">
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
  <Card className="glass-card overflow-hidden !border-0 !border-red-500/30">
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
        className="!bg-accent-purple !border-accent-purple hover:!bg-accent-purple/80"
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
}>(({ id, result, prompt, imageUrl, canDownload, onPreview, onDownload }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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
    className="glass-card overflow-hidden !border-0 transition-all duration-300"
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
        <div className="absolute inset-0 bg-linear-to-t from-(--color-background) via-transparent to-transparent opacity-60 transition-opacity duration-300" />

        {/* Download loading overlay */}
        {isDownloading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
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
              <span className="text-white text-sm font-medium" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Downloading...
              </span>
            </motion.div>
          </div>
        )}

        {/* Image label at bottom */}
        <div className="absolute bottom-3 left-3">
          <h4 className="text-white font-semibold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Image #{id + 1}
          </h4>
        </div>

        {/* Zoom icon on hover */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <motion.div
            className="bg-black/40 backdrop-blur-sm rounded-full p-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ZoomInOutlined className="text-white text-3xl" />
          </motion.div>
        </div>

        {/* Download indicator */}
        <div
          className={`absolute top-3 left-3 flex items-center gap-2 bg-accent-purple/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'} ${!canDownload || isDownloading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
        >
          {isDownloading ? (
            <>
              <LoadingOutlined className="text-white text-sm animate-spin" />
              <span className="text-white text-xs font-medium">Downloading...</span>
            </>
          ) : (
            <>
              <DownloadOutlined className="text-white text-sm" />
              <span className="text-white text-xs font-medium">Download</span>
            </>
          )}
        </div>

        {/* Eye indicator for preview */}
        <div className={`absolute top-3 right-3 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
          <EyeOutlined className="text-white text-sm" />
          <span className="text-white text-xs font-medium">Preview</span>
        </div>

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(1200);
  const [columnCount, setColumnCount] = useState(3);

  // Calculate column count based on container width
  useEffect(() => {
    const updateGridSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setGridWidth(width);

        // Calculate columns based on breakpoints
        if (width < 576) {
          setColumnCount(1); // xs
        } else if (width < 992) {
          setColumnCount(2); // sm
        } else {
          setColumnCount(3); // lg
        }
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  // Calculate grid dimensions
  const rowHeight = 380; // Card height + gutter
  const columnWidth = (gridWidth - (columnCount - 1) * 16) / columnCount; // 16px gutter
  const rowCount = Math.ceil(items.length / columnCount);

  // Calculate progress stats
  const completedCount = items.filter(i => i.status === 'success').length;
  const failedCount = items.filter(i => i.status === 'error').length;
  const totalCount = items.length;
  const inProgress = items.some(i => i.status === 'pending' || i.status === 'loading');

  // Render individual cell in the grid
  const Cell = memo(({ columnIndex, rowIndex, style, data }: {
    columnIndex: number;
    rowIndex: number;
    style: React.CSSProperties;
    data: {
      columnCount: number;
      items: ImageGenerationItem[];
      prompt: string;
      onDownload: (imageUrl: string) => void;
      onPreview: (result: OpenAIImageResult, index: number) => void;
      onRetry: (id: number) => void;
      getDisplayUrl: (result: OpenAIImageResult) => string | null;
      hasDownloadableImage: (result: OpenAIImageResult) => boolean;
    };
  }) => {
    const index = rowIndex * data.columnCount + columnIndex;
    const item = data.items[index];

    if (!item) return null;

    return (
      <div style={{ ...style, padding: '8px' }}>
        {/* Loading Card */}
        {(item.status === 'pending' || item.status === 'loading') && (
          <LoadingCard id={item.id} />
        )}

        {/* Error Card */}
        {item.status === 'error' && (
          <ErrorCard
            id={item.id}
            error={item.error}
            onRetry={() => data.onRetry(item.id)}
          />
        )}

        {/* Success Card */}
        {item.status === 'success' && item.result && (() => {
          const imageUrl = data.getDisplayUrl(item.result);
          const canDownload = data.hasDownloadableImage(item.result);
          return imageUrl ? (
            <SuccessCard
              id={item.id}
              result={item.result!}
              prompt={data.prompt}
              imageUrl={imageUrl}
              canDownload={canDownload}
              onPreview={() => data.onPreview(item.result!, item.id)}
              onDownload={() => data.onDownload(imageUrl)}
            />
          ) : null;
        })()}
      </div>
    );
  });

  Cell.displayName = 'VirtualCell';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mb-8"
    >
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
              className="text-sm font-medium px-4 py-2 rounded-full bg-glass-light backdrop-blur-md border border-glass-border"
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

      {/* Virtual Grid Container */}
      <div ref={containerRef} className="w-full">
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={Math.min(rowCount * rowHeight, 800)} // Max height 800px, then scroll
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={gridWidth}
          itemData={{
            items,
            prompt,
            onDownload,
            onPreview,
            onRetry,
            getDisplayUrl,
            hasDownloadableImage,
            columnCount,
          }}
          overscanCount={2} // Render 2 extra rows/columns for smoother scrolling
        >
          {Cell}
        </Grid>
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
