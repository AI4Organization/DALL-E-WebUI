# CLAUDE.md - pages/api/

This directory contains Next.js API routes (server-side endpoints).

## Routes

### `images.js`
**Endpoint**: `/api/images` (via POST from client, reads query params)

Handles DALL-E 3 image generation using the OpenAI SDK.

**Query Parameters**:
- `p` (prompt): Text description for image generation
- `n`: Number of images (note: DALL-E 3 only supports n=1)
- `s` (size): Image size - "1024x1024", "1792x1024", or "1024x1792"
- `q` (quality): "standard" or "hd"
- `st` (style): "vivid" or "natural"

**Response**:
```javascript
{ result: [{ url: "https://...", revised_prompt: "..." }] }
```

**Dependencies**:
- `openai` npm package (OpenAI SDK)

### `download.js`
**Endpoint**: `/api/download` (POST)

Converts downloaded images to different formats using the sharp library.

**Request Body**:
- `url`: Image URL to download
- `type`: Target format - "png", "jpg", "gif", "avif", or "webp" (default)

**Response**:
```javascript
{ result: "data:image/[type];base64,[base64data]" }
```

**Dependencies**:
- `axios` - for downloading images
- `sharp` - for image format conversion

## Notes

- Both routes use `export default async function handler(req, res)` pattern (Next.js Pages Router API routes)
- API key is loaded from `process.env.OPENAI_API_KEY` server-side
