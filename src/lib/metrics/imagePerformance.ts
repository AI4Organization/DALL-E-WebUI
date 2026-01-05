/**
 * Performance Metrics Tracking
 *
 * Tracks image loading and download performance metrics.
 * Useful for monitoring optimization effectiveness.
 */

/**
 * Performance metrics for image operations
 */
export interface ImagePerformanceMetrics {
  /** Image ID */
  imageId: number;
  /** Time to load image (ms) */
  loadTime?: number;
  /** Time to download image (ms) */
  downloadTime?: number;
  /** Whether download was cached */
  downloadCached?: boolean;
  /** Whether image was base64 */
  isBase64?: boolean;
  /** Timestamp when metrics were recorded */
  timestamp: number;
}

/**
 * Performance tracker class
 */
class ImagePerformanceTracker {
  private metrics = new Map<number, ImagePerformanceMetrics>();
  private loadStartTimes = new Map<number, number>();
  private downloadStartTimes = new Map<number, number>();

  /**
   * Start tracking image load time
   */
  startLoad(imageId: number): void {
    this.loadStartTimes.set(imageId, performance.now());
  }

  /**
   * End tracking image load time
   */
  endLoad(imageId: number): void {
    const startTime = this.loadStartTimes.get(imageId);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.setMetric(imageId, { loadTime });
      this.loadStartTimes.delete(imageId);
    }
  }

  /**
   * Start tracking download time
   */
  startDownload(imageId: number): void {
    this.downloadStartTimes.set(imageId, performance.now());
  }

  /**
   * End tracking download time
   */
  endDownload(imageId: number, cached: boolean = false): void {
    const startTime = this.downloadStartTimes.get(imageId);
    if (startTime) {
      const downloadTime = performance.now() - startTime;
      this.setMetric(imageId, { downloadTime, downloadCached: cached });
      this.downloadStartTimes.delete(imageId);
    }
  }

  /**
   * Set a metric value
   */
  private setMetric(imageId: number, values: Partial<ImagePerformanceMetrics>): void {
    const existing = this.metrics.get(imageId) || {
      imageId,
      timestamp: Date.now(),
    };

    this.metrics.set(imageId, {
      ...existing,
      ...values,
      timestamp: Date.now(),
    });
  }

  /**
   * Get metrics for an image
   */
  getMetrics(imageId: number): ImagePerformanceMetrics | undefined {
    return this.metrics.get(imageId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): ImagePerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.loadStartTimes.clear();
    this.downloadStartTimes.clear();
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalImages: number;
    avgLoadTime: number;
    avgDownloadTime: number;
    cacheHitRate: number;
    base64ImageCount: number;
  } {
    const allMetrics = this.getAllMetrics();
    const totalImages = allMetrics.length;

    const loadTimes = allMetrics.map(m => m.loadTime).filter((t): t is number => t !== undefined);
    const downloadTimes = allMetrics.map(m => m.downloadTime).filter((t): t is number => t !== undefined);
    const cachedDownloads = allMetrics.filter(m => m.downloadCached === true).length;
    const totalDownloads = allMetrics.filter(m => m.downloadTime !== undefined).length;
    const base64Count = allMetrics.filter(m => m.isBase64 === true).length;

    const avgLoadTime = loadTimes.length > 0
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      : 0;

    const avgDownloadTime = downloadTimes.length > 0
      ? downloadTimes.reduce((a, b) => a + b, 0) / downloadTimes.length
      : 0;

    const cacheHitRate = totalDownloads > 0
      ? (cachedDownloads / totalDownloads) * 100
      : 0;

    return {
      totalImages,
      avgLoadTime,
      avgDownloadTime,
      cacheHitRate,
      base64ImageCount: base64Count,
    };
  }

  /**
   * Log statistics to console
   */
  logStats(): void {
    const stats = this.getStats();
    console.log('[Performance Metrics]', {
      'Total Images': stats.totalImages,
      'Avg Load Time': `${stats.avgLoadTime.toFixed(2)}ms`,
      'Avg Download Time': `${stats.avgDownloadTime.toFixed(2)}ms`,
      'Cache Hit Rate': `${stats.cacheHitRate.toFixed(1)}%`,
      'Base64 Images': stats.base64ImageCount,
    });
  }
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = new ImagePerformanceTracker();

/**
 * Hook to track performance for image operations
 */
export function usePerformanceTracking(imageId: number) {
  const startLoad = () => performanceTracker.startLoad(imageId);
  const endLoad = () => performanceTracker.endLoad(imageId);
  const startDownload = () => performanceTracker.startDownload(imageId);
  const endDownload = (cached: boolean = false) => performanceTracker.endDownload(imageId, cached);
  const getMetrics = () => performanceTracker.getMetrics(imageId);

  return {
    startLoad,
    endLoad,
    startDownload,
    endDownload,
    getMetrics,
  };
}
