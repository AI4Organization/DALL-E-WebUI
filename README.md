# DALL-E Web UI

### Create realistic images and art from a description in natural language.

![Main Screen](./assets/image1.png)

![Result Screen](./assets/image2.png)

## Requirements

- Node.js >= 18.0.0
- Create `.env` file from `.env.example` with the following variables:
  - `OPENAI_API_KEY` - Your API key (get from [OpenAI Platform](https://platform.openai.com/docs/quickstart) or [OpenRouter](https://openrouter.ai/settings/keys))
  - `OPENAI_BASE_URL` - Base URL for the API (default: `https://api.openai.com/v1`)

## Getting Started

1. Clone/Download this project

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example` and configure your API credentials

4. Run the development server:
```bash
npm run dev
```

5. Run production server:
```bash
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Select a model from the dropdown (DALL-E 2, DALL-E 3, or others depending on your base URL)
2. Configure generation parameters:
   - **Quality**: Standard or HD (DALL-E 3 only)
   - **Size**: Auto, 1024x1024, 1024x1536 (Portrait), or 1536x1024 (Landscape)
   - **Style**: Vivid or Natural (DALL-E 3 only)
   - **Format**: WebP, PNG, JPG, GIF, or AVIF
3. Enter your image description in the prompt field
4. Click "Generate" to create images
5. Download generated images in your selected format

Example prompt: `A sleeping cat and flower vase on the kitchen table in the artist Van Gogh style.`

## Tech Stack

- **Framework**: Next.js 16.x (Pages Router)
- **UI Library**: React 19.x with Ant Design 6.x
- **Type Safety**: TypeScript 5.x (strict mode enabled)
- **API Client**: OpenAI SDK 6.x
- **Image Processing**: sharp 0.34.x

## API Routes

The `pages/api` directory is mapped to `/api/*`:
- `/api/config` - Server configuration and available models
- `/api/images` - Image generation via OpenAI DALL-E API
- `/api/download` - Image format conversion

## Developer Notes

This project uses the OpenAI official API with proper TypeScript typing and Ant Design components.
