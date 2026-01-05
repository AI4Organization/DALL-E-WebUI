import { PictureOutlined } from '@ant-design/icons';
import { motion, type Variants } from 'framer-motion';
import { memo } from 'react';

export interface EmptyStateProps {
  /** Variants for Framer Motion animations */
  variants?: Variants;
}

/**
 * EmptyState - Placeholder component when no images have been generated
 *
 * Displays a centered message with icon and description
 * encouraging users to generate their first image.
 *
 * Memoized since props rarely change.
 */
export const EmptyState = memo<EmptyStateProps>(function EmptyState({ variants }) {
  return (
    <motion.div
      variants={variants}
      className="glass-card p-12 text-center"
    >
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-glow flex items-center justify-center opacity-50">
        <PictureOutlined className="text-5xl text-white" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
        Ready to Create
      </h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Enter a prompt above and configure your settings to generate stunning AI-powered images.
      </p>
    </motion.div>
  );
});

EmptyState.displayName = 'EmptyState';
