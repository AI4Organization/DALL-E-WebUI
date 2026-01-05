import { createContext, useContext, ReactNode } from 'react';

import type {
  ImageQuality,
  GPTImageQuality,
  ImageSize,
  ImageStyle,
  ImageOutputFormat,
  GPTImageBackground,
  ImageGenerationItem,
} from '../../types';
import { useImageGeneration } from '../hooks/useImageGeneration';

export interface GenerationContextValue {
  /** Model selection */
  model: string | null;
  /** Generation prompt */
  prompt: string;
  /** Number of images to generate */
  number: number;
  /** Quality setting */
  quality: ImageQuality | GPTImageQuality;
  /** Image size */
  size: ImageSize;
  /** Style (DALL-E 3 only) */
  style: ImageStyle;
  /** Output format (GPT Image 1.5 only) */
  outputFormat: ImageOutputFormat;
  /** Background (GPT Image 1.5 only) */
  background: GPTImageBackground;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Generated items with their states */
  items: ImageGenerationItem[];
  /** Generate images based on current settings */
  generateImages: () => Promise<void>;
  /** Retry a single failed image */
  retryImage: (id: number) => Promise<void>;
  /** Clear all results */
  clearResults: () => void;
}

const GenerationContext = createContext<GenerationContextValue | undefined>(undefined);

export interface GenerationProviderProps {
  children: ReactNode;
  model: string | null;
  prompt: string;
  number: number;
  quality: ImageQuality | GPTImageQuality;
  size: ImageSize;
  style: ImageStyle;
  outputFormat: ImageOutputFormat;
  background: GPTImageBackground;
  onModelChange: (model: string | null) => void;
  onPromptChange: (prompt: string) => void;
  onNumberChange: (number: number) => void;
  onQualityChange: (quality: ImageQuality | GPTImageQuality) => void;
  onSizeChange: (size: ImageSize) => void;
  onStyleChange: (style: ImageStyle) => void;
  onOutputFormatChange: (format: ImageOutputFormat) => void;
  onBackgroundChange: (background: GPTImageBackground) => void;
  apiBaseUrl?: string;
}

/**
 * Provider component for image generation state and actions
 *
 * Wraps useImageGeneration hook and provides generation context to children.
 * Manages generation state, progress tracking, and error handling.
 */
export function GenerationProvider({
  children,
  model,
  prompt,
  number,
  quality,
  size,
  style,
  outputFormat,
  background,
  apiBaseUrl,
}: GenerationProviderProps) {
  const generation = useImageGeneration(
    model,
    prompt,
    number,
    quality,
    size,
    style,
    outputFormat,
    background,
    { apiBaseUrl }
  );

  const value: GenerationContextValue = {
    model,
    prompt,
    number,
    quality,
    size,
    style,
    outputFormat,
    background,
    isGenerating: generation.isGenerating,
    items: generation.items,
    generateImages: generation.generateImages,
    retryImage: generation.retryImage,
    clearResults: generation.clearResults,
  };

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

/**
 * Hook to access generation context
 *
 * Throws an error if used outside of GenerationProvider.
 */
export function useGenerationContext(): GenerationContextValue {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGenerationContext must be used within a GenerationProvider');
  }
  return context;
}
