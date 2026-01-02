import type { ValidationResult, ImageStyle } from '../../types';

// ============ Type Definitions ============
type ValidModel = 'dall-e-3' | 'gpt-image-1.5' | 'z-ai/glm-4.6v' | 'x-ai/grok-4.1-fast';

// ============ Constants ============
const BASE_URL_MODELS: Record<string, ValidModel[]> = {
  'https://api.openai.com/v1': ['dall-e-3', 'gpt-image-1.5'],
  'https://openrouter.ai/api/v1': ['z-ai/glm-4.6v', 'x-ai/grok-4.1-fast'],
};

const VALID_STYLES: ImageStyle[] = ['vivid', 'natural'];

// GPT Image 1.5 specific validation constants
const GPT_IMAGE_1_5_QUALITIES = ['auto', 'high', 'medium', 'low'] as const;
const GPT_IMAGE_1_5_OUTPUT_FORMATS = ['png', 'jpeg', 'webp'] as const;
const GPT_IMAGE_1_5_BACKGROUNDS = ['auto', 'transparent', 'opaque'] as const;
const GPT_IMAGE_1_5_SIZES = ['auto', '1024x1024', '1536x1024', '1024x1536'] as const;

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

/**
 * Gets the maximum prompt length for a given model.
 */
export function getPromptLimitForModel(model: string): number {
  if (model === 'gpt-image-1.5') return 32000;
  if (model === 'dall-e-3') return 4000;
  return 4000; // Default for other models
}

/**
 * Gets the maximum number of images for a given model.
 */
export function getMaxImagesForModel(model: string): number {
  if (model === 'gpt-image-1.5') return 10;
  if (model === 'dall-e-3') return 1;
  return 1; // Default conservative limit
}
