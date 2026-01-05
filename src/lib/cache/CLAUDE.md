# CLAUDE.md - src/lib/cache/

This file provides guidance to Claude Code (claude.ai/code) when working with caching utilities.

## Purpose

This directory contains caching utilities for storing and managing converted image downloads. The LRU (Least Recently Used) cache prevents redundant format conversions and improves performance.

## Modules

### `imageDownloadCache.ts` - Image Download Cache

**Purpose:** LRU cache for storing converted image downloads to prevent redundant format conversions.

## Types

### `CacheEntry`

Cache entry structure.

```typescript
interface CacheEntry {
  dataUrl: string;        // Data URL of the converted image
  timestamp: number;      // Timestamp when entry was created (milliseconds)
  accessCount: number;    // Number of times this entry has been accessed
  lastAccess: number;     // Last access timestamp
}
```

## Class: `ImageDownloadCache`

### Constructor

```typescript
constructor(maxSize: number = 50, ttl: number = 1000 * 60 * 30)
```

**Parameters:**
- `maxSize` - Maximum number of entries to store (default: 50)
- `ttl` - Time to live in milliseconds (default: 30 minutes)

### Methods

#### `set(imageUrl: string, format: ImageOutputFormat, dataUrl: string): void`

Stores a converted image in the cache.

**Parameters:**
- `imageUrl` - Original image URL or Blob URL
- `format` - Target format (webp, png, jpeg)
- `dataUrl` - Converted image data URL

**Example:**
```typescript
downloadCache.set(imageUrl, 'webp', convertedDataUrl);
```

#### `get(imageUrl: string, format: ImageOutputFormat): string | null`

Retrieves a converted image from the cache.

**Returns:** Data URL of converted image, or null if not found or expired

**Example:**
```typescript
const cached = downloadCache.get(imageUrl, 'webp');
if (cached) {
  console.log('Cache hit!');
  // Use cached data URL
} else {
  console.log('Cache miss, need to convert');
}
```

#### `has(imageUrl: string, format: ImageOutputFormat): boolean`

Checks if an image conversion is cached.

**Returns:** true if cached and not expired

**Example:**
```typescript
if (downloadCache.has(imageUrl, 'webp')) {
  // Use cached version
}
```

#### `delete(imageUrl: string, format: ImageOutputFormat): void`

Removes a specific entry from the cache.

**Example:**
```typescript
downloadCache.delete(imageUrl, 'webp');
```

#### `clear(): void`

Clears all entries from the cache. Revokes any Blob URLs before clearing.

**Example:**
```typescript
downloadCache.clear();
```

#### `cleanup(): void`

Removes all expired entries from the cache.

**Example:**
```typescript
downloadCache.cleanup();
```

#### `size: number`

Gets the current number of entries in the cache.

**Example:**
```typescript
console.log(`Cache size: ${downloadCache.size}`);
```

#### `getStats(): CacheStats`

Gets cache statistics.

**Returns:**
```typescript
{
  size: number;           // Current size
  maxSize: number;        // Maximum size
  ttl: number;            // Time to live (ms)
  entries: Array<{
    key: string;          // Cache key
    accessCount: number;  // Access count
    age: number;          // Age in milliseconds
    lastAccess: number;   // Time since last access
  }>;
}
```

## Global Instance

### `downloadCache`

Global singleton instance of `ImageDownloadCache`.

**Configuration:**
- Max size: 50 entries
- TTL: 30 minutes (1800000ms)

## Auto-Cleanup

### `startAutoCleanup(intervalMs: number = 1000 * 60 * 5): () => void`

Starts automatic cleanup interval.

**Parameters:**
- `intervalMs` - Cleanup interval in milliseconds (default: 5 minutes)

**Returns:** Cleanup stop function

**Example:**
```typescript
const stopCleanup = startAutoCleanup(1000 * 60 * 5); // 5 minutes

// Later, stop cleanup
stopCleanup();
```

## LRU Eviction Strategy

When the cache is full, the least recently used entry is evicted based on:
1. **Lowest access count** - Entries accessed fewer times are prioritized
2. **Oldest last access time** - Among entries with same access count, oldest is evicted

This ensures frequently accessed entries are retained.

## Cache Key Format

Cache keys are generated as: `{imageUrl}|{format}`

**Example:**
```
https://example.com/image.png|webp
blob:http://localhost:3000/xxx|jpeg
```

## Usage Example

```typescript
import { downloadCache, startAutoCleanup } from '../lib/cache/imageDownloadCache';

// Check cache before converting
const cachedImage = downloadCache.get(imageUrl, 'webp');
if (cachedImage) {
  // Use cached image - no conversion needed!
  displayImage(cachedImage);
} else {
  // Convert image
  const convertedImage = await convertImage(imageUrl, 'webp');

  // Store in cache
  downloadCache.set(imageUrl, 'webp', convertedImage);

  // Display converted image
  displayImage(convertedImage);
}

// Get cache statistics
const stats = downloadCache.getStats();
console.log('Cache hit rate:', stats.entries.length / stats.maxSize * 100 + '%');

// Start auto-cleanup (every 5 minutes)
const stopCleanup = startAutoCleanup();

// Clear all entries when done
downloadCache.clear();
```

## Memory Management

1. **Blob URL Cleanup:** When cache entries are evicted or cleared, Blob URLs are automatically revoked
2. **Automatic Cleanup:** Expired entries are removed on access or during cleanup interval
3. **Size Limits:** Cache size is bounded to prevent unbounded memory growth

## Best Practices

1. **Always check cache** before performing expensive operations
2. **Handle cache misses** gracefully by computing and storing results
3. **Use appropriate TTL** based on how long data remains valid
4. **Monitor cache statistics** to optimize hit rate
5. **Clear cache** when navigating to new contexts to free memory

## Notes

- Cache entries expire after TTL (default: 30 minutes)
- Blob URLs are automatically revoked when entries are removed
- LRU eviction prioritizes frequently accessed entries
- Cache is thread-safe for single-threaded JavaScript execution
