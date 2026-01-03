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

## Notes

- This is a client-side SPA (no SSR)
- Uses React 19 with new features
- Ant Design components require ConfigProvider for theming
- Theme preference persists in localStorage
- All API calls go through Express backend (never directly to OpenAI)
- TypeScript strict mode is enabled
