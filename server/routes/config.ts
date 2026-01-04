import { Router, Request, Response } from 'express';
import { getServerConfig } from '../lib/config';
import type { ConfigApiResponse, ConfigApiErrorResponse } from '../../types';

const router = Router();

// GET /api/config - Returns server configuration
router.get('/', (req: Request, res: Response<ConfigApiResponse | ConfigApiErrorResponse>) => {
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
    availableModels: config.availableModels,
    baseURL: config.baseURL
  } as ConfigApiResponse);
});

export default router;
