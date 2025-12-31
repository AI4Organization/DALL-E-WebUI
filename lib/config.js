import { validateEnvVars } from './validation.js';

// Model options for each base URL (with labels for UI)
const BASE_URL_MODELS = {
  'https://api.openai.com/v1': [
    { value: 'dall-e-2', label: 'DALL-E 2' },
    { value: 'dall-e-3', label: 'DALL-E 3' }
  ],
  'https://openrouter.ai/api/v1': [
    { value: 'z-ai/glm-4.6v', label: 'GLM-4.6v (Z-AI)' },
    { value: 'x-ai/grok-4.1-fast', label: 'Grok-4.1-Fast (X-AI)' }
  ]
};

// Cached configuration
let cachedConfig = null;

/**
 * Gets the server configuration
 * @returns {Object} Configuration object with model, baseURL, isValid, errors, availableModels
 */
export function getServerConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const validation = validateEnvVars();

  cachedConfig = {
    baseURL: process.env.OPENAI_BASE_URL,
    model: process.env.OPENAI_MODEL,
    isValid: validation.valid,
    errors: validation.errors,
    availableModels: BASE_URL_MODELS[process.env.OPENAI_BASE_URL] || []
  };

  return cachedConfig;
}

/**
 * Resets the configuration cache (useful for testing)
 */
export function resetConfigCache() {
  cachedConfig = null;
}

/**
 * Gets available models for a specific base URL
 * @param {string} baseURL - The base URL
 * @returns {Array} Array of model objects with value and label
 */
export function getAvailableModelsForBaseURL(baseURL) {
  return BASE_URL_MODELS[baseURL] || [];
}
