# CLAUDE.md - types/

This file provides guidance to Claude Code (claude.ai/code) when working with shared TypeScript type definitions.

## Purpose

This directory contains shared TypeScript interfaces and types used across both frontend and backend. All types are exported from `index.ts` for easy importing.

## File Structure

```
types/
└── index.ts    # All shared TypeScript definitions
```

## Type Categories

### 1. OpenAI API Types

#### `OpenAIImageResponse`
Response from OpenAI images API.

```typescript
interface OpenAIImageResponse {
  created: number;              // Timestamp
  data: OpenAIImageResult[];    // Generated images
}
```

#### `OpenAIImageResult`
Individual image result from DALL-E API.

```typescript
interface OpenAIImageResult {
  url?: string;              // Image URL (if not base64)
  revised_prompt?: string;    // DALL-E 3 revised prompt
  b64_json?: string;         // Base64 encoded image
}
```

---

### 2. Image Generation Types

#### `DALLE2ImageQuality`
Quality setting for DALL-E 2 image generation.

```typescript
type DALLE2ImageQuality = 'standard';
```

- **standard**: Only quality option for DALL-E 2

#### `ImageQuality`
Quality setting for DALL-E 3 image generation.

```typescript
type ImageQuality = 'standard' | 'hd';
```

- **standard**: Faster generation, lower cost
- **hd**: Higher detail, slower generation

#### `GPTImageQuality`
Quality setting for GPT Image 1.5 image generation.

```typescript
type GPTImageQuality = 'auto' | 'high' | 'medium' | 'low';
```

- **auto**: Automatic quality selection
- **high**: Highest quality
- **medium**: Medium quality
- **low**: Lowest quality

#### `GPTImageOutputFormat`
Output format setting for GPT Image 1.5.

```typescript
type GPTImageOutputFormat = 'png' | 'jpeg' | 'webp';
```

#### `GPTImageBackground`
Background setting for GPT Image 1.5.

```typescript
type GPTImageBackground = 'auto' | 'transparent' | 'opaque';
```

#### `ImageSize`
Dimensions for generated images.

```typescript
type ImageSize =
  // Common square size (all models)
  | '1024x1024'
  // DALL-E 2 sizes
  | '256x256'
  | '512x512'
  // DALL-E 3 sizes
  | '1024x1792'  // Portrait
  | '1792x1024'  // Landscape
  // GPT Image 1.5 sizes
  | 'auto'       // Automatic size
  | '1536x1024'  // Landscape
  | '1024x1536'; // Portrait
```

**Model Support:**
- DALL-E 2: All square sizes (256x256, 512x512, 1024x1024)
- DALL-E 3: Square (1024x1024) and rectangular sizes (1024x1792, 1792x1024)
- GPT Image 1.5: All sizes (auto, 1024x1024, 1536x1024, 1024x1536)

#### `ImageStyle`
Style preset for DALL-E 3.

```typescript
type ImageStyle = 'vivid' | 'natural';
```

- **vivid**: Hyper-realistic, dramatic images
- **natural**: More natural, less dramatic results

#### `DownloadFormat`
Supported image formats for download/conversion.

```typescript
type DownloadFormat = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'avif';
```

#### `ImageGenerationStatus`
Status of an individual image generation request.

```typescript
type ImageGenerationStatus = 'pending' | 'loading' | 'success' | 'error';
```

#### `ImageGenerationItem`
Individual image generation item with status tracking.

```typescript
interface ImageGenerationItem {
  id: number;
  status: ImageGenerationStatus;
  result?: OpenAIImageResult;
  error?: string;
}
```

#### Size Constants
Pre-defined size arrays for each model.

```typescript
const DALL_E_2_SIZES: readonly ImageSize[];
// ['256x256', '512x512', '1024x1024']

const DALL_E_3_SIZES: readonly ImageSize[];
// ['1024x1024', '1024x1792', '1792x1024']

const GPT_IMAGE_1_5_SIZES: readonly ImageSize[];
// ['auto', '1024x1024', '1536x1024', '1024x1536']
```

---

### 3. Model Options

#### `ModelOption`
Dropdown option for model selection.

```typescript
interface ModelOption {
  value: string;  // Model ID (e.g., 'dall-e-3')
  label: string;  // Display name (e.g., 'DALL-E 3')
}
```

---

### 4. API Request/Response Types

#### `ImagesApiQueryParams`
Parameters for image generation API.

```typescript
interface ImagesApiQueryParams {
  p: string;          // Prompt text
  n: number;          // Number of images
  s: ImageSize;       // Image dimensions
  q: ImageQuality;    // Quality (DALL-E 3 and GPT Image 1.5)
                      // Note: For DALL-E 2, quality parameter may be present but is not sent to API
  st?: ImageStyle;    // Style (DALL-E 3 only)
  m: string;          // Model identifier
}
```

#### `ImagesApiResponse`
Response from image generation endpoint.

```typescript
interface ImagesApiResponse {
  result: OpenAIImageResult[];
}
```

#### `ImagesApiErrorResponse`
Error response from image generation endpoint.

```typescript
interface ImagesApiErrorResponse {
  error: string;
  details?: string[];
  code?: string;
  type?: string;
}
```

#### `DownloadApiRequestBody`
Request body for image conversion endpoint.

```typescript
interface DownloadApiRequestBody {
  url: string;          // Image URL to convert
  type: DownloadFormat; // Target format
}
```

#### `DownloadApiResponse`
Response from image conversion endpoint.

```typescript
interface DownloadApiResponse {
  result: string;  // Base64 data URL
}
```

#### `ConfigApiResponse`
Response from configuration endpoint.

```typescript
interface ConfigApiResponse {
  availableModels: ModelOption[];
  baseURL: string;
}
```

#### `ConfigApiErrorResponse`
Error response from configuration endpoint.

```typescript
interface ConfigApiErrorResponse {
  error: string;
  details: string[];
}
```

---

### 5. Server Config Types

#### `ServerConfig`
Server configuration state.

```typescript
interface ServerConfig {
  baseURL: string;
  isValid: boolean;
  errors: string[];
  availableModels: ModelOption[];
}
```

#### `ValidationResult`
Result of input validation.

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: string[];
  error?: string;
}
```

---

### 6. Environment Variables

Global type declarations for environment variables.

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;    // Required
      OPENAI_BASE_URL: string;   // Required
    }
  }
}
```

**Required Environment Variables:**
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - API base URL (e.g., `https://api.openai.com/v1`)

## Import Usage

```typescript
// Import specific types
import type { ImageSize, ImageQuality, ImageStyle } from '../../types';
import { OpenAIImageResult, ModelOption } from '../../types';

// Import all
import * as Types from '../../types';

// Import constants
import { DALL_E_2_SIZES, DALL_E_3_SIZES, GPT_IMAGE_1_5_SIZES } from '../../types';
```

## Model-Specific Type Usage

### DALL-E 2
```typescript
import type { ImageSize, DALLE2ImageQuality } from '../../types';

const size: ImageSize = '1024x1024'; // Valid: 256x256, 512x512, 1024x1024
const quality: DALLE2ImageQuality = 'standard'; // Only option
```

### DALL-E 3
```typescript
import type { ImageSize, ImageQuality, ImageStyle } from '../../types';

const size: ImageSize = '1024x1024'; // Valid: 1024x1024, 1024x1792, 1792x1024
const quality: ImageQuality = 'hd'; // Valid: standard, hd
const style: ImageStyle = 'vivid'; // Valid: vivid, natural
```

### GPT Image 1.5
```typescript
import type {
  ImageSize,
  GPTImageQuality,
  GPTImageOutputFormat,
  GPTImageBackground
} from '../../types';

const size: ImageSize = 'auto'; // Valid: auto, 1024x1024, 1536x1024, 1024x1536
const quality: GPTImageQuality = 'high'; // Valid: auto, high, medium, low
const outputFormat: GPTImageOutputFormat = 'png'; // Valid: png, jpeg, webp
const background: GPTImageBackground = 'transparent'; // Valid: auto, transparent, opaque
```

## Type Safety Notes

- TypeScript strict mode is enabled
- All API responses are typed
- Environment variables are typed with `declare global`
- Readonly arrays prevent modification of constants
- Union types provide exhaustiveness checking
- `readonly` modifier on size constants prevents accidental modification

## Adding New Types

When adding new types:

1. Place in appropriate category section
2. Export from `index.ts`
3. Add JSDoc comments for complex types
4. Update this documentation
5. Consider adding to global namespace if environment-related
6. Use `type` for unions, intersections, and primitives
7. Use `interface` for object shapes (extensible)

## Notes

- These types are shared between frontend and backend
- Backend imports from `../../types`
- Frontend imports from `types/` or uses path alias `@/types`
- All types use `interface` for object shapes (extensible)
- Use `type` for unions, intersections, and primitives
