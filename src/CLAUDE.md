# CLAUDE.md - src/

This file provides guidance to Claude Code (claude.ai/code) when working with the Rsbuild frontend source code.

## Purpose

This directory contains the React 19 single-page application (SPA) built with Rsbuild. It provides the user interface for generating images using OpenAI's DALL-E 3 and GPT Image 1.5 APIs.

## Architecture

The frontend is a client-side SPA with the following structure:

```
src/
├── index.tsx           # React entry point (ReactDOM root)
├── App.tsx             # Main application component
├── components/         # React UI components
│   ├── ThemedApp.tsx       # Ant Design ConfigProvider wrapper
│   ├── ThemeToggle.tsx     # Dark/light mode toggle button
│   └── ValidationDialog.tsx # Configuration error dialog
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
- Prompt input with character counter (max 4000 characters)
- Model selection (DALL-E 2, DALL-E 3, etc.)
- Generation parameters (quality, size, style, format)
- Generate and download buttons
- Image results display with preview modal
- Configuration validation

**Key Features:**
- Uses `API_BASE_URL` environment variable for API calls
- Implements character count validation (dynamic based on model: 4000 for DALL-E 3, 32000 for GPT Image 1.5)
- Shows real-time character counter in the prompt input
- Shows loading states during generation
- Displays images with zoom/preview modal
- Handles error messages with Ant Design Alert
- Supports both image URL format (DALL-E 3) and base64 format (GPT Image 1.5)
- Downloads base64 images directly in browser, URLs via backend conversion

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

#### `ValidationDialog.tsx`
Modal dialog for configuration errors.
- Displays missing/invalid environment variables
- Provides clear guidance for fixing issues
- Uses Ant Design Modal component

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
