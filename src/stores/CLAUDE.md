# CLAUDE.md - src/stores/

This file provides guidance to Claude Code (claude.ai/code) when working with Zustand state management.

## Purpose

This directory contains Zustand stores that manage global application state. Zustand provides a lightweight, performant alternative to React Context with built-in DevTools support.

## Stores

### `useImageStore.ts` - Image Store

**Purpose:** Single source of truth for all image-related state. Consolidates GenerationContext and ImageContext functionality.

## Store State

### Settings State

```typescript
{
  model: string | null;                    // Selected model
  prompt: string;                          // Generation prompt
  number: number;                          // Number of images to generate
  quality: ImageQuality | GPTImageQuality; // Quality setting
  size: ImageSize;                         // Image dimensions
  style: ImageStyle;                       // Style preset (DALL-E 3 only)
  outputFormat: ImageOutputFormat;         // Output format
  background: GPTImageBackground;          // Background setting (GPT Image 1.5 only)
}
```

### Generation State

```typescript
{
  isGenerating: boolean;              // Whether generation is in progress
  items: ImageGenerationItem[];       // Generated items with their states
}
```

### Preview State

```typescript
{
  previewImage: OpenAIImageResult | null;    // Currently previewed image
  navigationImages: OpenAIImageResult[];      // All images for navigation
  currentNavIndex: number;                    // Current image index
}
```

## Store Actions

### Settings Actions

```typescript
{
  setModel: (model: string | null) => void;
  setPrompt: (prompt: string) => void;
  setNumber: (number: number) => void;
  setQuality: (quality: ImageQuality | GPTImageQuality) => void;
  setSize: (size: ImageSize) => void;
  setStyle: (style: ImageStyle) => void;
  setOutputFormat: (format: ImageOutputFormat) => void;
  setBackground: (background: GPTImageBackground) => void;
}
```

### Generation Actions

```typescript
{
  setGenerating: (isGenerating: boolean) => void;
  setItems: (items: ImageGenerationItem[]) => void;
  updateItem: (id: number, updates: Partial<ImageGenerationItem>) => void;
  addItem: (item: ImageGenerationItem) => void;
  clearItems: () => void;
}
```

### Preview Actions

```typescript
{
  openPreview: (result: OpenAIImageResult, index: number, allImages: OpenAIImageResult[]) => void;
  closePreview: () => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
}
```

### Derived Getters

```typescript
{
  getCompletedCount: () => number;
  getFailedCount: () => number;
  getInProgress: () => boolean;
  getItemById: (id: number) => ImageGenerationItem | undefined;
}
```

## Selector Hooks

For optimized re-renders, use selector hooks that return specific slices of state:

### Settings Selectors

```typescript
import { useImageSettingsState, useImageSettingsActions } from '../../stores/useImageStore';

// Get settings values (no re-render on actions)
function SettingsComponent() {
  const { model, prompt, number, quality, size, style, outputFormat, background } =
    useImageSettingsState();
  // ...
}

// Get settings actions
function SettingsControls() {
  const { setModel, setPrompt, setNumber, setQuality, setSize, setStyle, setOutputFormat, setBackground } =
    useImageSettingsActions();
  // ...
}
```

### Generation Selectors

```typescript
import { useImageGenerationState, useImageGenerationActions } from '../../stores/useImageStore';

// Get generation state
function GenerationStatus() {
  const { items, isGenerating } = useImageGenerationState();
  // ...
}

// Get generation actions
function GenerationControls() {
  const { setGenerating, setItems, updateItem, addItem, clearItems, getCompletedCount, getFailedCount, getInProgress, getItemById } =
    useImageGenerationActions();
  // ...
}
```

### Preview Selectors

```typescript
import { useImagePreviewState, useImagePreviewActions } from '../../stores/useImageStore';

// Get preview state
function PreviewDisplay() {
  const { previewImage, navigationImages, currentNavIndex } = useImagePreviewState();
  // ...
}

// Get preview actions
function PreviewControls() {
  const { openPreview, closePreview, navigatePrevious, navigateNext } =
    useImagePreviewActions();
  // ...
}
```

## Direct Store Access

You can also access the store directly:

```typescript
import { useImageStore } from '../../stores/useImageStore';

// Get specific values
const model = useImageStore(state => state.model);
const setModel = useImageStore(state => state.setModel);

// Get multiple values
const { model, prompt, isGenerating } = useImageStore(state => ({
  model: state.model,
  prompt: state.prompt,
  isGenerating: state.isGenerating,
}));
```

## Image Pruning

The store automatically prunes old images to prevent unbounded memory growth:

- **MAX_STORED_IMAGES**: 20 (maximum images to keep)
- **CLEANUP_THRESHOLD**: 30 (threshold to trigger cleanup)

When items exceed 30, only the most recent 20 are kept.

## DevTools Integration

The store includes Zustand DevTools integration for debugging:

```typescript
import { devtools } from 'zustand/middleware';

export const useImageStore = create<ImageStoreState>()(
  devtools(
    (set, get) => ({
      // store implementation
    }),
    {
      name: 'ImageStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);
```

To use DevTools:
1. Install [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools)
2. Open DevTools in your browser
3. Select "ImageStore" from the store selector
4. View state changes and actions

## Usage Example

```typescript
import { useImageStore } from '../../stores/useImageStore';

function ImageGenerator() {
  // Using selector hooks for optimal re-rendering
  const prompt = useImageStore(state => state.prompt);
  const isGenerating = useImageStore(state => state.isGenerating);
  const setPrompt = useImageStore(state => state.setPrompt);
  const generateImages = useImageStore(state => state.generateImages);

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={generateImages}
        disabled={isGenerating}
      >
        Generate Images
      </button>
    </div>
  );
}
```

## Migration from Context

If migrating from React Context:

```typescript
// Old (Context)
const { model, setModel } = useGenerationContext();
const { previewImage, openPreview } = useImageContext();

// New (Zustand)
const model = useImageStore(state => state.model);
const setModel = useImageStore(state => state.setModel);
const previewImage = useImageStore(state => state.previewImage);
const openPreview = useImageStore(state => state.openPreview);
```

## Best Practices

1. **Use selector hooks** for optimal re-rendering
2. **Select specific values** rather than entire state object
3. **Use derived getters** for computed values
4. **Keep actions pure** - avoid side effects in actions
5. **Use DevTools** for debugging state changes

## Notes

- Zustand is lightweight (~1KB) compared to Redux
- No providers needed - store can be used anywhere
- Automatic batching of state updates
- Built-in TypeScript support
- DevTools integration in development mode
