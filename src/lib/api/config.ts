import { z } from 'zod';

import type { ModelOption } from '../../../types';
import { apiClient, ApiError } from '../api-client';

/**
 * Zod schema for model option
 */
export const ModelOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
}) as z.ZodType<ModelOption>;

/**
 * Zod schema for config API response
 */
export const ConfigResponseSchema = z.object({
  availableModels: z.array(ModelOptionSchema),
  baseURL: z.string(),
});

/**
 * Configuration response from the API
 */
export interface ConfigResponse {
  /** Available AI models for image generation */
  availableModels: ModelOption[];
  /** Base URL for the API server */
  baseURL: string;
}

/**
 * Fetches server configuration including available models
 *
 * @returns Promise resolving to server configuration
 * @throws {ApiError} On API errors
 *
 * @example
 * ```ts
 * const config = await fetchConfig();
 * console.log(config.availableModels);
 * // [{ value: 'dall-e-3', label: 'DALL-E 3' }, ...]
 * ```
 */
export async function fetchConfig(): Promise<ConfigResponse> {
  try {
    const response = await apiClient.get('/api/config');

    // Validate response with Zod
    const validatedResponse = ConfigResponseSchema.parse(response.data);

    return {
      availableModels: validatedResponse.availableModels,
      baseURL: validatedResponse.baseURL,
    };
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap Zod validation errors
    if (error instanceof z.ZodError) {
      throw new ApiError(
        500,
        'Invalid response from server',
        [`Response validation failed: ${error.message}`]
      );
    }

    // Wrap unknown errors
    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'Failed to fetch configuration',
      error instanceof Error ? [error.message] : undefined
    );
  }
}

/**
 * Fetches just the available models
 * Convenience wrapper around fetchConfig
 *
 * @returns Promise resolving to array of available models
 */
export async function fetchAvailableModels(): Promise<ModelOption[]> {
  const config = await fetchConfig();
  return config.availableModels;
}
