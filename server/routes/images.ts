import axios from 'axios';
import { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';

import type {
  GPTImageBackground,
  GPTImageQuality,
  ImageOutputFormat,
  ImageQuality,
  ImagesApiErrorResponse,
  ImagesApiResponse,
  ImageSize,
  ImageStyle,
  OpenAIImageResult,
} from '../../types';
import openai from '../lib/openai-client';
import {
  getPromptLimitForModel,
  validateDALLE2Params,
  validateGPTImage15Params,
  validateModelForBaseURL,
  validateSeedream45Params,
  validateStyleForModel,
} from '../lib/validation';

// OpenRouter base URL constant
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Debug log file path
const DEBUG_LOG_PATH = path.join(process.cwd(), 'openrouter-debug.log');

/**
 * Writes debug information to a log file
 */
function writeDebugLog(label: string, data: unknown): void {
  const timestamp = new Date().toISOString();
  const logEntry = `\n${timestamp} - ${label}\n${JSON.stringify(data, null, 2)}\n${'='.repeat(80)}\n`;

  try {
    fs.appendFileSync(DEBUG_LOG_PATH, logEntry, 'utf-8');
    console.log(`Debug log written to: ${DEBUG_LOG_PATH}`);
  } catch (error) {
    console.error('Failed to write debug log:', error);
  }
}

// Type for OpenAI image generation request parameters (varies by model)
interface ImageGenerationRequestParams {
  prompt: string;
  n: number;
  size: ImageSize;
  model: string;
  quality?: ImageQuality | GPTImageQuality;
  style?: ImageStyle;
  output_format?: ImageOutputFormat;
  background?: GPTImageBackground;
}

// Type for OpenAI API errors
interface OpenAIApiError extends Error {
  status?: number;
  code?: string;
  type?: string;
  message: string;
}

// Type guard for OpenAI API errors
function isOpenAIApiError(error: unknown): error is OpenAIApiError {
  return (
    error instanceof Error &&
    'status' in error &&
    typeof (error as OpenAIApiError).status === 'number'
  );
}

/**
 * Checks if a model should be routed through OpenRouter.
 * OpenRouter models include: bytedance-seed/seedream-4.5, z-ai/glm-4.6v, x-ai/grok-4.1-fast
 */
function isOpenRouterModel(model: string): boolean {
  return (
    model.startsWith('bytedance-seed/') || model.startsWith('z-ai/') || model.startsWith('x-ai/')
  );
}

/**
 * Maps a size string (e.g., "1024x1024") to an OpenRouter aspect ratio.
 * OpenRouter uses aspect_ratio in image_config instead of width/height.
 *
 * Supported aspect ratios by OpenRouter:
 * - 1:1 → 1024×1024 (default)
 * - 2:3 → 832×1248
 * - 3:2 → 1248×832
 * - 3:4 → 864×1184
 * - 4:3 → 1184×864
 * - 4:5 → 896×1152
 * - 5:4 → 1152×896
 * - 9:16 → 768×1344
 * - 16:9 → 1344×768
 * - 21:9 → 1536×672
 */
function mapSizeToAspectRatio(size: string): string {
  if (size === 'auto') {
    return '1:1'; // Default to square
  }

  const parts = size.split('x');
  const widthStr = parts[0];
  const heightStr = parts[1];

  if (!widthStr || !heightStr) {
    return '1:1'; // Fallback to square
  }

  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  if (isNaN(width) || isNaN(height)) {
    return '1:1'; // Fallback to square
  }

  // Calculate the greatest common divisor to simplify the ratio
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const divisor = gcd(width, height);
  const simplifiedWidth = width / divisor;
  const simplifiedHeight = height / divisor;

  return `${simplifiedWidth}:${simplifiedHeight}`;
}

/**
 * Generates images using OpenRouter's chat completions API.
 * OpenRouter uses multimodal chat with modalities: ['image', 'text'] for image generation.
 *
 * Note: Using axios directly since the OpenRouter SDK may not fully support the modalities parameter.
 *
 * OpenRouter requires image_config with aspect_ratio (not direct width/height).
 * Example: { image_config: { aspect_ratio: "16:9", image_size: "2K" } }
 */
async function generateImagesWithOpenRouter(
  prompt: string,
  model: string,
  n: number,
  size: string,
  quality?: string
): Promise<OpenAIImageResult[]> {
  // Map size to aspect ratio for OpenRouter
  const aspectRatio = mapSizeToAspectRatio(size);

  // Build image_config object
  const imageConfig: Record<string, unknown> = {
    aspect_ratio: aspectRatio,
  };

  // Add image_size based on quality
  // High quality uses 2K, standard quality uses 1K
  if (quality === 'high') {
    imageConfig.image_size = '2K';
  } else if (quality === 'standard') {
    imageConfig.image_size = '1K';
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    modalities: ['image', 'text'],
    stream: false,
    image_config: imageConfig,
  };

  // Log request
  writeDebugLog('OpenRouter REQUEST', {
    url: `${OPENROUTER_BASE_URL}/chat/completions`,
    originalSize: size,
    mappedAspectRatio: aspectRatio,
    quality,
    imageConfig,
    body: requestBody,
  });

  const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, requestBody, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'OpenDia',
    },
    timeout: 60000, // 60 seconds for image generation
  });

  // Log response structure for debugging
  writeDebugLog('OpenRouter RESPONSE', response.data);

  // Transform OpenRouter response to OpenAIImageResult format
  const results: OpenAIImageResult[] = [];

  // OpenRouter returns images as base64 data URLs in assistant message content
  // Note: OpenRouter may return images in different fields:
  // 1. choice.message.content (string or array)
  // 2. choice.message.images (array of image objects)
  for (const choice of response.data.choices) {
    const message = choice.message;
    const content = message.content;
    const images = (message as { images?: unknown[] }).images;

    writeDebugLog('Processing choice', {
      choiceIndex: choice.index,
      hasContent: !!content,
      contentType: typeof content,
      hasImages: !!images,
      imagesCount: images?.length ?? 0,
    });

    // First, check for images array (OpenRouter's format for image generation)
    if (images && Array.isArray(images) && images.length > 0) {
      writeDebugLog('Found images array in message', {
        imagesCount: images.length,
      });

      for (const img of images) {
        if (img && typeof img === 'object' && 'type' in img && img.type === 'image_url') {
          const imageObj = img as { image_url?: { url?: string } };
          if (imageObj.image_url?.url) {
            const imageUrl = imageObj.image_url.url;
            // Check if it's a base64 data URL
            if (imageUrl.startsWith('data:image/')) {
              const base64Match = imageUrl.match(/base64,(.+)/);
              if (base64Match && base64Match[1]) {
                results.push({
                  b64_json: base64Match[1],
                });
                writeDebugLog('Found base64 image in images array', {
                  urlLength: imageUrl.length,
                  base64Length: base64Match[1].length,
                });
              }
            } else {
              // It's a regular URL - store it directly
              results.push({
                url: imageUrl,
              });
              writeDebugLog('Found regular URL in images array', {
                url: imageUrl,
              });
            }
          }
        }
      }
    }

    // Second, check content field (standard chat format)
    if (typeof content === 'string') {
      // Check if content contains a data URL (base64 image)
      const dataUrlMatch = content.match(/data:image\/[^;]+;base64,[^"'\s]+/);
      if (dataUrlMatch) {
        // Extract the base64 data (without the data:image/...;base64, prefix)
        const base64Match = dataUrlMatch[0].match(/base64,(.+)/);
        if (base64Match && base64Match[1]) {
          results.push({
            b64_json: base64Match[1],
          });
          writeDebugLog('Found base64 image in string content', {
            dataUrlLength: dataUrlMatch[0].length,
            base64Length: base64Match[1].length,
          });
        }
      }
    } else if (Array.isArray(content)) {
      writeDebugLog('Content is array, processing items', {
        itemCount: content.length,
      });
      // Content is an array of content items (structured format)
      for (const item of content) {
        if (item && typeof item === 'object' && 'type' in item && item.type === 'image_url') {
          const imageItem = item as { image_url?: { url?: string } };
          if (imageItem.image_url?.url) {
            const imageUrl = imageItem.image_url.url;
            // Check if it's a base64 data URL
            if (imageUrl.startsWith('data:image/')) {
              const base64Match = imageUrl.match(/base64,(.+)/);
              if (base64Match && base64Match[1]) {
                results.push({
                  b64_json: base64Match[1],
                });
                writeDebugLog('Found base64 image in content array item', {
                  urlLength: imageUrl.length,
                  base64Length: base64Match[1].length,
                });
              }
            } else {
              // It's a regular URL - store it directly
              results.push({
                url: imageUrl,
              });
              writeDebugLog('Found regular URL in content array item', {
                url: imageUrl,
              });
            }
          }
        }
      }
    }
  }

  // Log extracted results
  writeDebugLog('Extracted results', {
    resultsCount: results.length,
    results: results,
  });

  // If no images found in content, log detailed error
  if (results.length === 0) {
    writeDebugLog('ERROR: No image data found', {
      fullResponse: response.data,
      choices: response.data.choices,
    });
    throw new Error('No image data returned from OpenRouter');
  }

  return results;
}

const router = Router();

/**
 * POST /api/images - Handles DALL-E image generation
 *
 * Supports DALL-E 3, DALL-E 2, and GPT Image 1.5 models.
 * Each request generates images based on the model's capabilities.
 *
 * Model-specific parameters:
 * - DALL-E 3: Requires style (vivid/natural), quality (standard/hd), supports n=1 only
 * - DALL-E 2: No quality parameter (API ignores it), no style, supports n=1 to n=10
 * - GPT Image 1.5: Quality (auto/high/medium/low), output_format (png/jpeg/webp), background (auto/transparent/opaque), supports n=1 to n=10
 */
router.post(
  '/',
  async (req: Request, res: Response<ImagesApiResponse | ImagesApiErrorResponse>) => {
    const {
      p: prompt,
      n,
      s: size,
      q: quality,
      st: style,
      m: model,
      of: output_format,
      bg: background,
    } = req.query;

    // Validate required parameters
    if (!prompt || !n || !size) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: ['prompt (p), number (n), and size (s) are required'],
      });
    }

    // Use model from query or default to env config
    const selectedModel = model || process.env.OPENAI_MODEL;
    const baseURL = process.env.OPENAI_BASE_URL;

    // Validate model for base URL
    const modelValidation = validateModelForBaseURL(selectedModel as string, baseURL as string);
    if (!modelValidation.valid) {
      return res.status(400).json({ error: modelValidation.error ?? 'Invalid model' });
    }

    // Validate prompt length for model
    const promptLimit = getPromptLimitForModel(selectedModel as string);
    if ((prompt as string).length > promptLimit) {
      return res.status(400).json({
        error: 'Prompt too long',
        details: [`Prompt exceeds ${promptLimit} character limit for ${selectedModel}`],
      });
    }

    // Validate style for DALL-E 3 only
    if (selectedModel === 'dall-e-3') {
      if (!style) {
        return res.status(400).json({
          error: 'Missing required parameter',
          details: ['style (st) is required for DALL-E 3'],
        });
      }
      const styleValidation = validateStyleForModel(style as string, selectedModel as string);
      if (!styleValidation.valid) {
        return res.status(400).json({ error: styleValidation.error ?? 'Invalid style' });
      }
    }

    // Validate GPT Image 1.5 specific parameters
    if (selectedModel === 'gpt-image-1.5') {
      const gptImageValidation = validateGPTImage15Params({
        quality: quality as string,
        output_format: output_format as string,
        background: background as string,
        n: n as unknown as number,
        size: size as string,
      });
      if (!gptImageValidation.valid) {
        return res.status(400).json({
          error: 'Invalid GPT Image 1.5 parameters',
          details: gptImageValidation.errors,
        });
      }
    }

    // Validate DALL-E 2 specific parameters
    if (selectedModel === 'dall-e-2') {
      const dalle2Validation = validateDALLE2Params({
        quality: quality as string,
        size: size as string,
        n: n as unknown as number,
      });
      if (!dalle2Validation.valid) {
        return res.status(400).json({
          error: 'Invalid DALL-E 2 parameters',
          details: dalle2Validation.errors,
        });
      }
    }

    // Validate Seedream 4.5 specific parameters
    if (selectedModel === 'bytedance-seed/seedream-4.5') {
      const seedreamValidation = validateSeedream45Params({
        quality: quality as string,
        n: n as unknown as number,
        size: size as string,
      });
      if (!seedreamValidation.valid) {
        return res.status(400).json({
          error: 'Invalid Seedream 4.5 parameters',
          details: seedreamValidation.errors,
        });
      }
    }

    try {
      // Check if we should use OpenRouter for this model
      const useOpenRouter = isOpenRouterModel(selectedModel as string);

      let resultData: OpenAIImageResult[];

      if (useOpenRouter) {
        // Use OpenRouter for models like Seedream 4.5
        resultData = await generateImagesWithOpenRouter(
          prompt as string,
          selectedModel as string,
          Number(n),
          size as string,
          quality as string | undefined
        );
      } else {
        // Use OpenAI SDK for DALL-E models
        // Build request parameters based on model
        // Note: Cast size to OpenAI SDK's expected type (excludes Seedream 4.5 specific sizes)
        const requestParams: ImageGenerationRequestParams = {
          prompt: prompt as string,
          n: Number(n),
          size: size as ImageSize,
          model: selectedModel as string,
        };

        // Add quality parameter for DALL-E 3 and GPT Image 1.5
        // DALL-E 2 does not support quality parameter (always standard)
        if (quality && selectedModel !== 'dall-e-2') {
          requestParams.quality = quality as ImageQuality | GPTImageQuality;
        }

        // Add style for DALL-E 3 only
        if (selectedModel === 'dall-e-3' && style) {
          requestParams.style = style as ImageStyle;
        }

        // Add output_format for GPT Image 1.5
        if (selectedModel === 'gpt-image-1.5' && output_format) {
          requestParams.output_format = output_format as ImageOutputFormat;
        }

        // Add background for GPT Image 1.5
        if (selectedModel === 'gpt-image-1.5' && background) {
          requestParams.background = background as GPTImageBackground;
        }

        // Cast to any to bypass OpenAI SDK type checking for our extended ImageSize type
        // The size is validated earlier per-model, so this is safe
        const response = await openai.images.generate(requestParams as any);

        if (!response.data) {
          return res.status(500).json({
            error: 'Failed to generate image',
            details: ['No data returned from API'],
          });
        }

        resultData = response.data;
      }

      res.status(200).json({ result: resultData });
    } catch (error) {
      console.error('Image generation error:', error);

      // Check for OpenAI API errors with specific status codes
      if (isOpenAIApiError(error) && error.status) {
        // Handle specific OpenAI error statuses
        const status = error.status;
        const errorMessage = error.message || 'API request failed';
        const errorCode = error.code || '';
        const errorType = error.type || '';

        // Return appropriate status code based on error type
        if (status === 403 || errorCode === 'model_not_found') {
          return res.status(403).json({
            error: errorMessage,
            details: [
              `Model '${selectedModel}' is not available for your API key.`,
              errorType === 'image_generation_user_error'
                ? 'Please check your OpenAI project settings to enable this model.'
                : 'Please verify your API key has access to this model.',
            ],
            code: errorCode,
            type: errorType,
          });
        }

        if (status === 401) {
          return res.status(401).json({
            error: 'Authentication failed',
            details: [errorMessage, 'Please check your API key.'],
          });
        }

        if (status === 400) {
          return res.status(400).json({
            error: 'Invalid request',
            details: [errorMessage],
          });
        }

        if (status === 429) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            details: [errorMessage, 'Please try again later.'],
          });
        }

        // For other status codes from OpenAI, preserve them
        return res.status(status).json({
          error: errorMessage,
          details: errorCode ? [`${errorCode}: ${errorMessage}`] : [errorMessage],
        });
      }

      // Generic error fallback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to generate image',
        details: [errorMessage],
      });
    }
  }
);

export default router;
