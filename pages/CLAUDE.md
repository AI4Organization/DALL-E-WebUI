# CLAUDE.md - pages/

This directory contains the Next.js Pages Router structure.

## Structure

```
pages/
  _app.js           # Next.js App wrapper - applies global styles
  index.js          # Main application page - UI for DALL-E 3 image generation
  api/
    images.js       # API endpoint for DALL-E 3 image generation
    download.js     # API endpoint for image format conversion
```

## Key Files

### `index.js`
Main React component containing:
- State management for prompt, image count, quality, size, style
- API call to `/api/images` for generation
- Download functionality via `/api/download`
- Results grid display with click-to-download

### `_app.js`
Next.js app wrapper that imports global CSS from `styles/globals.css`.

## API Routes

Both API routes are in `pages/api/`:
- **images.js**: Handles OpenAI DALL-E 3 API calls
- **download.js**: Handles image format conversion using sharp
