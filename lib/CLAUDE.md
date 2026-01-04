# CLAUDE.md - lib/

This file provides guidance to Claude Code (claude.ai/code) when working with root-level shared utility modules.

## Purpose

This directory contains shared utility modules that can be used across both frontend and backend code. These are distinct from `server/lib/` (backend-only) and `src/lib/` (frontend-only) utilities.

**Note:** This `lib/` directory is at the project root level and contains utilities that may be shared or have general applicability.

## File Structure

```
lib/
├── config.ts      # Configuration management and model options
├── validation.ts  # Type-safe input validation
└── theme.tsx      # React theme context (duplicate of src/lib/theme.tsx)
```

## Modules

### `config.ts` - Configuration Management

**Purpose:** Manages server configuration with caching and provides model options based on the OpenAI base URL.

**Important Note:** This is a simplified version of `server/lib/config.ts`. The root `lib/config.ts` contains a subset of configuration functionality.

#### Constants

##### `BASE_URL_MODELS`
Maps base URLs to available model options.

```typescript
const BASE_URL_MODELS: Record<string, ModelOption[]> = {
  'https://api.openai.com/v1': [
    { value: 'dall-e-2', label: 'DALL-E 2' },
    { value: 'dall-e-3', label: 'DALL-E 3' }
  ],
  'https://openrouter.ai/api/v1': [
    { value: 'z-ai/glm-4.6v', label: 'GLM-4.6v (Z-AI)' },
    { value: 'x-ai/grok-4.1-fast', label: 'Grok-4.1-Fast (X-AI)' }
  ]
};
```

**Note:** This does NOT include GPT Image 1.5, which is only available in `server/lib/config.ts`.

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

##### `resetConfigCache()`
Clears the cached configuration.

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

**Purpose:** Provides type-safe validation for environment variables, model compatibility, and style parameters.

**Important Note:** This is a simplified version of `server/lib/validation.ts`. The root `lib/validation.ts` contains basic validation without the GPT Image 1.5 or DALL-E 2 specific functions.

#### Type Definitions

##### `ValidModel`
Union type of supported models (does NOT include GPT Image 1.5).

```typescript
type ValidModel = 'dall-e-2' | 'dall-e-3' | 'z-ai/glm-4.6v' | 'x-ai/grok-4.1-fast';
```

#### Constants

##### `BASE_URL_MODELS`
Maps base URLs to valid model identifiers.

```typescript
const BASE_URL_MODELS: Record<string, ValidModel[]> = {
  'https://api.openai.com/v1': ['dall-e-2', 'dall-e-3'],
  'https://openrouter.ai/api/v1': ['z-ai/glm-4.6v', 'x-ai/grok-4.1-fast'],
};
```

##### `VALID_STYLES`
Valid style options for DALL-E 3.

```typescript
const VALID_STYLES: ImageStyle[] = ['vivid', 'natural'];
```

#### Functions

##### `validateEnvVars()`
Validates required environment variables.

```typescript
function validateEnvVars(): ValidationResult
```

**Checks:**
- `OPENAI_API_KEY` is present
- `OPENAI_BASE_URL` is present and recognized

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

##### `validateModelForBaseURL(model: string, baseURL: string)`
Validates that a model is available for the given base URL.

```typescript
function validateModelForBaseURL(model: string, baseURL: string): ValidationResult
```

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;  // Error message if validation fails
}
```

##### `validateStyleForModel(style: string | undefined, model: string)`
Validates style parameter (required for DALL-E 3).

```typescript
function validateStyleForModel(style: string | undefined, model: string): ValidationResult
```

**Validation:**
- Style is required for `dall-e-3`
- Style must be 'vivid' or 'natural'

##### `getBaseURLModels()`
Returns the `BASE_URL_MODELS` mapping.

```typescript
function getBaseURLModels(): Record<string, ValidModel[]>
```

---

### `theme.tsx` - React Theme Context

**Purpose:** Provides React context for dark/light theme management with localStorage persistence and system preference detection.

**Note:** This file is identical to `src/lib/theme.tsx`. The theme context is primarily used in the frontend React application.

#### Types

```typescript
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;           // Current theme
  toggleTheme: () => void;  // Switch between themes
  mounted: boolean;       // Hydration state
}
```

#### Exported Components

##### `ThemeProvider`
React context provider for theme management.

**Props:**
```typescript
interface ThemeProviderProps {
  children: ReactNode;
}
```

**Features:**
- Manages theme state (dark/light)
- Persists theme to localStorage
- Detects system preference on first load
- Updates DOM classes for CSS variables
- Prevents hydration mismatch with `mounted` state

#### Exported Hooks

##### `useTheme()`
Hook to access theme context.

**Returns:** `ThemeContextType`

**Throws:** Error if used outside `ThemeProvider`

```typescript
const { theme, toggleTheme, mounted } = useTheme();
```

## Usage Examples

### Configuration

```typescript
import { getServerConfig, resetConfigCache } from './lib/config';

// Get server configuration
const config = getServerConfig();
if (!config.isValid) {
  console.error('Configuration errors:', config.errors);
}

// Get models for a specific base URL
const models = getAvailableModelsForBaseURL('https://api.openai.com/v1');
// Returns: [{ value: 'dall-e-2', label: 'DALL-E 2' }, { value: 'dall-e-3', label: 'DALL-E 3' }]

// Reset cache (e.g., after environment change)
resetConfigCache();
```

### Validation

```typescript
import { validateEnvVars, validateModelForBaseURL, validateStyleForModel } from './lib/validation';

// Validate environment variables
const envResult = validateEnvVars();
if (!envResult.valid) {
  console.error('Environment errors:', envResult.errors);
}

// Validate model for base URL
const modelResult = validateModelForBaseURL('dall-e-3', 'https://api.openai.com/v1');
if (!modelResult.valid) {
  console.error('Model error:', modelResult.error);
}

// Validate style for model
const styleResult = validateStyleForModel('vivid', 'dall-e-3');
if (!styleResult.valid) {
  console.error('Style error:', styleResult.error);
}
```

### Theme Context

```typescript
import { ThemeProvider, useTheme } from './lib/theme';

// Wrap app with provider
<ThemeProvider>
  <App />
</ThemeProvider>

// Use theme in component
function MyComponent() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return null;

  return (
    <div className={theme === 'dark' ? 'dark-theme' : 'light-theme'}>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

## Comparison with Other lib/ Directories

| Directory | Purpose | Scope |
|-----------|---------|-------|
| `/lib/` | Root-level shared utilities | May be used anywhere |
| `/server/lib/` | Backend utilities | Server-side only, includes GPT Image 1.5 |
| `/src/lib/` | Frontend utilities | Client-side only, React-specific |

## Differences from server/lib/

The root `lib/` utilities are simplified compared to `server/lib/`:

| Feature | `/lib/` | `/server/lib/` |
|---------|---------|----------------|
| GPT Image 1.5 support | No | Yes |
| DALL-E 2 validation functions | No | Yes |
| Prompt limit helpers | No | Yes |
| OpenAI client initialization | No | Yes (`openai-client.ts`) |

## Dependencies

- **../types** - Shared TypeScript interfaces (`ServerConfig`, `ModelOption`, `ValidationResult`, `ImageStyle`)
- **react** - React context and hooks (for `theme.tsx`)
- **process.env** - Environment variables

## Notes

- Root `lib/` contains simplified/shared utilities
- For backend-specific validation with GPT Image 1.5, use `server/lib/validation.ts`
- For backend-specific configuration with all models, use `server/lib/config.ts`
- Theme context is duplicated between `/lib/theme.tsx` and `/src/lib/theme.tsx`
- All validation is synchronous
- Type-safe with TypeScript strict mode
