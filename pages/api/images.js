import { OpenAI } from 'openai';

export default async function handler(req, res) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  const { p: prompt, n, s: size, q: quality, st: style } = req.query;
  if (!prompt || !n || !size || !quality || !style) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const response = await openai.images.generate({
    prompt,
    n: parseInt(n),
    size,
    model: 'dall-e-3',
    quality,
    style,
  });

  console.log(response.data);
  res.status(200).json({ result: response.data });
}
