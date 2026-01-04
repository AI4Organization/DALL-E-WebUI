# CLAUDE.md - src/

This file provides guidance to Claude Code (claude.ai/code) when working with the Rsbuild frontend source code.

## Purpose

This directory contains the React 19 single-page application (SPA) built with Rsbuild. It provides the user interface for generating images using OpenAI's DALL-E 3, DALL-E 2, and GPT Image 1.5 APIs.

## Architecture

The frontend is a client-side SPA with the following structure:

```
src/
├── index.tsx           # React entry point (ReactDOM root)
├── App.tsx             # Main application component
├── components/         # React UI components
│   ├── ThemedApp.tsx       # Ant Design ConfigProvider wrapper
│   └── ThemeToggle.tsx     # Dark/light mode toggle button
├── lib/                # Frontend utilities
│   └── theme.tsx           # Theme context and provider
└── styles/             # CSS/styling
    ├── globals.css         # Global styles with Tailwind v4
    └── CLAUDE.md           # Styles documentation
```

## Key Files

### `index.tsx` - Application Entry Point

React 19 entry point that:
- Renders the root div element
- Wraps app in ThemeProvider and ThemedApp
- Imports global CSS styles
- Uses `React.StrictMode` for development checks

### `App.tsx` - Main Application Component

Primary UI component containing:
- Prompt input with character counter (dynamic based on model)
- Model selection (DALL-E 3, DALL-E 2, GPT Image 1.5)
- Generation parameters (quality, size, style, output format, background)
- Generate and download buttons
- Image results display with enhanced preview modal
- Progressive image generation with progress tracking

**Format Selection:**
- **Unified Output Format dropdown** (all models): WebP (default), PNG, JPEG
  - For DALL-E 2/3: Format is applied during download via backend conversion
  - For GPT Image 1.5: Format is sent to API as `response_format` parameter

**Key Features:**
- Uses `API_BASE_URL` environment variable for API calls
- Implements character count validation (dynamic based on model: 1000 for DALL-E 2, 4000 for DALL-E 3, 32000 for GPT Image 1.5)
- Shows real-time character counter in the prompt input
- Auto-resizing textarea (120px to 400px height)
- **Parallel Image Generation:**
  - Uses `p-limit` for concurrency control (4 concurrent requests)
  - DALL-E 3 generates images in parallel with progressive display
  - Each image appears as it completes
  - Progress counter shows completed/total images
  - Failed images can be retried individually
- **Toast Notifications (via Sonner):**
  - Success/error/warning toasts with rich descriptions
  - Custom action buttons (e.g., "Retry" on connection failure)
  - Model-specific info messages (e.g., parallel generation notification)
- **Enhanced Preview Modal:**
  - Zoom controls (50% to 500%) via slider, +/- keys, or scroll wheel
  - Pan: Click and drag when zoomed in
  - Fit modes: Contain, Actual (100%), Fill
  - Fullscreen toggle (F11)
  - Image navigation: Arrow keys or swipe gestures
  - Keyboard shortcuts: ESC (close), 0 (reset zoom), F (cycle fit mode)
- Supports both image URL format (DALL-E 2, DALL-E 3) and base64 format (GPT Image 1.5)
- **Download behavior:**
  - DALL-E 2/3: URL images are converted to selected format via backend `/api/download`
  - GPT Image 1.5: Base64 images are downloaded directly (already in selected format)
- Quality dropdown shows for all models (DALL-E 2 shows only "standard" option)
- Quality parameter is only sent to API for DALL-E 3 and GPT Image 1.5 (DALL-E 2 ignores it)
- **Output Format dropdown** shows for all models (WebP, PNG, JPEG)
- **Visual Effects:**
  - Floating animated blob backgrounds
  - Glass morphism cards with backdrop blur
  - Smooth Framer Motion animations
  - Gradient text and buttons

### Component Architecture

#### `ThemedApp.tsx`
Wraps the application with Ant Design ConfigProvider for theming.
- Dynamic theme switching (dark/light)
- Custom token configuration
- No Next.js-specific code (was migrated from AppProps pattern)

#### `ThemeToggle.tsx`
Animated toggle button for switching themes.
- Framer Motion animations (scale, opacity)
- Sun/moon icon transitions
- localStorage persistence
- System preference detection

### `lib/theme.tsx` - Theme Context

React context provider for theme management:
- Theme state (dark/light)
- Toggle function
- System preference detection
- localStorage synchronization

## Styling

The app uses a hybrid styling approach:

1. **Tailwind CSS 4.x** - Utility-first CSS framework
2. **Ant Design 6.x** - Component library with theming
3. **Custom CSS Variables** - For dynamic theming
4. **Framer Motion** - For smooth animations

See `src/styles/CLAUDE.md` for detailed styling documentation.

## API Communication

All API calls use axios with the following pattern:

```typescript
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Example: Get configuration
await axios.get(`${API_BASE_URL}/api/config`);

// Example: Generate images
await axios.post(`${API_BASE_URL}/api/images`, {
  prompt, model, quality, size, style, n
});
```

## Environment Variables

```typescript
API_BASE_URL=http://localhost:3001  # Backend API base URL
```

## Dependencies

- **react** 19.2.3 - UI library
- **react-dom** 19.2.3 - React DOM bindings
- **antd** 6.1.3 - UI component library
- **framer-motion** 12.23.26 - Animation library
- **axios** 1.13.2 - HTTP client
- **sonner** 2.0.7 - Toast notifications
- **p-limit** 7.2.0 - Concurrency control for parallel requests

## Development

### Running the Frontend

```bash
# Development with hot reload
npm run dev:rsbuild

# Production (after build)
npm run start:rsbuild
```

### Building

```bash
# Build for production
npm run build:rsbuild
```

Build output goes to `dist/` directory.

## Testing

The project uses Vitest for unit/component testing and Playwright for end-to-end testing.

### Test Structure

```
src/
├── __tests__/              # General tests
│   └── example.test.ts
├── components/
│   └── __tests__/          # Component tests
│       ├── ThemeToggle.test.tsx
│       └── ErrorBoundary.test.tsx
├── hooks/
│   └── __tests__/          # Hook tests
│       └── useAutoResizeTextArea.test.ts
├── lib/
│   └── api/
│       └── __tests__/      # API tests
│           └── image-generation.test.ts
└── contexts/
    └── __tests__/          # Context tests
        └── GenerationContext.test.tsx

e2e/                       # E2E tests (Playwright)
├── image-generation.spec.ts
├── model-switching.spec.ts
└── theme-toggle.spec.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npx vitest src/components/__tests__/ThemeToggle.test.tsx
```

### Test Configuration

**Vitest** (`vitest.config.ts`):
- Environment: `jsdom` (simulates browser DOM)
- Setup file: `src/__tests__/setup.ts`
- Coverage: `istanbul` with thresholds (80% minimum)
- Global CSS mock for component tests

**Playwright** (`playwright.config.ts`):
- Browser: Chromium
- Base URL: `http://localhost:3000`
- Timeout: 30 seconds
- Screenshot directory: `e2e/screenshots`

### Writing Component Tests

Use `@testing-library/react` for component testing:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';

describe('ThemeToggle', () => {
  it('renders the toggle button', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    // Assert theme changed
  });
});
```

### Writing Hook Tests

Use `renderHook` from `@testing-library/react`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAutoResizeTextArea } from '../useAutoResizeTextArea';

describe('useAutoResizeTextArea', () => {
  it('auto-resizes textarea', () => {
    const ref = { current: document.createElement('textarea') };
    renderHook(() => useAutoResizeTextArea(ref));

    act(() => {
      ref.current.value = 'Long text...';
      ref.current.dispatchEvent(new Event('input'));
    });

    expect(ref.current.style.height).toBe('150px');
  });
});
```

### Writing API Tests

Mock the API client for isolated testing:

```typescript
import { vi, expect, describe, it } from 'vitest';
import { generateImages } from '../image-generation';
import { apiClient } from '../api-client';

vi.mock('../api-client');

describe('generateImages', () => {
  it('generates images successfully', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { result: [{ url: 'https://example.com/image.png' }] }
    });

    const result = await generateImages({
      prompt: 'Test',
      model: 'dall-e-3',
      n: 1,
    });

    expect(result.images).toHaveLength(1);
  });
});
```

### Writing E2E Tests

Use Playwright for end-to-end testing:

```typescript
import { test, expect } from '@playwright/test';

test('generates an image', async ({ page }) => {
  await page.goto('/');

  // Enter prompt
  await page.fill('textarea[placeholder*="prompt"]', 'A cat');

  // Click generate
  await page.click('button:has-text("Generate")');

  // Wait for result
  await page.waitForSelector('img[alt*="Generated"]');

  // Assert image exists
  const images = await page.locator('img[alt*="Generated"]').count();
  expect(images).toBeGreaterThan(0);
});
```

### Test Utilities

**Setup File** (`src/__tests__/setup.ts`):
- Configures `@testing-library/react`
- Sets up global mocks (CSS modules, window.matchMedia)
- Provides custom test utilities

**Custom Matchers:**
- `toBeInTheDocument()` - DOM presence
- `toHaveTextContent()` - Text content
- `toBeVisible()` - Visibility check
- `toBeDisabled()` - Disabled state

### Coverage Thresholds

Current coverage targets (configured in `vitest.config.ts`):
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

View coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

### Testing Best Practices

1. **Test user behavior, not implementation**
   - Test what users see and do
   - Avoid testing internal state

2. **Use semantic queries**
   - Prefer `getByRole()` over `getByClassName()`
   - Use `getByLabelText()` for form inputs

3. **Mock external dependencies**
   - Mock API calls
   - Mock browser APIs
   - Mock timers when testing async code

4. **Keep tests isolated**
   - Each test should be independent
   - Clean up after each test

5. **Use descriptive test names**
   - Should describe what is being tested
   - Should describe the expected outcome

## Notes

- This is a client-side SPA (no SSR)
- Uses React 19 with new features
- Ant Design components require ConfigProvider for theming
- Theme preference persists in localStorage
- All API calls go through Express backend (never directly to OpenAI)
- TypeScript strict mode is enabled
- Test suite includes 36 tests (unit + component + E2E)
- ESLint configured with React hooks and import ordering rules
- Husky pre-commit hooks run linter on staged files

