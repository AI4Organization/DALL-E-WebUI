import { OpenAI } from 'openai';
import { validateModelForBaseURL, validateStyleForModel } from '../../lib/validation.js';

export default async function handler(req, res) {
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
  const modelValidation = validateModelForBaseURL(selectedModel, baseURL);
  if (!modelValidation.valid) {
    return res.status(400).json({ error: modelValidation.error });
  }

  // Build request parameters
  const requestParams = {
    prompt,
    n: parseInt(n),
    size,
    model: selectedModel,
    quality,
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
    const styleValidation = validateStyleForModel(style, selectedModel);
    if (!styleValidation.valid) {
      return res.status(400).json({ error: styleValidation.error });
    }
    requestParams.style = style;
  }

  try {
    const response = await openai.images.generate(requestParams);
    console.log(response.data);
    res.status(200).json({ result: response.data });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      details: [error.message]
    });
  }
}
