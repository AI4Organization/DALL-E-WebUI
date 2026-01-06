import { PictureOutlined } from '@ant-design/icons';
import { motion, type Variants } from 'framer-motion';
import { memo, useMemo, useState } from 'react';

export interface EmptyStateProps {
  /** Variants for Framer Motion animations */
  variants?: Variants;
}

/**
 * Helper function to get a new animation style that's different from the last one
 * Uses localStorage to persist the last animation across page refreshes
 */
const getNewAnimationStyle = (): number => {
  const lastAnimation = parseInt(localStorage.getItem('emptystate-last-animation') || '-1');
  let newAnimation: number;
  // Keep rolling until we get a different animation
  do {
    newAnimation = Math.floor(Math.random() * 5);
  } while (newAnimation === lastAnimation);
  // Store the new animation for next time
  localStorage.setItem('emptystate-last-animation', String(newAnimation));
  return newAnimation;
};

/**
 * EmptyState - Placeholder component when no images have been generated
 *
 * Displays an animated illustration with 5 different modern animation styles
 * randomly selected on each page load, with intelligent rotation to avoid
 * consecutive duplicates.
 *
 * Animation Styles:
 * 0. Float & Pulse - Floating particles with pulsing glow
 * 1. Breathe & Glow - Breathing scale with radial pulse
 * 2. Orbit & Spin - Orbiting particles with rotating background
 * 3. Wave & Ripple - Wave motion with ripple effects
 * 4. Bounce & Elastic - Bouncy spring animations
 *
 * Memoized since props rarely change.
 */
export const EmptyState = memo<EmptyStateProps>(function EmptyState({ variants }) {
  // Use function initializer to avoid initial render mismatch
  // This ensures the random animation is selected during initial render
  const [animationStyle] = useState<number>(getNewAnimationStyle);

  // Memoize animation variants to prevent recreation on every render
  // This fixes the blank page bug caused by object reference changes
  const backgroundVariants = useMemo(() => ({
    0: { // Float & Pulse
      animate: {
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      },
      transition: { duration: 20, repeat: Infinity, ease: 'linear' },
      style: {
        background: 'conic-gradient(from 0deg, #a855f7, #ec4899, #22d3d3, #a855f7)',
      },
    },
    1: { // Breathe & Glow
      animate: {
        scale: [1, 1.3, 1],
        opacity: [0.1, 0.3, 0.1],
      },
      transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      style: {
        background: 'radial-gradient(circle, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
      },
    },
    2: { // Orbit & Spin
      animate: {
        rotate: [0, 360, 0],
      },
      transition: { duration: 15, repeat: Infinity, ease: 'linear' },
      style: {
        background: 'conic-gradient(from 0deg, #22d3d3, #a855f7, #ec4899, #22d3d3)',
      },
    },
    3: { // Wave & Ripple
      animate: {
        y: [0, -10, 10, 0],
      },
      transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
      style: {
        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
      },
    },
    4: { // Bounce & Elastic
      animate: {
        y: [0, -15, 0],
        scale: [1, 1.1, 1],
      },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      style: {
        background: 'conic-gradient(from 180deg, #ec4899, #22d3d3, #a855f7, #ec4899)',
      },
    },
  }), []);

  // Memoize particle animations for each style
  // Using consistent structure with animate, transition, and optional style properties
  const particleVariants = useMemo(() => ({
    0: [ // Float & Pulse
      { animate: { y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }, transition: { duration: 3, repeat: Infinity } },
      { animate: { y: [0, -25, 0], opacity: [0.4, 0.7, 0.4] }, transition: { duration: 3.5, repeat: Infinity } },
      { animate: { y: [0, -15, 0], opacity: [0.3, 0.5, 0.3] }, transition: { duration: 2.5, repeat: Infinity } },
    ],
    1: [ // Breathe & Glow - Expand from center
      { animate: { scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }, transition: { duration: 3, repeat: Infinity } },
      { animate: { scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }, transition: { duration: 3.5, repeat: Infinity } },
      { animate: { scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }, transition: { duration: 2.5, repeat: Infinity } },
    ],
    2: [ // Orbit & Spin - Use CSS animations for orbit
      { style: { animation: 'orbit-clockwise 8s linear infinite' } },
      { style: { animation: 'orbit-counter 10s linear infinite' } },
      { style: { animation: 'orbit-clockwise 12s linear infinite' } },
    ],
    3: [ // Wave & Ripple
      { animate: { y: [0, -15, 15, 0], opacity: [0.3, 0.6, 0.6, 0.3] }, transition: { duration: 4, repeat: Infinity } },
      { animate: { y: [0, 15, -15, 0], opacity: [0.3, 0.6, 0.6, 0.3] }, transition: { duration: 4, repeat: Infinity } },
      { animate: { y: [0, -10, 10, 0], opacity: [0.3, 0.5, 0.5, 0.3] }, transition: { duration: 3, repeat: Infinity } },
    ],
    4: [ // Bounce & Elastic
      { animate: { y: [0, -30, 0, -15, 0], scale: [1, 1.2, 0.9, 1.1, 1] }, transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
      { animate: { y: [0, -25, 0, -12, 0], scale: [1, 1.15, 0.95, 1.05, 1] }, transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
      { animate: { y: [0, -20, 0, -10, 0], scale: [1, 1.1, 0.95, 1.05, 1] }, transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
    ],
  }), []);

  // Memoize icon animations for each style
  const iconVariants = useMemo(() => ({
    0: { // Float & Pulse
      animate: { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] },
      transition: { duration: 4, repeat: Infinity },
      className: '',
      style: undefined,
    },
    1: { // Breathe & Glow
      animate: { scale: [1, 1.15, 1] },
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
      className: 'shadow-2xl',
      style: { animation: 'glow-pulse 2s ease-in-out infinite' },
    },
    2: { // Orbit & Spin
      animate: { rotate: 360 },
      transition: { duration: 10, repeat: Infinity, ease: 'linear' },
      className: '',
      style: undefined,
    },
    3: { // Wave & Ripple
      animate: { y: [0, -8, 8, 0] },
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      className: '',
      style: undefined,
    },
    4: { // Bounce & Elastic
      animate: { y: [0, -20, 0] },
      transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      className: '',
      style: undefined,
    },
  }), []);

  // Safely get selected animation variants with fallback
  const selectedBg = backgroundVariants[animationStyle] ?? backgroundVariants[0];
  const selectedParticles = particleVariants[animationStyle] ?? particleVariants[0];
  const selectedIcon = iconVariants[animationStyle] ?? iconVariants[0];

  return (
    <motion.div
      variants={variants}
      className="glass-card p-12 text-center relative overflow-hidden"
    >
      {/* Animated background elements */}
      <motion.div
        animate={selectedBg.animate}
        transition={selectedBg.transition}
        className="absolute inset-0 opacity-10"
        style={selectedBg.style}
      />

      {/* Floating/animated elements */}
      {[0, 1, 2].map((i) => {
        const particle = selectedParticles[i];
        if (!particle) return null;

        const baseStyle = {
          background: ['#a855f7', '#ec4899', '#22d3d3'][i] ?? '#a855f7',
          left: `${20 + i * 30}%`,
          top: '20%',
        };

        // Determine if this particle uses Framer Motion or CSS animation
        const hasMotionAnimate = particle.animate !== undefined;
        const hasCssAnimation = particle.style?.animation !== undefined;

        return (
          <motion.div
            key={i}
            {...(hasMotionAnimate && { animate: particle.animate, transition: particle.transition })}
            className="absolute w-4 h-4 rounded-full"
            style={{
              ...baseStyle,
              ...(hasCssAnimation && particle.style),
            }}
          />
        );
      })}

      {/* Main content */}
      <div className="relative z-10">
        <motion.div
          animate={selectedIcon.animate}
          transition={selectedIcon.transition}
          className={`w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-glow
                     flex items-center justify-center ${selectedIcon.className}`}
          style={selectedIcon.style}
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
