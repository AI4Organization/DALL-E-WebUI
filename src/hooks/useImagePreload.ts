import { useEffect, useRef, useState } from 'react';

import type { OpenAIImageResult } from '../../types';
import { getImageDisplayUrl } from '../lib/api/image-generation';

/**
 * Options for image preloading
 */
export interface UseImagePreloadOptions {
  /** Number of images to preload before and after current index */
  preloadCount?: number;
  /** Whether preloading is enabled */
  enabled?: boolean;
}

/**
 * Image preloading hook
 *
 * Preloads adjacent images in the background for instant navigation.
 * Uses native Image object for browser caching.
 *
 * @param images - Array of images to preload from
 * @param currentIndex - Current image index
 * @param options - Preloading options
 *
 * @example
 * ```tsx
 * useImagePreload(navigationImages, currentNavIndex, {
 *   preloadCount: 2,  // Preload 2 images before and after current
 *   enabled: true,    // Enable preloading
 * });
 * ```
 */
export function useImagePreload(
  images: OpenAIImageResult[],
  currentIndex: number,
  options: UseImagePreloadOptions = {}
): void {
  const { preloadCount = 2, enabled = true } = options;

  // Track preloaded URLs to avoid duplicate preloading
  const preloadedUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || images.length === 0) {
      return;
    }

    // Preload an individual image
    const preloadImage = (url: string): (() => void) => {
      if (!url || preloadedUrls.current.has(url)) {
        return () => {};
      }

      const img = new Image();
      img.src = url;

      // Mark as preloaded (regardless of load outcome)
      preloadedUrls.current.add(url);

      // Return cleanup function
      return () => {
        img.src = '';
        preloadedUrls.current.delete(url);
      };
    };

    const cleanupFunctions: (() => void)[] = [];

    // Preload next images
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < images.length) {
        const result = images[nextIndex];
        if (result) {
          const url = getImageDisplayUrl(result);
          if (url) {
            cleanupFunctions.push(preloadImage(url));
          }
        }
      }
    }

    // Preload previous images
    for (let i = 1; i <= preloadCount; i++) {
      const prevIndex = currentIndex - i;
      if (prevIndex >= 0) {
        const result = images[prevIndex];
        if (result) {
          const url = getImageDisplayUrl(result);
          if (url) {
            cleanupFunctions.push(preloadImage(url));
          }
        }
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      cleanupFunctions.forEach(fn => fn());
    };
  }, [images, currentIndex, preloadCount, enabled]);
}

/**
 * Clears the preloaded image cache
 *
 * Useful for resetting preloading state when navigating to a new context.
 *
 * @returns A function to clear the cache
 */
export function useImagePreloadCache() {
  const [preloadedUrls, setPreloadedUrls] = useState<Set<string>>(new Set());

  const clearCache = () => {
    setPreloadedUrls(new Set());
  };

  const addUrl = (url: string) => {
    setPreloadedUrls(prev => new Set(prev).add(url));
  };

  const hasUrl = (url: string): boolean => {
    return preloadedUrls.has(url);
  };

  return {
    clearCache,
    addUrl,
    hasUrl,
    size: preloadedUrls.size,
  };
}
