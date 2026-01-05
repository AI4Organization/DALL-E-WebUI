import { type ValidationResult, type ImageStyle } from '../../types';

// ============ Type Definitions ============
type ValidModel = 'dall-e-3' | 'dall-e-2' | 'gpt-image-1.5' | 'bytedance-seed/seedream-4.5' | 'z-ai/glm-4.6v' | 'x-ai/grok-4.1-fast';

// ============ Constants ============
const BASE_URL_MODELS: Record<string, ValidModel[]> = {
  'https://api.openai.com/v1': ['dall-e-3', 'dall-e-2', 'gpt-image-1.5'],
  'https://openrouter.ai/api/v1': ['bytedance-seed/seedream-4.5', 'z-ai/glm-4.6v', 'x-ai/grok-4.1-fast'],
};

const VALID_STYLES: ImageStyle[] = ['vivid', 'natural'];

// DALL-E 2 specific validation constants
const DALL_E_2_SIZES = ['256x256', '512x512', '1024x1024'] as const;
const DALL_E_2_QUALITIES = ['standard'] as const;

const DALL_E_3_SIZES = ['1024x1024', '1024x1792', '1792x1024'] as const;

// GPT Image 1.5 specific validation constants
const GPT_IMAGE_1_5_QUALITIES = ['auto', 'high', 'medium', 'low'] as const;
const GPT_IMAGE_1_5_OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const;
const GPT_IMAGE_1_5_BACKGROUNDS = ['auto', 'transparent', 'opaque'] as const;
const GPT_IMAGE_1_5_SIZES = ['auto', '1024x1024', '1536x1024', '1024x1536'] as const;

// Seedream 4.5 specific validation constants
const SEEDREAM_4_5_QUALITIES = ['standard', 'high'] as const;
const SEEDREAM_4_5_SIZES = ['1024x1024', '1536x1536', '2048x2048', '1024x1536', '1536x1024', '1024x2048', '2048x1024'] as const;

// ============ Type-Safe Functions ============
export function validateEnvVars(): ValidationResult {
  const errors: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required');
  }
  if (!process.env.OPENAI_BASE_URL) {
    errors.push('OPENAI_BASE_URL is required');
  }

  const baseURL = process.env.OPENAI_BASE_URL;

  if (baseURL && !BASE_URL_MODELS[baseURL as keyof typeof BASE_URL_MODELS]) {
    errors.push(`Unknown base URL: ${baseURL}`);
  }

  return { valid: errors.length === 0, errors };
}

export function validateModelForBaseURL(
  model: string,
  baseURL: string
): ValidationResult {
  const validModels = BASE_URL_MODELS[baseURL as keyof typeof BASE_URL_MODELS];

  if (!validModels) {
    return { valid: false, error: `Unknown base URL: ${baseURL}` };
  }

  if (!validModels.includes(model as ValidModel)) {
    return {
      valid: false,
      error: `Model '${model}' is not valid for ${baseURL}. Valid models: ${validModels.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateStyleForModel(
  style: string | undefined,
  model: string
): ValidationResult {
  if (model === 'dall-e-3') {
    if (!style) {
      return { valid: false, error: 'Style parameter is required for dall-e-3' };
    }

    if (!VALID_STYLES.includes(style as ImageStyle)) {
      return {
        valid: false,
        error: `Style '${style}' is not valid. Valid styles: ${VALID_STYLES.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

export function getBaseURLModels() {
  return BASE_URL_MODELS;
}

// ============ GPT Image 1.5 Validation ============

/**
 * Validates GPT Image 1.5 specific parameters.
 */
export interface GPTImage15Params {
  quality?: string;
  output_format?: string;
  background?: string;
  n?: number;
  size?: string;
}

export function validateGPTImage15Params(params: GPTImage15Params): ValidationResult {
  const errors: string[] = [];

  // Validate quality (optional, defaults to auto)
  if (params.quality !== undefined) {
    if (!GPT_IMAGE_1_5_QUALITIES.includes(params.quality as typeof GPT_IMAGE_1_5_QUALITIES[number])) {
      errors.push(`Quality '${params.quality}' is not valid for GPT Image 1.5. Valid options: ${GPT_IMAGE_1_5_QUALITIES.join(', ')}`);
    }
  }

  // Validate output_format (optional, defaults to png)
  if (params.output_format !== undefined) {
    if (!GPT_IMAGE_1_5_OUTPUT_FORMATS.includes(params.output_format as typeof GPT_IMAGE_1_5_OUTPUT_FORMATS[number])) {
      errors.push(`Output format '${params.output_format}' is not valid for GPT Image 1.5. Valid options: ${GPT_IMAGE_1_5_OUTPUT_FORMATS.join(', ')}`);
    }
  }

  // Validate background (optional, defaults to auto)
  if (params.background !== undefined) {
    if (!GPT_IMAGE_1_5_BACKGROUNDS.includes(params.background as typeof GPT_IMAGE_1_5_BACKGROUNDS[number])) {
      errors.push(`Background '${params.background}' is not valid for GPT Image 1.5. Valid options: ${GPT_IMAGE_1_5_BACKGROUNDS.join(', ')}`);
    }
  }

  // Validate n (number of images) - GPT Image 1.5 supports 1-10
  if (params.n !== undefined) {
    if (params.n < 1 || params.n > 10) {
      errors.push(`Number of images must be between 1 and 10 for GPT Image 1.5. Received: ${params.n}`);
    }
  }

  // Validate size (optional, defaults to auto)
  if (params.size !== undefined) {
    if (!GPT_IMAGE_1_5_SIZES.includes(params.size as typeof GPT_IMAGE_1_5_SIZES[number])) {
      errors.push(`Size '${params.size}' is not valid for GPT Image 1.5. Valid options: ${GPT_IMAGE_1_5_SIZES.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============ Seedream 4.5 Validation ============

/**
 * Validates Seedream 4.5 specific parameters.
 */
export interface Seedream45Params {
  quality?: string;
  n?: number;
  size?: string;
}

export function validateSeedream45Params(params: Seedream45Params): ValidationResult {
  const errors: string[] = [];

  // Validate quality (optional, defaults to standard)
  if (params.quality !== undefined) {
    if (!SEEDREAM_4_5_QUALITIES.includes(params.quality as typeof SEEDREAM_4_5_QUALITIES[number])) {
      errors.push(`Quality '${params.quality}' is not valid for Seedream 4.5. Valid options: ${SEEDREAM_4_5_QUALITIES.join(', ')}`);
    }
  }

  // Validate n (number of images) - Seedream 4.5 supports 1-6
  if (params.n !== undefined) {
    if (params.n < 1 || params.n > 6) {
      errors.push(`Number of images must be between 1 and 6 for Seedream 4.5. Received: ${params.n}`);
    }
  }

  // Validate size (optional, defaults to 1024x1024)
  if (params.size !== undefined) {
    if (!SEEDREAM_4_5_SIZES.includes(params.size as typeof SEEDREAM_4_5_SIZES[number])) {
      errors.push(`Size '${params.size}' is not valid for Seedream 4.5. Valid options: ${SEEDREAM_4_5_SIZES.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Gets the maximum prompt length for a given model.
 */
export function getPromptLimitForModel(model: string): number {
  if (model === 'gpt-image-1.5') return 32000;
  if (model === 'bytedance-seed/seedream-4.5') return 4096; // Seedream 4.5 supports long prompts
  if (model === 'dall-e-3') return 4000;
  if (model === 'dall-e-2') return 1000;
  return 4000; // Default for other models
}

/**
 * Gets the maximum number of images for a given model.
 */
export function getMaxImagesForModel(model: string): number {
  if (model === 'gpt-image-1.5') return 10;
  if (model === 'bytedance-seed/seedream-4.5') return 6; // Seedream 4.5 max is 6
  if (model === 'dall-e-3') return 1;
  if (model === 'dall-e-2') return 10;
  return 1; // Default conservative limit
}

/**
 * Gets the valid sizes for a given model.
 */
export function getValidSizesForModel(model: string): readonly string[] {
  if (model === 'gpt-image-1.5') return GPT_IMAGE_1_5_SIZES;
  if (model === 'bytedance-seed/seedream-4.5') return SEEDREAM_4_5_SIZES;
  if (model === 'dall-e-2') return DALL_E_2_SIZES;
  // Default to DALL-E 3 sizes for dall-e-3 and others
  if (model === 'dall-e-3') return DALL_E_3_SIZES;
  return ['1024x1024'];
}

/**
 * Gets the default size for a given model.
 * For DALL-E 3 and GPT Image 1.5, returns landscape orientation.
 * For DALL-E 2, returns the largest square size.
 * For Seedream 4.5, returns 1024x1024 (default square).
 */
export function getDefaultSizeForModel(model: string): string {
  if (model === 'gpt-image-1.5') return GPT_IMAGE_1_5_SIZES[2]; // '1536x1024' (Landscape)
  if (model === 'bytedance-seed/seedream-4.5') return SEEDREAM_4_5_SIZES[0]; // '1024x1024' (Square)
  if (model === 'dall-e-2') return DALL_E_2_SIZES[2]; // '1024x1024' (Largest square)
  if (model === 'dall-e-3') return DALL_E_3_SIZES[2]; // Landscape for DALL-E 3
  // Return default sizes for the other models
  return '1024x1024';
}

/**
 * Validates DALL-E 2 specific parameters.
 */
export interface DALLE2Params {
  quality?: string;
  size?: string;
  n?: number;
}

export function validateDALLE2Params(params: DALLE2Params): ValidationResult {
  const errors: string[] = [];

  // Validate quality (optional, but must be 'standard' if provided)
  if (params.quality !== undefined) {
    if (!DALL_E_2_QUALITIES.includes(params.quality as typeof DALL_E_2_QUALITIES[number])) {
      errors.push(`Quality '${params.quality}' is not valid for DALL-E 2. Valid options: ${DALL_E_2_QUALITIES.join(', ')}`);
    }
  }

  // Validate size (optional, defaults to 1024x1024)
  if (params.size !== undefined) {
    if (!DALL_E_2_SIZES.includes(params.size as typeof DALL_E_2_SIZES[number])) {
      errors.push(`Size '${params.size}' is not valid for DALL-E 2. Valid options: ${DALL_E_2_SIZES.join(', ')}`);
    }
  }

  // Validate n (number of images) - DALL-E 2 supports 1-10
  if (params.n !== undefined) {
    if (params.n < 1 || params.n > 10) {
      errors.push(`Number of images must be between 1 and 10 for DALL-E 2. Received: ${params.n}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
