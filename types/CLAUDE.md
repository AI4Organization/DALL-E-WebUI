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

#### `ImageQuality`
Quality setting for DALL-E 3 image generation.

```typescript
type ImageQuality = 'standard' | 'hd';
```

- **standard**: Faster generation, lower cost
- **hd**: Higher detail, slower generation

#### `ImageSize`
Dimensions for generated images.

```typescript
type ImageSize =
  // DALL-E 2 sizes
  | '256x256'
  | '512x512'
  | '1024x1024'
  // DALL-E 3 sizes
  | '1024x1792'  // Portrait
  | '1792x1024'; // Landscape
```

**Model Support:**
- DALL-E 2: All square sizes (256x256, 512x512, 1024x1024)
- DALL-E 3: Square (1024x1024) and rectangular sizes

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

#### Size Constants
Pre-defined size arrays for each model.

```typescript
const DALL_E_2_SIZES: readonly ImageSize[];
// ['256x256', '512x512', '1024x1024']

const DALL_E_3_SIZES: readonly ImageSize[];
// ['1024x1024', '1024x1792', '1792x1024']
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
  n: number;          // Number of images (DALL-E 3 ignores, always 1)
  s: ImageSize;       // Image dimensions
  q: ImageQuality;    // Quality (DALL-E 3 only)
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
```

## Type Safety Notes

- TypeScript strict mode is enabled
- All API responses are typed
- Environment variables are typed with `declare global`
- Readonly arrays prevent modification of constants
- Union types provide exhaustiveness checking

## Adding New Types

When adding new types:

1. Place in appropriate category section
2. Export from `index.ts`
3. Add JSDoc comments for complex types
4. Update this documentation
5. Consider adding to global namespace if environment-related

## Notes

- These types are shared between frontend and backend
- Backend imports from `../../types`
- Frontend imports from `types/` or uses path alias `@/types`
- All types use `interface` for object shapes (extensible)
- Use `type` for unions, intersections, and primitives
