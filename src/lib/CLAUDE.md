# CLAUDE.md - src/lib/

This file provides guidance to Claude Code (claude.ai/code) when working with frontend utility libraries.

## Purpose

This directory contains client-side utility modules and React contexts for the frontend application.

## File Structure

```
src/lib/
├── theme.tsx          # Theme context and provider
├── api-client.ts      # Core API client with axios and interceptors
├── api/               # API functions with Zod validation
│   ├── config.ts      # Server configuration API
│   ├── image-generation.ts # Image generation with Zod
│   └── download.ts    # Image format conversion API
├── utils/             # Utility functions
│   └── blobUrl.ts     # Blob URL utilities for memory efficiency
├── metrics/           # Performance tracking
│   └── imagePerformance.ts # Performance metrics tracking
└── cache/             # Caching utilities
    └── imageDownloadCache.ts # LRU cache for converted images
```

## Modules

### `theme.tsx` - Theme Context

**Purpose:** Provides React context for dark/light theme management with localStorage persistence and system preference detection.

See main documentation below for full details.

### `api-client.ts` - Core API Client

**Purpose:** Provides centralized HTTP client with interceptors and error handling.

**Classes:**

#### `ApiError`

Custom error class for API failures.

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

#### `apiClient`

Singleton axios instance with pre-configured settings.

**Configuration:**
- **Base URL:** `process.env.API_BASE_URL` or `http://localhost:3001`
- **Timeout:** 2 minutes (120,000ms)
- **Headers:**
  - `Content-Type: application/json`
  - `X-Request-ID` - Unique UUID for each request

**Request Interceptor:** Adds unique request ID header for tracing.

**Response Interceptor:** Transforms errors to `ApiError` instances.

**Retry Logic:** Automatic retry with exponential backoff for retryable status codes (500, 502, 503, 504).

### `api/` - API Functions

#### `config.ts` - Server Configuration API

**Purpose:** Fetches server configuration and available models.

See `api/CLAUDE.md` for detailed documentation.

#### `image-generation.ts` - Image Generation API

**Purpose:** Generates images using OpenAI's DALL-E 3, DALL-E 2, and GPT Image 1.5 APIs.

See `api/CLAUDE.md` for detailed documentation.

#### `download.ts` - Image Conversion API

**Purpose:** Converts images to different formats via backend Sharp processing.

See `api/CLAUDE.md` for detailed documentation.

### `utils/` - Utility Functions

#### `blobUrl.ts` - Blob URL Utilities

**Purpose:** Converts base64 image data to Blob URLs for efficient memory usage (~90% reduction).

See `utils/CLAUDE.md` for detailed documentation.

### `metrics/` - Performance Metrics

#### `imagePerformance.ts` - Performance Tracking

**Purpose:** Tracks image loading and download performance metrics.

See `metrics/CLAUDE.md` for detailed documentation.

### `cache/` - Caching Utilities

#### `imageDownloadCache.ts` - Image Download Cache

**Purpose:** LRU cache for storing converted image downloads.

See `cache/CLAUDE.md` for detailed documentation.

## Dependencies

- **react** - Context and hooks (for theme.tsx)
- **react-dom** - DOM manipulation (for theme.tsx)
- **axios** - HTTP client (for api-client.ts)
- **../../types** - Shared TypeScript interfaces
- **zod** - Runtime type validation (for api/)

## Adding New Utilities

When adding new utilities to this directory:

1. Create file in appropriate subdirectory (utils/, metrics/, cache/, api/)
2. Export functions/components
3. Add TypeScript types
4. Update this documentation
5. Consider client-side only code

## Notes

- Theme context is client-side only
- `mounted` state prevents hydration mismatch
- localStorage persists theme across sessions
- System preference detected on first visit only
- Theme changes update CSS variables globally
- Works with Ant Design ConfigProvider in `ThemedApp.tsx`
- API client provides centralized HTTP communication
- Zod schemas validate all API responses
- Blob URL utilities reduce memory usage by ~90%
- Performance metrics tracking for optimization monitoring
- LRU cache prevents redundant format conversions
