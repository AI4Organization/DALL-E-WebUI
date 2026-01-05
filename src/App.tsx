import { LoadingOutlined, PictureOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import pLimit from 'p-limit';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type {
  ImageGenerationItem,
  ImageGenerationStatus,
  ImageSize,
  ModelOption,
  OpenAIImageResult,
} from '../types';
import { DALL_E_2_SIZES, DALL_E_3_SIZES, GPT_IMAGE_1_5_SIZES, SEEDREAM_4_5_SIZES } from '../types';

import { EmptyState } from './components/EmptyState';
import { ImageResultsGrid } from './components/ImageResultsGrid';
import { PromptInputSection } from './components/PromptInputSection';
import { SettingsGrid } from './components/SettingsGrid';
import { ThemeToggle } from './components/ThemeToggle';
import { downloadAndSave } from './lib/api/download';
import { getImageDisplayUrl, hasDownloadableImage } from './lib/api/image-generation';
import { ApiError } from './lib/api-client';
import { useTheme } from './lib/theme';
import { useImageStore } from './stores/useImageStore';

// Lazy load PreviewModal for code splitting
const LazyPreviewModal = lazy(() =>
  import('./components/PreviewModal').then((m) => ({ default: m.PreviewModal }))
);

// Get API base URL from definePlugin in rsbuild.config.ts
declare const process: { env: { API_BASE_URL: string } };

// ============ Constants ============

const isSizeValidForModel = (size: ImageSize, modelName: string | null): boolean => {
  if (modelName === 'bytedance-seed/seedream-4.5') {
    return SEEDREAM_4_5_SIZES.includes(size);
  }
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_SIZES.includes(size);
  }
  if (modelName === 'dall-e-2') {
    return DALL_E_2_SIZES.includes(size);
  }
  return DALL_E_3_SIZES.includes(size);
};

const getDefaultSizeForModel = (modelName: string | null): ImageSize => {
  if (modelName === 'bytedance-seed/seedream-4.5') {
    return SEEDREAM_4_5_SIZES[0]!; // '1024x1024' (Square)
  }
  if (modelName === 'gpt-image-1.5') {
    return GPT_IMAGE_1_5_SIZES[2]!; // '1536x1024' (Landscape)
  }
  if (modelName === 'dall-e-3') {
    return DALL_E_3_SIZES[2]!; // '1792x1024' (Landscape)
  }
  // DALL-E 2 defaults to largest square (only square sizes available)
  return DALL_E_2_SIZES[2]!; // '1024x1024'
};

// Helper function to get prompt limit for model
const getPromptLimit = (modelName: string | null): number => {
  if (modelName === 'bytedance-seed/seedream-4.5') return 4096;
  if (modelName === 'gpt-image-1.5') return 32000;
  if (modelName === 'dall-e-3') return 4000;
  if (modelName === 'dall-e-2') return 1000;
  return 4000; // Default
};

// Helper function to get max images for model
// Note: For DALL-E 3, we allow up to 10 images but handle via parallel requests
// since the API only supports n=1 per request
const getMaxImages = (modelName: string | null): number => {
  if (modelName === 'bytedance-seed/seedream-4.5') return 6;
  if (modelName === 'gpt-image-1.5') return 10;
  if (modelName === 'dall-e-3') return 10; // Allow up to 10 via parallel requests
  if (modelName === 'dall-e-2') return 10;
  return 10; // Default
};

// Universal output format options for all models (API-supported formats only)

// GPT Image 1.5 background options

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

// ============ Helper Functions ============
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
// Optimized: Using CSS animations instead of Framer Motion for better performance
const FloatingBlob: React.FC<{ className?: string; color: string; delay?: number }> = ({
  className,
  color,
  delay = 0,
}) => (
  <div
    className={`absolute rounded-full blur-3xl floating-blob ${className}`}
    style={{
      background: color,
      opacity: 'var(--blob-opacity)',
      animationDelay: `${delay}s`,
      willChange: 'transform',
    }}
  />
);

// ============ Main Component ============
export default function App(): React.ReactElement {
  useTheme();

  // ============ Zustand Store Individual Selectors ============
  // Using individual selectors to avoid infinite loop from object reference changes
  // Settings state
  const model = useImageStore((state) => state.model);
  const prompt = useImageStore((state) => state.prompt);
  const number = useImageStore((state) => state.number);
  const quality = useImageStore((state) => state.quality);
  const size = useImageStore((state) => state.size);
  const style = useImageStore((state) => state.style);
  const outputFormat = useImageStore((state) => state.outputFormat);
  const background = useImageStore((state) => state.background);

  // Settings actions
  const setModel = useImageStore((state) => state.setModel);
  const setPrompt = useImageStore((state) => state.setPrompt);
  const setNumber = useImageStore((state) => state.setNumber);
  const setQuality = useImageStore((state) => state.setQuality);
  const setSize = useImageStore((state) => state.setSize);
  const setStyle = useImageStore((state) => state.setStyle);
  const setOutputFormat = useImageStore((state) => state.setOutputFormat);
  const setBackground = useImageStore((state) => state.setBackground);

  // Generation state
  const generationItems = useImageStore((state) => state.items);
  const loading = useImageStore((state) => state.isGenerating);

  // Generation actions
  const setLoading = useImageStore((state) => state.setGenerating);
  const setGenerationItems = useImageStore((state) => state.setItems);
  const updateItem = useImageStore((state) => state.updateItem);
  const clearItems = useImageStore((state) => state.clearItems);

  // Preview state
  const navigationImages = useImageStore((state) => state.navigationImages);
  const currentNavIndex = useImageStore((state) => state.currentNavIndex);

  // Preview actions
  const openPreviewContext = useImageStore((state) => state.openPreview);
  const closePreview = useImageStore((state) => state.closePreview);
  const handlePreviousImage = useImageStore((state) => state.navigatePrevious);
  const handleNextImage = useImageStore((state) => state.navigateNext);

  // Local state (non-store state)
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [configLoading, setConfigLoading] = useState<boolean>(true);
  const [isGenerationInProgress, setIsGenerationInProgress] = useState<boolean>(false);

  // Zoom & Pan State (handled by useImagePreview hook in PreviewModal)
  const [, _setZoomLevel] = useState<number>(100); // 50% to 500%
  const [, _setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [, _setIsDragging] = useState<boolean>(false);

  // Set document title
  useEffect(() => {
    document.title = 'OpenDia';
  }, []);

  // ============ Memoized Values ============
  // Memoize prompt limit to avoid recomputing on every render
  const promptLimit = useMemo(() => getPromptLimit(model), [model]);

  // ============ Effects ============
  // Reset size to model's default when model changes
  useEffect(() => {
    if (model) {
      setSize(getDefaultSizeForModel(model));
    }
  }, [model, setSize]);

  // Fallback: if current size becomes invalid for current model, reset to default
  useEffect(() => {
    if (model && !isSizeValidForModel(size, model)) {
      setSize(getDefaultSizeForModel(model));
    }
  }, [model, size, setSize]);

  useEffect(() => {
    if (model === 'bytedance-seed/seedream-4.5') {
      setQuality('standard');
    } else if (model === 'gpt-image-1.5') {
      setQuality('low');
    } else if (model === 'dall-e-2') {
      setQuality('standard');
    } else if (model === 'dall-e-3') {
      setQuality('standard');
    }
  }, [model, setQuality]);

  useEffect(() => {
    const fetchConfig = async (): Promise<void> => {
      try {
        const res = await axios.get(`${process.env.API_BASE_URL}/api/config`);

        // Sort models by priority: dall-e-3, gpt-image-1.5, dall-e-2, bytedance-seed/seedream-4.5, then others alphabetically
        const modelPriority: Record<string, number> = {
          'dall-e-3': 1,
          'gpt-image-1.5': 2,
          'dall-e-2': 3,
          'bytedance-seed/seedream-4.5': 4,
        };

        const sortedModels = [...res.data.availableModels].sort((a, b) => {
          const priorityA = modelPriority[a.value] ?? 999;
          const priorityB = modelPriority[b.value] ?? 999;
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }
          return a.label.localeCompare(b.label);
        });

        setAvailableModels(sortedModels);
        setConfigLoading(false);
      } catch (err) {
        const axiosError = err as {
          response?: { data?: { error: string; details?: string[] }; status?: number };
        };
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
  // The first model returned by the API is the default
  // Also reset the model if the current one is not in the available models list
  useEffect(() => {
    if (!configLoading && availableModels.length > 0) {
      const isFirstModel = !model;
      const isModelNotAvailable =
        model && !availableModels.some((m: ModelOption) => m.value === model);

      if (isFirstModel || isModelNotAvailable) {
        setModel(availableModels[0]?.value ?? null);
      }
    }
  }, [configLoading, availableModels, model, setModel]);

  // ============ Handlers ============
  const getImages = useCallback(async (): Promise<void> => {
    let hasErrors = false;

    // Client-side validation
    if (!model) {
      toast.error('No Model Selected', {
        description:
          'Please select an AI model to generate images. Choose a model from the "Model" dropdown above.',
      });
      hasErrors = true;
    }

    if (!prompt.trim()) {
      toast.error('Empty Prompt', {
        description:
          'Please describe the image you want to create. Enter a detailed description in the "Your Prompt" text area.',
      });
      hasErrors = true;
    } else if (prompt.trim().length < 10) {
      toast.warning('Prompt Too Short', {
        description:
          'Your prompt is quite short. More detailed prompts usually produce better results. Try describing your vision in more detail - include style, mood, objects, colors, etc.',
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

    if (model === 'bytedance-seed/seedream-4.5' && !SEEDREAM_4_5_SIZES.includes(size)) {
      toast.error('Invalid Size for Seedream 4.5', {
        description: `The size "${size}" is not supported by Seedream 4.5. Choose a supported size: 1024x1024, 1536x1536, 2048x2048, 1024x1536, 1536x1024, 1024x2048, or 2048x1024.`,
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

    if (model === 'bytedance-seed/seedream-4.5' && number > 1) {
      toast.info(`Multiple Images with Seedream 4.5`, {
        description: `You requested ${number} images. Seedream 4.5 supports up to 6 images per request. Generation may take 30-60 seconds per image.`,
      });
    }

    // Clear previous results and set loading state
    clearItems();
    setLoading(true);
    setIsGenerationInProgress(true);

    // Initialize generation items for parallel execution
    const initialItems: ImageGenerationItem[] = Array.from({ length: number }, (_, i) => ({
      id: i,
      status: 'pending' as ImageGenerationStatus,
    }));
    setGenerationItems(initialItems);

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

        try {
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
        } catch (err) {
          console.error(`${model} batch generation error:`, err);
          const errorMessage = getApiErrorMessage(err);

          // Update all items to error status
          const errorItems = initialItems.map((item) => ({
            ...item,
            status: 'error' as ImageGenerationStatus,
            error: errorMessage,
          }));
          setGenerationItems(errorItems);
          toast.error(`Batch generation failed: ${errorMessage}`);
        }
      } else {
        // DALL-E 3 and DALL-E 2: Make parallel requests (one per image)
        const tasks = Array.from({ length: number }, (_, i) => limit(() => generateSingleImage(i)));

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
  }, [
    model,
    prompt,
    number,
    quality,
    size,
    style,
    outputFormat,
    background,
    clearItems,
    setGenerationItems,
    setLoading,
    updateItem,
    setIsGenerationInProgress,
  ]);

  const download = useCallback(
    async (imageUrl: string): Promise<void> => {
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
          await downloadAndSave({
            imageUrl,
            format: outputFormat,
            filename: `${prompt}.${outputFormat}`,
          });
          toast.success('Image downloaded successfully');
        }
      } catch (err) {
        // Handle ApiError
        if (err instanceof ApiError) {
          const userMessage = err.getUserMessage();
          toast.error('Failed to download image', {
            description: userMessage,
          });
        } else {
          // Handle unknown errors
          console.error('Download error:', err);
          toast.error('Failed to download image');
        }
      }
    },
    [prompt, outputFormat]
  );

  // Retry a single failed image generation
  const retryImage = useCallback(
    async (id: number): Promise<void> => {
      // Update status to loading using store action
      updateItem(id, { status: 'loading' as ImageGenerationStatus, error: undefined });

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
          updateItem(id, { status: 'success' as ImageGenerationStatus, result });
          toast.success(`Image ${id + 1} regenerated successfully!`);
        } else {
          throw new Error('No image data returned');
        }
      } catch (err) {
        console.error(`Image ${id + 1} retry error:`, err);
        const errorMessage = getApiErrorMessage(err);
        updateItem(id, { status: 'error' as ImageGenerationStatus, error: errorMessage });
        toast.error(`Image ${id + 1} retry failed: ${errorMessage}`);
      }
    },
    [prompt, quality, size, model, style, outputFormat, background, updateItem]
  );

  const handleGenerate = useCallback((): void => {
    void getImages();
  }, [getImages]);

  // ============ Preview Handlers ============
  const openPreview = useCallback(
    (clickedResult: OpenAIImageResult): void => {
      // Extract all successfully generated images
      const allSuccessfulImages = generationItems
        .filter((item) => item.status === 'success' && item.result)
        .map((item) => item.result!);

      // Find the index of the clicked image using a more robust comparison
      const clickedNavIndex = allSuccessfulImages.findIndex((img) => {
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

      // Use context's openPreview with the computed values
      const targetImage = allSuccessfulImages[clickedNavIndex >= 0 ? clickedNavIndex : 0];
      if (targetImage) {
        openPreviewContext(
          targetImage,
          clickedNavIndex >= 0 ? clickedNavIndex : 0,
          allSuccessfulImages
        );
      }
    },
    [generationItems, openPreviewContext]
  );

  // ============ Render ============
  return (
    <>
      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
        <FloatingBlob
          color="rgba(168, 85, 247, 0.4)"
          className="w-96 h-96 top-0 left-1/4"
          delay={0}
        />
        <FloatingBlob
          color="rgba(236, 72, 153, 0.3)"
          className="w-80 h-80 top-1/3 right-1/4"
          delay={1}
        />
        <FloatingBlob
          color="rgba(34, 211, 211, 0.3)"
          className="w-72 h-72 bottom-1/4 left-1/3"
          delay={2}
        />
        <FloatingBlob
          color="rgba(168, 85, 247, 0.2)"
          className="w-64 h-64 bottom-0 right-1/3"
          delay={3}
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-(--color-background)/50 to-(--color-background)" />
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
            <h1
              className="text-5xl md:text-7xl font-extrabold mb-4"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
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
                  <h2
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    Image Generator
                  </h2>
                  <p className="text-gray-400 text-sm">Configure your prompt and settings</p>
                </div>
              </div>

              <Space orientation="vertical" size="large" className="w-full">
                {/* Prompt Input with Floating Effect */}
                <PromptInputSection
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  maxLength={promptLimit}
                  model={model}
                />

                {/* Settings Grid */}
                <SettingsGrid
                  model={model}
                  onModelChange={setModel}
                  availableModels={availableModels}
                  configLoading={configLoading}
                  quality={quality}
                  onQualityChange={setQuality}
                  size={size}
                  onSizeChange={setSize}
                  number={number}
                  onNumberChange={setNumber}
                  style={style}
                  onStyleChange={setStyle}
                  outputFormat={outputFormat}
                  onOutputFormatChange={setOutputFormat}
                  background={background}
                  onBackgroundChange={setBackground}
                  isGenerationInProgress={isGenerationInProgress}
                />

                {/* Generate Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={loading ? <LoadingOutlined /> : <PictureOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={loading || configLoading}
                    block
                    className="glow-button h-14! text-lg! font-semibold!"
                    style={{
                      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #22d3d3 100%)',
                      border: 'none',
                      borderRadius: '4px',
                    }}
                  >
                    {loading
                      ? 'Generating Magic...'
                      : `Generate ${number} Image${number !== 1 ? 's' : ''}`}
                  </Button>
                </motion.div>
              </Space>
            </div>
          </motion.div>
          {/* Results Grid */}
          <AnimatePresence>
            {generationItems.length > 0 && (
              <ImageResultsGrid
                items={generationItems}
                prompt={prompt}
                onDownload={download}
                onPreview={openPreview}
                onRetry={retryImage}
                getDisplayUrl={getImageDisplayUrl}
                hasDownloadableImage={hasDownloadableImage}
              />
            )}
          </AnimatePresence>

          {/* Empty State - Show before first generation */}
          {generationItems.length === 0 && !loading && <EmptyState variants={itemVariants} />}
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
      <Suspense fallback={null}>
        <LazyPreviewModal
          navigationImages={navigationImages}
          currentNavIndex={currentNavIndex}
          onClose={closePreview}
          onNavigatePrevious={handlePreviousImage}
          onNavigateNext={handleNextImage}
          getDisplayUrl={getImageDisplayUrl}
        />
      </Suspense>

      <style>{`
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

        /* Optimized CSS animations for floating blobs (replaces Framer Motion) */
        @keyframes floating-blob {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(90deg);
          }
          50% {
            transform: scale(1.2) rotate(180deg);
          }
          75% {
            transform: scale(1.1) rotate(270deg);
          }
        }

        .floating-blob {
          animation: floating-blob 8s ease-in-out infinite;
          transform: translateZ(0); /* GPU hint */
        }
      `}</style>
    </>
  );
}
