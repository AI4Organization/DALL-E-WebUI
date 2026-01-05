import { z } from 'zod';

import type {
  OpenAIImageResult,
  ImageQuality,
  ImageSize,
  ImageStyle,
  GPTImageQuality,
  ImageOutputFormat,
  GPTImageBackground,
} from '../../../types';
import { apiClient, ApiError } from '../api-client';

/**
 * Zod schema for OpenAI image result
 * Validates both URL-based and base64-based responses
 */
export const OpenAIImageResultSchema = z.object({
  url: z.string().url().optional(),
  revised_prompt: z.string().optional(),
  b64_json: z.string().optional(),
  // Client-side Blob URL (not part of API response, but we allow it for compatibility)
  blobUrl: z.string().optional(),
}) as z.ZodType<OpenAIImageResult>;

/**
 * Zod schema for image generation response
 */
export const ImageGenerationResponseSchema = z.object({
  result: z.array(OpenAIImageResultSchema),
});

/**
 * Image generation parameters
 */
export interface ImageGenerationParams {
  /** Text prompt for image generation */
  prompt: string;
  /** Model identifier (dall-e-2, dall-e-3, gpt-image-1.5) */
  model: string;
  /** Number of images to generate (1-10) */
  n: number;
  /** Quality setting (standard, hd, auto, high, medium, low) */
  quality?: ImageQuality | GPTImageQuality;
  /** Image size (varies by model) */
  size?: ImageSize;
  /** Style setting (vivid, natural) - DALL-E 3 only */
  style?: ImageStyle;
  /** Output format (webp, png, jpeg) - GPT Image 1.5 only */
  response_format?: ImageOutputFormat;
  /** Background setting (auto, transparent, opaque) - GPT Image 1.5 only */
  background?: GPTImageBackground;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Image generation result with metadata
 */
export interface ImageGenerationResult {
  /** Generated images */
  images: OpenAIImageResult[];
  /** Number of images successfully generated */
  count: number;
}

/**
 * Generates images using OpenAI's DALL-E APIs
 *
 * Features:
 * - Runtime validation with Zod schemas
 * - AbortSignal support for cancellation
 * - Type-safe error handling
 * - Automatic retry on retryable errors
 *
 * @param params - Image generation parameters
 * @returns Promise resolving to generated images
 * @throws {ApiError} On API errors
 *
 * @example
 * ```ts
 * const result = await generateImages({
 *   prompt: 'A futuristic city at sunset',
 *   model: 'dall-e-3',
 *   n: 4,
 *   quality: 'hd',
 *   size: '1792x1024',
 *   style: 'vivid',
 * });
 * ```
 */
export async function generateImages(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  const {
    prompt,
    model,
    n,
    quality,
    size,
    style,
    response_format,
    background,
    signal,
  } = params;

  try {
    // Build request payload based on model
    const payload: Record<string, unknown> = {
      prompt,
      model,
      n,
    };

    // Add quality parameter
    if (quality) {
      // DALL-E 2 ignores quality parameter, but we include it for consistency
      if (model !== 'dall-e-2') {
        payload.quality = quality;
      }
    }

    // Add size parameter
    if (size) {
      payload.size = size;
    }

    // Add style parameter (DALL-E 3 only)
    if (style && model === 'dall-e-3') {
      payload.style = style;
    }

    // Add response_format (GPT Image 1.5 only)
    if (response_format && model === 'gpt-image-1.5') {
      payload.response_format = response_format;
    }

    // Add background (GPT Image 1.5 only)
    if (background && model === 'gpt-image-1.5') {
      payload.background = background;
    }

    // Make API request with signal for cancellation
    const response = await apiClient.post('/api/images', payload, {
      signal,
    });

    // Validate response with Zod
    const validatedResponse = ImageGenerationResponseSchema.parse(response.data);

    return {
      images: validatedResponse.result,
      count: validatedResponse.result.length,
    };
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap Zod validation errors
    if (error instanceof z.ZodError) {
      throw new ApiError(
        500,
        'Invalid response from server',
        [`Response validation failed: ${error.message}`]
      );
    }

    // Wrap unknown errors
    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'Unknown error occurred',
      error instanceof Error ? [error.message] : undefined
    );
  }
}

/**
 * Helper function to check if an error is from aborted request
 */
export function isAbortError(error: unknown): error is Error & { name: 'AbortError' | 'CanceledError' } {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.name === 'CanceledError' ||
      ('code' in error && (error as { code: string }).code === 'ERR_CANCELED')
    );
  }
  return false;
}

/**
 * Helper function to get display URL from OpenAI image result
 * Handles Blob URL, URL, and base64 formats
 *
 * Priority: blobUrl > url > base64 data URL
 */
export function getImageDisplayUrl(result: OpenAIImageResult): string | null {
  // Prefer Blob URL (most memory-efficient for base64 images)
  if (result.blobUrl) return result.blobUrl;

  // Fall back to regular URL
  if (result.url) return result.url;

  // Final fallback: base64 data URL (least memory-efficient)
  if (result.b64_json) {
    return `data:image/png;base64,${result.b64_json}`;
  }

  return null;
}

/**
 * Helper function to check if result has downloadable image
 */
export function hasDownloadableImage(result: OpenAIImageResult): boolean {
  return !!result.url || !!result.b64_json;
}
