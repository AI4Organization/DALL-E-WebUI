import {
  LoadingOutlined,
  DownloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ZoomInOutlined,
  ReloadOutlined,
  StarOutlined,
} from '@ant-design/icons';
import {
  Card,
  Button,
  Row,
  Col,
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { memo } from 'react';

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
const LoadingCard = memo<{ id: number; status: ImageGenerationStatus }>(({ id }) => (
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
}>(({ id, result, prompt, imageUrl, canDownload, onPreview, onDownload }) => (
  <Card
    hoverable
    className="glass-card overflow-hidden !border-0"
    cover={
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{ backgroundColor: 'var(--color-card-bg)' }}
        onClick={onPreview}
      >
        <img
          src={imageUrl}
          alt={`Generated image ${id + 1}`}
          className="!w-full transition-transform duration-300 hover:scale-105"
          style={{ height: 280, objectFit: 'cover' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
          <ZoomInOutlined className="text-white text-4xl drop-shadow-lg" />
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md rounded-full px-3 py-1 shadow-lg">
          <CheckCircleOutlined className="text-white text-sm" />
          <span className="text-white text-xs font-medium">Ready</span>
        </div>
      </div>
    }
    actions={[
      <Button
        key="download"
        type="primary"
        icon={<DownloadOutlined />}
        disabled={!canDownload}
        onClick={canDownload ? onDownload : undefined}
        className="!bg-accent-purple !border-accent-purple hover:!bg-accent-purple/80"
      >
        Download
      </Button>,
    ]}
  >
    <div className="text-white">
      <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Image #{id + 1}
      </h4>
      <p className="text-gray-400 text-sm line-clamp-3">
        {result.revised_prompt ?? prompt}
      </p>
    </div>
  </Card>
));
SuccessCard.displayName = 'SuccessCard';

type ImageGenerationStatus = 'pending' | 'loading' | 'success' | 'error';

/**
 * ImageResultsGrid - Displays generated images with loading, error, and success states
 *
 * Features:
 * - Progress counter showing completed/failed images
 * - Loading cards with animated spinner
 * - Error cards with retry button
 * - Success cards with preview and download actions
 * - Framer Motion animations for card appearance
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

      <Row gutter={[16, 16]}>
        <AnimatePresence>
          {items.map((item, index) => (
            <Col xs={24} sm={12} lg={8} key={item.id}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
                whileHover={{ y: -8 }}
              >
                {/* Loading Card */}
                {(item.status === 'pending' || item.status === 'loading') && (
                  <LoadingCard id={item.id} status={item.status} />
                )}

                {/* Error Card */}
                {item.status === 'error' && (
                  <ErrorCard
                    id={item.id}
                    error={item.error}
                    onRetry={() => onRetry(item.id)}
                  />
                )}

                {/* Success Card */}
                {item.status === 'success' && item.result && (() => {
                  const imageUrl = getDisplayUrl(item.result);
                  const canDownload = hasDownloadableImage(item.result);
                  return imageUrl ? (
                    <SuccessCard
                      id={item.id}
                      result={item.result!}
                      prompt={prompt}
                      imageUrl={imageUrl}
                      canDownload={canDownload}
                      onPreview={() => onPreview(item.result!, item.id)}
                      onDownload={() => onDownload(imageUrl)}
                    />
                  ) : null;
                })()}
              </motion.div>
            </Col>
          ))}
        </AnimatePresence>
      </Row>
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
