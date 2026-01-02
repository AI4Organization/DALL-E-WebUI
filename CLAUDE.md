# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DALL-E 3 Web UI is a Next.js application (Pages Router) that provides a web interface for generating images using OpenAI's DALL-E 3 API. It allows users to input prompts, configure generation parameters (quality, size, style), and download generated images in various formats.

**Note**: This codebase has been fully migrated to TypeScript (strict mode) and uses Ant Design for UI components with a custom dark/light theme system.

## Development Commands

### Local Development
```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production (TypeScript compilation)
npm run start     # Start production server (after build)
./start-cc.sh     # Launch with Claude Code integration (Z.ai)
```

## Architecture

### Project Structure
```
types/
  index.ts           # Shared TypeScript interfaces and types

lib/
  validation.ts      # Type-safe validation functions
  config.ts          # Server configuration utilities
  theme.tsx          # Theme context and providers

components/
  ThemedApp.tsx      # Themed App wrapper with Ant Design ConfigProvider
  ThemeToggle.tsx    # Dark/light mode toggle button with animations
  ValidationDialog.tsx # Configuration error validation dialog

pages/
  _app.tsx           # Next.js App wrapper with ThemeProvider
  index.tsx          # Main UI page with Ant Design components
  api/
    config.ts        # GET endpoint: Server configuration
    images.ts        # POST endpoint: Calls OpenAI DALL-E 3 API
    download.ts      # POST endpoint: Converts images using sharp library

styles/
  globals.css        # Global CSS styles with theme variables
```

### Key Files

#### Frontend
- `pages/index.tsx` - Main React component with Ant Design UI components
- `pages/_app.tsx` - App wrapper with ThemeProvider
- `components/ThemedApp.tsx` - Ant Design ConfigProvider with dynamic theming
- `components/ThemeToggle.tsx` - Animated dark/light mode toggle button

#### Backend (API Routes)
- `pages/api/images.ts` - Uses OpenAI SDK to generate images
- `pages/api/download.ts` - Uses `sharp` for image format conversion (PNG, JPG, GIF, AVIF, WebP)
- `pages/api/config.ts` - Returns server configuration and available models

#### Utilities
- `lib/validation.ts` - Model and style validation with type safety
- `lib/config.ts` - Server configuration caching and model options
- `lib/theme.tsx` - React context for theme state management

#### Types
- `types/index.ts` - All shared TypeScript interfaces and type definitions

### Technology Stack
- **Framework**: Next.js 16.1.1 (Pages Router)
- **UI Library**: React 19.2.3
- **UI Components**: Ant Design 6.1.3
- **Animations**: Framer Motion 12.23.26
- **Styling**: Tailwind CSS 4.1.18 + Ant Design theming
- **Type Safety**: TypeScript 5.9.3 (strict mode enabled)
- **API Client**: OpenAI SDK 6.15.0
- **Image Processing**: sharp 0.34.5
- **HTTP Client**: axios 1.13.2
- **Runtime**: Node.js >= 18.0.0

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
