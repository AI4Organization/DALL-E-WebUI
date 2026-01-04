# CLAUDE.md - src/contexts/

This file provides guidance to Claude Code (claude.ai/code) when working with React contexts.

## Purpose

This directory contains React context providers that manage global state for the DALL-E 3 Web UI. Contexts provide a way to share state between components without prop drilling.

## Contexts Overview

| Context | Purpose | File |
|---------|---------|------|
| `GenerationContext` | Manages image generation state and settings | `GenerationContext.tsx` |
| `ImageContext` | Manages image preview modal and navigation state | `ImageContext.tsx` |

## Context Details

### `GenerationContext.tsx`

**Purpose:** Manages image generation state, settings, and actions across the application.

**State Provided:**
```typescript
interface GenerationContextValue {
  model: string | null;                    // Selected model
  prompt: string;                          // Generation prompt text
  number: number;                          // Number of images to generate
  quality: ImageQuality | GPTImageQuality;  // Quality setting
  size: ImageSize;                         // Image dimensions
  style: ImageStyle;                       // Style preset (DALL-E 3)
  outputFormat: ImageOutputFormat;          // Output format (GPT Image 1.5)
  background: GPTImageBackground;           // Background setting (GPT Image 1.5)
  isGenerating: boolean;                   // Whether generation is in progress
  items: ImageGenerationItem[];            // Generated images with status
  generateImages: () => Promise<void>;     // Start generation
  retryImage: (id: number) => Promise<void>; // Retry failed image
  clearResults: () => void;                // Clear all results
}
```

**Provider Props:**
```typescript
interface GenerationProviderProps {
  children: ReactNode;
  model: string | null;
  prompt: string;
  number: number;
  quality: ImageQuality | GPTImageQuality;
  size: ImageSize;
  style: ImageStyle;
  outputFormat: ImageOutputFormat;
  background: GPTImageBackground;
  onModelChange: (model: string | null) => void;
  onPromptChange: (prompt: string) => void;
  onNumberChange: (number: number) => void;
  onQualityChange: (quality: ImageQuality | GPTImageQuality) => void;
  onSizeChange: (size: ImageSize) => void;
  onStyleChange: (style: ImageStyle) => void;
  onOutputFormatChange: (format: ImageOutputFormat) => void;
  onBackgroundChange: (background: GPTImageBackground) => void;
  apiBaseUrl?: string;                      // Optional custom API base URL
}
```

**Features:**
- Wraps `useImageGeneration` hook for shared state
- Provides generation state to all child components
- Manages progress tracking for parallel requests
- Handles retry logic for individual failed images
- Centralizes generation settings for easy access

**Usage in App.tsx:**
```tsx
import { GenerationProvider } from './contexts/GenerationContext';

function App() {
  const [model, setModel] = useState<string | null>('dall-e-3');
  const [prompt, setPrompt] = useState('');

  return (
    <GenerationProvider
      model={model}
      prompt={prompt}
      number={4}
      quality="hd"
      size="1792x1024"
      style="vivid"
      outputFormat="webp"
      background="auto"
      onModelChange={setModel}
      onPromptChange={setPrompt}
      // ... other handlers
    >
      <YourComponents />
    </GenerationProvider>
  );
}
```

**Accessing Context:**
```tsx
import { useGenerationContext } from './contexts/GenerationContext';

function YourComponent() {
  const {
    model,
    isGenerating,
    generateImages,
    retryImage
  } = useGenerationContext();

  return (
    <button onClick={generateImages} disabled={isGenerating}>
      Generate Images
    </button>
  );
}
```

---

### `ImageContext.tsx`

**Purpose:** Manages image preview modal state and navigation between multiple generated images.

**State Provided:**
```typescript
interface ImageContextValue {
  previewImage: OpenAIImageResult | null;      // Currently previewed image
  navigationImages: OpenAIImageResult[];      // All images for navigation
  currentNavIndex: number;                     // Current image index
  openPreview: (result, index, allImages) => void;  // Open preview modal
  closePreview: () => void;                    // Close preview modal
  navigatePrevious: () => void;                // Go to previous image
  navigateNext: () => void;                    // Go to next image
}
```

**Provider Props:**
```typescript
interface ImageProviderProps {
  children: ReactNode;
}
```

**Features:**
- Manages preview modal open/close state
- Tracks current image for multi-image navigation
- Handles previous/next navigation with bounds checking
- Stores navigation image array for index-based access

**Usage:**
```tsx
import { ImageProvider } from './contexts/ImageContext';
import { useImageContext } from './contexts/ImageContext';

// Wrap app with provider
function App() {
  return (
    <ImageProvider>
      <YourComponents />
    </ImageProvider>
  );
}

// Use in components
function ImageCard({ result, index, allImages }) {
  const { openPreview } = useImageContext();

  return (
    <img
      src={result.url}
      onClick={() => openPreview(result, index, allImages)}
    />
  );
}
```

**Navigation Controls:**
```tsx
function PreviewModal() {
  const {
    previewImage,
    navigationImages,
    currentNavIndex,
    navigatePrevious,
    navigateNext
  } = useImageContext();

  return (
    <Modal>
      <img src={previewImage?.url} />
      <button
        onClick={navigatePrevious}
        disabled={currentNavIndex === 0}
      >
        Previous
      </button>
      <button
        onClick={navigateNext}
        disabled={currentNavIndex >= navigationImages.length - 1}
      >
        Next
      </button>
    </Modal>
  );
}
```

## Context Patterns

### Creating a New Context

When creating a new context, follow this pattern:

```typescript
import { createContext, useContext, ReactNode } from 'react';

// 1. Define the context value interface
export interface MyContextValue {
  state: string;
  setState: (value: string) => void;
}

// 2. Create the context with undefined default
const MyContext = createContext<MyContextValue | undefined>(undefined);

// 3. Define provider props
export interface MyProviderProps {
  children: ReactNode;
  initialState: string;
}

// 4. Create provider component
export function MyProvider({ children, initialState }: MyProviderProps) {
  const [state, setState] = useState(initialState);

  const value: MyContextValue = {
    state,
    setState,
  };

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// 5. Create custom hook with error handling
export function useMyContext(): MyContextValue {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within a MyProvider');
  }
  return context;
}
```

### Context Provider Nesting

Multiple providers can be nested:

```tsx
<GenerationProvider {...generationProps}>
  <ImageProvider>
    <AnotherProvider>
      <App />
    </AnotherProvider>
  </ImageProvider>
</GenerationProvider>
```

## Dependencies

- **react** - Context creation and consumption hooks
- **../../types** - Shared TypeScript interfaces
- **../hooks/useImageGeneration** - Image generation hook (GenerationContext)

## Best Practices

1. **Error Handling**: Always check for undefined context and throw descriptive errors
2. **Type Safety**: Export and use TypeScript interfaces for all context values
3. **Separation of Concerns**: Keep contexts focused on specific domains
4. **Memoization**: Use `useCallback` for functions provided to context
5. **Provider Location**: Wrap providers at the highest level needed (usually in `App.tsx` or `index.tsx`)

## Notes

- All contexts use TypeScript strict typing
- Context hooks throw descriptive errors when used outside providers
- Functions in contexts are memoized with `useCallback` for stability
- Providers should be placed at appropriate nesting levels based on usage scope
- GenerationContext wraps `useImageGeneration` hook for shared state
- ImageContext manages preview/navigation state independently of generation logic
