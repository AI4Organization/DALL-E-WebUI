# CLAUDE.md - src/lib/utils/

This file provides guidance to Claude Code (claude.ai/code) when working with utility functions.

## Purpose

This directory contains utility functions that provide common functionality across the frontend application.

## Modules

### `blobUrl.ts` - Blob URL Utilities

**Purpose:** Converts base64 image data to Blob URLs for efficient memory usage.

**Key Benefits:**
- ~90% memory reduction compared to base64 data URLs
- Automatic garbage collection when revoked
- Registry tracking for cleanup
- Prevents unbounded memory growth

## Functions

### `base64ToBlobUrl(base64: string, mimeType: string): string`

Converts a base64 string to a Blob URL.

**Parameters:**
- `base64` - Base64 encoded image data (without data URI prefix)
- `mimeType` - MIME type of the image (e.g., 'image/png', 'image/jpeg')

**Returns:** Blob URL string (e.g., 'blob:http://localhost:3000/xxx-xxx-xxx')

**Example:**
```typescript
const blobUrl = base64ToBlobUrl(base64Data, 'image/png');
// Returns: 'blob:http://localhost:3000/550e8400-e29b-41d4-a716-446655440000'
```

### `revokeBlobUrl(blobUrl: string): void`

Revokes a Blob URL to free memory.

**Must be called** when the image is no longer needed to prevent memory leaks.

**Example:**
```typescript
const blobUrl = base64ToBlobUrl(base64Data, 'image/png');
// ... use the blobUrl
revokeBlobUrl(blobUrl); // Free memory when done
```

### `revokeBlobUrls(blobUrls: string[]): void`

Revokes multiple Blob URLs at once.

**Example:**
```typescript
const blobUrls = [url1, url2, url3];
revokeBlobUrls(blobUrls);
```

### `isBlobUrl(url: string | null): boolean`

Checks if a URL is a Blob URL.

**Example:**
```typescript
if (isBlobUrl(imageUrl)) {
  revokeBlobUrl(imageUrl);
}
```

### `dataUrlToBlobUrl(dataUrl: string, mimeType?: string): string`

Converts a data URL (base64) to Blob URL.

Handles both full data URLs (data:image/png;base64,...) and raw base64 strings.

**Example:**
```typescript
const blobUrl = dataUrlToBlobUrl('data:image/png;base64,iVBORw0KG...', 'image/png');
```

### `extractBlobUrlsFromItems(items): string[]`

Extracts Blob URLs from an array of image generation items.

**Example:**
```typescript
const blobUrls = extractBlobUrlsFromItems(items);
revokeBlobUrls(blobUrls);
```

### `getBlobUrlCount(): number`

Gets the current number of Blob URLs in the registry.

**Returns:** Count of active Blob URLs

### `clearAllBlobUrls(): void`

Clears all Blob URLs from the registry.

**Warning:** This will revoke all tracked Blob URLs. Use with caution, usually only when clearing all images.

## Registry Management

The blob URL registry tracks all created Blob URLs:

- **Maximum size:** 50 Blob URLs
- **Automatic pruning:** Oldest Blob URLs are revoked when limit exceeded
- **Purpose:** Prevents unbounded memory growth

## Usage Example

```typescript
import {
  base64ToBlobUrl,
  revokeBlobUrl,
  dataUrlToBlobUrl,
  extractBlobUrlsFromItems,
  clearAllBlobUrls
} from '../lib/utils/blobUrl';

// Convert base64 to Blob URL
const blobUrl = base64ToBlobUrl(base64Data, 'image/png');

// Use in img tag
<img src={blobUrl} alt="Generated image" />

// Clean up when done
revokeBlobUrl(blobUrl);

// Or clean up all at once (e.g., when clearing results)
clearAllBlobUrls();
```

## Memory Management Best Practices

1. **Always revoke Blob URLs** when images are no longer needed
2. **Use the registry functions** for batch operations
3. **Clear all Blob URLs** when clearing image results
4. **Monitor registry size** with `getBlobUrlCount()` for debugging

## Dependencies

- **../../types** - Shared TypeScript interfaces

## Notes

- Blob URLs use significantly less memory than base64 data URLs
- Automatic garbage collection happens when URLs are revoked
- Registry prevents unbounded memory growth
- Thread-safe for single-threaded JavaScript execution
