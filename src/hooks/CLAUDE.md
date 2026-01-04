# CLAUDE.md - src/hooks/

This file provides guidance to Claude Code (claude.ai/code) when working with React hooks.

## Purpose

This directory contains custom React hooks that encapsulate reusable stateful logic for the DALL-E 3 Web UI. All hooks use TypeScript strict mode.

## Hooks Overview

| Hook | Purpose | File |
|------|---------|------|
| `useAutoResizeTextArea` | Auto-resizing textarea height | `useAutoResizeTextArea.ts` |
| `useImageGeneration` | Image generation API calls with retry | `useImageGeneration.ts` |
| `useImagePreview` | Image preview modal state and controls | `useImagePreview.ts` |

## Hook Details

### `useAutoResizeTextArea`

**Purpose:** Automatically adjusts textarea height based on content.

**Signature:**
```typescript
export function useAutoResizeTextArea(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  minHeight?: number,
  maxHeight?: number
): void
```

**Parameters:**
- `textareaRef` - Ref to the textarea element
- `minHeight` - Minimum height in pixels (default: 120)
- `maxHeight` - Maximum height in pixels (default: 400)

**Features:**
- Auto-expands textarea as user types
- Respects min/max height constraints
- Resets height to `auto` before measuring to allow shrinking
- Uses `scrollHeight` to determine required height
- Listens to `input` event for real-time updates

**Usage:**
```tsx
const textareaRef = useRef<HTMLTextAreaElement>(null);

useAutoResizeTextArea(textareaRef, 120, 400);

<textarea ref={textareaRef} />
```

**Cleanup:**
Removes event listener on unmount.

---

### `useImageGeneration`

**Purpose:** Manages image generation with parallel requests, progress tracking, and retry logic.

**Signature:**
```typescript
export function useImageGeneration(
  options?: UseImageGenerationOptions
): UseImageGenerationReturn
```

**Options:**
```typescript
export interface UseImageGenerationOptions {
  concurrent?: number;  // Max concurrent requests (default: 4)
  retryCount?: number;  // Max retry attempts (default: 3)
}

export interface UseImageGenerationReturn {
  images: ImageGenerationItem[];
  progress: number;
  isGenerating: boolean;
  generateImages: (params: ImageGenerationParams) => Promise<void>;
  cancelGeneration: () => void;
  retryImage: (index: number) => Promise<void>;
  clearImages: () => void;
}
```

**Features:**
- **Parallel Requests:** Uses `p-limit` for concurrency control (4 concurrent by default)
- **Progress Tracking:** Shows completed/total images count
- **Retry Logic:** Exponential backoff retry for failed images
- **Request Cancellation:** Uses `AbortController` to cancel pending requests
- **Model-Aware:** Handles different models (DALL-E 3, DALL-E 2, GPT Image 1.5)
- **Progressive Display:** Images appear as they complete

**State Management:**
- `images` - Array of image generation items with status
- `progress` - Number of completed images
- `isGenerating` - Whether generation is in progress

**Functions:**
- `generateImages()` - Start generation with given parameters
- `cancelGeneration()` - Cancel all pending requests
- `retryImage(index)` - Retry a failed image
- `clearImages()` - Clear all images

**Usage:**
```tsx
const { images, progress, isGenerating, generateImages, cancelGeneration } = useImageGeneration({
  concurrent: 4,
  retryCount: 3,
});

await generateImages({
  prompt: 'A futuristic city',
  model: 'dall-e-3',
  n: 4,
  size: '1792x1024',
  quality: 'hd',
  style: 'vivid',
});
```

**Error Handling:**
- Errors are stored in individual image items
- Failed images can be retried individually
- API errors are transformed to `ApiError` instances

---

### `useImagePreview`

**Purpose:** Manages image preview modal state with zoom, pan, and navigation controls.

**Signature:**
```typescript
export function useImagePreview(): UseImagePreviewReturn
```

**Return Type:**
```typescript
export type FitMode = 'contain' | 'actual' | 'fill';

export interface PreviewState {
  imageUrl: string;
  currentIndex: number;
  totalImages: number;
}

export interface UseImagePreviewReturn {
  previewState: PreviewState | null;
  openPreview: (result: OpenAIImageResult, index: number, allImages: OpenAIImageResult[]) => void;
  closePreview: () => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  zoomLevel: number;  // 50-500
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  panPosition: { x: number; y: number };
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}
```

**Features:**
- **Zoom Controls:**
  - Slider control (50% to 500%)
  - +/- buttons (25% step)
  - Scroll wheel (with Ctrl/Cmd key)
  - Keyboard: +/- keys
  - Reset zoom (0 key)

- **Pan Controls:**
  - Click and drag when zoomed in or in actual size mode
  - Tracks drag start position and delta

- **Fit Modes:**
  - `contain` - Fit image within container
  - `actual` - Display at 100% actual size
  - `fill` - Fill container (may crop)

- **Navigation:**
  - Previous/Next buttons
  - Arrow keys
  - Swipe gestures (mobile)

- **Fullscreen:**
  - F11 key support
  - Toggle button
  - Automatic fullscreen change detection

- **Keyboard Shortcuts:**
  - ESC: Close preview
  - +/-: Zoom in/out
  - 0: Reset zoom
  - F: Cycle fit modes
  - Arrow keys: Navigate images

**Usage:**
```tsx
const {
  previewState,
  openPreview,
  closePreview,
  zoomLevel,
  zoomIn,
  zoomOut,
  fitMode,
  setFitMode,
  handleKeyDown,
  handleWheel,
  // ... other controls
} = useImagePreview();

// Open preview
openPreview(imageResult, 0, allImages);

// Modal component receives controls
<PreviewModal
  visible={!!previewState}
  zoomLevel={zoomLevel}
  fitMode={fitMode}
  onZoomIn={zoomIn}
  onZoomOut={zoomOut}
  onFitModeChange={setFitMode}
  // ... other props
/>
```

**Constants:**
- `ZOOM_MIN = 50`
- `ZOOM_MAX = 500`
- `ZOOM_STEP = 25`

## Common Patterns

### Custom Hook Structure

All hooks follow this pattern:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

export function useHookName(param: ParamType): ReturnType {
  // State
  const [state, setState] = useState<StateType>(initialState);

  // Refs
  const ref = useRef<RefType>(null);

  // Effects
  useEffect(() => {
    // Setup and cleanup
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // Callbacks
  const callback = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  // Return state and handlers
  return {
    state,
    callback,
    // ... other returns
  };
}
```

### TypeScript Interfaces

All hooks use TypeScript interfaces:

```typescript
export interface HookOptions {
  optional?: boolean;
  required: string;
}

export interface HookReturn {
  value: string;
  setValue: (value: string) => void;
}

export function useHook(options?: HookOptions): HookReturn {
  // implementation
}
```

### Cleanup in useEffect

Always cleanup side effects:

```typescript
useEffect(() => {
  const controller = new AbortController();

  // Async work with signal
  doWork({ signal: controller.signal });

  return () => {
    controller.abort();
  };
}, [dependencies]);
```

## Dependencies

- **react** - Hooks (useState, useEffect, useCallback, useRef, useMemo)
- **../../types** - Shared TypeScript types
- **../lib/api/image-generation** - Image generation API
- **../lib/api-client** - API client with error handling
- **p-limit** - Concurrency control (useImageGeneration)

## Testing

Hook tests are located in `src/hooks/__tests__/`:

- `useAutoResizeTextArea.test.ts` - Auto-resize functionality

Test files use:
- **vitest** - Test runner
- **@testing-library/react** - `renderHook` utility for testing hooks

**Example Test:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useAutoResizeTextArea } from '../useAutoResizeTextArea';

test('auto-resizes textarea', () => {
  const { result } = renderHook(() => useAutoResizeTextArea(ref));

  act(() => {
    // Simulate input
  });

  expect(textarea.style.height).toBe('150px');
});
```

## Adding New Hooks

When creating new hooks:

1. Create file with `use` prefix: `useHookName.ts`
2. Export interfaces for options and return type
3. Use TypeScript strict typing
4. Include JSDoc comments for complex functions
5. Add cleanup in useEffect when needed
6. Create test file in `__tests__/` directory
7. Update this documentation

### Template

```typescript
import { useState, useEffect, useCallback } from 'react';

export interface UseHookNameOptions {
  // option definitions
}

export interface UseHookNameReturn {
  // return value definitions
}

/**
 * Brief description of what the hook does.
 *
 * @param options - Hook options
 * @returns Hook return value
 *
 * @example
 * ```tsx
 * const result = useHookName({ option: value });
 * ```
 */
export function useHookName(options?: UseHookNameOptions): UseHookNameReturn {
  // implementation

  return {
    // return values
  };
}
```

## Notes

- All hooks are functional (no class components)
- TypeScript strict mode is enabled
- Cleanup functions are used in useEffect to prevent memory leaks
- Callbacks are memoized with useCallback
- Expensive computations use useMemo
- AbortController used for cancellable async operations
- p-limit used for concurrency control in image generation
