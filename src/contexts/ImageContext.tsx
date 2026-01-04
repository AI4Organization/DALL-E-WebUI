import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

import type { OpenAIImageResult } from '../../types';

export interface ImageContextValue {
  /** Currently previewed image or null */
  previewImage: OpenAIImageResult | null;
  /** Array of images for navigation */
  navigationImages: OpenAIImageResult[];
  /** Current navigation index */
  currentNavIndex: number;
  /** Open preview modal with image */
  openPreview: (result: OpenAIImageResult, index: number, allImages: OpenAIImageResult[]) => void;
  /** Close preview modal */
  closePreview: () => void;
  /** Navigate to previous image */
  navigatePrevious: () => void;
  /** Navigate to next image */
  navigateNext: () => void;
}

const ImageContext = createContext<ImageContextValue | undefined>(undefined);

export interface ImageProviderProps {
  children: ReactNode;
}

/**
 * Provider component for image preview and navigation state
 *
 * Manages:
 * - Preview modal open/close state
 * - Navigation between multiple generated images
 * - Current image index tracking
 */
export function ImageProvider({ children }: ImageProviderProps) {
  const [previewImage, setPreviewImage] = useState<OpenAIImageResult | null>(null);
  const [navigationImages, setNavigationImages] = useState<OpenAIImageResult[]>([]);
  const [currentNavIndex, setCurrentNavIndex] = useState<number>(0);

  const openPreview = useCallback((
    result: OpenAIImageResult,
    index: number,
    allImages: OpenAIImageResult[]
  ) => {
    setPreviewImage(result);
    setNavigationImages(allImages);
    setCurrentNavIndex(index);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewImage(null);
    setNavigationImages([]);
    setCurrentNavIndex(0);
  }, []);

  const navigatePrevious = useCallback(() => {
    if (currentNavIndex > 0) {
      const newIndex = currentNavIndex - 1;
      const newImage = navigationImages[newIndex];
      if (newImage) {
        setCurrentNavIndex(newIndex);
        setPreviewImage(newImage);
      }
    }
  }, [currentNavIndex, navigationImages]);

  const navigateNext = useCallback(() => {
    if (currentNavIndex < navigationImages.length - 1) {
      const newIndex = currentNavIndex + 1;
      const newImage = navigationImages[newIndex];
      if (newImage) {
        setCurrentNavIndex(newIndex);
        setPreviewImage(newImage);
      }
    }
  }, [currentNavIndex, navigationImages]);

  const value: ImageContextValue = {
    previewImage,
    navigationImages,
    currentNavIndex,
    openPreview,
    closePreview,
    navigatePrevious,
    navigateNext,
  };

  return (
    <ImageContext.Provider value={value}>
      {children}
    </ImageContext.Provider>
  );
}

/**
 * Hook to access image context
 *
 * Throws an error if used outside of ImageProvider.
 */
export function useImageContext(): ImageContextValue {
  const context = useContext(ImageContext);
  if (context === undefined) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  return context;
}
