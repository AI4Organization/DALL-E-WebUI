import { validateEnvVars } from './validation';
import type { ServerConfig, ModelOption } from '../types';

// Model options for each base URL (with labels for UI)
const BASE_URL_MODELS: Record<string, ModelOption[]> = {
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
let cachedConfig: ServerConfig | null = null;

export function getServerConfig(): ServerConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const validation = validateEnvVars();

  cachedConfig = {
    baseURL: process.env.OPENAI_BASE_URL ?? '',
    isValid: validation.valid,
    errors: validation.errors ?? [],
    availableModels: BASE_URL_MODELS[process.env.OPENAI_BASE_URL ?? ''] ?? [],
  };

  return cachedConfig;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}

export function getAvailableModelsForBaseURL(baseURL: string): ModelOption[] {
  return BASE_URL_MODELS[baseURL] ?? [];
}
