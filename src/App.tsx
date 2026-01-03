import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Spin,
  Space,
  Row,
  Col,
  Modal,
  Tooltip,
  Slider,
} from 'antd';
import {
  LoadingOutlined,
  DownloadOutlined,
  PictureOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  StarOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CompressOutlined,
  ExpandOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import pLimit from 'p-limit';
import axios from 'axios';
import { toast } from 'sonner';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './lib/theme';
import type {
  OpenAIImageResult,
  ModelOption,
  ImageQuality,
  ImageSize,
  ImageStyle,
  DownloadFormat,
  ImageGenerationItem,
  ImageGenerationStatus,
  GPTImageQuality,
  GPTImageOutputFormat,
  ImageOutputFormat,
  GPTImageBackground,
} from '../types';
import { DALL_E_2_SIZES, DALL_E_3_SIZES, GPT_IMAGE_1_5_SIZES } from '../types';

const { TextArea } = Input;

// Get API base URL from definePlugin in rsbuild.config.ts
declare const process: { env: { API_BASE_URL: string } };

// ============ Constants ============
const DALL_E_3_QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'hd', label: 'HD' },
];

const DALL_E_2_QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'standard', label: 'Standard' },
];

const GPT_IMAGE_1_5_QUALITY_OPTIONS: { value: GPTImageQuality; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const getQualityOptions = (modelName: string | null): { value: ImageQuality | GPTImageQuality; label: string }[] => {
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_QUALITY_OPTIONS;
  }
  if (modelName === 'dall-e-2') {
    return DALL_E_2_QUALITY_OPTIONS;
  }
  return DALL_E_3_QUALITY_OPTIONS;
};

const getSizeOptions = (modelName: string | null): { value: ImageSize; label: string }[] => {
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_SIZES.map((size) => ({
      value: size,
      label: size === 'auto' ? 'Auto' :
             size === '1024x1024' ? '1024 x 1024 (Square)' :
             size === '1536x1024' ? '1536 x 1024 (Landscape)' :
             size === '1024x1536' ? '1024 x 1536 (Portrait)' :
             size.replace('x', ' x '),
    }));
  }
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.map((size) => ({
      value: size,
      label: size === '256x256' ? '256 x 256' :
             size === '512x512' ? '512 x 512' :
             size === '1024x1024' ? '1024 x 1024 (Square)' :
             size.replace('x', ' x '),
    }));
  }
  return DALL_E_3_SIZES.map((size) => ({
    value: size,
    label: size === '1024x1024' ? '1024 x 1024 (Square)' :
           size === '1024x1792' ? '1024 x 1792 (Portrait)' :
           size === '1792x1024' ? '1792 x 1024 (Landscape)' :
           size.replace('x', ' x '),
  }));
};

const isSizeValidForModel = (size: ImageSize, modelName: string | null): boolean => {
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_SIZES.includes(size);
  }
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.includes(size);
  }
  return DALL_E_3_SIZES.includes(size);
};

const getDefaultSizeForModel = (modelName: string | null): ImageSize => {
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_SIZES[2]; // '1536x1024' (Landscape)
  }
  if (modelName === 'dall-e-3') {
    return DALL_E_3_SIZES[2]; // '1792x1024' (Landscape)
  }
  // DALL-E 2 defaults to largest square (only square sizes available)
  return DALL_E_2_SIZES[2]; // '1024x1024'
};

// Helper function to get prompt limit for model
const getPromptLimit = (modelName: string | null): number => {
  if (modelName === 'gpt-image-1.5') return 32000;
  if (modelName === 'dall-e-3') return 4000;
  if (modelName === 'dall-e-2') return 1000;
  return 4000; // Default
};

// Helper function to get max images for model
// Note: For DALL-E 3, we allow up to 10 images but handle via parallel requests
// since the API only supports n=1 per request
const getMaxImages = (modelName: string | null): number => {
  if (modelName === 'gpt-image-1.5') return 10;
  if (modelName === 'dall-e-3') return 10; // Allow up to 10 via parallel requests
  if (modelName === 'dall-e-2') return 10;
  return 10; // Default
};

const STYLE_OPTIONS: { value: ImageStyle; label: string }[] = [
  { value: 'vivid', label: 'Vivid' },
  { value: 'natural', label: 'Natural' },
];

// Universal output format options for all models (API-supported formats only)
const OUTPUT_FORMAT_OPTIONS: { value: ImageOutputFormat; label: string }[] = [
  { value: 'webp', label: 'WebP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
];

// GPT Image 1.5 background options
const GPT_IMAGE_1_5_BACKGROUND_OPTIONS: { value: GPTImageBackground; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'transparent', label: 'Transparent' },
  { value: 'opaque', label: 'Opaque' },
];

// ============ Animation Variants ============
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
  },
};

const blobVariants = {
  animate: {
    scale: [1, 1.2, 1],
    rotate: [0, 90, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

// ============ Helper Functions ============
// Get displayable URL from OpenAI image result (handles both url and b64_json formats)
const getImageDisplayUrl = (result: OpenAIImageResult): string | undefined => {
  if (result.url) return result.url;
  if (result.b64_json) {
    // GPT Image 1.5 returns base64-encoded images
    // Default to PNG for b64_json as it's the most common format
    return `data:image/png;base64,${result.b64_json}`;
  }
  return undefined;
};

// Check if result has a downloadable image source
const hasDownloadableImage = (result: OpenAIImageResult): boolean => {
  return !!result.url || !!result.b64_json;
};

// Extract user-friendly error message from API error response
const getApiErrorMessage = (err: unknown): string => {
  // Check if it's an axios error with response data
  const axiosError = err as { response?: { data?: { error?: string; details?: string[] } } };
  if (axiosError.response?.data) {
    const { error, details } = axiosError.response.data;

    // If we have details array, join them for user-friendly message
    if (details && details.length > 0) {
      return details.join('. ');
    }

    // Fall back to error message
    if (error) {
      return error;
    }
  }

  // Fall back to standard error message
  return err instanceof Error ? err.message : 'Unknown error';
};

// ============ Floating Blob Component ============
const FloatingBlob: React.FC<{ className?: string; color: string; delay?: number }> = ({ className, color, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl ${className}`}
    style={{
      background: color,
      opacity: 'var(--blob-opacity)'
    }}
    variants={blobVariants}
    animate="animate"
    initial={{ scale: 1, rotate: 0 }}
    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' as const, delay }}
  />
);

// ============ Main Component ============
export default function App(): React.ReactElement {
  const { theme } = useTheme();

  // Set document title
  useEffect(() => {
    document.title = 'GenAI Studio - Create Images with AI';
  }, []);

  // ============ State ============
  const [prompt, setPrompt] = useState<string>('');
  const [textAreaHeight, setTextAreaHeight] = useState<number>(160);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const autoResizeTextArea = useCallback(() => {
    const textArea = textAreaRef.current;
    if (textArea && textArea.style) {
      textArea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textArea.scrollHeight, 160), 400);
      textArea.style.height = `${newHeight}px`;
      setTextAreaHeight(newHeight);
    }
  }, []);

  // Update textarea height when prompt changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rafId = requestAnimationFrame(() => {
      autoResizeTextArea();
    });
    return () => cancelAnimationFrame(rafId);
  }, [prompt, autoResizeTextArea]);

  const [number, setNumber] = useState<number>(4);
  const [generationItems, setGenerationItems] = useState<ImageGenerationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isGenerationInProgress, setIsGenerationInProgress] = useState<boolean>(false);

  const [model, setModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [configLoading, setConfigLoading] = useState<boolean>(true);

  const [quality, setQuality] = useState<ImageQuality | GPTImageQuality>('standard');
  const [size, setSize] = useState<ImageSize>('1024x1024');
  const [style, setStyle] = useState<ImageStyle>('vivid');
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat>('webp');
  const [background, setBackground] = useState<GPTImageBackground>('auto');

  // Image preview state
  const [previewImage, setPreviewImage] = useState<{ url: string; index: number } | null>(null);
  const [navigationImages, setNavigationImages] = useState<OpenAIImageResult[]>([]);
  const [currentNavIndex, setCurrentNavIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(100);  // 50% to 500%
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState<'contain' | 'actual' | 'fill'>('contain');

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // ============ Effects ============
  // Reset size to model's default when model changes
  useEffect(() => {
    if (model) {
      setSize(getDefaultSizeForModel(model));
    }
  }, [model]);

  // Fallback: if current size becomes invalid for current model, reset to default
  useEffect(() => {
    if (model && !isSizeValidForModel(size, model)) {
      setSize(getDefaultSizeForModel(model));
    }
  }, [model, size]);

  useEffect(() => {
    if (model === 'gpt-image-1.5') {
      setQuality('auto');
    } else if (model === 'dall-e-2') {
      setQuality('standard');
    } else if (model === 'dall-e-3') {
      setQuality('standard');
    }
  }, [model]);

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      try {
        const res = await axios.get(`${process.env.API_BASE_URL}/api/config`);
        setAvailableModels(res.data.availableModels);
        setConfigLoading(false);
      } catch (err) {
        const axiosError = err as { response?: { data?: { error: string; details?: string[] }; status?: number } };
        if (axiosError.response?.status === 500 && axiosError.response.data) {
          const errorData = axiosError.response.data;
          toast.error('Server Configuration Error', {
            description: `${errorData.error}${errorData.details ? '. ' + errorData.details.join(', ') : ''}`,
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            },
          });
        } else {
          toast.error('Failed to connect to server', {
            description: 'Please check if the server is running',
            action: {
              label: 'Retry',
              onClick: () => window.location.reload(),
            },
          });
        }
        setConfigLoading(false);

        // Retry after 2 seconds if connection failed
        if (!axiosError.response?.status) {
          setTimeout(() => {
            fetchConfig();
          }, 2000);
        }
      }
    };

    void fetchConfig();
  }, []);

  // Set default model after availableModels is populated
  useEffect(() => {
    if (!configLoading && availableModels.length > 0 && !model) {
      const defaultModel = availableModels.find((m: ModelOption) => m.value === 'dall-e-3')?.value ?? availableModels[0]?.value ?? null;
      setModel(defaultModel);
    }
  }, [configLoading, availableModels, model]);

  // ============ Handlers ============
  const getImages = useCallback(async (): Promise<void> => {
    let hasErrors = false;

    // Client-side validation
    if (!model) {
      toast.error('No Model Selected', {
        description: 'Please select an AI model to generate images. Choose a model from the "Model" dropdown above.',
      });
      hasErrors = true;
    }

    if (!prompt.trim()) {
      toast.error('Empty Prompt', {
        description: 'Please describe the image you want to create. Enter a detailed description in the "Your Prompt" text area.',
      });
      hasErrors = true;
    } else if (prompt.trim().length < 10) {
      toast.warning('Prompt Too Short', {
        description: 'Your prompt is quite short. More detailed prompts usually produce better results. Try describing your vision in more detail - include style, mood, objects, colors, etc.',
      });
    }

    // Character count validation (dynamic based on model)
    const charCount = prompt.length;
    const promptLimit = getPromptLimit(model);
    if (charCount > promptLimit) {
      toast.error('Prompt Too Long', {
        description: `Your prompt has ${charCount} characters, but the maximum is ${promptLimit} characters for ${model}. Please shorten your prompt to ${promptLimit} characters or fewer.`,
      });
      hasErrors = true;
    }

    // Validate number of images based on model
    const maxImages = getMaxImages(model);
    if (number < 1) {
      toast.error('Invalid Number', {
        description: `Number of images must be at least 1. Set the number between 1 and ${maxImages}.`,
      });
      hasErrors = true;
    }

    if (number > maxImages) {
      toast.error('Too Many Images', {
        description: `${model} supports a maximum of ${maxImages} image${maxImages !== 1 ? 's' : ''} per request. Reduce the number of images to ${maxImages} or less.`,
      });
      hasErrors = true;
    }

    // Size validation based on model
    if (model === 'dall-e-3' && !DALL_E_3_SIZES.includes(size)) {
      toast.error('Invalid Size for DALL-E 3', {
        description: `The size "${size}" is not supported by DALL-E 3. Choose a supported size: 1024x1024, 1792x1024, or 1024x1792.`,
      });
      hasErrors = true;
    }

    if (model === 'gpt-image-1.5' && !GPT_IMAGE_1_5_SIZES.includes(size)) {
      toast.error('Invalid Size for GPT Image 1.5', {
        description: `The size "${size}" is not supported by GPT Image 1.5. Choose a supported size: auto, 1024x1024, 1536x1024, or 1024x1536.`,
      });
      hasErrors = true;
    }

    // If there are errors, show them and stop
    if (hasErrors) {
      return;
    }

    // Model-specific info messages (show after errors check so they don't block)
    if (model === 'dall-e-3' && number > 1) {
      toast.info(`Multiple Images with DALL-E 3`, {
        description: `You requested ${number} images. We'll generate them in parallel and show each one as it completes. Images will appear progressively as they finish - no need to wait for all of them!`,
      });
    }

    if (model === 'gpt-image-1.5' && number > 1) {
      toast.info(`Multiple Images with GPT Image 1.5`, {
        description: `You requested ${number} images. We'll generate them in a single request and show all results together. GPT Image 1.5 supports multiple images in one request for faster generation.`,
      });
    }

    // Clear previous results and set loading state
    setGenerationItems([]);
    setLoading(true);
    setIsGenerationInProgress(true);

    // Initialize generation items for parallel execution
    const initialItems: ImageGenerationItem[] = Array.from({ length: number }, (_, i) => ({
      id: i,
      status: 'pending' as ImageGenerationStatus,
    }));
    setGenerationItems(initialItems);

    // Helper function to update a single generation item
    const updateItem = (id: number, updates: Partial<ImageGenerationItem>): void => {
      setGenerationItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
    };

    // Single image generation function
    const generateSingleImage = async (id: number): Promise<void> => {
      // Update status to loading
      updateItem(id, { status: 'loading' });

      const queryParams = new URLSearchParams({
        p: encodeURIComponent(prompt),
        n: '1',
        s: size,
        m: model ?? 'dall-e-3',
      });

      // Add quality for DALL-E 3 and GPT Image 1.5 (DALL-E 2 doesn't support it)
      if (model === 'dall-e-3' || model === 'gpt-image-1.5') {
        queryParams.append('q', quality);
      }

      if (model === 'dall-e-3') {
        queryParams.append('st', style);
      }

      if (model === 'gpt-image-1.5') {
        queryParams.append('of', outputFormat);
        queryParams.append('bg', background);
      }

      try {
        const res = await axios.post(`${process.env.API_BASE_URL}/api/images?${queryParams}`);
        const result = res.data.result?.[0];

        if (result) {
          updateItem(id, { status: 'success', result });
          toast.success(`Image ${id + 1} of ${number} ready!`);
        } else {
          throw new Error('No image data returned');
        }
      } catch (err) {
        console.error(`Image ${id + 1} generation error:`, err);
        const errorMessage = getApiErrorMessage(err);
        updateItem(id, { status: 'error', error: errorMessage });
        toast.error(`Image ${id + 1} failed: ${errorMessage}`);
      }
    };

    // Concurrency limit: 4 parallel requests
    const limit = pLimit(4);

    try {
      // For GPT Image 1.5 with n > 1, we can use a single request
      // For DALL-E 3, use parallel execution (one request per image)
      if (model === 'gpt-image-1.5' && number > 1) {
        // GPT Image 1.5 supports n > 1 in a single request
        const queryParams = new URLSearchParams({
          p: encodeURIComponent(prompt),
          n: String(number),
          q: quality,
          s: size,
          m: 'gpt-image-1.5',
          of: outputFormat,
          bg: background,
        });

        const res = await axios.post(`${process.env.API_BASE_URL}/api/images?${queryParams}`);
        const results = res.data.result || [];

        // Update all items with results
        const updatedItems = results.map((result: OpenAIImageResult, i: number) => ({
          id: i,
          status: 'success' as ImageGenerationStatus,
          result,
        }));

        setGenerationItems(updatedItems);
        toast.success(`${results.length} image${results.length !== 1 ? 's' : ''} generated!`);
      } else {
        // DALL-E 3 and DALL-E 2: Make parallel requests (one per image)
        const tasks = Array.from({ length: number }, (_, i) =>
          limit(() => generateSingleImage(i))
        );

        await Promise.all(tasks);
      }
    } catch (err) {
      console.error('Batch generation error:', err);
      const errorMessage = getApiErrorMessage(err);
      toast.error(`Generation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
      setIsGenerationInProgress(false);
    }
  }, [model, prompt, number, quality, size, style, outputFormat, background]);

  const download = useCallback(async (imageUrl: string): Promise<void> => {
    try {
      // Check if it's a base64 data URL (from GPT Image 1.5)
      if (imageUrl.startsWith('data:')) {
        // For GPT Image 1.5, the API returns the image in the selected format
        // Download directly in browser
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${prompt}.${outputFormat}`;
        link.click();
        toast.success('Image downloaded successfully');
      } else {
        // For DALL-E 2/3 (URL images), use backend for format conversion
        const res = await axios.post(`${process.env.API_BASE_URL}/api/download`, { url: imageUrl, type: outputFormat as DownloadFormat });
        const link = document.createElement('a');
        link.href = res.data.result;
        link.download = `${prompt}.${outputFormat}`;
        link.click();
        toast.success('Image downloaded successfully');
      }
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download image');
    }
  }, [prompt, outputFormat]);

  // Retry a single failed image generation
  const retryImage = useCallback(async (id: number): Promise<void> => {
    // Update status to loading
    setGenerationItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'loading' as ImageGenerationStatus, error: undefined } : item
      )
    );

    const queryParams = new URLSearchParams({
      p: encodeURIComponent(prompt),
      n: '1',
      s: size,
      m: model ?? 'dall-e-3',
    });

    // Add quality for DALL-E 3 and GPT Image 1.5 (DALL-E 2 doesn't support it)
    if (model === 'dall-e-3' || model === 'gpt-image-1.5') {
      queryParams.append('q', quality);
    }

    if (model === 'dall-e-3') {
      queryParams.append('st', style);
    }

    if (model === 'gpt-image-1.5') {
      queryParams.append('of', outputFormat);
      queryParams.append('bg', background);
    }

    try {
      const res = await axios.post(`${process.env.API_BASE_URL}/api/images?${queryParams}`);
      const result = res.data.result?.[0];

      if (result) {
        setGenerationItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: 'success' as ImageGenerationStatus, result } : item
          )
        );
        toast.success(`Image ${id + 1} regenerated successfully!`);
      } else {
        throw new Error('No image data returned');
      }
    } catch (err) {
      console.error(`Image ${id + 1} retry error:`, err);
      const errorMessage = getApiErrorMessage(err);
      setGenerationItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'error' as ImageGenerationStatus, error: errorMessage } : item
        )
      );
      toast.error(`Image ${id + 1} retry failed: ${errorMessage}`);
    }
  }, [prompt, quality, size, model, style, outputFormat, background]);

  const handleGenerate = (): void => {
    void getImages();
  };

  // ============ Preview Handlers ============
  const openPreview = (clickedResult: OpenAIImageResult, clickedIndex: number): void => {
    // Extract all successfully generated images
    const allSuccessfulImages = generationItems
      .filter(item => item.status === 'success' && item.result)
      .map(item => item.result!);

    // Find the index of the clicked image using a more robust comparison
    const clickedNavIndex = allSuccessfulImages.findIndex(img => {
      // Compare by URL first (for DALL-E 2/3)
      if (img.url && clickedResult.url && img.url === clickedResult.url) {
        return true;
      }
      // Compare by b64_json (for GPT Image 1.5)
      if (img.b64_json && clickedResult.b64_json && img.b64_json === clickedResult.b64_json) {
        return true;
      }
      return false;
    });

    // Set all state in the right order
    setNavigationImages(allSuccessfulImages);
    setCurrentNavIndex(clickedNavIndex >= 0 ? clickedNavIndex : 0);

    // Set previewImage with the correct URL from the navigation array
    const targetImage = allSuccessfulImages[clickedNavIndex >= 0 ? clickedNavIndex : 0];
    setPreviewImage({
      url: getImageDisplayUrl(targetImage) ?? '',
      index: clickedNavIndex >= 0 ? clickedNavIndex : 0
    });
  };

  const closePreview = (): void => {
    setPreviewImage(null);
    setNavigationImages([]);
    setCurrentNavIndex(0);
  };

  const handlePreviousImage = (): void => {
    if (currentNavIndex > 0) {
      const newIndex = currentNavIndex - 1;
      const prevImage = navigationImages[newIndex];
      setCurrentNavIndex(newIndex);
      setPreviewImage({
        url: getImageDisplayUrl(prevImage) ?? '',
        index: newIndex
      });
    }
  };

  const handleNextImage = (): void => {
    if (currentNavIndex < navigationImages.length - 1) {
      const newIndex = currentNavIndex + 1;
      const nextImage = navigationImages[newIndex];
      setCurrentNavIndex(newIndex);
      setPreviewImage({
        url: getImageDisplayUrl(nextImage) ?? '',
        index: newIndex
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent): void => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    if (touchStart === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePreviousImage();
      }
    }

    setTouchStart(null);
  };

  // ============ Zoom & Pan Handlers ============
  const handleZoomIn = useCallback((): void => {
    setZoomLevel(prev => Math.min(prev + 25, 500));
  }, []);

  const handleZoomOut = useCallback((): void => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  }, []);

  const handleZoomReset = useCallback((): void => {
    setZoomLevel(100);
    setPanPosition({ x: 0, y: 0 });
    setFitMode('contain');
  }, []);

  const handleFitModeChange = useCallback((mode: 'contain' | 'actual' | 'fill'): void => {
    setFitMode(mode);
    if (mode === 'contain') {
      setZoomLevel(100);
      setPanPosition({ x: 0, y: 0 });
    } else if (mode === 'actual') {
      setZoomLevel(100);
      setPanPosition({ x: 0, y: 0 });
    } else if (mode === 'fill') {
      setZoomLevel(100);
      setPanPosition({ x: 0, y: 0 });
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -25 : 25;
      setZoomLevel(prev => Math.min(Math.max(prev + delta, 50), 500));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    if (zoomLevel > 100 || fitMode === 'actual') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [zoomLevel, fitMode, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    if (isDragging) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleFullscreenToggle = useCallback((): void => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Update keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (!previewImage) return;

    // Navigation
    if (e.key === 'Escape') closePreview();
    if (e.key === 'ArrowLeft') handlePreviousImage();
    if (e.key === 'ArrowRight') handleNextImage();

    // Zoom
    if (e.key === '+' || e.key === '=') handleZoomIn();
    if (e.key === '-' || e.key === '_') handleZoomOut();
    if (e.key === '0') handleZoomReset();

    // Fit mode
    if (e.key === 'f') {
      const modes: Array<'contain' | 'actual' | 'fill'> = ['contain', 'actual', 'fill'];
      const currentIdx = modes.indexOf(fitMode);
      handleFitModeChange(modes[(currentIdx + 1) % modes.length]);
    }

    // Fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      handleFullscreenToggle();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [previewImage, currentNavIndex, navigationImages, fitMode, handleZoomIn, handleZoomOut, handleZoomReset, handleFitModeChange, handleFullscreenToggle, handleMouseUp]);

  // ============ Render ============
  return (
    <>
      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <FloatingBlob color="rgba(168, 85, 247, 0.4)" className="w-96 h-96 top-0 left-1/4" delay={0} />
        <FloatingBlob color="rgba(236, 72, 153, 0.3)" className="w-80 h-80 top-1/3 right-1/4" delay={1} />
        <FloatingBlob color="rgba(34, 211, 211, 0.3)" className="w-72 h-72 bottom-1/4 left-1/3" delay={2} />
        <FloatingBlob color="rgba(168, 85, 247, 0.2)" className="w-64 h-64 bottom-0 right-1/3" delay={3} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-background)]/50 to-[var(--color-background)]" />
      </div>

      {/* Main Content */}
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
              <span className="text-white">Create </span>
              <span className="gradient-text">Breathtaking</span>
              <br />
              <span className="text-white">Images with </span>
              <span className="gradient-text">GenAI</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Transform your ideas into stunning visuals with the power of artificial intelligence.
              Simply describe what you imagine, and watch the magic happen.
            </p>
          </motion.div>

          {/* Main Generator Card */}
          <motion.div variants={itemVariants}>
            <div className="glass-card p-8 mb-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-glow flex items-center justify-center">
                  <ThunderboltOutlined className="text-white text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    Image Generator
                  </h2>
                  <p className="text-gray-400 text-sm">Configure your prompt and settings</p>
                </div>
              </div>

              <Space orientation="vertical" size="large" className="w-full">
                {/* Prompt Input with Floating Effect */}
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <PictureOutlined className="text-accent-purple" />
                    Your Prompt
                  </label>
                  <TextArea
                    ref={textAreaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city at sunset, with flying cars and neon lights reflecting off glass buildings..."
                    autoSize={false}
                    maxLength={getPromptLimit(model)}
                    style={{ height: textAreaHeight, overflowY: 'auto' }}
                    className="glass-input !text-base resize-none"
                  />
                  {/* Custom character count display */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-gray-500">
                    <span>{prompt.length} / {getPromptLimit(model)} characters</span>
                    <StarOutlined className="text-accent-cyan ml-2" />
                  </div>
                </motion.div>

                {/* Settings Grid */}
                <Row gutter={[16, 16]}>
                  {/* Model Selection */}
                  <Col xs={24} sm={12} md={6}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Model
                    </label>
                  {configLoading ? (
                    <Select
                      disabled
                      placeholder="Loading models..."
                      className="w-full"
                    />
                  ) : model ? (
                    <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                      <Select
                        value={model}
                        onChange={setModel}
                        options={availableModels}
                        placeholder="Select a model"
                        disabled={isGenerationInProgress}
                        className="w-full"
                        popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                      />
                    </Tooltip>
                  ) : (
                    <Select
                      disabled
                      placeholder="Select a model"
                      className="w-full"
                    />
                  )}
                  </Col>

                  {/* Quality (DALL-E 2, DALL-E 3 and GPT Image 1.5) */}
                  {(model === 'dall-e-2' || model === 'dall-e-3' || model === 'gpt-image-1.5') && (
                    <Col xs={24} sm={12} md={6}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quality
                      </label>
                      <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                        <Select
                          value={quality}
                          onChange={setQuality}
                          options={getQualityOptions(model)}
                          disabled={isGenerationInProgress}
                          className="w-full"
                          popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                        />
                      </Tooltip>
                    </Col>
                  )}

                  {/* Size */}
                  <Col xs={24} sm={12} md={6}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Size
                    </label>
                    <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                      <Select<ImageSize>
                        value={size}
                        onChange={setSize}
                        options={getSizeOptions(model)}
                        disabled={isGenerationInProgress}
                        className="w-full"
                        popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                      />
                    </Tooltip>
                  </Col>

                  {/* Number of Images */}
                  <Col xs={24} sm={12} md={model === 'gpt-image-1.5' ? 6 : 8}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Images
                    </label>
                    <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                      <InputNumber
                        value={number}
                        onChange={(val) => setNumber(val ?? 1)}
                        min={1}
                        max={getMaxImages(model)}
                        disabled={isGenerationInProgress}
                        className="w-full"
                      />
                    </Tooltip>
                  </Col>

                  {/* Style (DALL-E 3 only) */}
                  {model === 'dall-e-3' && (
                    <Col xs={24} sm={12} md={6}>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        Style
                        <Tooltip
                          title={
                            style === 'vivid'
                              ? 'Vivid: Generates hyper-real and dramatic images with intense details'
                              : 'Natural: Produces more natural, less hyper-real looking images'
                          }
                        >
                          <InfoCircleOutlined className="text-accent-cyan cursor-help" />
                        </Tooltip>
                      </label>
                      <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                        <Select<ImageStyle>
                          value={style}
                          onChange={setStyle}
                          options={STYLE_OPTIONS}
                          disabled={isGenerationInProgress}
                          className="w-full"
                          popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                        />
                      </Tooltip>
                    </Col>
                  )}

                  {/* Output Format (All models) */}
                  <Col xs={24} sm={12} md={model === 'gpt-image-1.5' ? 6 : 4}>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      Output Format
                      <Tooltip title="Format of the generated image">
                        <InfoCircleOutlined className="text-accent-cyan cursor-help" />
                      </Tooltip>
                    </label>
                    <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                      <Select<ImageOutputFormat>
                        value={outputFormat}
                        onChange={setOutputFormat}
                        options={OUTPUT_FORMAT_OPTIONS}
                        disabled={isGenerationInProgress}
                        className="w-full"
                        popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                      />
                    </Tooltip>
                  </Col>

                  {/* Background (GPT Image 1.5 only) */}
                  {model === 'gpt-image-1.5' && (
                    <Col xs={24} sm={12} md={6}>
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        Background
                        <Tooltip title="Control the transparency of the generated image background">
                          <InfoCircleOutlined className="text-accent-cyan cursor-help" />
                        </Tooltip>
                      </label>
                      <Tooltip title={isGenerationInProgress ? 'Please wait for current generation to complete' : ''}>
                        <Select<GPTImageBackground>
                          value={background}
                          onChange={setBackground}
                          options={GPT_IMAGE_1_5_BACKGROUND_OPTIONS}
                          disabled={isGenerationInProgress}
                          className="w-full"
                          popupClassName={theme === 'dark' ? 'dark-select-dropdown' : 'light-select-dropdown'}
                        />
                      </Tooltip>
                    </Col>
                  )}
                </Row>

                {/* Generate Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={loading ? <LoadingOutlined /> : <PictureOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={loading || configLoading}
                    block
                    className="glow-button !h-14 !text-lg !font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                      border: 'none',
                      borderRadius: '12px',
                    }}
                  >
                    {loading ? 'Generating Magic...' : `Generate ${number} Image${number !== 1 ? 's' : ''}`}
                  </Button>
                </motion.div>
              </Space>
            </div>
          </motion.div>

          {/* Results Grid */}
          <AnimatePresence>
            {generationItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-8"
              >
                {/* Progress Counter */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <StarOutlined className="text-accent-cyan" />
                    Generated Images
                    <span className="text-sm font-normal text-gray-500">
                      ({generationItems.length} image{generationItems.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  {/* Progress Counter */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const completedCount = generationItems.filter(i => i.status === 'success').length;
                      const failedCount = generationItems.filter(i => i.status === 'error').length;
                      const totalCount = generationItems.length;
                      const inProgress = generationItems.some(i => i.status === 'pending' || i.status === 'loading');

                      if (inProgress || completedCount > 0 || failedCount > 0) {
                        return (
                          <motion.span
                            key={`progress-${completedCount}-${failedCount}`}
                            initial={{ scale: 0.9, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-sm font-medium px-4 py-2 rounded-full bg-glass-light backdrop-blur-md border border-glass-border"
                          >
                            <span className="text-gray-300">
                              Generated: <span className="text-accent-cyan font-bold">{completedCount}</span>/{totalCount}
                            </span>
                            {failedCount > 0 && (
                              <span className="ml-3 text-red-400">
                                ({failedCount} failed)
                              </span>
                            )}
                          </motion.span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <Row gutter={[16, 16]}>
                  {generationItems.map((item, index) => (
                    <Col xs={24} sm={12} lg={8} key={item.id}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
                        whileHover={{ y: -8 }}
                      >
                        {/* Loading Card */}
                        {(item.status === 'pending' || item.status === 'loading') && (
                          <Card className="glass-card overflow-hidden !border-0">
                            <div className="flex flex-col items-center justify-center py-12" style={{ minHeight: 360 }}>
                              <div className="relative">
                                <motion.div
                                  className="w-16 h-16 rounded-full"
                                  style={{
                                    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                                  }}
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <LoadingOutlined className="text-2xl text-white" />
                                </div>
                              </div>
                              <h4 className="text-white font-semibold text-lg mt-4 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Image #{item.id + 1}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {item.status === 'pending' ? 'Waiting to start...' : 'Generating...'}
                              </p>
                            </div>
                          </Card>
                        )}

                        {/* Error Card */}
                        {item.status === 'error' && (
                          <Card className="glass-card overflow-hidden !border-0 !border-red-500/30">
                            <div className="flex flex-col items-center justify-center py-8 text-center" style={{ minHeight: 360 }}>
                              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                                <CloseCircleOutlined className="text-4xl text-red-400" />
                              </div>
                              <h4 className="text-white font-semibold text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Image #{item.id + 1}
                              </h4>
                              <p className="text-red-400 text-sm mb-4 px-4">
                                {item.error || 'Generation failed'}
                              </p>
                              <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={() => void retryImage(item.id)}
                                className="!bg-accent-purple !border-accent-purple hover:!bg-accent-purple/80"
                              >
                                Retry
                              </Button>
                            </div>
                          </Card>
                        )}

                        {/* Success Card */}
                        {item.status === 'success' && item.result && (() => {
                          const imageUrl = getImageDisplayUrl(item.result);
                          const canDownload = hasDownloadableImage(item.result);
                          return imageUrl ? (
                            <Card
                              hoverable
                              className="glass-card overflow-hidden !border-0"
                              cover={
                                <div
                                  className="relative overflow-hidden cursor-pointer"
                                  style={{ backgroundColor: 'var(--color-card-bg)' }}
                                  onClick={() => openPreview(item.result, item.id)}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Generated image ${item.id + 1}`}
                                    className="!w-full transition-transform duration-300 hover:scale-105"
                                    style={{ height: 280, objectFit: 'cover' }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent opacity-60" />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                                    <ZoomInOutlined className="text-white text-4xl drop-shadow-lg" />
                                  </div>
                                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-md rounded-full px-3 py-1 shadow-lg">
                                    <CheckCircleOutlined className="text-white text-sm" />
                                    <span className="text-white text-xs font-medium">Ready</span>
                                  </div>
                                </div>
                              }
                              actions={[
                                <Button
                                  key="download"
                                  type="primary"
                                  icon={<DownloadOutlined />}
                                  disabled={!canDownload}
                                  onClick={() => canDownload ? void download(imageUrl) : undefined}
                                  className="!bg-accent-purple !border-accent-purple hover:!bg-accent-purple/80"
                                >
                                  Download
                                </Button>,
                              ]}
                            >
                            <div className="text-white">
                              <h4 className="font-semibold text-lg mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                                Image #{item.id + 1}
                              </h4>
                              <p className="text-gray-400 text-sm line-clamp-3">
                                {item.result.revised_prompt ?? prompt}
                              </p>
                            </div>
                          </Card>
                          ) : null;
                        })()}
                      </motion.div>
                    </Col>
                  ))}
                </Row>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State - Show before first generation */}
          {generationItems.length === 0 && !loading && (
            <motion.div
              variants={itemVariants}
              className="glass-card p-12 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-glow flex items-center justify-center opacity-50">
                <PictureOutlined className="text-5xl text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Ready to Create
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Enter a prompt above and configure your settings to generate stunning AI-powered images.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8 text-gray-600 text-sm"
        >
          <p>Powered by AI4Organization</p>
        </motion.footer>
      </div>

      {/* Enhanced Image Preview Modal with Zoom/Pan */}
      <Modal
        open={previewImage !== null}
        onCancel={closePreview}
        footer={null}
        centered
        width="95vw"
        style={{ maxWidth: '1920px', top: 20 }}
        className="image-preview-modal"
        closeIcon={null}
        title={null}
        styles={{
          content: {
            background: 'transparent',
            padding: 0,
            overflow: 'hidden',
          },
        }}
        rootClassName="image-preview-modal-root"
        wrapClassName="image-preview-modal-wrap"
      >
        {/* Image Container with Zoom/Pan */}
        <div
          className="relative preview-image-container"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            height: '90vh',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : (zoomLevel > 100 || fitMode === 'actual') ? 'grab' : 'default',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {previewImage && navigationImages[currentNavIndex] && (() => {
            const currentImage = navigationImages[currentNavIndex];
            const currentImageUrl = getImageDisplayUrl(currentImage);
            return currentImageUrl ? (
              <motion.div
                key={currentImageUrl}
                className="preview-image-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.img
                  src={currentImageUrl}
                  alt={`Preview ${currentNavIndex + 1}`}
                  draggable={false}
                  className="preview-image"
                  style={{
                    maxWidth: fitMode === 'fill' ? '100%' : '100%',
                    maxHeight: fitMode === 'fill' ? '100%' : '100%',
                    objectFit: fitMode === 'contain' ? 'contain' : fitMode === 'fill' ? 'fill' : 'none',
                    transform: `scale(${zoomLevel / 100}) translate(${panPosition.x / (zoomLevel / 100)}px, ${panPosition.y / (zoomLevel / 100)}px)`,
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    userSelect: 'none',
                    WebkitUserDrag: 'none' as const,
                  }}
                  onDoubleClick={handleZoomReset}
                />
              </motion.div>
            ) : null;
          })()}

          {/* Floating Control Bar - Always Visible */}
          <div
            className="preview-floating-controls absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-xl"
            style={{
              maxWidth: '90vw',
              flexWrap: 'wrap',
              justifyContent: 'center',
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              outline: 'none',
            }}
          >
                {/* Zoom Controls */}
                <div className="control-button-group flex items-center gap-2">
                  <Tooltip title="Zoom Out (-)">
                    <Button
                      type="text"
                      icon={<ZoomOutOutlined />}
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 50}
                      className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
                    />
                  </Tooltip>

                  <div className="flex items-center gap-2 px-2">
                    <Slider
                      min={50}
                      max={500}
                      value={zoomLevel}
                      onChange={(value) => setZoomLevel(value)}
                      step={25}
                      className="!w-24"
                      tooltip={{ formatter: (value) => `${value}%` }}
                      styles={{
                        rail: { backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' },
                        track: { backgroundColor: 'rgba(168, 85, 247, 0.8)' },
                        handle: { borderColor: '#a855f7', backgroundColor: '#a855f7' },
                      }}
                    />
                    <span className={!theme || theme === 'dark' ? 'text-white' : 'text-gray-900'} style={{ fontSize: '14px', fontWeight: 500, minWidth: '50px', textAlign: 'center' } as React.CSSProperties}>
                      {zoomLevel}%
                    </span>
                  </div>

                  <Tooltip title="Zoom In (+)">
                    <Button
                      type="text"
                      icon={<ZoomInOutlined />}
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 500}
                      className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
                    />
                  </Tooltip>

                  <Tooltip title="Reset Zoom (0 or Double-click)">
                    <Button
                      type="text"
                      icon={<CompressOutlined />}
                      onClick={handleZoomReset}
                      className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
                    />
                  </Tooltip>
                </div>

                {/* Divider */}
                <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

                {/* Fit Mode Toggle */}
                <Tooltip title={`Fit Mode: ${fitMode} (Press F to cycle)`}>
                  <Button
                    type="text"
                    icon={fitMode === 'contain' ? <CompressOutlined /> : fitMode === 'actual' ? <ExpandOutlined /> : <ExpandOutlined />}
                    onClick={() => {
                      const modes: Array<'contain' | 'actual' | 'fill'> = ['contain', 'actual', 'fill'];
                      const currentIdx = modes.indexOf(fitMode);
                      handleFitModeChange(modes[(currentIdx + 1) % modes.length]);
                    }}
                    className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none !font-medium' : '!text-gray-900 hover:!bg-gray-900/10 !border-none !font-medium'}
                  >
                    {fitMode === 'contain' ? 'Fit' : fitMode === 'actual' ? '100%' : 'Fill'}
                  </Button>
                </Tooltip>

                {/* Divider */}
                <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

                {/* Navigation */}
                <div className="control-button-group flex items-center gap-1">
                  <Tooltip title="Previous Image (Left Arrow)">
                    <Button
                      type="text"
                      icon={<LeftOutlined />}
                      onClick={handlePreviousImage}
                      disabled={currentNavIndex === 0}
                      className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
                    />
                  </Tooltip>

                  <span className={!theme || theme === 'dark' ? 'text-white' : 'text-gray-900'} style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px', textAlign: 'center' } as React.CSSProperties}>
                    {navigationImages.length > 0 ? `${currentNavIndex + 1} / ${navigationImages.length}` : 'Preview'}
                  </span>

                  <Tooltip title="Next Image (Right Arrow)">
                    <Button
                      type="text"
                      icon={<RightOutlined />}
                      onClick={handleNextImage}
                      disabled={currentNavIndex >= navigationImages.length - 1 || navigationImages.length === 0}
                      className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
                    />
                  </Tooltip>
                </div>

                {/* Divider */}
                <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

                {/* Fullscreen Toggle */}
                <Tooltip title="Fullscreen (F11)">
                  <Button
                    type="text"
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={handleFullscreenToggle}
                    className={!theme || theme === 'dark' ? '!text-white hover:!bg-white/10 !border-none' : '!text-gray-900 hover:!bg-gray-900/10 !border-none'}
                  />
                </Tooltip>

                {/* Divider */}
                <div className="w-px h-6 mx-1" style={{ backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} />

                {/* Close Button */}
                <Tooltip title="Close (ESC)">
                  <Button
                    type="text"
                    onClick={closePreview}
                    className={!theme || theme === 'dark' ? '!text-white hover:!bg-red-500/20 !border-none !text-lg' : '!text-gray-900 hover:!bg-red-500/20 !border-none !text-lg'}
                  >
                    ✕
                  </Button>
                </Tooltip>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-full px-4 py-2 text-xs pointer-events-none"
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
              color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            +/-: Zoom • 0: Reset • F: Fit Mode • F11: Fullscreen • ESC: Close
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .dark-dropdown .ant-select-dropdown {
          background: rgba(15, 15, 25, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(20px);
        }
        .dark-dropdown .ant-select-item {
          color: rgba(255, 255, 255, 0.85) !important;
        }
        .dark-dropdown .ant-select-item-option-selected {
          background: rgba(168, 85, 247, 0.2) !important;
        }
        .dark-dropdown .ant-select-item-option-active {
          background: rgba(168, 85, 247, 0.1) !important;
        }
        .dark-dropdown .ant-select-item-option:hover:not(.ant-select-item-option-disabled) {
          background: rgba(168, 85, 247, 0.15) !important;
        }

        .ant-image-preview-mask {
          background: rgba(10, 10, 18, 0.95) !important;
        }
        .ant-image-preview-wrap {
          backdrop-filter: blur(10px);
        }

        .ant-message {
          z-index: 9999 !important;
        }
        .ant-message-notice-content {
          background: rgba(15, 15, 25, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(20px);
          border-radius: 12px !important;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .image-preview-modal-root .ant-modal-content {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        .image-preview-modal-root .ant-modal-body {
          padding: 0;
          background: transparent;
        }
        .image-preview-modal-wrap .ant-modal-mask {
          background: rgba(10, 10, 18, 0.95) !important;
          backdrop-filter: blur(10px);
        }

        /* Enhanced Preview Modal Styles */
        .preview-image-container {
          position: relative;
          overflow: hidden;
        }

        .preview-image-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }

        .preview-image {
          display: block;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          pointer-events: none;
        }

        .preview-floating-controls {
          z-index: 1000;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .preview-floating-controls .ant-slider {
          margin: 0;
        }

        .preview-floating-controls .ant-slider-rail {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }

        .preview-floating-controls .ant-slider-track {
          background-color: rgba(168, 85, 247, 0.8) !important;
        }

        .preview-floating-controls .ant-slider-handle {
          border: none !important;
          background-color: #a855f7 !important;
          box-shadow: none !important;
        }

        .control-button-group {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .control-button-group .ant-btn {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          transition: background-color 0.2s ease, transform 0.1s ease;
        }

        .control-button-group .ant-btn:active {
          transform: scale(0.95);
        }

        .control-button-group .ant-btn:focus,
        .control-button-group .ant-btn:focus-visible {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .control-button-group .ant-btn-disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Slider tooltip styling */
        .ant-tooltip-inner {
          background: rgba(15, 15, 25, 0.95) !important;
          backdrop-filter: blur(10px);
          border: none !important;
        }

        .ant-tooltip-arrow-content {
          background: rgba(15, 15, 25, 0.95) !important;
        }
      `}</style>
    </>
  );
}
