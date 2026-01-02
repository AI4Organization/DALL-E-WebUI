import { Router, Request, Response } from 'express';
import openai from '../lib/openai-client';
import { validateModelForBaseURL, validateStyleForModel, validateGPTImage15Params, getPromptLimitForModel } from '../lib/validation';
import type {
  ImagesApiResponse,
  ImageQuality,
  ImageSize,
  ImageStyle,
} from '../../types';

const router = Router();

/**
 * POST /api/images - Handles DALL-E image generation
 *
 * Supports DALL-E 3 and GPT Image 1.5 models.
 * Each request generates images based on the model's capabilities.
 */
router.post('/', async (req: Request, res: Response<ImagesApiResponse | { error: string; details?: string[] }>) => {
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

  try {
    // Build request parameters based on model
    // Note: We use 'as any' for dynamic parameters since they differ by model
    // and we're already validating them at runtime
    const requestParams: any = {
      prompt: prompt as string,
      n: Number(n),
      size: size as ImageSize,
      model: selectedModel as string,
    };

    // Add quality parameter (both DALL-E 3 and GPT Image 1.5 support it)
    if (quality) {
      requestParams.quality = quality;
    }

    // Add style for DALL-E 3 only
    if (selectedModel === 'dall-e-3' && style) {
      requestParams.style = style as ImageStyle;
    }

    // Add output_format for GPT Image 1.5
    if (selectedModel === 'gpt-image-1.5' && output_format) {
      requestParams.output_format = output_format;
    }

    // Add background for GPT Image 1.5
    if (selectedModel === 'gpt-image-1.5' && background) {
      requestParams.background = background;
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to generate image',
      details: [errorMessage]
    });
  }
});

export default router;
