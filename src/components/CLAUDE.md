# CLAUDE.md - src/components/

This file provides guidance to Claude Code (claude.ai/code) when working with React components.

## Purpose

This directory contains reusable React components for the DALL-E 3 Web UI. All components use TypeScript strict mode and integrate with Ant Design for styling.

## Components Overview

| Component | Purpose | File |
|-----------|---------|------|
| `ThemedApp` | Ant Design ConfigProvider wrapper | `ThemedApp.tsx` |
| `ThemeToggle` | Dark/light mode toggle button | `ThemeToggle.tsx` |
| `EmptyState` | Placeholder when no images generated | `EmptyState.tsx` |
| `ErrorBoundary` | Error catching and fallback UI | `ErrorBoundary.tsx` |
| `PromptInputSection` | Prompt textarea with character count | `PromptInputSection.tsx` |
| `SettingsGrid` | Model/quality/size/style controls | `SettingsGrid.tsx` |
| `ImageResultsGrid` | Generated images display grid | `ImageResultsGrid.tsx` |
| `PreviewModal` | Full-screen image preview modal | `PreviewModal.tsx` |

## Component Details

### `ThemedApp.tsx`

**Purpose:** Wraps the application with Ant Design ConfigProvider for dynamic theming.

**Props:**
```typescript
interface ThemedAppProps {
  children: React.ReactNode;
}
```

**Features:**
- Applies Ant Design theme tokens
- Switches between dark/light algorithms
- Custom color configuration (primary: #a855f7 purple)
- Component-specific token overrides

**Theme Configuration:**
- Primary color: `#a855f7` (purple)
- Dark background: `#0a0a12`
- Light background: `#f8f9fc`
- Border radius: 6px (global default for Ant Design components)

---

### `ThemeToggle.tsx`

**Purpose:** Animated toggle button for switching between dark and light themes.

**State:** Uses `useTheme()` hook from `lib/theme.tsx`

**Features:**
- Smooth Framer Motion animations (scale, opacity)
- Sun icon for light mode, moon icon for dark mode
- Hover and tap animations
- Positioned in top-right corner

**Theme Persistence:**
- Saves preference to localStorage
- Respects system preference on first visit
- Updates `html` element class (`dark-theme`/`light-theme`)

---

### `EmptyState.tsx`

**Purpose:** Placeholder component displayed when no images have been generated.

**Props:**
```typescript
import type { Variants } from 'framer-motion';

export interface EmptyStateProps {
  variants?: Variants;
}
```

**Features:**
- Centered icon and message
- "Ready to Create" heading
- Encouraging description text
- Memoized for performance

**Usage:**
```tsx
import { EmptyState } from './components/EmptyState';

<EmptyState variants={staggerChildren} />
```

---

### `ErrorBoundary.tsx`

**Purpose:** Class component that catches React errors and displays a fallback UI.

**State:**
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

**Features:**
- Catches errors in component tree
- Logs error details to console
- Displays user-friendly error message
- "Try again" button to reset error state
- Preserves error stack trace for debugging

**Usage:**
```tsx
import { ErrorBoundary } from './components/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

### `PromptInputSection.tsx`

**Purpose:** Textarea component for entering image generation prompts with dynamic character count.

**Props:**
```typescript
export interface PromptInputSectionProps {
  prompt: string;
  promptLimit: number;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}
```

**Features:**
- Auto-resizing textarea (120px to 400px height)
- Real-time character count display
- Model-specific prompt limits (1000 for DALL-E 2, 4000 for DALL-E 3, 32000 for GPT Image 1.5)
- Visual warning when approaching limit
- Generate button integrated below textarea
- Memoized to prevent unnecessary re-renders

**Dependencies:**
- `useAutoResizeTextArea` hook for auto-resize behavior

---

### `SettingsGrid.tsx`

**Purpose:** Grid of dropdown selectors for generation parameters (model, quality, size, style, output format, background).

**Props:**
```typescript
export interface SettingsGridProps {
  model: string | null;
  setModel: (model: string) => void;
  quality: ImageQuality | GPTImageQuality;
  setQuality: (quality: ImageQuality | GPTImageQuality) => void;
  size: ImageSize;
  setSize: (size: ImageSize) => void;
  style: ImageStyle;
  setStyle: (style: ImageStyle) => void;
  outputFormat: ImageOutputFormat;
  setOutputFormat: (format: ImageOutputFormat) => void;
  background: GPTImageBackground;
  setBackground: (bg: GPTImageBackground) => void;
}
```

**Features:**
- Model selection (DALL-E 3, DALL-E 2, GPT Image 1.5)
- Conditional dropdowns based on selected model:
  - **DALL-E 3:** Quality, Size, Style
  - **DALL-E 2:** Quality (standard only), Size
  - **GPT Image 1.5:** Quality, Size, Output Format, Background
- Info tooltips for each option
- Custom comparison for React.memo to prevent unnecessary re-renders

**Model-Specific Options:**
| Feature | DALL-E 2 | DALL-E 3 | GPT Image 1.5 |
|---------|----------|----------|---------------|
| Quality | Standard only | Standard, HD | Auto, High, Medium, Low |
| Sizes | 256x256, 512x512, 1024x1024 | 1024x1024, 1024x1792, 1792x1024 | Auto, 1024x1024, 1536x1024, 1024x1536 |
| Style | Not supported | Vivid, Natural | Not supported |
| Output Format | Not supported | Not supported | PNG, JPEG, WebP |
| Background | Not supported | Not supported | Auto, Transparent, Opaque |

---

### `ImageResultsGrid.tsx`

**Purpose:** Grid display for generated images with loading, success, and error states.

**Props:**
```typescript
export interface ImageResultsGridProps {
  images: ImageGenerationItem[];
  onImageClick: (result: OpenAIImageResult, index: number) => void;
  onRetry: (index: number) => void;
}
```

**Features:**
- Responsive grid layout (1-3 columns based on screen size)
- Animated card reveals with stagger effect
- Individual image states:
  - **Loading:** Skeleton loader with animation
  - **Success:** Image thumbnail with action buttons
  - **Error:** Error message with retry button
- Progressive image display (images appear as they complete)
- Framer Motion AnimatePresence for smooth transitions
- Memoized to prevent unnecessary re-renders

**Sub-components:**
- `ImageCard` - Individual image card with state-based rendering

**Action Buttons (Success State):**
- Preview (opens modal)
- Download (saves to local file)

---

### `PreviewModal.tsx`

**Purpose:** Full-screen modal for viewing generated images with zoom, pan, and navigation controls.

**Props:**
```typescript
export interface PreviewModalProps {
  visible: boolean;
  imageUrl: string;
  currentIndex: number;
  totalImages: number;
  zoomLevel: number;
  fitMode: FitMode;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitModeChange: (mode: FitMode) => void;
}
```

**Features:**
- Zoom controls (50% to 500%):
  - Slider control
  - +/- buttons
  - Scroll wheel with Ctrl/Cmd key
  - Keyboard: +/- keys
- Pan: Click and drag when zoomed in or in actual size mode
- Fit modes: Contain, Actual (100%), Fill
- Fullscreen toggle (F11 or button)
- Image navigation: Arrow keys or swipe gestures
- Keyboard shortcuts:
  - ESC: Close modal
  - 0: Reset zoom
  - F: Cycle fit modes

**Sub-components:**
- `ControlBar` - Bottom control bar with zoom, fit, and navigation controls
- `KeyboardShortcutsHint` - Keyboard shortcut reference modal

**Lazy Loading:**
Loaded using `React.lazy()` for code splitting. Initial bundle size reduced by ~70 kB.

## Common Patterns

### Ant Design Integration

All components use Ant Design components with custom theming:

```tsx
import { Modal, Button, Select, Input } from 'antd';

<Modal
  title="Title"
  open={open}
  onCancel={onClose}
  footer={<Button onClick={onClose}>OK</Button>}
>
  {children}
</Modal>
```

### Framer Motion Animations

Used for smooth transitions:

```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="wait">
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

### TypeScript Props

All components use TypeScript interfaces:

```tsx
interface ComponentProps {
  // prop definitions
}

export const Component = memo(function Component({ prop1, prop2 }: ComponentProps) {
  // component logic
});
```

### Memoization

Most components use `React.memo` with custom comparison:

```tsx
export const Component = memo(ComponentImpl, (prevProps, nextProps) => {
  return (
    prevProps.prop1 === nextProps.prop1 &&
    prevProps.prop2 === nextProps.prop2
  );
});
```

## Dependencies

- **react** 19.2.3 - Component library
- **antd** 6.1.3 - UI components
- **framer-motion** 12.23.26 - Animations
- **@types/react** - TypeScript definitions
- **../lib/theme** - Theme context hook
- **../contexts** - React contexts (GenerationContext, ImageContext)
- **../../types** - Shared TypeScript types
- **../hooks** - Custom hooks (useAutoResizeTextArea, useImagePreview)

## Testing

Component tests are located in `src/components/__tests__/`:

- `ThemeToggle.test.tsx` - Theme toggle functionality
- `ErrorBoundary.test.tsx` - Error catching and fallback UI

Test files use:
- **vitest** - Test runner
- **@testing-library/react** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation

## Notes

- All components are functional components (no classes except ErrorBoundary)
- TypeScript strict mode is enabled
- No Next.js-specific code (fully migrated to Rsbuild)
- Components are server-side render compatible
- Theme switching updates CSS variables globally
- Memoization used to prevent unnecessary re-renders
- Code splitting implemented for PreviewModal
