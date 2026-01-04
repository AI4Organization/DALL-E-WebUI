<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DALL-E 3 Web UI is a **decoupled frontend/backend application** that provides a web interface for generating images using OpenAI's DALL-E 3, DALL-E 2, and GPT Image 1.5 APIs. It allows users to input prompts, configure generation parameters (quality, size, style, output format, background), and download generated images in various formats.

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
    openai-client.ts # OpenAI SDK client initialization
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
- **Toast Notifications**: sonner 2.0.7
- **Concurrency Control**: p-limit 7.2.0
- **Rate Limiting**: express-rate-limit 8.2.1
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
| `Select` | Model, quality, size, style, output format, background dropdowns |
| `Button` | Generate and download buttons |
| `Card` | Image result cards with actions |
| `Modal` | Image preview modal with zoom, pan, and fullscreen controls |
| `Spin` | Loading indicators |
| `Row`, `Col` | Responsive grid layout |
| `Space` | Layout spacing |
| `Slider` | Zoom control slider in preview modal |
| `Tooltip` | Style info tooltip with contextual help |
| `Input` | Text input components |

### Sonner Toast Notifications
The app uses `sonner` for toast notifications:
- Success/error/warning toasts for generation events
- Custom action buttons (e.g., "Retry" on connection failure)
- Rich descriptions with detailed error messages
- Auto-dismissal with configurable duration

### Framer Motion
- Used for smooth animations throughout the app
- Scale and opacity transitions for sun/moon icons
- Hover and tap animations for interactive feedback
- Stagger children animations for card reveals
- Floating blob animations with continuous rotation
- Smooth layout transitions for image results

### Rate Limiting
The backend implements rate limiting using `express-rate-limit`:
- **100 requests per minute** per IP address
- Applied to all `/api/*` routes
- Custom error message with details
- Standard headers enabled for rate limit info

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

// Image generation - DALL-E 3 and DALL-E 2
type ImageQuality = 'standard' | 'hd';
type ImageStyle = 'vivid' | 'natural';

// Image generation - DALL-E 2
type DALLE2ImageQuality = 'standard';

// Image generation - GPT Image 1.5
type GPTImageQuality = 'auto' | 'high' | 'medium' | 'low';
type GPTImageOutputFormat = 'png' | 'jpeg' | 'webp';
type GPTImageBackground = 'auto' | 'transparent' | 'opaque';

// Universal output format for all models
type ImageOutputFormat = 'webp' | 'png' | 'jpeg';

// All sizes across models
type ImageSize =
  | '1024x1024'    // Common square size (all models)
  | '256x256'      // DALL-E 2 only
  | '512x512'      // DALL-E 2 only
  | '1024x1792'    // DALL-E 3 portrait
  | '1792x1024'    // DALL-E 3 landscape
  | 'auto'         // GPT Image 1.5 auto size
  | '1536x1024'    // GPT Image 1.5 landscape
  | '1024x1536';   // GPT Image 1.5 portrait

// API responses
interface ImagesApiResponse { result: OpenAIImageResult[]; }
interface DownloadApiResponse { result: string; }
interface ConfigApiResponse { availableModels: ModelOption[]; baseURL: string; }
```

## Notes

### Model-Specific Capabilities

**DALL-E 3:**
- Supports `n=1` to `n=10` via parallel API requests (4 concurrent requests using p-limit)
- Each API request generates one image, but multiple requests run in parallel
- Prompt character limit: **4000 characters**
- Quality options: standard, hd
- Style options: vivid (hyper-realistic), natural (more subtle)
- Sizes: 1024x1024 (square), 1024x1792 (portrait), 1792x1024 (landscape)
- Default size: "1792x1024" (Landscape)
- Returns image URLs (not base64)
- Progressive image display - images appear as they complete

**DALL-E 2:**
- Supports `n=1` to `n=10` (multiple images per request)
- Prompt character limit: **1000 characters**
- Quality options: standard only (UI shows dropdown with single option)
- No style option (not supported by API)
- Sizes: 256x256, 512x512, 1024x1024 (all square)
- Default size: "1024x1024" (Square)
- Returns image URLs (not base64)
- Quality parameter is NOT sent to API (DALL-E 2 ignores it)

**GPT Image 1.5:**
- Supports `n=1` to `n=10` (multiple images per request)
- Prompt character limit: **32000 characters**
- Quality options: auto, high, medium, low
- Output format options: png, jpeg, webp
- Background options: auto, transparent, opaque
- Sizes: auto, 1024x1024 (square), 1536x1024 (landscape), 1024x1536 (portrait)
- Always returns base64-encoded images (b64_json)

### General Notes
- TypeScript strict mode catches potential null/undefined issues at compile time
- The app supports multiple base URLs (OpenAI API and OpenRouter)
- Configuration errors are displayed via sonner toast notifications
- Default model: DALL-E 3
- Style dropdown shows an info icon with tooltip explaining each style option
- **Image Preview Modal Features:**
  - Zoom controls: Scroll wheel (Ctrl/Cmd + scroll), +/- keys, or slider
  - Pan: Click and drag when zoomed in or in actual size mode
  - Fit modes: Contain, Actual (100%), Fill - press 'F' to cycle
  - Fullscreen toggle: F11 key or button
  - Navigation: Arrow keys or swipe gestures for multiple images
  - Keyboard shortcuts: ESC (close), 0 (reset zoom)
- **Progressive Image Generation:**
  - DALL-E 3 images appear progressively as they complete
  - Progress counter shows completed/total images
  - Failed images can be retried individually
- Dark/light theme toggle with animated sun/moon icons in the top-right corner
- Theme preference is saved to localStorage and persists across sessions
- System preference detection sets initial theme based on user's OS setting
- Prompt character limit is dynamic based on selected model (1000 for DALL-E 2, 4000 for DALL-E 3, 32000 for GPT Image 1.5)
- Image count limit is dynamic based on selected model (10 for DALL-E 2, 10 for DALL-E 3 via parallel requests, 10 for GPT Image 1.5)
- Quality dropdown shows for all models, but DALL-E 2 only has "standard" option (parameter not sent to API)
- Auto-resize textarea expands as user types (up to 400px height)
- Floating animated blob backgrounds with gradient colors
- Glass morphism card effects with backdrop blur

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
