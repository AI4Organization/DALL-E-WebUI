/**
 * Blob URL Utilities
 *
 * Converts base64 image data to Blob URLs for efficient memory usage.
 * Blob URLs use significantly less memory than base64 data URLs.
 *
 * Key benefits:
 * - ~90% memory reduction compared to base64 data URLs
 * - Automatic garbage collection when revoked
 * - Same display capabilities as data URLs
 */

/**
 * Mapping of Blob URLs to their object URLs for tracking and cleanup
 */
const blobUrlRegistry = new Map<string, string>();

/**
 * Maximum number of Blob URLs to keep in registry
 * Prevents unbounded memory growth
 */
const MAX_BLOB_URLS = 50;

/**
 * Converts a base64 string to a Blob URL
 *
 * @param base64 - Base64 encoded image data (without data URI prefix)
 * @param mimeType - MIME type of the image (e.g., 'image/png', 'image/jpeg')
 * @returns Blob URL string (e.g., 'blob:http://localhost:3000/xxx-xxx-xxx')
 *
 * @example
 * ```ts
 * const blobUrl = base64ToBlobUrl(base64Data, 'image/png');
 * // Returns: 'blob:http://localhost:3000/550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function base64ToBlobUrl(base64: string, mimeType: string): string {
  // Decode base64 to binary string
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  // Convert to Uint8Array
  const byteArray = new Uint8Array(byteNumbers);

  // Create Blob
  const blob = new Blob([byteArray], { type: mimeType });

  // Create Blob URL
  const blobUrl = URL.createObjectURL(blob);

  // Track in registry for cleanup
  blobUrlRegistry.set(blobUrl, mimeType);

  // Prune old Blob URLs if limit exceeded
  if (blobUrlRegistry.size > MAX_BLOB_URLS) {
    const firstUrl = blobUrlRegistry.keys().next().value;
    if (firstUrl) {
      revokeBlobUrl(firstUrl);
    }
  }

  return blobUrl;
}

/**
 * Revokes a Blob URL to free memory
 *
 * Must be called when the image is no longer needed to prevent memory leaks.
 *
 * @param blobUrl - The Blob URL to revoke
 *
 * @example
 * ```ts
 * const blobUrl = base64ToBlobUrl(base64Data, 'image/png');
 * // ... use the blobUrl
 * revokeBlobUrl(blobUrl); // Free memory when done
 * ```
 */
export function revokeBlobUrl(blobUrl: string): void {
  if (blobUrlRegistry.has(blobUrl)) {
    URL.revokeObjectURL(blobUrl);
    blobUrlRegistry.delete(blobUrl);
  }
}

/**
 * Revokes multiple Blob URLs at once
 *
 * Useful for cleaning up multiple images, such as when clearing results.
 *
 * @param blobUrls - Array of Blob URLs to revoke
 *
 * @example
 * ```ts
 * const blobUrls = [url1, url2, url3];
 * revokeBlobUrls(blobUrls);
 * ```
 */
export function revokeBlobUrls(blobUrls: string[]): void {
  blobUrls.forEach(revokeBlobUrl);
}

/**
 * Checks if a URL is a Blob URL
 *
 * @param url - URL to check
 * @returns true if the URL is a Blob URL
 *
 * @example
 * ```ts
 * if (isBlobUrl(imageUrl)) {
 *   revokeBlobUrl(imageUrl);
 * }
 * ```
 */
export function isBlobUrl(url: string | null): boolean {
  return url?.startsWith('blob:') ?? false;
}

/**
 * Gets the current number of Blob URLs in the registry
 *
 * Useful for debugging and monitoring memory usage.
 *
 * @returns Count of active Blob URLs
 */
export function getBlobUrlCount(): number {
  return blobUrlRegistry.size;
}

/**
 * Clears all Blob URLs from the registry
 *
 * WARNING: This will revoke all tracked Blob URLs.
 * Use with caution, usually only when clearing all images.
 *
 * @example
 * ```ts
 * // When clearing all image results
 * clearAllBlobUrls();
 * ```
 */
export function clearAllBlobUrls(): void {
  const urls = Array.from(blobUrlRegistry.keys());
  urls.forEach(revokeBlobUrl);
}

/**
 * Extracts Blob URLs from an array of image generation items
 *
 * Scans items for blobUrl properties and returns them for cleanup.
 *
 * @param items - Array of image generation items
 * @returns Array of Blob URLs found in the items
 *
 * @example
 * ```ts
 * const blobUrls = extractBlobUrlsFromItems(items);
 * revokeBlobUrls(blobUrls);
 * ```
 */
export function extractBlobUrlsFromItems(items: Array<{ result?: { blobUrl?: string } }>): string[] {
  const blobUrls: string[] = [];

  for (const item of items) {
    if (item.result?.blobUrl && isBlobUrl(item.result.blobUrl)) {
      blobUrls.push(item.result.blobUrl);
    }
  }

  return blobUrls;
}

/**
 * Converts a data URL (base64) to Blob URL
 *
 * Handles both full data URLs (data:image/png;base64,...) and raw base64 strings.
 *
 * @param dataUrl - Data URL or base64 string
 * @param mimeType - MIME type (required if dataUrl is raw base64)
 * @returns Blob URL string
 *
 * @example
 * ```ts
 * const blobUrl = dataUrlToBlobUrl('data:image/png;base64,iVBORw0KG...', 'image/png');
 * ```
 */
export function dataUrlToBlobUrl(dataUrl: string, mimeType?: string): string {
  let base64: string;
  let inferredMimeType: string;

  // Check if it's a full data URL
  if (dataUrl.startsWith('data:')) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match || !match[1] || !match[2]) {
      throw new Error('Invalid data URL format');
    }
    inferredMimeType = match[1];
    base64 = match[2];
  } else {
    // Raw base64 string
    if (!mimeType) {
      throw new Error('MIME type is required for raw base64 strings');
    }
    inferredMimeType = mimeType;
    base64 = dataUrl;
  }

  return base64ToBlobUrl(base64, inferredMimeType);
}
