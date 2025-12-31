# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DALL-E 3 Web UI is a Next.js application (Pages Router) that provides a web interface for generating images using OpenAI's DALL-E 3 API. It allows users to input prompts, configure generation parameters (quality, size, style), and download generated images in various formats.

**Note**: This codebase has been fully migrated to TypeScript (strict mode) and uses Ant Design for UI components.

## Development Commands

### Local Development
```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production (TypeScript compilation)
npm run start     # Start production server (after build)
```

### Production/Docker
```bash
make start-server-local           # Build and start production server locally
make start-docker-compose-local   # Start with Docker Compose
make stop-docker-compose-local    # Stop Docker Compose services
```

## Architecture

### Project Structure
```
types/
  index.ts           # Shared TypeScript interfaces and types

lib/
  validation.ts      # Type-safe validation functions
  config.ts          # Server configuration utilities

pages/
  _app.tsx           # Next.js App wrapper with Ant Design ConfigProvider
  index.tsx          # Main UI page with Ant Design components
  api/
    config.ts        # GET endpoint: Server configuration
    images.ts        # POST endpoint: Calls OpenAI DALL-E 3 API
    download.ts      # POST endpoint: Converts images using sharp library
```

### Key Files

#### Frontend
- `pages/index.tsx` - Main React component with Ant Design UI components
- `pages/_app.tsx` - App wrapper with Ant Design theme configuration

#### Backend (API Routes)
- `pages/api/images.ts` - Uses OpenAI SDK to generate images
- `pages/api/download.ts` - Uses `sharp` for image format conversion (PNG, JPG, GIF, AVIF, WebP)
- `pages/api/config.ts` - Returns server configuration and available models

#### Utilities
- `lib/validation.ts` - Model and style validation with type safety
- `lib/config.ts` - Server configuration caching and model options

#### Types
- `types/index.ts` - All shared TypeScript interfaces and type definitions

### Technology Stack
- **Framework**: Next.js 16.x (Pages Router)
- **UI Library**: React 19.x
- **UI Components**: Ant Design 6.x
- **Type Safety**: TypeScript 5.x (strict mode enabled)
- **API Client**: OpenAI SDK 6.x
- **Image Processing**: sharp 0.34.x
- **HTTP Client**: axios 1.13.x
- **Runtime**: Node.js >= 18.0.0

### TypeScript Configuration
- **Strict mode**: Enabled (`strict: true`)
- **Additional checks**: `noUncheckedIndexedAccess`, `noImplicitOverride`, `forceConsistentCasingInFileNames`
- All source files use `.ts` or `.tsx` extensions

### Ant Design Theme
The app uses a custom Ant Design theme with:
- **Primary color**: `#5f9ea0` (cadetblue - matching original design)
- **Border radius**: 6px

### Environment
- Requires `.env` file with `OPENAI_API_KEY` (see `.env.example`)
- Optional: `OPENAI_BASE_URL` and `OPENAI_MODEL` for custom endpoints

## Ant Design Components Used

| Component | Usage |
|-----------|-------|
| `ConfigProvider` | Global theme configuration |
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
type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
type ImageStyle = 'vivid' | 'natural';
type DownloadFormat = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'avif';

// API responses
interface ImagesApiResponse { result: OpenAIImageResult[]; }
interface DownloadApiResponse { result: string; }
interface ConfigApiResponse { model: string; availableModels: ModelOption[]; baseURL: string; }
```

## Notes

- DALL-E 3 only supports `n=1` (single image) regardless of the input number
- TypeScript strict mode catches potential null/undefined issues at compile time
- The app supports multiple base URLs (OpenAI API and OpenRouter)
- Configuration errors are displayed in a modal dialog to the user
