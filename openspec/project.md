# Project Context

## Purpose

DALL-E 3 Web UI is a decoupled web application that provides a modern, user-friendly interface for generating images using OpenAI's DALL-E 3 API (and compatible services like OpenRouter). The project enables users to:

- Input text prompts with real-time character validation (4000 char limit)
- Configure generation parameters (model, quality, size, style)
- Generate and preview images with zoom/pan functionality
- Download generated images in multiple formats (WebP, PNG, JPG, GIF, AVIF)
- Toggle between dark and light themes with persistent preferences

## Tech Stack

### Frontend
- **Build Tool**: Rsbuild 1.7.1 (Rspack-based bundler)
- **Framework**: React 19.2.3
- **UI Library**: Ant Design 6.1.3
- **Styling**: Tailwind CSS 4.1.18 + Ant Design theming
- **Animations**: Framer Motion 12.23.26
- **HTTP Client**: axios 1.13.2

### Backend
- **Runtime**: Node.js >= 24.0.0
- **Framework**: Express.js 5.2.1
- **API Client**: OpenAI SDK 6.15.0
- **Image Processing**: sharp 0.34.5
- **Middleware**: helmet, cors, compression, morgan

### Development
- **Language**: TypeScript 5.9.3 (strict mode enabled)
- **Process Management**: concurrently, nodemon, tsx
- **Code Quality**: ESLint 9.39.2

### Deployment
- **Containerization**: Docker (multi-stage builds for frontend/backend)
- **Reverse Proxy**: Nginx for static file serving
- **Orchestration**: Docker Compose

## Project Conventions

### Code Style

#### TypeScript
- **Strict mode**: Enabled (`strict: true`)
- **Additional compiler options**: `noUncheckedIndexedAccess`, `noImplicitOverride`, `forceConsistentCasingInFileNames`
- All source files use `.ts` or `.tsx` extensions
- Type definitions are centralized in `types/index.ts`

#### Naming Conventions
- **Files**: kebab-case for most files (e.g., `theme-toggle.tsx`)
- **Components**: PascalCase for React components (e.g., `ThemedApp.tsx`)
- **Variables/Functions**: camelCase (e.g., `generateImages`, `isLoading`)
- **Types/Interfaces**: PascalCase (e.g., `ImageQuality`, `OpenAIImageResult`)
- **Constants**: UPPER_SNAKE_CASE for environment-derived values

#### File Organization
- Colocate related files (components with their styles, hooks with components)
- Keep shared types in `types/` directory
- Separate concerns: `server/` for backend, `src/` for frontend

#### Code Quality
- Use Ant Design components over custom UI when available
- Prefer built-in React hooks (useState, useEffect, useContext)
- Use Zod for runtime validation (type-safe)
- Implement proper error boundaries and error handling

### Architecture Patterns

#### Decoupled Frontend/Backend
- **Frontend**: Rsbuild SPA on port 3000 (dev)
- **Backend**: Express API server on port 3001
- **Communication**: RESTful API via axios
- **Separation**: No server-side rendering; pure client-side React

#### Backend Architecture
- **Entry Point**: `server/index.ts` with middleware chain
- **Routes**: Organized by feature (`config.ts`, `images.ts`, `download.ts`)
- **Libraries**: Shared utilities in `lib/` directory
- **Middleware**: Error handling in `middleware/error.ts`

#### Frontend Architecture
- **Entry Point**: `src/index.tsx` with ReactDOM root
- **Main Component**: `src/App.tsx` as the primary UI container
- **Components**: Reusable components in `src/components/`
- **Context**: Theme management via `src/lib/theme.tsx`

#### State Management
- React hooks for local state (useState, useEffect)
- React Context for global theme state
- No external state management library (Redux, Zustand, etc.)

#### API Layer
- **Endpoints**:
  - `GET /api/config` - Server configuration and model options
  - `POST /api/images` - Image generation via OpenAI SDK
  - `POST /api/download` - Image format conversion
  - `GET /health` - Health check

### Testing Strategy

**Note**: The project currently has no test files or testing framework set up.

#### Recommended Testing Approach (To Be Implemented)
- **Unit Tests**: Vitest or Jest for React components and utility functions
- **API Tests**: Supertest for Express endpoints
- **E2E Tests**: Playwright or Cypress for user flows
- **Type Checking**: TypeScript compiler as first line of defense

### Git Workflow

#### Branch Strategy
- **Main branch**: `main` - production-ready code
- **Feature branches**: `feature/<description>` - e.g., `feature/rsbuild-migration`
- **Fix branches**: `fix/<description>` - for bug fixes
- **Refactor branches**: `refactor/<description>` - for code improvements

#### Commit Conventions
- Use descriptive commit messages
- Reference issues or change proposals when applicable
- OpenSpec change proposals should be referenced in commits

#### Deployment Workflow
1. Create feature branch from `main`
2. Create OpenSpec proposal for non-trivial changes
3. Implement changes following `tasks.md` checklist
4. Test locally and via Docker
5. Create PR with proposal reference
6. Review and approve
7. Merge to `main`
8. Archive change proposal after deployment

## Domain Context

### Image Generation
- **Primary Model**: DALL-E 3 (default)
- **Alternative Models**: GPT Image 1.5, OpenRouter-compatible models
- **DALL-E 3 Constraints**:
  - Only supports `n=1` (single image per request)
  - Default size: 1024x1024 (square)
  - Prompt limit: 4000 characters (enforced at UI level)
  - Quality options: standard, hd
  - Style options: vivid (hyper-realistic), natural (more subtle)
  - Size options: 1024x1024, 1024x1792, 1792x1024
- **GPT Image 1.5 Capabilities**:
  - Supports `n=1` to `n=10` (multiple images per request)
  - Default size: auto
  - Prompt limit: 32000 characters (enforced at UI level)
  - Quality options: auto, high, medium, low
  - Output format options: png, jpeg, webp
  - Background options: auto, transparent, opaque
  - Size options: auto, 1024x1024, 1536x1024, 1024x1536
  - Always returns base64-encoded images (b64_json)

### Image Formats
- **Generation**: Returns URL or base64 JSON from OpenAI
- **Download Formats**: WebP (default), PNG, JPG/JPEG, GIF, AVIF
- **Conversion**: Handled by Sharp library on backend

### Theme System
- **Primary Color**: `#a855f7` (purple)
- **Border Radius**: 12px
- **Dark Mode**: Background `#0a0a12`
- **Light Mode**: Background `#f8f9fc`
- **Persistence**: localStorage with system preference fallback
- **Animation**: Framer Motion for smooth transitions

### UI/UX Patterns
- **Glass Morphism**: Backdrop blur effects on containers
- **Responsive Design**: Ant Design Grid (Row/Col) system
- **Loading States**: Spin components for async operations
- **Error Handling**: Alert components and Modal dialogs
- **Image Preview**: Zoomable modal with scroll/drag/keyboard controls

## Important Constraints

### Technical Constraints
- **Node.js Version**: Requires >= 24.0.0
- **TypeScript Strict Mode**: Cannot be disabled; all code must type-check
- **API Key Required**: `OPENAI_API_KEY` must be set in `.env`
- **Prompt Length**: Model-specific limits (4000 for DALL-E 3, 32000 for GPT Image 1.5)
- **Image Count**: Model-specific limits (1 for DALL-E 3, 10 for GPT Image 1.5)

### API Constraints
- **OpenAI Rate Limits**: Subject to OpenAI API rate limiting
- **Image Storage**: No persistent storage; images served via URL or converted on-demand
- **No Authentication**: No user authentication system (API key is server-side only)

### Browser Constraints
- **Modern Browsers Only**: Requires ES2020+ support
- **Canvas Support**: Required for image download functionality
- **LocalStorage**: Required for theme persistence

### Deployment Constraints
- **CORS Configuration**: Frontend URL must be allowed in backend CORS settings
- **Environment Variables**: Must be properly configured in production

## External Dependencies

### API Services
- **OpenAI API**: `https://api.openai.com/v1` (default)
  - Used for DALL-E image generation
  - Requires valid API key
  - SDK: `openai@6.15.0`
- **OpenRouter** (optional): Alternative API endpoint
  - Configurable via `OPENAI_BASE_URL` environment variable

### NPM Dependencies
See `package.json` for complete list. Key dependencies:

| Dependency | Version | Purpose |
|------------|---------|---------|
| @rsbuild/core | ^1.7.1 | Frontend build tool |
| antd | ^6.1.3 | UI component library |
| express | ^5.2.1 | Backend web framework |
| openai | ^6.15.0 | OpenAI API client |
| react | 19.2.3 | UI framework |
| sharp | ^0.34.5 | Image processing |
| framer-motion | ^12.23.26 | Animation library |
| axios | ^1.13.2 | HTTP client |

### Development Tools
- **nodemon**: Auto-restart backend on changes
- **concurrently**: Run multiple npm scripts simultaneously
- **tsx**: Execute TypeScript directly
- **eslint**: Code linting

### Docker Resources
- **nginx:alpine**: Frontend static file serving
- **node:24-alpine**: Backend runtime environment

## Migration History

This project was migrated from Next.js 16 to a decoupled Rsbuild/Express architecture in January 2026. The migration achieved:

- **5-10x faster build times**: Rsbuild builds in ~3s vs Next.js ~30s
- **Better HMR**: Hot module reload under 200ms vs 1-3s
- **Cleaner architecture**: Separated frontend/backend concerns
- **Smaller bundle sizes**: Rspack's superior tree-shaking

The migration preserved all functionality, TypeScript strict mode, Ant Design theming, Tailwind CSS v4 styling, and Framer Motion animations.
