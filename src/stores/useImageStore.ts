import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {
  ImageGenerationItem,
  OpenAIImageResult,
  ImageQuality,
  GPTImageQuality,
  ImageSize,
  ImageStyle,
  ImageOutputFormat,
  GPTImageBackground,
} from '../../types';

/**
 * Image Store State
 *
 * Single source of truth for all image-related state.
 * Consolidates GenerationContext and ImageContext functionality.
 */
interface ImageStoreState {
  // === Settings ===
  /** Selected model */
  model: string | null;
  /** Generation prompt */
  prompt: string;
  /** Number of images to generate */
  number: number;
  /** Quality setting */
  quality: ImageQuality | GPTImageQuality;
  /** Image dimensions */
  size: ImageSize;
  /** Style preset (DALL-E 3 only) */
  style: ImageStyle;
  /** Output format */
  outputFormat: ImageOutputFormat;
  /** Background setting (GPT Image 1.5 only) */
  background: GPTImageBackground;

  // === Generation State ===
  /** Whether generation is in progress */
  isGenerating: boolean;
  /** Generated items with their states */
  items: ImageGenerationItem[];

  // === Preview State ===
  /** Currently previewed image result */
  previewImage: OpenAIImageResult | null;
  /** All images for navigation */
  navigationImages: OpenAIImageResult[];
  /** Current image index for navigation */
  currentNavIndex: number;

  // === Settings Actions ===
  setModel: (model: string | null) => void;
  setPrompt: (prompt: string) => void;
  setNumber: (number: number) => void;
  setQuality: (quality: ImageQuality | GPTImageQuality) => void;
  setSize: (size: ImageSize) => void;
  setStyle: (style: ImageStyle) => void;
  setOutputFormat: (format: ImageOutputFormat) => void;
  setBackground: (background: GPTImageBackground) => void;

  // === Generation Actions ===
  setGenerating: (isGenerating: boolean) => void;
  setItems: (items: ImageGenerationItem[]) => void;
  updateItem: (id: number, updates: Partial<ImageGenerationItem>) => void;
  addItem: (item: ImageGenerationItem) => void;
  clearItems: () => void;

  // === Preview Actions ===
  openPreview: (result: OpenAIImageResult, index: number, allImages: OpenAIImageResult[]) => void;
  closePreview: () => void;
  navigatePrevious: () => void;
  navigateNext: () => void;

  // === Derived Getters ===
  getCompletedCount: () => number;
  getFailedCount: () => number;
  getInProgress: () => boolean;
  getItemById: (id: number) => ImageGenerationItem | undefined;
}

/**
 * Constants for image lifecycle management
 */
const MAX_STORED_IMAGES = 20;
const CLEANUP_THRESHOLD = 30;

/**
 * Prunes old images to prevent unbounded memory growth
 */
function pruneOldImages(items: ImageGenerationItem[]): ImageGenerationItem[] {
  if (items.length > CLEANUP_THRESHOLD) {
    return items.slice(-MAX_STORED_IMAGES);
  }
  return items;
}

/**
 * Image Store
 *
 * Zustand store with devtools support for debugging.
 * All state mutations are batched for efficiency.
 */
export const useImageStore = create<ImageStoreState>()(
  devtools(
    (set, get) => ({
      // === Initial State ===
      model: 'dall-e-3',
      prompt: '',
      number: 4,
      quality: 'hd' as ImageQuality,
      size: '1792x1024' as ImageSize,
      style: 'vivid' as ImageStyle,
      outputFormat: 'webp' as ImageOutputFormat,
      background: 'auto' as GPTImageBackground,

      isGenerating: false,
      items: [],

      previewImage: null,
      navigationImages: [],
      currentNavIndex: -1,

      // === Settings Actions ===
      setModel: (model) => set({ model }, false, 'setModel'),
      setPrompt: (prompt) => set({ prompt }, false, 'setPrompt'),
      setNumber: (number) => set({ number }, false, 'setNumber'),
      setQuality: (quality) => set({ quality }, false, 'setQuality'),
      setSize: (size) => set({ size }, false, 'setSize'),
      setStyle: (style) => set({ style }, false, 'setStyle'),
      setOutputFormat: (outputFormat) => set({ outputFormat }, false, 'setOutputFormat'),
      setBackground: (background) => set({ background }, false, 'setBackground'),

      // === Generation Actions ===
      setGenerating: (isGenerating) => set({ isGenerating }, false, 'setGenerating'),

      setItems: (items) =>
        set(
          { items: pruneOldImages(items) },
          false,
          'setItems'
        ),

      updateItem: (id, updates) =>
        set(
          (state) => ({
            items: pruneOldImages(
              state.items.map((item) =>
                item.id === id ? { ...item, ...updates } : item
              )
            ),
          }),
          false,
          'updateItem'
        ),

      addItem: (item) =>
        set(
          (state) => ({
            items: pruneOldImages([...state.items, item]),
          }),
          false,
          'addItem'
        ),

      clearItems: () =>
        set({ items: [] }, false, 'clearItems'),

      // === Preview Actions ===
      openPreview: (result, index, allImages) =>
        set(
          {
            previewImage: result,
            navigationImages: allImages,
            currentNavIndex: index,
          },
          false,
          'openPreview'
        ),

      closePreview: () =>
        set(
          {
            previewImage: null,
            navigationImages: [],
            currentNavIndex: -1,
          },
          false,
          'closePreview'
        ),

      navigatePrevious: () =>
        set(
          (state) => {
            // Only navigate if there are images
            if (state.navigationImages.length === 0) {
              return state;
            }
            return {
              currentNavIndex: Math.max(0, state.currentNavIndex - 1),
              previewImage: state.navigationImages[Math.max(0, state.currentNavIndex - 1)] || null,
            };
          },
          false,
          'navigatePrevious'
        ),

      navigateNext: () =>
        set(
          (state) => {
            // Only navigate if there are images
            if (state.navigationImages.length === 0) {
              return state;
            }
            return {
              currentNavIndex: Math.min(state.navigationImages.length - 1, state.currentNavIndex + 1),
              previewImage: state.navigationImages[Math.min(state.navigationImages.length - 1, state.currentNavIndex + 1)] || null,
            };
          },
          false,
          'navigateNext'
        ),

      // === Derived Getters ===
      getCompletedCount: () => {
        const state = get();
        return state.items.filter((i) => i.status === 'success').length;
      },

      getFailedCount: () => {
        const state = get();
        return state.items.filter((i) => i.status === 'error').length;
      },

      getInProgress: () => {
        const state = get();
        return state.items.some((i) => i.status === 'pending' || i.status === 'loading');
      },

      getItemById: (id) => {
        const state = get();
        return state.items.find((item) => item.id === id);
      },
    }),
    {
      name: 'ImageStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 *
 * Using direct selectors without shallow comparison to avoid infinite loops.
 * Each selector returns individual values instead of objects to prevent
 * reference equality issues.
 */

/** Settings state selectors (values only) */
export function useImageSettingsState() {
  return useImageStore((state) => ({
    model: state.model,
    prompt: state.prompt,
    number: state.number,
    quality: state.quality,
    size: state.size,
    style: state.style,
    outputFormat: state.outputFormat,
    background: state.background,
  }));
}

/** Settings actions selectors (functions only) */
export function useImageSettingsActions() {
  return useImageStore((state) => ({
    setModel: state.setModel,
    setPrompt: state.setPrompt,
    setNumber: state.setNumber,
    setQuality: state.setQuality,
    setSize: state.setSize,
    setStyle: state.setStyle,
    setOutputFormat: state.setOutputFormat,
    setBackground: state.setBackground,
  }));
}

/** Generation state selectors (values only) */
export function useImageGenerationState() {
  return useImageStore((state) => ({
    items: state.items,
    isGenerating: state.isGenerating,
  }));
}

/** Generation actions selectors (functions only) */
export function useImageGenerationActions() {
  return useImageStore((state) => ({
    setGenerating: state.setGenerating,
    setItems: state.setItems,
    updateItem: state.updateItem,
    addItem: state.addItem,
    clearItems: state.clearItems,
    getCompletedCount: state.getCompletedCount,
    getFailedCount: state.getFailedCount,
    getInProgress: state.getInProgress,
    getItemById: state.getItemById,
  }));
}

/** Preview state selectors (values only) */
export function useImagePreviewState() {
  return useImageStore((state) => ({
    previewImage: state.previewImage,
    navigationImages: state.navigationImages,
    currentNavIndex: state.currentNavIndex,
  }));
}

/** Preview actions selectors (functions only) */
export function useImagePreviewActions() {
  return useImageStore((state) => ({
    openPreview: state.openPreview,
    closePreview: state.closePreview,
    navigatePrevious: state.navigatePrevious,
    navigateNext: state.navigateNext,
  }));
}
