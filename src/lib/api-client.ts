import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * ApiError - Custom error class for API errors
 *
 * Provides structured error information including:
 * - HTTP status code
 * - Error message
 * - Detailed error descriptions
 * - Request ID for tracing
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: string[],
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Check if the error is a network/connection error
   */
  isNetworkError(): boolean {
    return this.statusCode === 0 || !this.statusCode;
  }

  /**
   * Check if the error is a retryable server error
   */
  isRetryable(): boolean {
    return this.statusCode === 408 || // Request Timeout
      this.statusCode === 429 || // Too Many Requests
      this.statusCode >= 500; // Server errors (5xx)
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    if (this.isNetworkError()) {
      return 'Network error. Please check your connection and try again.';
    }

    switch (this.statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please check your API key.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Request timeout. Please try again.';
      default:
        return this.details && this.details.length > 0
          ? this.details.join('. ')
          : this.message;
    }
  }
}

/**
 * ApiClientOptions - Configuration options for the API client
 */
export interface ApiClientOptions {
  /** Base URL for API requests */
  baseURL: string;
  /** Request timeout in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Enable retry with exponential backoff (default: true) */
  enableRetry?: boolean;
}

/**
 * Internal request config with retry metadata
 */
interface RetryableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

/**
 * createApiClient - Creates a configured axios instance with error handling
 *
 * Features:
 * - Request ID generation for tracing
 * - Automatic error transformation to ApiError
 * - Configurable timeout
 * - Retry logic with exponential backoff
 * - Request/response interceptors
 */
export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const {
    baseURL,
    timeout = 120000, // 2 minutes
    maxRetries = 3,
    enableRetry = true,
  } = options;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add request ID
  client.interceptors.request.use(
    (config: RetryableAxiosRequestConfig) => {
      // Generate unique request ID for tracing
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      config.headers = config.headers || {};
      config.headers['X-Request-ID'] = requestId;

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Transform errors to ApiError
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as RetryableAxiosRequestConfig;

      // Check if we should retry
      if (
        enableRetry &&
        originalRequest &&
        !originalRequest._retry &&
        error.response &&
        [408, 429, 500, 502, 503, 504].includes(error.response.status)
      ) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

        if (originalRequest._retryCount <= maxRetries) {
          // Exponential backoff: 2^retryCount * 1000ms
          const backoffDelay = Math.pow(2, originalRequest._retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffDelay));

          return client(originalRequest);
        }
      }

      // Transform error to ApiError
      if (error.response) {
        // Server responded with error status
        const { status, data } = error.response;
        const errorMessage = (data as { error?: string })?.error || 'API request failed';
        const errorDetails = (data as { details?: string[] })?.details;
        const requestId = error.response.headers['x-request-id'];

        throw new ApiError(
          status,
          errorMessage,
          errorDetails,
          requestId
        );
      } else if (error.request) {
        // Request was made but no response received
        throw new ApiError(
          0,
          'No response received from server',
          ['Please check your network connection and try again.']
        );
      } else {
        // Error in setting up the request
        throw new ApiError(
          0,
          error.message || 'Failed to make request',
          error.cause ? [String(error.cause)] : undefined
        );
      }
    }
  );

  return client;
}

/**
 * Get the API base URL from environment or default
 */
export function getApiBaseUrl(): string {
  // In development, use empty string to leverage Rsbuild proxy
  // In production, use the actual backend URL
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    return '';
  }

  if (typeof process !== 'undefined' && process.env?.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }

  return 'http://localhost:3001';
}

/**
 * Singleton API client instance
 * Created on first import and reused for all requests
 */
export const apiClient = createApiClient({
  baseURL: getApiBaseUrl(),
  timeout: 120000, // 2 minutes
  maxRetries: 3,
  enableRetry: true,
});
