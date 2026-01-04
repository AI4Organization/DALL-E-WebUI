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
- **OpenAI**: DALL-E 2, DALL-E 3, GPT Image 1.5
- **OpenRouter**: GLM-4.6v (Z-AI), Grok-4.1-Fast (X-AI)

---

### `images.ts` - Image Generation Endpoint

**Endpoint:** `POST /api/images`

**Purpose:** Generates images using OpenAI's DALL-E 3, DALL-E 2, and GPT Image 1.5 APIs.

**Request Query Parameters:**
```typescript
{
  p: string;          // Prompt (URL-encoded)
  n: string;          // Number of images (as string for query param)
  s: string;          // Size: Image dimensions (model-dependent)
  q?: string;         // Quality: 'standard'|'hd' (DALL-E 3) or 'auto'|'high'|'medium'|'low' (GPT Image 1.5)
                      // Note: For DALL-E 2, quality parameter is accepted but NOT sent to API (DALL-E 2 ignores it)
  st?: string;        // Style: 'vivid'|'natural' (DALL-E 3 only)
  m?: string;         // Model: 'dall-e-2', 'dall-e-3', or 'gpt-image-1.5'
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
  url?: string;            // Image URL (DALL-E 2, DALL-E 3)
  revised_prompt?: string; // DALL-E 3 revised prompt
  b64_json?: string;       // Base64 encoded image (GPT Image 1.5)
}
```

**Key Features:**
- Validates input parameters using `server/lib/validation.ts`
- Handles DALL-E 2, DALL-E 3, and GPT Image 1.5
- Supports OpenRouter API
- Returns image URLs (DALL-E 2, DALL-E 3) or base64 data (GPT Image 1.5)
- Comprehensive error handling for API failures
- Quality parameter is only sent to API for DALL-E 3 and GPT Image 1.5 (DALL-E 2 ignores it)

**Note:** All parameters are passed as query parameters in the URL, not in the request body.

**Model-Specific Behavior:**

| Feature | DALL-E 2 | DALL-E 3 | GPT Image 1.5 |
|---------|----------|----------|---------------|
| Max images (per request) | 10 | 1 | 10 |
| Max images (via parallel requests) | N/A | 10 (via 4 concurrent requests) | N/A |
| Prompt limit | 1000 chars | 4000 chars | 32000 chars |
| Return format | `url` | `url` | `b64_json` (base64) |
| Quality options | N/A (API ignores) | standard, hd | auto, high, medium, low |
| Style options | Not supported | vivid, natural | Not supported |
| Sizes | 256x256, 512x512, 1024x1024 | 1024x1024, 1024x1792, 1792x1024 | auto, 1024x1024, 1536x1024, 1024x1536 |
| Output format | N/A | N/A | png, jpeg, webp |
| Background | N/A | N/A | auto, transparent, opaque |

**Validation Rules:**
- DALL-E 3 API only supports `n=1` per request, but frontend makes parallel requests for multiple images
- DALL-E 2 supports `n=1` to `n=10` in a single API request
- GPT Image 1.5 supports `n=1` to `n=10` in a single API request
- Style is **required** for DALL-E 3
- Size validation per model
- Quality/Style only for DALL-E 3
- Quality parameter not sent to API for DALL-E 2 (API ignores it)
- Output format/Background only for GPT Image 1.5

**Error Handling:**

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Missing parameters | Required params not provided |
| 400 | Invalid parameters | Parameter validation failed |
| 400 | Invalid request | OpenAI API rejected request |
| 401 | Authentication failed | Invalid API key |
| 403 | Model not found | Model not available for API key |
| 429 | Rate limit exceeded | API rate limit reached |
| 500 | API failure | OpenAI API error |

---

### `download.ts` - Image Conversion Endpoint

**Endpoint:** `POST /api/download`

**Purpose:** Converts images to different formats using the Sharp library.

**Request Body:**
```typescript
{
  imageUrl: string;           // URL of image to convert
  type: ImageOutputFormat;    // Target format (webp, png, jpeg)
}
```

**ImageOutputFormat:** `'webp' | 'png' | 'jpeg'`

**Response:**
```typescript
{
  result: string;  // Base64 encoded image (data URL format)
}
```

**Key Features:**
- Fetches images from URLs
- Converts to 3 different formats
- Handles both PNG and JPEG sources
- Returns base64 data URL for client download
- Efficient Sharp-based processing

**Format Support:**
- **WebP** - Modern format with good compression
- **PNG** - Lossless compression
- **JPEG** - Lossy compression

## Error Handling

All routes use the centralized error handler from `middleware/error.ts`:

- **400 Bad Request** - Invalid input parameters
- **401 Unauthorized** - Missing/invalid API key
- **403 Forbidden** - Model not available for API key
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - API or processing failures

## Dependencies

- **express** - Router and request handling
- **openai** - OpenAI SDK for image generation (via `../lib/openai-client.ts`)
- **sharp** - Image processing and format conversion
- **axios** - HTTP client for fetching images
- **../../types** - Shared TypeScript interfaces
- **../lib/validation** - Input validation utilities
- **../lib/config** - Configuration helpers

## Common Patterns

### Request Validation

All routes follow this pattern:

```typescript
import { validateRequest } from '../lib/validation';

router.post('/', async (req, res, next) => {
  // Validate query parameters
  const validationResult = validateRequest(req.query);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error });
  }

  // Process request...
});
```

### Model-Specific Parameter Building

```typescript
// Build request parameters based on model
const requestParams: any = {
  prompt: prompt as string,
  n: Number(n),
  size: size as ImageSize,
  model: selectedModel as string,
};

// Add quality parameter for DALL-E 3 and GPT Image 1.5
// DALL-E 2 does not support quality parameter (always standard)
if (quality && selectedModel !== 'dall-e-2') {
  requestParams.quality = quality;
}

// Add style for DALL-E 3 only
if (selectedModel === 'dall-e-3' && style) {
  requestParams.style = style as ImageStyle;
}

// Add GPT Image 1.5 specific parameters
if (selectedModel === 'gpt-image-1.5') {
  if (output_format) requestParams.output_format = output_format;
  if (background) requestParams.background = background;
}
```

### Error Responses

```typescript
// Success
res.json({ result: data });

// Error
res.status(400).json({ error: 'Error message' });

// Error with details
res.status(400).json({
  error: 'Error message',
  details: ['Detail 1', 'Detail 2']
});
```

## API Key Configuration

The OpenAI client is initialized in `../lib/openai-client.ts`:

```typescript
import openai from '../lib/openai-client';

const response = await openai.images.generate(requestParams);
```

The client uses:
- `OPENAI_API_KEY` from environment
- `OPENAI_BASE_URL` from environment

## Notes

- All routes are mounted at `/api/*` in `server/index.ts`
- API key is stored in environment variable (never in code)
- Sharp handles all image processing server-side
- Base64 encoding used for image transport
- CORS configured for frontend access
- DALL-E 2 quality parameter is accepted but not sent to API (API ignores it)
