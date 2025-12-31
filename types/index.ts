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
export type ImageSize = '1024x1024' | '1792x1024' | '1024x1792';
export type ImageStyle = 'vivid' | 'natural';
export type DownloadFormat = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'avif';

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
