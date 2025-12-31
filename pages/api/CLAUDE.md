# CLAUDE.md - pages/api/

This directory contains Next.js API routes (server-side endpoints) written in TypeScript.

## Routes

### `images.ts`
**Endpoint**: `/api/images` (via POST from client, reads query params)

Handles DALL-E 3 image generation using the OpenAI SDK.

**Query Parameters**:
- `p` (prompt): Text description for image generation
- `n`: Number of images (note: DALL-E 3 only supports n=1)
- `s` (size): Image size - "1024x1024", "1792x1024", "1024x1792", or "auto"
- `q` (quality): "standard" or "hd"
- `st` (style): "vivid" or "natural" (required for dall-e-3)
- `m` (model): Model identifier (selected from UI)

**Response**:
```typescript
{ result: [{ url?: string; revised_prompt?: string }] }
```

**Dependencies**:
- `openai` npm package (OpenAI SDK)
- `lib/validation.ts` - Model and style validation

### `download.ts`
**Endpoint**: `/api/download` (POST)

Converts downloaded images to different formats using the sharp library.

**Request Body**:
```typescript
{ url: string; type: DownloadFormat }
```

**Type**: "png", "jpg", "jpeg", "gif", "avif", or "webp"

**Response**:
```typescript
{ result: "data:image/[type];base64,[base64data]" }
```

**Dependencies**:
- `axios` - for downloading images
- `sharp` - for image format conversion

### `config.ts`
**Endpoint**: `/api/config` (GET)

Returns server configuration and available models.

**Response** (Success):
```typescript
{
  availableModels: ModelOption[];
  baseURL: string;
}
```

**Response** (Error):
```typescript
{
  error: string;
  details: string[];
}
```

**Dependencies**:
- `lib/config.ts` - Server configuration

## Notes

- All routes use `export default async function handler(req: NextApiRequest, res: NextApiResponse)` pattern
- API key is loaded from `process.env.OPENAI_API_KEY` server-side
- TypeScript types are imported from `types/index.ts`
- Proper error handling with typed responses
