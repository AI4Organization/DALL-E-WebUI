# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DALL-E 3 Web UI is a Next.js application (Pages Router) that provides a web interface for generating images using OpenAI's DALL-E 3 API. It allows users to input prompts, configure generation parameters (quality, size, style), and download generated images in various formats.

## Development Commands

### Local Development
```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production
npm run start     # Start production server (after build)
npm run lint      # Run ESLint
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
pages/
  _app.js           # Next.js App wrapper (global styles)
  index.js          # Main UI page with prompt input, settings, results display
  api/
    images.js       # POST endpoint: Calls OpenAI DALL-E 3 API
    download.js     # POST endpoint: Converts images using sharp library

styles/
  globals.css       # Global CSS styles
  Home.module.css   # Component-scoped styles for index.js
```

### Key Files
- `pages/index.js` - Main React component containing all UI state and logic
- `pages/api/images.js` - Uses OpenAI SDK (`openai` npm package) to generate images
- `pages/api/download.js` - Uses `sharp` for image format conversion (PNG, JPG, GIF, AVIF, WebP)

### Technology Stack
- Next.js 16.x (Pages Router, not App Router)
- React 19.x
- OpenAI SDK 6.x
- Node.js >= 18.0.0
- TypeScript configuration present but source files use JavaScript (.js)

### Environment
- Requires `.env` file with `OPENAI_API_KEY` (see `.env.example`)
- API key is loaded server-side in `pages/api/images.js`

## Notes

- The app uses client-side API key passing via URL query params (`?t=${token}`) - the token is passed from the client's environment variable, not a secure pattern for production
- DALL-E 3 only supports `n=1` (single image) regardless of the input number
- The TypeScript config (`strict: false`) allows loose typing
