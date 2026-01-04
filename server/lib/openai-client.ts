/**
 * Singleton OpenAI client instance for reuse across requests.
 *
 * This improves performance by:
 * - Reusing HTTP connections (keep-alive)
 * - Avoiding per-request initialization overhead
 * - Proper connection pooling via Node.js fetch (automatic)
 *
 * Note: The OpenAI SDK v6.x is inherently async-first and handles
 * concurrent requests properly. Connection pooling is managed automatically
 * by Node.js's built-in fetch implementation.
 */

import { OpenAI } from 'openai';

/**
 * Singleton OpenAI client configured for image generation.
 * - 60 second timeout (images can take longer than chat)
 * - 2 automatic retries for transient errors
 * - Uses environment variables for API key and base URL
 * - All methods return Promises and are safe for concurrent use
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  timeout: 60000, // 60 seconds for image generation
  maxRetries: 2,
});

export default openai;
