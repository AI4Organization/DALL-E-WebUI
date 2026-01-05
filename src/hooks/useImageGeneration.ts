import pLimit from 'p-limit';
import { useCallback, useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

import type {
  ImageGenerationItem,
  ImageGenerationStatus,
  OpenAIImageResult,
  ImageQuality,
  GPTImageQuality,
  ImageSize,
  ImageStyle,
  ImageOutputFormat,
  GPTImageBackground,
} from '../../types';
import { DALL_E_2_SIZES, DALL_E_3_SIZES, GPT_IMAGE_1_5_SIZES } from '../../types';
import { generateImages as apiGenerateImages, isAbortError } from '../lib/api/image-generation';
import { ApiError } from '../lib/api-client';
import { base64ToBlobUrl, revokeBlobUrls, extractBlobUrlsFromItems } from '../lib/utils/blobUrl';

// Helper functions
const getPromptLimit = (modelName: string | null): number => {
  if (modelName === 'gpt-image-1.5-2025-12-16') return 32000;
  if (modelName === 'dall-e-3') return 4000;
  if (modelName === 'dall-e-2') return 1000;
  return 4000;
};

const getMaxImages = (modelName: string | null): number => {
  if (modelName === 'gpt-image-1.5-2025-12-16') return 10;
  if (modelName === 'dall-e-3') return 10;
  if (modelName === 'dall-e-2') return 10;
  return 10;
};

// Image lifecycle management constants
const MAX_STORED_IMAGES = 20; // Keep maximum of 20 images
const CLEANUP_THRESHOLD = 30; // Trigger cleanup when exceeding 30 images

/**
 * Prunes old images to prevent unbounded memory growth
 * Revokes Blob URLs before removing images
 *
 * @param items - Current image items array
 * @returns Pruned items array
 */
const pruneOldImages = (items: ImageGenerationItem[]): ImageGenerationItem[] => {
  if (items.length > CLEANUP_THRESHOLD) {
    // Revoke Blob URLs for items to be removed
    const toRemove = items.slice(0, items.length - MAX_STORED_IMAGES);
    const blobUrls = extractBlobUrlsFromItems(toRemove);
    revokeBlobUrls(blobUrls);

    // Keep only the most recent MAX_STORED_IMAGES items
    return items.slice(-MAX_STORED_IMAGES);
  }
  return items;
};

/**
 * Converts base64 image data to Blob URL for memory efficiency
 * @param result - OpenAI image result (may contain b64_json or url)
 * @returns Image result with blobUrl added if base64 was present
 */
const convertBase64ToBlobUrl = (result: OpenAIImageResult): OpenAIImageResult => {
  // Only convert if we have base64 data and don't already have a blobUrl
  if (result.b64_json && !result.blobUrl) {
    // Determine MIME type based on output format or default to PNG
    // For GPT Image 1.5, the format is determined by response_format
    // Default to PNG for base64 images
    const mimeType = 'image/png';

    try {
      const blobUrl = base64ToBlobUrl(result.b64_json, mimeType);

      // Return new object with blobUrl, keeping original b64_json for potential download
      return {
        ...result,
        blobUrl,
      };
    } catch (error) {
      console.error('Failed to convert base64 to Blob URL:', error);
      // Return original result if conversion fails
      return result;
    }
  }

  return result;
};

export interface UseImageGenerationOptions {
  /** Base URL for API (deprecated - now handled by apiClient) */
  apiBaseUrl?: string;
}

export interface UseImageGenerationReturn {
  /** Generate images based on current settings */
  generateImages: () => Promise<void>;
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Generated items with their states */
  items: ImageGenerationItem[];
  /** Retry a single failed image */
  retryImage: (id: number) => Promise<void>;
  /** Clear all results */
  clearResults: () => void;
}

/**
 * Custom hook for managing image generation
 *
 * Handles:
 * - Validation of prompts and settings
 * - Parallel image generation with concurrency limit
 * - Progress tracking and error handling
 * - Retry functionality for failed images
 * - Request cancellation via AbortController
 */
export function useImageGeneration(
  model: string | null,
  prompt: string,
  number: number,
  quality: ImageQuality | GPTImageQuality,
  size: ImageSize,
  style: ImageStyle,
  outputFormat: ImageOutputFormat,
  background: GPTImageBackground,
  _options: UseImageGenerationOptions = {}
): UseImageGenerationReturn {
  // AbortController for cancelling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [items, setItems] = useState<ImageGenerationItem[]>([]);

  const clearResults = useCallback(() => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Revoke all Blob URLs before clearing items
    setItems(prevItems => {
      const blobUrls = extractBlobUrlsFromItems(prevItems);
      revokeBlobUrls(blobUrls);
      return [];
    });
  }, []);

  // Cleanup effect: Revoke all Blob URLs on unmount
  useEffect(() => {
    return () => {
      setItems(prevItems => {
        const blobUrls = extractBlobUrlsFromItems(prevItems);
        revokeBlobUrls(blobUrls);
        return [];
      });
    };
  }, []);

  const generateImages = useCallback(async (): Promise<void> => {
    // Cancel any previous in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new AbortController for this generation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let hasErrors = false;

    // Client-side validation
    if (!model) {
      toast.error('No Model Selected', {
        description: 'Please select an AI model to generate images. Choose a model from the "Model" dropdown above.',
      });
      hasErrors = true;
    }

    if (!prompt.trim()) {
      toast.error('Empty Prompt', {
        description: 'Please describe the image you want to create. Enter a detailed description in the "Your Prompt" text area.',
      });
      hasErrors = true;
    } else if (prompt.trim().length < 10) {
      toast.warning('Prompt Too Short', {
        description: 'Your prompt is quite short. More detailed prompts usually produce better results.',
      });
    }

    // Character count validation
    const charCount = prompt.length;
    const promptLimit = getPromptLimit(model);
    if (charCount > promptLimit) {
      toast.error('Prompt Too Long', {
        description: `Your prompt has ${charCount} characters, but the maximum is ${promptLimit} for ${model}.`,
      });
      hasErrors = true;
    }

    // Validate number of images
    const maxImages = getMaxImages(model);
    if (number < 1 || number > maxImages) {
      toast.error('Invalid Number', {
        description: `Number of images must be between 1 and ${maxImages}.`,
      });
      hasErrors = true;
    }

    // Size validation
    if (model === 'dall-e-3' && !DALL_E_3_SIZES.includes(size)) {
      toast.error('Invalid Size for DALL-E 3', {
        description: `Choose: 1024x1024, 1792x1024, or 1024x1792.`,
      });
      hasErrors = true;
    }

    if (model === 'dall-e-2' && !DALL_E_2_SIZES.includes(size)) {
      toast.error('Invalid Size for DALL-E 2', {
        description: `Choose: 256x256, 512x512, or 1024x1024.`,
      });
      hasErrors = true;
    }

    if (model === 'gpt-image-1.5-2025-12-16' && !GPT_IMAGE_1_5_SIZES.includes(size)) {
      toast.error('Invalid Size for GPT Image 1.5', {
        description: `Choose: auto, 1024x1024, 1536x1024, or 1024x1536.`,
      });
      hasErrors = true;
    }

    if (hasErrors) return;

    // Info messages
    if (model === 'dall-e-3' && number > 1) {
      toast.info(`Multiple Images with DALL-E 3`, {
        description: `Generating ${number} images in parallel. Images will appear progressively!`,
      });
    }

    if (model === 'gpt-image-1.5-2025-12-16' && number > 1) {
      toast.info(`Multiple Images with GPT Image 1.5`, {
        description: `Generating all ${number} images in a single request.`,
      });
    }

    // Initialize generation items (preserving existing items with unique IDs)
    setIsGenerating(true);
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 0;
    const newItems: ImageGenerationItem[] = Array.from({ length: number }, (_, i) => ({
      id: nextId + i,
      status: 'pending' as ImageGenerationStatus,
    }));

    // Apply pruning before adding new items
    setItems(pruneOldImages([...items, ...newItems]));

    // Helper to update item
    const updateItem = (id: number, updates: Partial<ImageGenerationItem>) => {
      setItems(prev => {
        const updated = prev.map(item => (item.id === id ? { ...item, ...updates } : item));
        return pruneOldImages(updated);
      });
    };

    // Single image generation using the new API layer
    const generateSingleImage = async (id: number): Promise<void> => {
      updateItem(id, { status: 'loading' });

      try {
        const { images } = await apiGenerateImages({
          prompt,
          model: model!,
          n: 1,
          quality,
          size,
          style,
          response_format: outputFormat,
          background,
          signal: abortController.signal,
        });

        const result = images[0];
        if (result) {
          // Convert base64 to Blob URL for memory efficiency
          const resultWithBlobUrl = convertBase64ToBlobUrl(result);
          updateItem(id, { status: 'success', result: resultWithBlobUrl });
          toast.success(`Image ${id + 1} of ${number} ready!`);
        } else {
          throw new Error('No image data returned');
        }
      } catch (err) {
        // Check for abort error
        if (isAbortError(err)) {
          throw err; // Re-throw to handle at higher level
        }

        // Handle ApiError
        if (err instanceof ApiError) {
          const userMessage = err.getUserMessage();
          updateItem(id, { status: 'error', error: userMessage });
          toast.error(`Image ${id + 1} failed`, {
            description: userMessage,
          });
        } else {
          // Handle unknown errors
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          updateItem(id, { status: 'error', error: errorMessage });
          toast.error(`Image ${id + 1} failed`, {
            description: errorMessage,
          });
        }
      }
    };

    // Concurrency limit
    const limit = pLimit(4);

    try {
      // GPT Image 1.5: Single request for multiple images
      if (model === 'gpt-image-1.5-2025-12-16' && number > 1) {
        const { images } = await apiGenerateImages({
          prompt,
          model,
          n: number,
          quality,
          size,
          response_format: outputFormat,
          background,
          signal: abortController.signal,
        });

        // Update existing pending items with results (they were already added to state)
        setItems(prev => {
          const firstNewId = prev.length > 0 ? Math.max(...prev.map(i => i.id)) - number + 1 : 0;

          const updated = prev.map(item => {
            // Update pending items with their corresponding results
            const index = item.id - firstNewId;
            if (index >= 0 && index < images.length) {
              return {
                ...item,
                status: 'success' as ImageGenerationStatus,
                result: convertBase64ToBlobUrl(images[index]!),
              };
            }
            return item;
          });

          return pruneOldImages(updated);
        });
        toast.success(`${images.length} image${images.length !== 1 ? 's' : ''} generated!`);
      } else {
        // DALL-E 3/2: Parallel requests
        const tasks = Array.from({ length: number }, (_, i) =>
          limit(() => generateSingleImage(i))
        );

        await Promise.all(tasks);
      }
    } catch (err) {
      // Check for abort error
      if (isAbortError(err)) {
        toast.info('Generation cancelled');
        return;
      }

      // Handle ApiError
      if (err instanceof ApiError) {
        const userMessage = err.getUserMessage();
        toast.error('Generation failed', {
          description: userMessage,
        });
      } else {
        // Handle unknown errors
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        toast.error('Generation failed', {
          description: errorMessage,
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [model, prompt, number, size, items, quality, style, outputFormat, background]);

  const retryImage = useCallback(async (id: number): Promise<void> => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: 'loading' as ImageGenerationStatus, error: undefined } : item
      )
    );

    try {
      const { images } = await apiGenerateImages({
        prompt,
        model: model!,
        n: 1,
        quality,
        size,
        style,
        response_format: outputFormat,
        background,
      });

      const result = images[0];
      if (result) {
        // Convert base64 to Blob URL for memory efficiency
        const resultWithBlobUrl = convertBase64ToBlobUrl(result);
        setItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: 'success' as ImageGenerationStatus, result: resultWithBlobUrl } : item
          )
        );
        toast.success(`Image ${id + 1} regenerated!`);
      } else {
        throw new Error('No image data returned');
      }
    } catch (err) {
      // Handle ApiError
      if (err instanceof ApiError) {
        const userMessage = err.getUserMessage();
        setItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: 'error' as ImageGenerationStatus, error: userMessage } : item
          )
        );
        toast.error('Retry failed', {
          description: userMessage,
        });
      } else {
        // Handle unknown errors
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setItems(prev =>
          prev.map(item =>
            item.id === id ? { ...item, status: 'error' as ImageGenerationStatus, error: errorMessage } : item
          )
        );
        toast.error('Retry failed', {
          description: errorMessage,
        });
      }
    }
  }, [prompt, model, quality, size, style, outputFormat, background]);

  return {
    generateImages,
    isGenerating,
    items,
    retryImage,
    clearResults,
  };
}
