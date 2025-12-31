import type { ValidationResult, ImageStyle } from '../types';

// ============ Type Definitions ============
type ValidModel = 'dall-e-2' | 'dall-e-3' | 'z-ai/glm-4.6v' | 'x-ai/grok-4.1-fast';

// ============ Constants ============
const BASE_URL_MODELS: Record<string, ValidModel[]> = {
  'https://api.openai.com/v1': ['dall-e-2', 'dall-e-3'],
  'https://openrouter.ai/api/v1': ['z-ai/glm-4.6v', 'x-ai/grok-4.1-fast'],
};

const VALID_STYLES: ImageStyle[] = ['vivid', 'natural'];

// ============ Type-Safe Functions ============
export function validateEnvVars(): ValidationResult {
  const errors: string[] = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required');
  }
  if (!process.env.OPENAI_BASE_URL) {
    errors.push('OPENAI_BASE_URL is required');
  }
  if (!process.env.OPENAI_MODEL) {
    errors.push('OPENAI_MODEL is required');
  }

  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL;

  if (baseURL && model) {
    const validModels = BASE_URL_MODELS[baseURL as keyof typeof BASE_URL_MODELS];
    if (!validModels) {
      errors.push(`Unknown base URL: ${baseURL}`);
    } else if (!validModels.includes(model as ValidModel)) {
      errors.push(`OPENAI_MODEL '${model}' is not valid for '${baseURL}'. Valid models: ${validModels.join(', ')}`);
    }
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
