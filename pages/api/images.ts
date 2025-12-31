import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';
import { validateModelForBaseURL, validateStyleForModel } from '../../lib/validation';
import type {
  ImagesApiResponse,
  ImageQuality,
  ImageSize,
  ImageStyle,
} from '../../types';

type ImagesResponse = ImagesApiResponse | { error: string; details?: string[] };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ImagesResponse>
): Promise<void> {
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

  // Build request parameters
  const requestParams: {
    prompt: string;
    n: number;
    size: ImageSize;
    model: string;
    quality: ImageQuality;
    style?: ImageStyle;
  } = {
    prompt: prompt as string,
    n: parseInt(n as string, 4),
    size: size as ImageSize,
    model: selectedModel as string,
    quality: quality as ImageQuality,
  };

  // Only add style parameter for dall-e-3
  if (selectedModel === 'dall-e-3') {
    // Validate style for dall-e-3
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
    requestParams.style = style as ImageStyle;
  }

  try {
    const response = await openai.images.generate(requestParams);
    console.log(response.data);
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
