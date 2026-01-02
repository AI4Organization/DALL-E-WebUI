# CLAUDE.md - server/

This file provides guidance to Claude Code (claude.ai/code) when working with the Express.js backend server.

## Purpose

This directory contains the Express.js backend server that handles API requests for the DALL-E 3 Web UI. It provides RESTful endpoints for image generation, configuration, and image format conversion.

## Architecture

The backend follows a traditional Express.js MVC-lite pattern:

```
server/
├── index.ts           # Server entry point with middleware and route mounting
├── routes/            # API endpoint handlers
│   ├── config.ts      # GET /api/config - Server configuration
│   ├── images.ts      # POST /api/images - DALL-E image generation
│   └── download.ts    # POST /api/download - Image format conversion
├── lib/               # Backend utilities and helpers
│   ├── config.ts      # Configuration management and model options
│   └── validation.ts  # Type-safe input validation
└── middleware/        # Express middleware
    └── error.ts       # Centralized error handling
```

## Key Files

### `index.ts` - Server Entry Point

Express server configuration with:
- **Port**: 3001 (configurable via `PORT` env var)
- **Middleware**: helmet, CORS, compression, morgan, express.json
- **Routes**: Mounted at `/api/config`, `/api/images`, `/api/download`
- **Health check**: `GET /health` endpoint

```typescript
// Environment variables
PORT=3001                    # Server port
FRONTEND_URL=http://localhost:3000  # CORS origin
OPENAI_API_KEY=sk-...        # OpenAI API key
OPENAI_BASE_URL=https://api.openai.com/v1  # API base URL
```

### API Routes

#### `GET /api/config`
Returns server configuration and available DALL-E models.

#### `POST /api/images`
Generates images using OpenAI DALL-E API.
- Body: `{ prompt, model, quality, size, style, n }`
- Returns: `{ result: OpenAIImageResult[] }`

#### `POST /api/download`
Converts images to different formats using Sharp.
- Body: `{ imageUrl, format }`
- Supported formats: webp, png, jpg, jpeg, gif, avif
- Returns base64 encoded image

### `GET /health`
Health check endpoint for monitoring.

## Dependencies

- **express** 5.2.1 - Web framework
- **cors** 2.8.5 - Cross-origin resource sharing
- **helmet** 8.1.0 - Security headers
- **compression** 1.8.1 - Response compression
- **morgan** 1.10.1 - HTTP request logger
- **openai** 6.15.0 - OpenAI SDK
- **sharp** 0.34.5 - Image processing
- **@types/express** 5.0.6 - TypeScript definitions

## Development

### Running the Backend

```bash
# Development with hot reload
npm run dev:backend

# Production (after build)
npm run start:backend
```

### Building

```bash
# Compile TypeScript to server/dist/
npm run build:backend
```

## Security Considerations

- **OPENAI_API_KEY** must NEVER be exposed to the client
- CORS is configured to only allow requests from `FRONTEND_URL`
- Helmet middleware sets security headers
- Request body size limited to 10MB for image payloads
- All API routes are under `/api/*` prefix

## Error Handling

Centralized error handling in `middleware/error.ts`:
- Logs errors with morgan
- Returns consistent error responses
- Distinguishes between client (4xx) and server (5xx) errors

## Notes

- The backend runs on port 3001 by default
- All routes return JSON responses
- Image generation uses OpenAI SDK with proper timeout handling
- Sharp library handles all image format conversions server-side
- TypeScript strict mode is enabled
