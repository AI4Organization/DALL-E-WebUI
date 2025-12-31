// ============ OpenAI API Types ============
export interface OpenAIImageResponse {
  created: number;
  data: OpenAIImageResult[];
}

export interface OpenAIImageResult {
  url?: string;
  revised_prompt?: string;
  b64_json?: string;
}

// ============ Image Generation Types ============
export type ImageQuality = 'standard' | 'hd';

// DALL-E 2 sizes: 256x256, 512x512, 1024x1024
// DALL-E 3 sizes: 1024x1024, 1024x1536, 1536x1024, auto
export type ImageSize =
  // DALL-E 2 sizes
  | '256x256'
  | '512x512'
  | '1024x1024'
  // DALL-E 3 sizes
  | '1024x1536'
  | '1536x1024'
  | 'auto';

export type ImageStyle = 'vivid' | 'natural';
export type DownloadFormat = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'avif';

// Model-specific size options
export const DALL_E_2_SIZES: readonly ImageSize[] = ['256x256', '512x512', '1024x1024'] as const;
export const DALL_E_3_SIZES: readonly ImageSize[] = ['1024x1024', '1024x1536', '1536x1024', 'auto'] as const;

export interface ModelOption {
  value: string;
  label: string;
}

// ============ API Request/Response Types ============
export interface ImagesApiQueryParams {
  p: string;              // prompt
  n: number;              // number
  s: ImageSize;           // size
  q: ImageQuality;        // quality
  st?: ImageStyle;        // style (dall-e-3 only)
  m: string;              // model
}

export interface ImagesApiResponse {
  result: OpenAIImageResult[];
}

export interface DownloadApiRequestBody {
  url: string;
  type: DownloadFormat;
}

export interface DownloadApiResponse {
  result: string; // data URL base64
}

export interface ConfigApiResponse {
  model: string;
  availableModels: ModelOption[];
  baseURL: string;
}

export interface ConfigApiErrorResponse {
  error: string;
  details: string[];
}

// ============ Server Config Types ============
export interface ServerConfig {
  baseURL: string;
  model: string;
  isValid: boolean;
  errors: string[];
  availableModels: ModelOption[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  error?: string;
}

// ============ Environment Variable Types ============
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;
      OPENAI_BASE_URL: string;
      OPENAI_MODEL: string;
    }
  }
}
