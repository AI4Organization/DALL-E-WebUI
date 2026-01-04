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
// DALL-E 2 quality options
export type DALLE2ImageQuality = 'standard';

// DALL-E 3 quality options
export type ImageQuality = 'standard' | 'hd';

// GPT Image 1.5 quality options
export type GPTImageQuality = 'auto' | 'high' | 'medium' | 'low';

// GPT Image 1.5 output format options (API-supported)
export type GPTImageOutputFormat = 'png' | 'jpeg' | 'webp';

// Universal output format for all models (API-supported only)
export type ImageOutputFormat = 'webp' | 'png' | 'jpeg';

// GPT Image 1.5 background options
export type GPTImageBackground = 'auto' | 'transparent' | 'opaque';

// Status of an individual image generation request
export type ImageGenerationStatus = 'pending' | 'loading' | 'success' | 'error';

// Individual image generation item with status tracking
export interface ImageGenerationItem {
  id: number;
  status: ImageGenerationStatus;
  result?: OpenAIImageResult;
  error?: string;
}

// DALL-E 2 sizes: 256x256, 512x512, 1024x1024
// DALL-E 3 sizes: 1024x1024, 1024x1792, 1792x1024
// GPT Image 1.5 sizes: auto, 1024x1024, 1536x1024, 1024x1536
export type ImageSize =
  // Common size
  | '1024x1024'
  // DALL-E 2 sizes
  | '256x256'
  | '512x512'
  // DALL-E 3 sizes
  | '1024x1792'
  | '1792x1024'
  // GPT Image 1.5 specific sizes
  | 'auto'
  | '1536x1024'
  | '1024x1536';

export type ImageStyle = 'vivid' | 'natural';

// Image preview fit modes
export type FitMode = 'contain' | 'actual' | 'fill';

// Model-specific size options
export const DALL_E_2_SIZES: readonly ImageSize[] = ['256x256', '512x512', '1024x1024'] as const;
export const DALL_E_3_SIZES: readonly ImageSize[] = ['1024x1024', '1024x1792', '1792x1024'] as const;
export const GPT_IMAGE_1_5_SIZES: readonly ImageSize[] = ['auto', '1024x1024', '1536x1024', '1024x1536'] as const;

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

export interface ImagesApiErrorResponse {
  error: string;
  details?: string[];
  code?: string;
  type?: string;
}

export interface DownloadApiRequestBody {
  url: string;
  type: ImageOutputFormat;
}

export interface DownloadApiResponse {
  result: string; // data URL base64
}

export interface ConfigApiResponse {
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
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string;
      OPENAI_BASE_URL: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
export {};
