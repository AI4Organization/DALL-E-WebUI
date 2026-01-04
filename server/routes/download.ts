import { Router, Request, Response } from 'express';
import axios from 'axios';
import sharp from 'sharp';
import type { DownloadApiResponse, DownloadApiRequestBody, DownloadFormat } from '../../types';

const router = Router();

const VALID_FORMATS: DownloadFormat[] = ['png', 'jpg', 'jpeg', 'gif', 'avif', 'webp'];

function isValidFormat(format: string): format is DownloadFormat {
  return VALID_FORMATS.includes(format as DownloadFormat);
}

async function convertImage(
  buffer: Buffer,
  format: DownloadFormat
): Promise<{ data: Buffer; mimeType: string }> {
  let sharpInstance = sharp(buffer);

  switch (format) {
    case 'png':
      return {
        data: await sharpInstance.png().toBuffer(),
        mimeType: 'image/png',
      };
    case 'jpg':
    case 'jpeg':
      return {
        data: await sharpInstance.jpeg().toBuffer(),
        mimeType: 'image/jpeg',
      };
    case 'gif':
      return {
        data: await sharpInstance.gif().toBuffer(),
        mimeType: 'image/gif',
      };
    case 'avif':
      return {
        data: await sharpInstance.avif().toBuffer(),
        mimeType: 'image/avif',
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
  const { url, type } = req.body as DownloadApiRequestBody;

  if (!url || !type) {
    return res.status(400).json({ error: 'Missing required parameters: url and type' });
  }

  if (!isValidFormat(type)) {
    return res.status(400).json({
      error: `Invalid format. Valid formats: ${VALID_FORMATS.join(', ')}`,
    });
  }

  try {
    const response = await axios.get<Buffer>(url, {
      responseType: 'arraybuffer',
    });

    const { data, mimeType } = await convertImage(response.data, type);
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
