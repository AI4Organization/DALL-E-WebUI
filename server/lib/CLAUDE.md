# CLAUDE.md - server/lib/

This file provides guidance to Claude Code (claude.ai/code) when working with backend utility libraries.

## Purpose

This directory contains server-side utility modules for configuration management and input validation. These are shared across API routes.

## File Structure

```
server/lib/
├── config.ts      # Configuration management and model options
└── validation.ts  # Type-safe input validation
```

## Modules

### `config.ts` - Configuration Management

**Purpose:** Manages server configuration and provides model options based on the OpenAI base URL.

#### Functions

##### `getServerConfig()`
Gets the current server configuration with validation.

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
- Validates `OPENAI_API_KEY` presence
- Validates `OPENAI_BASE_URL` presence
- Detects API provider (OpenAI vs OpenRouter)
- Returns appropriate model options

**Model Detection:**

| Base URL | Provider | Models |
|----------|----------|--------|
| `api.openai.com` | OpenAI | DALL-E 2, DALL-E 3 |
| `openrouter.ai` | OpenRouter | Various provider models |
| Other | Custom | Custom models |

##### `getModelOptions(baseURL: string)`
Gets available models for a given base URL.

```typescript
function getModelOptions(baseURL: string): ModelOption[]
```

**OpenAI Models:**
- DALL-E 2 (`dall-e-2`)
- DALL-E 3 (`dall-e-3`)

**OpenRouter Models:**
- Various provider-specific DALL-E models

---

### `validation.ts` - Input Validation

**Purpose:** Provides type-safe validation for API request parameters.

#### Types

##### `RequestBody` Interface
```typescript
interface RequestBody {
  prompt?: string;
  model?: string;
  quality?: ImageQuality;
  size?: ImageSize;
  style?: ImageStyle;
  n?: number;
}
```

#### Functions

##### `validateRequestBody(body: RequestBody)`
Validates image generation request body.

```typescript
function validateRequestBody(body: RequestBody): ValidationResult
```

**Validation Rules:**

| Field | Required | Validation |
|-------|----------|------------|
| `prompt` | Yes | Non-empty string, 1-4096 words |
| `model` | Yes | Valid model identifier |
| `quality` | No | 'standard' or 'hd' |
| `size` | No | Valid size for model |
| `style` | No | 'vivid' or 'natural' |
| `n` | No | Positive integer |

**Returns:**
```typescript
{
  success: boolean;
  error?: string;  // Error message if validation fails
}
```

**Error Messages:**
- `"Prompt is required and must be between 1 and 4096 words."`
- `"Model is required."`
- `"Invalid quality value. Must be 'standard' or 'hd'."`
- `"Invalid size value."`
- `"Invalid style value. Must be 'vivid' or 'natural'."`
- `"Number of images must be a positive integer."`

##### `validateModelCompatibility(params: RequestBody)`
Validates that parameters are compatible with the selected model.

```typescript
function validateModelCompatibility(params: RequestBody): ValidationResult
```

**Compatibility Rules:**

| Model | Size Support | Quality | Style |
|-------|-------------|---------|-------|
| DALL-E 2 | 256x256, 512x512, 1024x1024 | No | No |
| DALL-E 3 | 1024x1024, 1024x1792, 1792x1024 | Yes | Yes |

**DALL-E 3 Constraints:**
- Only supports `n=1` (single image)
- Size validation: 1024x1024 (square), 1024x1792 (portrait), 1792x1024 (landscape)

##### `isValidImageSize(size: string, model: string)`
Checks if a size is valid for a model.

```typescript
function isValidImageSize(size: string, model: string): boolean
```

**Returns:** `true` if size is valid for the model

## Dependencies

- **../../types** - Shared TypeScript interfaces
- **process.env** - Environment variables

## Usage Examples

### Configuration Management

```typescript
import { getServerConfig } from '../lib/config';

// In API route
const config = getServerConfig();
if (!config.isValid) {
  return res.status(500).json({
    error: 'Server configuration error',
    details: config.errors
  });
}
```

### Request Validation

```typescript
import { validateRequestBody } from '../lib/validation';

// In API route
const validationResult = validateRequestBody(req.body);
if (!validationResult.success) {
  return res.status(400).json({ error: validationResult.error });
}
```

### Model Compatibility Check

```typescript
import { validateModelCompatibility } from '../lib/validation';

const compatibilityCheck = validateModelCompatibility({
  model: 'dall-e-3',
  size: '256x256',  // Invalid for DALL-E 3
  n: 4  // Invalid, DALL-E 3 only supports n=1
});

if (!compatibilityCheck.valid) {
  return res.status(400).json({
    error: compatibilityCheck.error,
    details: compatibilityCheck.errors
  });
}
```

## Notes

- All validation is synchronous
- Returns detailed error messages for debugging
- Type-safe with TypeScript strict mode
- No external dependencies (pure TypeScript)
- Used by all API routes in `server/routes/`
