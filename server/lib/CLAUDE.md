# CLAUDE.md - server/lib/

This file provides guidance to Claude Code (claude.ai/code) when working with backend utility libraries.

## Purpose

This directory contains server-side utility modules for configuration management, input validation, and OpenAI client initialization. These are shared across API routes.

## File Structure

```
server/lib/
├── config.ts          # Configuration management and model options
├── validation.ts      # Type-safe input validation
└── openai-client.ts   # OpenAI SDK client initialization
```

## Modules

### `config.ts` - Configuration Management

**Purpose:** Manages server configuration with caching and provides model options based on the OpenAI base URL.

#### Constants

##### `BASE_URL_MODELS`
Maps base URLs to available model options.

```typescript
const BASE_URL_MODELS: Record<string, ModelOption[]> = {
  'https://api.openai.com/v1': [
    { value: 'dall-e-3', label: 'DALL-E 3' },
    { value: 'dall-e-2', label: 'DALL-E 2' },
    { value: 'gpt-image-1.5', label: 'GPT Image 1.5' }
  ],
  'https://openrouter.ai/api/v1': [
    { value: 'z-ai/glm-4.6v', label: 'GLM-4.6v (Z-AI)' },
    { value: 'x-ai/grok-4.1-fast', label: 'Grok-4.1-Fast (X-AI)' }
  ]
};
```

#### Functions

##### `getServerConfig()`
Gets the current server configuration with caching.

```typescript
function getServerConfig(): ServerConfig
```

**Returns:**
```typescript
{
  baseURL: string;        // OPENAI_BASE_URL from env
  isValid: boolean;       // Configuration valid status
  errors: string[];       // Validation errors
  availableModels: ModelOption[];  // Available models
}
```

**Features:**
- Caches configuration after first call
- Validates environment variables via `validateEnvVars()`
- Returns appropriate model options based on `OPENAI_BASE_URL`

##### `resetConfigCache()`
Clears the cached configuration (useful for testing or config changes).

```typescript
function resetConfigCache(): void
```

##### `getAvailableModelsForBaseURL(baseURL: string)`
Gets available models for a specific base URL.

```typescript
function getAvailableModelsForBaseURL(baseURL: string): ModelOption[]
```

---

### `validation.ts` - Input Validation

**Purpose:** Provides type-safe validation for API request parameters, including model-specific constraints for DALL-E 2, DALL-E 3, and GPT Image 1.5.

#### Type Definitions

##### `ValidModel`
Union type of all supported models.

```typescript
type ValidModel = 'dall-e-3' | 'dall-e-2' | 'gpt-image-1.5' | 'z-ai/glm-4.6v' | 'x-ai/grok-4.1-fast';
```

##### `GPTImage15Params`
GPT Image 1.5 specific parameters.

```typescript
interface GPTImage15Params {
  quality?: string;
  output_format?: string;
  background?: string;
  n?: number;
  size?: string;
}
```

##### `DALLE2Params`
DALL-E 2 specific parameters.

```typescript
interface DALLE2Params {
  quality?: string;
  size?: string;
  n?: number;
}
```

#### Constants

| Constant | Values | Purpose |
|----------|--------|---------|
| `BASE_URL_MODELS` | Maps URLs to valid models | Model validation |
| `VALID_STYLES` | `['vivid', 'natural']` | DALL-E 3 style options |
| `DALL_E_2_SIZES` | `['256x256', '512x512', '1024x1024']` | DALL-E 2 sizes |
| `DALL_E_2_QUALITIES` | `['standard']` | DALL-E 2 quality |
| `DALL_E_3_SIZES` | `['1024x1024', '1024x1792', '1792x1024']` | DALL-E 3 sizes |
| `GPT_IMAGE_1_5_QUALITIES` | `['auto', 'high', 'medium', 'low']` | GPT Image 1.5 quality |
| `GPT_IMAGE_1_5_OUTPUT_FORMATS` | `['png', 'jpeg', 'webp']` | GPT Image 1.5 formats |
| `GPT_IMAGE_1_5_BACKGROUNDS` | `['auto', 'transparent', 'opaque']` | GPT Image 1.5 backgrounds |
| `GPT_IMAGE_1_5_SIZES` | `['auto', '1024x1024', '1536x1024', '1024x1536']` | GPT Image 1.5 sizes |

#### Functions

##### Environment Validation

###### `validateEnvVars()`
Validates required environment variables.

```typescript
function validateEnvVars(): ValidationResult
```

**Checks:**
- `OPENAI_API_KEY` is present
- `OPENAI_BASE_URL` is present and recognized

##### Model Validation

###### `validateModelForBaseURL(model: string, baseURL: string)`
Validates that a model is available for the given base URL.

```typescript
function validateModelForBaseURL(model: string, baseURL: string): ValidationResult
```

###### `validateStyleForModel(style: string | undefined, model: string)`
Validates style parameter (required for DALL-E 3).

```typescript
function validateStyleForModel(style: string | undefined, model: string): ValidationResult
```

##### GPT Image 1.5 Validation

###### `validateGPTImage15Params(params: GPTImage15Params)`
Validates GPT Image 1.5 specific parameters.

```typescript
function validateGPTImage15Params(params: GPTImage15Params): ValidationResult
```

**Validates:**
- `quality`: auto, high, medium, low
- `output_format`: png, jpeg, webp
- `background`: auto, transparent, opaque
- `n`: 1-10 images
- `size`: auto, 1024x1024, 1536x1024, 1024x1536

##### DALL-E 2 Validation

###### `validateDALLE2Params(params: DALLE2Params)`
Validates DALL-E 2 specific parameters.

```typescript
function validateDALLE2Params(params: DALLE2Params): ValidationResult
```

**Validates:**
- `quality`: standard only
- `size`: 256x256, 512x512, 1024x1024
- `n`: 1-10 images

##### Model-Specific Helpers

###### `getPromptLimitForModel(model: string)`
Returns the maximum prompt character limit for a model.

```typescript
function getPromptLimitForModel(model: string): number
```

| Model | Limit |
|-------|-------|
| DALL-E 2 | 1000 |
| DALL-E 3 | 4000 |
| GPT Image 1.5 | 32000 |

###### `getMaxImagesForModel(model: string)`
Returns the maximum number of images per request.

```typescript
function getMaxImagesForModel(model: string): number
```

| Model | Max Images |
|-------|------------|
| DALL-E 2 | 10 |
| DALL-E 3 | 1 |
| GPT Image 1.5 | 10 |

###### `getValidSizesForModel(model: string)`
Returns valid image sizes for a model.

```typescript
function getValidSizesForModel(model: string): readonly string[]
```

###### `getDefaultSizeForModel(model: string)`
Returns the default size for a model.

```typescript
function getDefaultSizeForModel(model: string): string
```

| Model | Default |
|-------|---------|
| DALL-E 2 | 1024x1024 |
| DALL-E 3 | 1792x1024 (landscape) |
| GPT Image 1.5 | 1536x1024 (landscape) |

###### `getBaseURLModels()`
Returns the `BASE_URL_MODELS` mapping.

```typescript
function getBaseURLModels(): Record<string, ValidModel[]>
```

---

### `openai-client.ts` - OpenAI Client

**Purpose:** Initializes and exports the OpenAI SDK client for making API requests.

#### Exports

```typescript
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});
```

**Usage:**
```typescript
import { openai } from '../lib/openai-client';

const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: 'A beautiful sunset'
});
```

## Dependencies

- **../../types** - Shared TypeScript interfaces (`ServerConfig`, `ModelOption`, `ValidationResult`, `ImageStyle`)
- **openai** - OpenAI SDK (imported in `openai-client.ts`)
- **process.env** - Environment variables

## Usage Examples

### Configuration Management

```typescript
import { getServerConfig, resetConfigCache } from '../lib/config';

// Get server configuration
const config = getServerConfig();
if (!config.isValid) {
  console.error('Configuration errors:', config.errors);
}

// Reset cache (e.g., after environment change)
resetConfigCache();
```

### Environment Validation

```typescript
import { validateEnvVars } from '../lib/validation';

const result = validateEnvVars();
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Model-Specific Validation

```typescript
import {
  validateGPTImage15Params,
  validateDALLE2Params,
  getPromptLimitForModel,
  getMaxImagesForModel
} from '../lib/validation';

// GPT Image 1.5 validation
const gptValidation = validateGPTImage15Params({
  quality: 'high',
  n: 5
});

// DALL-E 2 validation
const dalle2Validation = validateDALLE2Params({
  size: '512x512',
  n: 4
});

// Get model limits
const promptLimit = getPromptLimitForModel('dall-e-3'); // 4000
const maxImages = getMaxImagesForModel('dall-e-3');    // 1
```

## Model Comparison

| Feature | DALL-E 2 | DALL-E 3 | GPT Image 1.5 |
|---------|----------|----------|---------------|
| Max images | 10 | 1 | 10 |
| Prompt limit | 1000 | 4000 | 32000 |
| Return format | URL | URL | base64 (b64_json) |
| Quality options | standard | standard, hd | auto, high, medium, low |
| Style options | None | vivid, natural | None |
| Sizes | 256x256, 512x512, 1024x1024 | 1024x1024, 1024x1792, 1792x1024 | auto, 1024x1024, 1536x1024, 1024x1536 |
| Output format | N/A | N/A | png, jpeg, webp |
| Background | N/A | N/A | auto, transparent, opaque |

## Notes

- All validation is synchronous
- Returns detailed error messages for debugging
- Type-safe with TypeScript strict mode
- No external dependencies (pure TypeScript, except OpenAI SDK)
- Used by all API routes in `server/routes/`
- Configuration is cached for performance
- GPT Image 1.5 always returns base64-encoded images
- DALL-E 3 always returns a single image (n=1)
