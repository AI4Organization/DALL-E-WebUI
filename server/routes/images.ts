import { Router, Request, Response } from 'express';

import type {
  ImagesApiResponse,
  ImagesApiErrorResponse,
  ImageSize,
  ImageStyle,
  ImageQuality,
  GPTImageQuality,
  ImageOutputFormat,
  GPTImageBackground,
} from '../../types';
import openai from '../lib/openai-client';
import { validateModelForBaseURL, validateStyleForModel, validateGPTImage15Params, validateDALLE2Params, getPromptLimitForModel } from '../lib/validation';

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
router.post('/', async (req: Request, res: Response<ImagesApiResponse | ImagesApiErrorResponse>) => {
  const {
    p: prompt,
    n,
    s: size,
    q: quality,
    st: style,
    m: model,
    of: output_format,
    bg: background
  } = req.query;

  // Validate required parameters
  if (!prompt || !n || !size) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: ['prompt (p), number (n), and size (s) are required']
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
      details: [`Prompt exceeds ${promptLimit} character limit for ${selectedModel}`]
    });
  }

  // Validate style for DALL-E 3 only
  if (selectedModel === 'dall-e-3') {
    if (!style) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: ['style (st) is required for DALL-E 3']
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
        details: gptImageValidation.errors
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
        details: dalle2Validation.errors
      });
    }
  }

  try {
    // Build request parameters based on model
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

    const response = await openai.images.generate(requestParams);

    if (!response.data) {
      return res.status(500).json({
        error: 'Failed to generate image',
        details: ['No data returned from API']
      });
    }

    res.status(200).json({ result: response.data });
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
              : 'Please verify your API key has access to this model.'
          ],
          code: errorCode,
          type: errorType
        });
      }

      if (status === 401) {
        return res.status(401).json({
          error: 'Authentication failed',
          details: [errorMessage, 'Please check your API key.']
        });
      }

      if (status === 400) {
        return res.status(400).json({
          error: 'Invalid request',
          details: [errorMessage]
        });
      }

      if (status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          details: [errorMessage, 'Please try again later.']
        });
      }

      // For other status codes from OpenAI, preserve them
      return res.status(status).json({
        error: errorMessage,
        details: errorCode ? [`${errorCode}: ${errorMessage}`] : [errorMessage]
      });
    }

    // Generic error fallback
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to generate image',
      details: [errorMessage]
    });
  }
});

export default router;
