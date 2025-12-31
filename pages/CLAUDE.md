# CLAUDE.md - pages/

This directory contains the Next.js Pages Router structure.

## Structure

```
pages/
  _app.tsx           # Next.js App wrapper with Ant Design ConfigProvider
  index.tsx          # Main application page - UI for DALL-E 3 image generation
  api/
    config.ts        # API endpoint for server configuration
    images.ts        # API endpoint for DALL-E 3 image generation
    download.ts      # API endpoint for image format conversion
```

## Key Files

### `index.tsx`
Main React component containing:
- State management with proper TypeScript types
- Ant Design UI components (Input, Select, Button, Card, Image, etc.)
- API call to `/api/images` for generation
- Download functionality via `/api/download`
- Results grid display with click-to-download
- Configuration error modal dialog

### `_app.tsx`
Next.js app wrapper that:
- Wraps the app with Ant Design `ConfigProvider`
- Configures the Ant Design theme (cadetblue primary color)

## API Routes

All API routes use TypeScript with proper type definitions from `types/index.ts`:

- **config.ts**: Returns server configuration and available models
- **images.ts**: Handles OpenAI DALL-E 3 API calls
- **download.ts**: Handles image format conversion using sharp
