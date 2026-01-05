# CLAUDE.md - src/lib/metrics/

This file provides guidance to Claude Code (claude.ai/code) when working with performance metrics tracking.

## Purpose

This directory contains performance tracking utilities for monitoring image loading and download operations. Useful for measuring optimization effectiveness.

## Modules

### `imagePerformance.ts` - Performance Metrics Tracking

**Purpose:** Tracks image loading and download performance metrics.

## Types

### `ImagePerformanceMetrics`

Performance metrics for image operations.

```typescript
export interface ImagePerformanceMetrics {
  imageId: number;           // Image ID
  loadTime?: number;         // Time to load image (ms)
  downloadTime?: number;     // Time to download image (ms)
  downloadCached?: boolean;  // Whether download was cached
  isBase64?: boolean;        // Whether image was base64
  timestamp: number;         // Timestamp when metrics were recorded
}
```

## Global Tracker

### `performanceTracker`

Global singleton instance of `ImagePerformanceTracker` class.

**Methods:**
- `startLoad(imageId)` - Start tracking image load time
- `endLoad(imageId)` - End tracking image load time
- `startDownload(imageId)` - Start tracking download time
- `endDownload(imageId, cached)` - End tracking download time
- `getMetrics(imageId)` - Get metrics for an image
- `getAllMetrics()` - Get all metrics
- `clear()` - Clear all metrics
- `getStats()` - Get performance statistics
- `logStats()` - Log statistics to console

## Hook

### `usePerformanceTracking(imageId)`

Hook to track performance for image operations.

**Returns:**
```typescript
{
  startLoad: () => void;
  endLoad: () => void;
  startDownload: () => void;
  endDownload: (cached?: boolean) => void;
  getMetrics: () => ImagePerformanceMetrics | undefined;
}
```

**Example:**
```typescript
const { startLoad, endLoad, startDownload, endDownload } = usePerformanceTracking(imageId);

// Track load time
startLoad();
// ... load image
endLoad();

// Track download time
startDownload();
// ... download image
endDownload(true); // Pass true if cached
```

## Statistics

### `getStats()` Returns

```typescript
{
  totalImages: number;          // Total number of images tracked
  avgLoadTime: number;          // Average load time (ms)
  avgDownloadTime: number;      // Average download time (ms)
  cacheHitRate: number;         // Cache hit rate (%)
  base64ImageCount: number;     // Number of base64 images
}
```

**Example:**
```typescript
const stats = performanceTracker.getStats();
console.log('Average Load Time:', stats.avgLoadTime.toFixed(2) + 'ms');
console.log('Cache Hit Rate:', stats.cacheHitRate.toFixed(1) + '%');
```

## Usage Example

```typescript
import { performanceTracker } from '../lib/metrics/imagePerformance';

// Track a complete image lifecycle
const imageId = 1;

// Start load tracking
performanceTracker.startLoad(imageId);

// ... image loads ...

// End load tracking
performanceTracker.endLoad(imageId);

// Start download tracking
performanceTracker.startDownload(imageId);

// ... download completes ...

// End download tracking (cached = true if from cache)
performanceTracker.endDownload(imageId, true);

// Get metrics
const metrics = performanceTracker.getMetrics(imageId);
console.log(metrics);
// {
//   imageId: 1,
//   loadTime: 1234.56,
//   downloadTime: 567.89,
//   downloadCached: true,
//   timestamp: 1234567890
// }

// Get overall statistics
const stats = performanceTracker.getStats();
performanceTracker.logStats();
// [Performance Metrics] {
//   'Total Images': 10,
//   'Avg Load Time': '1234.56ms',
//   'Avg Download Time': '567.89ms',
//   'Cache Hit Rate': '75.0%',
//   'Base64 Images': 2
// }
```

## Use Cases

1. **Performance Monitoring:** Track how long images take to load and download
2. **Cache Effectiveness:** Monitor cache hit rate to measure cache efficiency
3. **Optimization Validation:** Measure performance improvements from optimizations
4. **Debugging:** Identify slow-loading images or download bottlenecks
5. **Analytics:** Collect performance data for analysis

## Notes

- All timestamps are in milliseconds (using `performance.now()`)
- Load time is measured from start to when image data is available
- Download time tracks format conversion and download operations
- Cache hit rate is calculated as (cached downloads / total downloads) * 100
- Statistics are calculated from all tracked metrics
