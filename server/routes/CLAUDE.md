# CLAUDE.md - server/routes/

This file provides guidance to Claude Code (claude.ai/code) when working with API route handlers.

## Purpose

This directory contains Express.js route handlers for all API endpoints. Each route file handles a specific API resource.

## Routes Overview

| Route File | Endpoint | Method | Purpose |
|------------|----------|--------|---------|
| `config.ts` | `/api/config` | GET | Server configuration and available models |
| `images.ts` | `/api/images` | POST | Generate images using DALL-E API |
| `download.ts` | `/api/download` | POST | Convert images to different formats |

## Route Handlers

### `config.ts` - Configuration Endpoint

**Endpoint:** `GET /api/config`

**Purpose:** Returns server configuration and available DALL-E models based on the OpenAI base URL.

**Response:**
```typescript
{
  availableModels: ModelOption[];
  baseURL: string;
}
```

**Key Features:**
- Detects API provider from `OPENAI_BASE_URL`
- Returns appropriate model options (OpenAI vs OpenRouter)
- Includes model capabilities (size support, quality options)

**Model Options:**
- **OpenAI**: DALL-E 2, DALL-E 3
- **OpenRouter**: Various provider models

---

### `images.ts` - Image Generation Endpoint

**Endpoint:** `POST /api/images`

**Purpose:** Generates images using OpenAI's DALL-E API.

**Request Body:**
```typescript
{
  prompt: string;          // Image description
  model: string;           // Model identifier
  quality?: 'standard' | 'hd';  // DALL-E 3 only
  size?: string;           // Image dimensions
  style?: 'vivid' | 'natural';  // DALL-E 3 only
  n?: number;              // Number of images (DALL-E 3 always returns 1)
}
```

**Response:**
```typescript
{
  result: OpenAIImageResult[];
}
```

**OpenAIImageResult:**
```typescript
{
  url?: string;            // Image URL
  revised_prompt?: string; // DALL-E 3 revised prompt
  b64_json?: string;       // Base64 encoded image
}
```

**Key Features:**
- Validates input parameters
- Handles both DALL-E 2 and DALL-E 3
- Supports OpenRouter API
- Returns image URLs or base64 data
- Error handling for API failures

**Validation Rules:**
- DALL-E 3 only supports `n=1`
- Size validation per model
- Quality/Style only for DALL-E 3

---

### `download.ts` - Image Conversion Endpoint

**Endpoint:** `POST /api/download`

**Purpose:** Converts images to different formats using the Sharp library.

**Request Body:**
```typescript
{
  imageUrl: string;        // URL of image to convert
  format: DownloadFormat;  // Target format
}
```

**DownloadFormat:** `'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'avif'`

**Response:**
```typescript
{
  result: string;  // Base64 encoded image (data URL format)
}
```

**Key Features:**
- Fetches images from URLs
- Converts to 6 different formats
- Handles both PNG and JPEG sources
- Returns base64 data URL for client download
- Efficient Sharp-based processing

**Format Support:**
- **WebP** - Modern format with good compression
- **PNG** - Lossless compression
- **JPEG/JPG** - Lossy compression
- **GIF** - Animated format support
- **AVIF** - Next-gen format

## Error Handling

All routes use the centralized error handler from `middleware/error.ts`:

- **400 Bad Request** - Invalid input parameters
- **401 Unauthorized** - Missing/invalid API key
- **500 Internal Server Error** - API or processing failures

## Dependencies

- **express** - Router and request handling
- **openai** - OpenAI SDK for image generation
- **sharp** - Image processing and format conversion
- **axios** - HTTP client for fetching images
- **../../types** - Shared TypeScript interfaces
- **../lib/validation** - Input validation utilities
- **../lib/config** - Configuration helpers

## Common Patterns

### Request Validation

All routes follow this pattern:

```typescript
import { validateRequestBody } from '../lib/validation';

router.post('/', async (req, res, next) => {
  // Validate request body
  const validationResult = validateRequestBody(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error });
  }

  // Process request...
});
```

### Error Responses

```typescript
// Success
res.json({ result: data });

// Error
res.status(400).json({ error: 'Error message' });
```

## Notes

- All routes are mounted at `/api/*` in `server/index.ts`
- API key is stored in environment variable (never in code)
- Sharp handles all image processing server-side
- Base64 encoding used for image transport
- CORS configured for frontend access
