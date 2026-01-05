import axios from 'axios';
import { Router, Request, Response } from 'express';
import pLimit from 'p-limit';
import sharp from 'sharp';

import type { DownloadApiResponse, DownloadApiRequestBody, ImageOutputFormat } from '../../types';

const router = Router();

const VALID_FORMATS: ImageOutputFormat[] = ['png', 'jpeg', 'webp'];

// Concurrency limit for parallel Sharp processing
// Utilizes libuv's thread pool for efficient parallel image processing
const sharpLimit = pLimit(4);

function isValidFormat(format: string): format is ImageOutputFormat {
  return VALID_FORMATS.includes(format as ImageOutputFormat);
}

/**
 * Converts an image buffer to the specified format using Sharp
 * Wraps the conversion in a concurrency-limited task for parallel processing
 *
 * @param buffer - Image buffer to convert
 * @param format - Target format
 * @returns Converted buffer and MIME type
 */
async function convertImage(
  buffer: Buffer,
  format: ImageOutputFormat
): Promise<{ data: Buffer; mimeType: string }> {
  // Use concurrency limit for parallel Sharp processing
  return sharpLimit(() => doConvertImage(buffer, format));
}

/**
 * Actual Sharp conversion implementation (called within concurrency limit)
 */
async function doConvertImage(
  buffer: Buffer,
  format: ImageOutputFormat
): Promise<{ data: Buffer; mimeType: string }> {
  const sharpInstance = sharp(buffer);

  switch (format) {
    case 'png':
      return {
        data: await sharpInstance.png().toBuffer(),
        mimeType: 'image/png',
      };
    case 'jpeg':
      return {
        data: await sharpInstance.jpeg().toBuffer(),
        mimeType: 'image/jpeg',
      };
    case 'webp':
    default:
      return {
        data: await sharpInstance.webp().toBuffer(),
        mimeType: 'image/webp',
      };
  }
}

// POST /api/download - Handles image format conversion
router.post('/', async (req: Request, res: Response<DownloadApiResponse | { error: string }>) => {
  // Accept both old ({ url, type }) and new ({ imageUrl, format }) parameter names
  const { url, type, imageUrl, format } = req.body as DownloadApiRequestBody & { imageUrl?: string; format?: string };

  // Use imageUrl/format if provided, otherwise fall back to url/type
  const finalUrl = imageUrl || url;
  const finalFormat = (format || type) as ImageOutputFormat;

  if (!finalUrl || !finalFormat) {
    return res.status(400).json({ error: 'Missing required parameters: imageUrl (or url) and format (or type)' });
  }

  if (!isValidFormat(finalFormat)) {
    return res.status(400).json({
      error: `Invalid format. Valid formats: ${VALID_FORMATS.join(', ')}`,
    });
  }

  try {
    const response = await axios.get<Buffer>(finalUrl, {
      responseType: 'arraybuffer',
    });

    const { data, mimeType } = await convertImage(response.data, finalFormat);
    const base64 = data.toString('base64');

    res.status(200).json({
      result: `data:${mimeType};base64,${base64}`,
    });
  } catch (error) {
    console.error('Download/conversion error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to process image: ${errorMessage}` });
  }
});

export default router;
