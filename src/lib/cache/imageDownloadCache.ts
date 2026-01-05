/**
 * Image Download Cache
 *
 * LRU (Least Recently Used) cache for storing converted image downloads.
 * Prevents redundant format conversions by caching results.
 *
 * Features:
 * - LRU eviction when cache is full
 * - TTL (Time To Live) expiration
 * - Access count tracking for eviction priority
 * - Automatic cleanup of expired entries
 */

import type { ImageOutputFormat } from '../../../types';

/**
 * Cache entry structure
 */
interface CacheEntry {
  /** Data URL of the converted image */
  dataUrl: string;
  /** Timestamp when entry was created (milliseconds) */
  timestamp: number;
  /** Number of times this entry has been accessed */
  accessCount: number;
  /** Last access timestamp */
  lastAccess: number;
}

/**
 * Cache key structure
 */
interface CacheKey {
  /** Original image URL or Blob URL */
  imageUrl: string;
  /** Target format */
  format: ImageOutputFormat;
}

/**
 * Image Download Cache class
 *
 * Implements LRU cache with TTL for converted image downloads.
 */
export class ImageDownloadCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly ttl: number;

  /**
   * Creates a new ImageDownloadCache instance
   *
   * @param maxSize - Maximum number of entries to store (default: 50)
   * @param ttl - Time to live in milliseconds (default: 30 minutes)
   */
  constructor(maxSize: number = 50, ttl: number = 1000 * 60 * 30) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generates a cache key from imageUrl and format
   */
  private getCacheKey(imageUrl: string, format: ImageOutputFormat): string {
    return `${imageUrl}|${format}`;
  }

  /**
   * Checks if a cache entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }

  /**
   * Evicts the least recently used entry from the cache
   * Prioritizes entries with:
   * 1. Lowest access count
   * 2. Oldest last access time
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lowestAccessCount = Infinity;
    let oldestLastAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prioritize by access count, then by last access time
      if (
        entry.accessCount < lowestAccessCount ||
        (entry.accessCount === lowestAccessCount && entry.lastAccess < oldestLastAccess)
      ) {
        lowestAccessCount = entry.accessCount;
        oldestLastAccess = entry.lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      const entry = this.cache.get(lruKey);
      if (entry?.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.dataUrl);
      }
      this.cache.delete(lruKey);
    }
  }

  /**
   * Stores a converted image in the cache
   *
   * @param imageUrl - Original image URL or Blob URL
   * @param format - Target format
   * @param dataUrl - Converted image data URL
   */
  set(imageUrl: string, format: ImageOutputFormat, dataUrl: string): void {
    const key = this.getCacheKey(imageUrl, format);
    const now = Date.now();

    // Evict oldest/least-used entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      dataUrl,
      timestamp: now,
      accessCount: 0,
      lastAccess: now,
    });
  }

  /**
   * Retrieves a converted image from the cache
   *
   * @param imageUrl - Original image URL or Blob URL
   * @param format - Target format
   * @returns Data URL of converted image, or null if not found or expired
   */
  get(imageUrl: string, format: ImageOutputFormat): string | null {
    const key = this.getCacheKey(imageUrl, format);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      if (entry.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.dataUrl);
      }
      this.cache.delete(key);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccess = Date.now();

    return entry.dataUrl;
  }

  /**
   * Checks if an image conversion is cached
   *
   * @param imageUrl - Original image URL or Blob URL
   * @param format - Target format
   * @returns true if cached and not expired
   */
  has(imageUrl: string, format: ImageOutputFormat): boolean {
    const key = this.getCacheKey(imageUrl, format);
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Removes a specific entry from the cache
   *
   * @param imageUrl - Original image URL or Blob URL
   * @param format - Target format
   */
  delete(imageUrl: string, format: ImageOutputFormat): void {
    const key = this.getCacheKey(imageUrl, format);
    const entry = this.cache.get(key);

    if (entry) {
      if (entry.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.dataUrl);
      }
      this.cache.delete(key);
    }
  }

  /**
   * Clears all entries from the cache
   * Revokes any Blob URLs before clearing
   */
  clear(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(entry.dataUrl);
      }
    }
    this.cache.clear();
  }

  /**
   * Removes all expired entries from the cache
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        if (entry.dataUrl.startsWith('blob:')) {
          URL.revokeObjectURL(entry.dataUrl);
        }
        this.cache.delete(key);
      }
    }
  }

  /**
   * Gets the current number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    entries: Array<{
      key: string;
      accessCount: number;
      age: number;
      lastAccess: number;
    }>;
  } {
    const now = Date.now();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: now - entry.timestamp,
        lastAccess: now - entry.lastAccess,
      })),
    };
  }
}

/**
 * Global singleton instance of the download cache
 */
export const downloadCache = new ImageDownloadCache();

/**
 * Starts automatic cleanup interval
 *
 * @param intervalMs - Cleanup interval in milliseconds (default: 5 minutes)
 * @returns Cleanup stop function
 */
export function startAutoCleanup(intervalMs: number = 1000 * 60 * 5): () => void {
  const intervalId = setInterval(() => {
    downloadCache.cleanup();
  }, intervalMs);

  return () => clearInterval(intervalId);
}
