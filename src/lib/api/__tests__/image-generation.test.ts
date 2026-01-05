/**
 * Tests for image generation API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { apiClient } from '../../api-client';
import { generateImages, getImageDisplayUrl, hasDownloadableImage, isAbortError } from '../image-generation';

// Mock api-client
vi.mock('../../api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public details?: string[]
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

describe('image-generation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateImages', () => {
    it('should generate images successfully', async () => {
      const mockResponse = {
        data: {
          result: [
            { url: 'https://example.com/image1.png' },
            { url: 'https://example.com/image2.png' },
          ],
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await generateImages({
        prompt: 'A cat',
        model: 'dall-e-3',
        n: 2,
        quality: 'standard',
        size: '1024x1024',
      });

      expect(result.images).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/images',
        expect.objectContaining({
          prompt: 'A cat',
          model: 'dall-e-3',
          n: 2,
        }),
        expect.any(Object)
      );
    });

    it('should handle base64 image responses', async () => {
      const mockResponse = {
        data: {
          result: [
            { b64_json: 'base64encodeddata' },
          ],
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await generateImages({
        prompt: 'A cat',
        model: 'gpt-image-1.5',
        n: 1,
      });

      expect(result.images[0].b64_json).toBe('base64encodeddata');
    });

    it('should include style parameter for DALL-E 3', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { result: [{ url: 'https://example.com/image.png' }] },
      });

      await generateImages({
        prompt: 'A cat',
        model: 'dall-e-3',
        n: 1,
        style: 'vivid',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/images',
        expect.objectContaining({
          style: 'vivid',
        }),
        expect.any(Object)
      );
    });

    it('should include response_format for GPT Image 1.5', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { result: [{ b64_json: 'base64data' }] },
      });

      await generateImages({
        prompt: 'A cat',
        model: 'gpt-image-1.5',
        n: 1,
        response_format: 'webp',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/images',
        expect.objectContaining({
          response_format: 'webp',
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      const { ApiError } = await import('../../api-client');
      vi.mocked(apiClient.post).mockRejectedValue(
        new ApiError(500, 'Internal server error')
      );

      await expect(
        generateImages({
          prompt: 'A cat',
          model: 'dall-e-3',
          n: 1,
        })
      ).rejects.toThrow('Internal server error');
    });

    it('should support request cancellation via AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { result: [{ url: 'https://example.com/image.png' }] },
      });

      await generateImages({
        prompt: 'A cat',
        model: 'dall-e-3',
        n: 1,
        signal: abortController.signal,
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/images',
        expect.any(Object),
        expect.objectContaining({
          signal: abortController.signal,
        })
      );
    });
  });

  describe('getImageDisplayUrl', () => {
    it('should return URL for URL-based images', () => {
      const result = { url: 'https://example.com/image.png' };
      expect(getImageDisplayUrl(result)).toBe('https://example.com/image.png');
    });

    it('should return data URL for base64 images', () => {
      const result = { b64_json: 'base64data' };
      expect(getImageDisplayUrl(result)).toBe('data:image/png;base64,base64data');
    });

    it('should return null for images without URL or base64', () => {
      const result = {};
      expect(getImageDisplayUrl(result)).toBeNull();
    });
  });

  describe('hasDownloadableImage', () => {
    it('should return true for URL-based images', () => {
      expect(hasDownloadableImage({ url: 'https://example.com/image.png' })).toBe(true);
    });

    it('should return true for base64 images', () => {
      expect(hasDownloadableImage({ b64_json: 'base64data' })).toBe(true);
    });

    it('should return false for images without URL or base64', () => {
      expect(hasDownloadableImage({})).toBe(false);
    });
  });

  describe('isAbortError', () => {
    it('should identify AbortError', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      expect(isAbortError(error)).toBe(true);
    });

    it('should identify CanceledError', () => {
      const error = new Error('Canceled');
      error.name = 'CanceledError';
      expect(isAbortError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Not aborted');
      expect(isAbortError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(isAbortError('string')).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
    });
  });
});
