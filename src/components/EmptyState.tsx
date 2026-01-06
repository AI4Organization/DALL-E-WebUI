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
 * Displays an animated illustration with floating elements
 * encouraging users to generate their first image.
 *
 * Memoized since props rarely change.
 */
export const EmptyState = memo<EmptyStateProps>(function EmptyState({ variants }) {
  return (
    <motion.div
      variants={variants}
      className="glass-card p-12 text-center relative overflow-hidden"
    >
      {/* Animated background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 opacity-10"
        style={{
          background: 'conic-gradient(from 0deg, #a855f7, #ec4899, #22d3d3, #a855f7)',
        }}
      />

      {/* Floating elements */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          className="absolute w-4 h-4 rounded-full"
          style={{
            background: ['#a855f7', '#ec4899', '#22d3d3'][i],
            left: `${20 + i * 30}%`,
            top: '20%',
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-glow
                     flex items-center justify-center shadow-2xl"
        >
          <PictureOutlined className="text-6xl text-white" />
        </motion.div>

        <h3 className="text-2xl font-bold text-white mb-3"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
          Ready to Create Magic
        </h3>

        <p className="text-gray-400 max-w-md mx-auto mb-8">
          Enter a prompt above and let AI bring your imagination to life.
          Start with one of the suggested prompts or describe your vision.
        </p>
      </div>
    </motion.div>
  );
});

EmptyState.displayName = 'EmptyState';
