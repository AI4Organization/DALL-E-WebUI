import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerConfig } from '../../lib/config';
import type { ConfigApiResponse, ConfigApiErrorResponse } from '../../types';

type ConfigResponse = ConfigApiResponse | ConfigApiErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfigResponse>
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as ConfigApiErrorResponse);
  }

  const config = getServerConfig();

  // If config is invalid, return 500 with error details
  if (!config.isValid) {
    return res.status(500).json({
      error: 'Server configuration error',
      details: config.errors
    } as ConfigApiErrorResponse);
  }

  // Return public-safe configuration
  res.status(200).json({
    model: config.model,
    availableModels: config.availableModels,
    baseURL: config.baseURL
  } as ConfigApiResponse);
}
