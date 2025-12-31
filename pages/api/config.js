import { getServerConfig } from '../../lib/config.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = getServerConfig();

  // If config is invalid, return 500 with error details
  if (!config.isValid) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: config.errors
    });
  }

  // Return public-safe configuration
  res.status(200).json({
    model: config.model,
    availableModels: config.availableModels,
    baseURL: config.baseURL
  });
}
