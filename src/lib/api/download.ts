import { z } from 'zod';

import type { ImageOutputFormat } from '../../../types';
import { apiClient, ApiError } from '../api-client';

/**
 * Zod schema for download API response
 */
export const DownloadResponseSchema = z.object({
  result: z.string(), // Base64 encoded image data
});

/**
 * Download parameters
 */
export interface DownloadParams {
  /** URL of the image to download and convert */
  imageUrl: string;
  /** Target format for conversion (webp, png, jpeg) */
  format: ImageOutputFormat;
  /** Optional filename for the downloaded file */
  filename?: string;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

/**
 * Download result with metadata
 */
export interface DownloadResult {
  /** Base64 encoded image data */
  base64Data: string;
  /** MIME type for the format */
  mimeType: string;
  /** Suggested file extension */
  extension: string;
}

/**
 * Downloads and converts an image to the specified format
 *
 * The backend downloads the image from the provided URL,
 * converts it to the target format, and returns base64-encoded data.
 *
 * Features:
 * - Support for multiple formats (webp, png, jpg, jpeg, gif, avif)
 * - AbortSignal support for cancellation
 * - Type-safe error handling
 *
 * @param params - Download parameters
 * @returns Promise resolving to base64-encoded image data with metadata
 * @throws {ApiError} On API errors
 *
 * @example
 * ```ts
 * const result = await downloadImage({
 *   imageUrl: 'https://example.com/image.png',
 *   format: 'webp',
 *   filename: 'my-image',
 * });
 * // result.base64Data can be used to create a download link
 * ```
 */
export async function downloadImage(
  params: DownloadParams
): Promise<DownloadResult> {
  const { imageUrl, format, filename, signal } = params;

  try {
    const payload = {
      imageUrl,
      format,
    };

    // Make API request with signal for cancellation
    const response = await apiClient.post('/api/download', payload, {
      signal,
    });

    // Validate response with Zod
    const validatedResponse = DownloadResponseSchema.parse(response.data);

    // Get MIME type and extension for the format
    const { mimeType, extension } = getFormatInfo(format);

    return {
      base64Data: validatedResponse.result,
      mimeType,
      extension,
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
      error instanceof Error ? error.message : 'Failed to download image',
      error instanceof Error ? [error.message] : undefined
    );
  }
}

/**
 * Gets MIME type and file extension for a download format
 */
function getFormatInfo(format: ImageOutputFormat): { mimeType: string; extension: string } {
  const formatMap: Record<ImageOutputFormat, { mimeType: string; extension: string }> = {
    webp: { mimeType: 'image/webp', extension: 'webp' },
    png: { mimeType: 'image/png', extension: 'png' },
    jpeg: { mimeType: 'image/jpeg', extension: 'jpg' },
  };

  return formatMap[format] || { mimeType: 'image/png', extension: 'png' };
}

/**
 * Helper function to trigger browser download
 *
 * @param base64Data - Base64 encoded image data
 * @param filename - Name for the downloaded file
 * @param mimeType - MIME type of the file
 *
 * @example
 * ```ts
 * triggerDownload(result.base64Data, 'my-image.webp', 'image/webp');
 * ```
 */
export function triggerDownload(
  base64Data: string,
  filename: string,
  mimeType: string
): void {
  // Create a blob from the base64 data
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Downloads an image and triggers browser download
 * Convenience wrapper combining downloadImage and triggerDownload
 *
 * @param params - Download parameters
 * @throws {ApiError} On API errors
 */
export async function downloadAndSave(
  params: DownloadParams & { filename?: string }
): Promise<void> {
  const { imageUrl, format, filename = `generated-image.${format}` } = params;

  const result = await downloadImage({ imageUrl, format, filename });
  triggerDownload(result.base64Data, filename, result.mimeType);
}
