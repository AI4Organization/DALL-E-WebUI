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

**Purpose:** Generates images using OpenAI's DALL-E 3 and GPT Image 1.5 APIs.

**Request Query Parameters:**
```typescript
{
  p: string;          // Prompt (URL-encoded)
  n: number;          // Number of images (1 for DALL-E 3, 1-10 for GPT Image 1.5)
  q: string;          // Quality: 'standard'|'hd' (DALL-E 3) or 'auto'|'high'|'medium'|'low' (GPT Image 1.5)
  s: string;          // Size: Image dimensions (model-dependent)
  m: string;          // Model: 'dall-e-3' or 'gpt-image-1.5'
  st?: string;        // Style: 'vivid'|'natural' (DALL-E 3 only)
  of?: string;        // Output format: 'png'|'jpeg'|'webp' (GPT Image 1.5 only)
  bg?: string;        // Background: 'auto'|'transparent'|'opaque' (GPT Image 1.5 only)
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
  url?: string;            // Image URL (DALL-E 3)
  revised_prompt?: string; // DALL-E 3 revised prompt
  b64_json?: string;       // Base64 encoded image (GPT Image 1.5)
}
```

**Key Features:**
- Validates input parameters
- Handles both DALL-E 3 and GPT Image 1.5
- Supports OpenRouter API
- Returns image URLs (DALL-E 3) or base64 data (GPT Image 1.5)
- Error handling for API failures

**Model-Specific Behavior:**

| Feature | DALL-E 3 | GPT Image 1.5 |
|---------|----------|---------------|
| Max images | 1 | 10 |
| Prompt limit | 4000 chars | 32000 chars |
| Return format | `url` | `b64_json` (base64) |
| Quality options | standard, hd | auto, high, medium, low |
| Style options | vivid, natural | Not supported |
| Size options | 1024x1024, 1024x1792, 1792x1024 | auto, 1024x1024, 1536x1024, 1024x1536 |
| Output format | N/A | png, jpeg, webp |
| Background | N/A | auto, transparent, opaque |

**Validation Rules:**
- DALL-E 3 only supports `n=1`
- Size validation per model
- Quality/Style only for DALL-E 3
- Output format/Background only for GPT Image 1.5

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
