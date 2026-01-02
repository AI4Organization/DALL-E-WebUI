# CLAUDE.md - pages/

This directory contains the Next.js Pages Router structure.

## Structure

```
pages/
  _app.tsx           # Next.js App wrapper with ThemeProvider
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
- Ant Design UI components (Input, Select, Button, Card, Image, Tooltip, etc.)
- Model selection from UI with DALL-E 3 as default
- API call to `/api/images` for generation
- Download functionality via `/api/download`
- Results grid display with click-to-download
- Configuration error modal dialog
- Style dropdown with info icon tooltip explaining each style option
- Theme toggle button integration (dark/light mode)
- Default size: "auto" for DALL-E 3, "1024x1024" for DALL-E 2

### `_app.tsx`
Next.js app wrapper that:
- Wraps the app with `ThemeProvider` from `lib/theme.tsx`
- Delegates Ant Design theming to `components/ThemedApp.tsx`
- Imports global styles from `styles/globals.css`
- Configures Google Fonts (Inter and Outfit families)
- Sets up proper viewport meta tags
- Integrates the `ThemeToggle` component for theme switching

**Structure**:
```tsx
<ThemeProvider>
  <ThemedApp {...appProps} />
</ThemeProvider>
```

## API Routes

All API routes use TypeScript with proper type definitions from `types/index.ts`:

- **config.ts**: Returns server configuration and available models
- **images.ts**: Handles OpenAI DALL-E 3 API calls
- **download.ts**: Handles image format conversion using sharp
