// Model registry mapping base URLs to valid models
const BASE_URL_MODELS = {
  'https://api.openai.com/v1': ['dall-e-2', 'dall-e-3'],
  'https://openrouter.ai/api/v1': ['z-ai/glm-4.6v', 'x-ai/grok-4.1-fast']
};

// Valid style values for dall-e-3
const VALID_STYLES = ['vivid', 'natural'];

/**
 * Validates required environment variables at server startup
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateEnvVars() {
  const errors = [];

  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is required');
  }
  if (!process.env.OPENAI_BASE_URL) {
    errors.push('OPENAI_BASE_URL is required');
  }
  if (!process.env.OPENAI_MODEL) {
    errors.push('OPENAI_MODEL is required');
  }

  // Validate model compatibility with base URL
  if (process.env.OPENAI_BASE_URL && process.env.OPENAI_MODEL) {
    const validModels = BASE_URL_MODELS[process.env.OPENAI_BASE_URL];
    if (!validModels) {
      errors.push(`Unknown base URL: ${process.env.OPENAI_BASE_URL}`);
    } else if (!validModels.includes(process.env.OPENAI_MODEL)) {
      errors.push(`OPENAI_MODEL '${process.env.OPENAI_MODEL}' is not valid for '${process.env.OPENAI_BASE_URL}'. Valid models: ${validModels.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates if a model is valid for a given base URL
 * @param {string} model - The model to validate
 * @param {string} baseURL - The base URL
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateModelForBaseURL(model, baseURL) {
  const validModels = BASE_URL_MODELS[baseURL];
  if (!validModels) {
    return { valid: false, error: `Unknown base URL: ${baseURL}` };
  }
  if (!validModels.includes(model)) {
    return {
      valid: false,
      error: `Model '${model}' is not valid for ${baseURL}. Valid models: ${validModels.join(', ')}`
    };
  }
  return { valid: true };
}

/**
 * Validates style parameter (only applies to dall-e-3)
 * @param {string} style - The style value to validate
 * @param {string} model - The model being used
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStyleForModel(style, model) {
  // Style is only applicable for dall-e-3
  if (model === 'dall-e-3') {
    if (!style) {
      return { valid: false, error: 'Style parameter is required for dall-e-3' };
    }
    if (!VALID_STYLES.includes(style)) {
      return {
        valid: false,
        error: `Style '${style}' is not valid. Valid styles: ${VALID_STYLES.join(', ')}`
      };
    }
  }
  return { valid: true };
}

/**
 * Gets the base URL models mapping
 * @returns {Object}
 */
export function getBaseURLModels() {
  return BASE_URL_MODELS;
}
