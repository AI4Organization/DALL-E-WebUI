import { Router, Request, Response } from 'express';
import openai from '../lib/openai-client';
import { validateModelForBaseURL, validateStyleForModel } from '../lib/validation';
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
 * Since the frontend now handles parallel execution with n=1 requests,
 * this endpoint always generates a single image per request.
 */
router.post('/', async (req: Request, res: Response<ImagesApiResponse | { error: string; details?: string[] }>) => {
  const { p: prompt, n, s: size, q: quality, st: style, m: model } = req.query;

  // Validate required parameters
  if (!prompt || !n || !size || !quality) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: ['prompt (p), number (n), size (s), and quality (q) are required']
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

  // Validate style for dall-e-3
  if (selectedModel === 'dall-e-3') {
    if (!style) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: ['style (st) is required for dall-e-3']
      });
    }
    const styleValidation = validateStyleForModel(style as string, selectedModel as string);
    if (!styleValidation.valid) {
      return res.status(400).json({ error: styleValidation.error ?? 'Invalid style' });
    }
  }

  try {
    const requestParams: {
      prompt: string;
      n: number;
      size: ImageSize;
      model: string;
      quality?: ImageQuality;
      style?: ImageStyle;
    } = {
      prompt: prompt as string,
      n: 1, // Frontend handles parallel execution with n=1
      size: size as ImageSize,
      model: selectedModel as string,
    };

    // Only add quality for non-DALL-E 2 models
    if (selectedModel !== 'dall-e-2') {
      requestParams.quality = quality as ImageQuality;
    }

    // Add style for DALL-E 3
    if (selectedModel === 'dall-e-3') {
      requestParams.style = style as ImageStyle;
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
