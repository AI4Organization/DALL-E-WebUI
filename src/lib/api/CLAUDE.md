# CLAUDE.md - src/lib/api/

This file provides guidance to Claude Code (claude.ai/code) when working with the API client layer.

## Purpose

This directory contains the API client layer that handles communication between the frontend and backend Express server. All API functions use TypeScript strict mode and include runtime validation with Zod schemas.

## Architecture

The API layer follows these principles:

1. **Centralized Configuration** - Single `apiClient` instance with consistent settings
2. **Error Handling** - Custom `ApiError` class with status codes and details
3. **Runtime Validation** - Zod schemas validate all API responses
4. **Type Safety** - Full TypeScript types for requests and responses
5. **Cancellation Support** - AbortSignal for request cancellation

## Files Overview

| File | Purpose |
|------|---------|
| `api-client.ts` | Core API client with axios and interceptors |
| `image-generation.ts` | Image generation API with Zod validation |
| `config.ts` | Server configuration API |
| `download.ts` | Image format conversion and download API |

## Core API Client

### `api-client.ts`

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

**Properties:**
- `status` - HTTP status code
- `message` - Error message
- `details` - Optional array of detailed error messages

**Usage:**
```typescript
try {
  await apiClient.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status); // 404
    console.error(error.details); // ['Resource not found']
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

**Request Interceptor:**
Adds unique request ID header for tracing:

```typescript
apiClient.interceptors.request.use((config) => {
  config.headers['X-Request-ID'] = crypto.randomUUID();
  return config;
});
```

**Response Interceptor:**
Transforms errors to `ApiError` instances:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      throw new ApiError(
        error.response.status,
        error.response.data?.error || 'Request failed',
        error.response.data?.details
      );
    }
    throw error;
  }
);
```

**Retry Logic:**
Automatic retry with exponential backoff for retryable status codes:
- **Retryable Codes:** 500, 502, 503, 504
- **Max Retries:** 3 attempts
- **Backoff:** 1s, 2s, 4s (exponential)

---

## API Functions

### `image-generation.ts`

**Purpose:** Generates images using OpenAI's DALL-E 3, DALL-E 2, and GPT Image 1.5 APIs.

**Main Function:**

#### `generateImages`

Generates images with runtime validation.

```typescript
export async function generateImages(
  params: ImageGenerationParams
): Promise<ImageGenerationResult>
```

**Parameters:**
```typescript
export interface ImageGenerationParams {
  prompt: string;
  model: string;
  n: number;
  quality?: ImageQuality | GPTImageQuality;
  size?: ImageSize;
  style?: ImageStyle;
  response_format?: ImageOutputFormat;
  background?: GPTImageBackground;
  signal?: AbortSignal;
}
```

**Returns:**
```typescript
export interface ImageGenerationResult {
  images: OpenAIImageResult[];
  count: number;
}
```

**Features:**
- **Zod Validation:** Response validated against `ImageGenerationResponseSchema`
- **Model-Specific Parameters:** Only sends applicable parameters to API
- **Abort Support:** Cancellable via `AbortSignal`
- **Type Safety:** Proper TypeScript types for all parameters

**Zod Schemas:**
```typescript
export const OpenAIImageResultSchema = z.object({
  url: z.string().url().optional(),
  revised_prompt: z.string().optional(),
  b64_json: z.string().optional(),
});

export const ImageGenerationResponseSchema = z.object({
  result: z.array(OpenAIImageResultSchema),
});
```

**Usage:**
```typescript
import { generateImages } from '../lib/api/image-generation';

const { images, count } = await generateImages({
  prompt: 'A futuristic city at sunset',
  model: 'dall-e-3',
  n: 4,
  quality: 'hd',
  size: '1792x1024',
  style: 'vivid',
  signal: abortController.signal,
});
```

**Helper Functions:**

#### `isAbortError`

Type guard for abort errors.

```typescript
export function isAbortError(error: unknown): error is Error & {
  name: 'AbortError' | 'CanceledError';
}
```

#### `getImageDisplayUrl`

Gets display URL from image result (handles both URL and base64).

```typescript
export function getImageDisplayUrl(result: OpenAIImageResult): string | null
```

#### `hasDownloadableImage`

Checks if result has downloadable image.

```typescript
export function hasDownloadableImage(result: OpenAIImageResult): boolean
```

---

### `config.ts`

**Purpose:** Fetches server configuration and available models.

**Main Function:**

#### `fetchConfig`

Fetches server configuration.

```typescript
export async function fetchConfig(): Promise<ServerConfig>
```

**Returns:**
```typescript
export interface ServerConfig {
  availableModels: ModelOption[];
  baseURL: string;
  isValid: boolean;
  errors?: string[];
}
```

**Zod Schema:**
```typescript
export const ConfigResponseSchema = z.object({
  availableModels: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
    })
  ),
  baseURL: z.string(),
});
```

**Usage:**
```typescript
import { fetchConfig } from '../lib/api/config';

const config = await fetchConfig();
console.log(config.availableModels);
// [{ value: 'dall-e-3', label: 'DALL-E 3' }, ...]
```

---

### `download.ts`

**Purpose:** Converts images to different formats via backend Sharp processing.

**Main Function:**

#### `downloadImage`

Downloads and converts image to specified format.

```typescript
export async function downloadImage(
  params: DownloadParams
): Promise<string>
```

**Parameters:**
```typescript
export interface DownloadParams {
  url: string;
  format: ImageOutputFormat;  // 'webp' | 'png' | 'jpeg'
}
```

**Returns:**
```typescript
Promise<string>  // Base64 data URL (data:image/...)
```

**Format Info:**
```typescript
function getFormatInfo(format: ImageOutputFormat): {
  mimeType: string;
  extension: string;
}
```

| Format | MIME Type | Extension |
|--------|-----------|-----------|
| `webp` | `image/webp` | `webp` |
| `png` | `image/png` | `png` |
| `jpeg` | `image/jpeg` | `jpg` |

**Usage:**
```typescript
import { downloadImage } from '../lib/api/download';

const dataUrl = await downloadImage({
  url: 'https://example.com/image.png',
  format: 'webp',
});

// Use dataUrl in download link or image source
const link = document.createElement('a');
link.href = dataUrl;
link.download = `image.${formatInfo.extension}`;
link.click();
```

**Helper Function:**

#### `getFormatInfo`

Gets MIME type and file extension for format.

```typescript
function getFormatInfo(format: ImageOutputFormat): {
  mimeType: string;
  extension: string;
}
```

---

## Common Patterns

### Error Handling

All API functions throw `ApiError` on failure:

```typescript
import { ApiError } from '../lib/api-client';

try {
  await generateImages(params);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Authentication failed
        break;
      case 429:
        // Rate limit exceeded
        break;
      case 500:
        // Server error
        break;
    }
  }
}
```

### Request Cancellation

Use `AbortSignal` for cancellable requests:

```typescript
const abortController = new AbortController();

try {
  await generateImages({
    ...params,
    signal: abortController.signal,
  });
} catch (error) {
  if (isAbortError(error)) {
    console.log('Request cancelled');
  }
}

// Cancel request
abortController.abort();
```

### Runtime Validation

Zod schemas validate all responses:

```typescript
import { ImageGenerationResponseSchema } from '../lib/api/image-generation';

const response = await apiClient.post('/api/images', payload);

// Validate with Zod
const validated = ImageGenerationResponseSchema.parse(response.data);

// Use validated data (type-safe)
console.log(validated.result[0].url);
```

## Dependencies

- **axios** 1.13.2 - HTTP client
- **zod** - Runtime type validation
- **../../types** - Shared TypeScript types
- **api-client** - Core API client instance

## Testing

API tests are located in `src/lib/api/__tests__/`:

- `image-generation.test.ts` - Image generation API tests

Test files use:
- **vitest** - Test runner
- **vi.mock()** - Mock `api-client` module

**Example Test:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateImages } from '../image-generation';
import { apiClient } from '../api-client';

vi.mock('../api-client');

it('generates images successfully', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({
    data: { result: [{ url: 'https://example.com/image.png' }] }
  });

  const result = await generateImages({
    prompt: 'Test',
    model: 'dall-e-3',
    n: 1,
  });

  expect(result.images).toHaveLength(1);
});
```

## Backend API Endpoints

The frontend API layer communicates with these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config` | GET | Server configuration |
| `/api/images` | POST | Generate images |
| `/api/download` | POST | Convert image format |
| `/health` | GET | Health check |

See `server/routes/CLAUDE.md` for backend API documentation.

## Adding New API Functions

When adding new API functions:

1. Create file in `src/lib/api/`
2. Import `apiClient` from `api-client.ts`
3. Define TypeScript interfaces for params and response
4. Create Zod schema for response validation
5. Implement function with error handling
6. Add JSDoc comments
7. Create test file in `__tests__/`
8. Update this documentation

### Template

```typescript
import { apiClient, ApiError } from '../api-client';
import { z } from 'zod';

// Types
export interface NewApiParams {
  param: string;
}

export interface NewApiResponse {
  result: string;
}

// Zod Schema
export const NewApiResponseSchema = z.object({
  result: z.string(),
});

// Function
export async function newApiCall(
  params: NewApiParams
): Promise<NewApiResponse> {
  try {
    const response = await apiClient.post('/api/new', params);
    return NewApiResponseSchema.parse(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, 'Unknown error', [String(error)]);
  }
}
```

## Notes

- All requests go through Express backend (never directly to OpenAI)
- Backend handles API key security
- Zod validation prevents type mismatches at runtime
- AbortController support for all cancellable operations
- Automatic retry with exponential backoff for server errors
- Request IDs enable tracing and debugging
