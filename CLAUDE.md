# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DALL-E 3 Web UI is a **decoupled frontend/backend application** that provides a web interface for generating images using OpenAI's DALL-E 3 API. It allows users to input prompts, configure generation parameters (quality, size, style), and download generated images in various formats.

**Architecture**:
- **Frontend**: Rsbuild (Rspack-based) SPA with React 19
- **Backend**: Express.js TypeScript API server

**Note**: This codebase has been fully migrated to TypeScript (strict mode) and uses Ant Design for UI components with a custom dark/light theme system.

## Development Commands

### Local Development
```bash
npm run dev           # Start both backend (3001) and frontend (3000)
npm run dev:backend   # Start Express backend server only
npm run dev:rsbuild   # Start Rsbuild frontend dev server only

# Production build
npm run build         # Build both backend and frontend
npm run build:backend # Compile backend TypeScript
npm run build:rsbuild # Build frontend with Rsbuild

# Production start
npm run start         # Start both backend and frontend
npm run start:backend # Start Express backend only
npm run start:rsbuild # Preview Rsbuild build
```

### Docker Deployment
```bash
docker-compose up -d --build    # Build and start all services
docker-compose down              # Stop all services
docker-compose logs -f           # View logs
```

## Architecture

### Project Structure
```
# Backend (Express.js)
server/
  index.ts           # Express server entry point
  routes/
    config.ts        # GET /api/config - Server configuration
    images.ts        # POST /api/images - Image generation via OpenAI
    download.ts      # POST /api/download - Image format conversion
  lib/
    config.ts        # Server configuration utilities
    validation.ts    # Type-safe validation functions
  middleware/
    error.ts         # Error handling middleware

# Frontend (Rsbuild SPA)
src/
  index.tsx          # React entry point
  App.tsx            # Main UI component
  components/
    ThemedApp.tsx    # Ant Design ConfigProvider wrapper
    ThemeToggle.tsx  # Dark/light mode toggle button
    ValidationDialog.tsx # Configuration error dialog
  lib/
    theme.tsx        # Theme context and providers
  styles/
    globals.css      # Global CSS with Tailwind v4

# Shared
types/
  index.ts           # Shared TypeScript interfaces

# Configuration
rsbuild.config.ts    # Rsbuild bundler configuration
tsconfig.json        # TypeScript config (frontend)
tsconfig.server.json # TypeScript config (backend)
docker-compose.yml   # Docker Compose configuration
nginx.conf           # Nginx configuration for frontend
index.html           # HTML template for SPA
```

### Key Files

#### Frontend Entry Points
- `src/index.tsx` - React application entry point with ReactDOM root
- `src/App.tsx` - Main UI component (migrated from pages/index.tsx)
- `index.html` - HTML template for SPA

#### Backend
- `server/index.ts` - Express server with middleware, CORS, route mounting
- `server/routes/images.ts` - OpenAI SDK integration for DALL-E
- `server/routes/download.ts` - Sharp image processing (PNG, JPG, GIF, AVIF, WebP)
- `server/routes/config.ts` - Server configuration and model options

#### Shared
- `types/index.ts` - All shared TypeScript interfaces and type definitions
- `src/components/ThemedApp.tsx` - Ant Design ConfigProvider with dynamic theming
- `src/lib/theme.tsx` - React context for theme state management

### Technology Stack
- **Frontend**: Rsbuild 1.7.1 (Rspack-based bundler)
- **Backend**: Express.js 5.2.1
- **UI Library**: React 19.2.3
- **UI Components**: Ant Design 6.1.3
- **Animations**: Framer Motion 12.23.26
- **Styling**: Tailwind CSS 4.1.18 + Ant Design theming
- **Type Safety**: TypeScript 5.9.3 (strict mode enabled)
- **API Client**: OpenAI SDK 6.15.0
- **Image Processing**: sharp 0.34.5
- **HTTP Client**: axios 1.13.2
- **Runtime**: Node.js >= 24.0.0

### TypeScript Configuration
- **Strict mode**: Enabled (`strict: true`)
- **Additional checks**: `noUncheckedIndexedAccess`, `noImplicitOverride`, `forceConsistentCasingInFileNames`
- All source files use `.ts` or `.tsx` extensions

### Theme System
The app features a comprehensive dark/light theme system with:
- **Primary color**: `#a855f7` (purple)
- **Border radius**: 12px
- **Dark background**: `#0a0a12`
- **Light background**: `#f8f9fc`
- **Animated theme toggle** with Framer Motion
- **localStorage persistence** for theme preference
- **System preference detection** for automatic theme selection
- Dynamic Ant Design theme configuration in `components/ThemedApp.tsx`

### Environment
- Requires `.env` file with `OPENAI_API_KEY` (see `.env.example`)
- Optional: `OPENAI_BASE_URL` for custom endpoints (default: `https://api.openai.com/v1`)
- Model is selected from the UI (default: DALL-E 3)
- `.env.cc` - Claude Code specific environment configuration

## UI Components and Libraries

### Ant Design Components
| Component | Usage |
|-----------|-------|
| `ConfigProvider` | Global theme configuration with dynamic theming |
| `Input.TextArea` | Prompt input with character count |
| `InputNumber` | Number of images selector |
| `Select` | Model, quality, size, style, format dropdowns |
| `Button` | Generate and download buttons |
| `Card` | Image result cards with actions |
| `Image` | Image display with preview modal |
| `Alert` | Error message display |
| `Spin` | Loading indicators |
| `Modal` | Configuration error dialog |
| `Row`, `Col` | Responsive grid layout |
| `Typography` | Text components (Title, Text) |
| `Space` | Layout spacing |
| `message` | Toast notifications |
| `Tooltip` | Style info tooltip with contextual help |

### Framer Motion
- Used for smooth animations on the theme toggle button
- Scale and opacity transitions for sun/moon icons
- Hover and tap animations for interactive feedback

### Tailwind CSS
- Custom animations and transitions
- Theme-aware utility classes
- Custom color variables for light/dark themes

## Type Definitions

Key types defined in `types/index.ts`:

```typescript
// OpenAI API
interface OpenAIImageResult {
  url?: string;
  revised_prompt?: string;
  b64_json?: string;
}

// Image generation
type ImageQuality = 'standard' | 'hd';
type ImageSize = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
type ImageStyle = 'vivid' | 'natural';
type DownloadFormat = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'avif';

// API responses
interface ImagesApiResponse { result: OpenAIImageResult[]; }
interface DownloadApiResponse { result: string; }
interface ConfigApiResponse { availableModels: ModelOption[]; baseURL: string; }
```

## Notes

- DALL-E 3 only supports `n=1` (single image) regardless of the input number
- TypeScript strict mode catches potential null/undefined issues at compile time
- The app supports multiple base URLs (OpenAI API and OpenRouter)
- Configuration errors are displayed in a modal dialog to the user
- Default model: DALL-E 3
- Default size for DALL-E 3: "1024x1024" (Square)
- Style dropdown shows an info icon with tooltip explaining each style option
- Image preview modal with zoom controls (scroll to zoom, drag to pan, +/- keys to zoom)
- Dark/light theme toggle with animated sun/moon icons in the top-right corner
- Theme preference is saved to localStorage and persists across sessions
- System preference detection sets initial theme based on user's OS setting

## Migration History

This project was migrated from Next.js 16 to a decoupled Rsbuild/Express architecture in January 2026 for:
- **5-10x faster build times**: Rsbuild builds in ~3s vs Next.js ~30s
- **Better HMR**: Hot module reload under 200ms vs 1-3s
- **Cleaner architecture**: Separated frontend/backend concerns
- **Smaller bundle sizes**: Rspack's superior tree-shaking

**Migration preserved**:
- All functionality (image generation, download, theme toggle)
- TypeScript strict mode
- Ant Design theming
- Tailwind CSS v4 styling
- Framer Motion animations
