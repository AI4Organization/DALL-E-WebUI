import { Router, Request, Response } from 'express';
import { OpenAI } from 'openai';
import { validateModelForBaseURL, validateStyleForModel } from '../lib/validation';
import type {
  ImagesApiResponse,
  ImageQuality,
  ImageSize,
  ImageStyle,
  OpenAIImageResult,
} from '../../types';

const router = Router();

// POST /api/images - Handles DALL-E image generation
router.post('/', async (req: Request, res: Response<ImagesApiResponse | { error: string; details?: string[] }>) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

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

  // Parse n (number of images)
  const requestedN = parseInt(n as string, 10);

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

  // DALL-E 3 only supports n=1, so we need to make multiple calls if n > 1
  if (selectedModel === 'dall-e-3') {
    try {
      const results: OpenAIImageResult[] = [];

      // Make multiple API calls, one for each image
      for (let i = 0; i < requestedN; i++) {
        const requestParams = {
          prompt: prompt as string,
          n: 1, // DALL-E 3 only supports n=1
          size: size as ImageSize,
          model: selectedModel as string,
          quality: quality as ImageQuality,
          style: style as ImageStyle,
        };

        const response = await openai.images.generate(requestParams);

        if (response.data && response.data.length > 0) {
          results.push(...response.data);
        }
      }

      res.status(200).json({ result: results });
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        error: 'Failed to generate image',
        details: [errorMessage]
      });
    }
  } else {
    // DALL-E 2 and other models support n > 1 in a single call
    const requestParams: {
      prompt: string;
      n: number;
      size: ImageSize;
      model: string;
      quality?: ImageQuality;
    } = {
      prompt: prompt as string,
      n: requestedN,
      size: size as ImageSize,
      model: selectedModel as string,
    };

    // DALL-E 2 doesn't support quality parameter
    if (selectedModel !== 'dall-e-2') {
      requestParams.quality = quality as ImageQuality;
    }

    try {
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
  }
});

export default router;
