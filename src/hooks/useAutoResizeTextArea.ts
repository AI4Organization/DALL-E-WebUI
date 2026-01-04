import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutoResizeTextAreaOptions {
  /** Minimum height in pixels (default: 160) */
  minHeight?: number;
  /** Maximum height in pixels (default: 400) */
  maxHeight?: number;
}

export interface UseAutoResizeTextAreaReturn {
  /** Ref to attach to the textarea element */
  ref: React.RefObject<HTMLTextAreaElement | null>;
  /** Current height of the textarea */
  height: number;
}

/**
 * Custom hook that auto-resizes a textarea based on its content.
 *
 * @param options - Configuration options for min/max height
 * @returns Object containing ref and current height
 *
 * @example
 * ```tsx
 * const { ref, height } = useAutoResizeTextArea({ minHeight: 100, maxHeight: 300 });
 * <TextArea ref={ref} style={{ height: `${height}px` }} />
 * ```
 */
export function useAutoResizeTextArea(
  value: string,
  options: UseAutoResizeTextAreaOptions = {}
): UseAutoResizeTextAreaReturn {
  const { minHeight = 160, maxHeight = 400 } = options;

  const ref = useRef<HTMLTextAreaElement>(null);
  const [height, setHeight] = useState<number>(minHeight);

  const autoResize = useCallback(() => {
    const textArea = ref.current;
    if (textArea && textArea.style) {
      // Reset height to auto to get the correct scrollHeight
      textArea.style.height = 'auto';
      // Calculate new height constrained between min and max
      const newHeight = Math.min(Math.max(textArea.scrollHeight, minHeight), maxHeight);
      textArea.style.height = `${newHeight}px`;
      setHeight(newHeight);
    }
  }, [minHeight, maxHeight]);

  // Update textarea height when value changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Use requestAnimationFrame for smooth resizing
    const rafId = requestAnimationFrame(() => {
      autoResize();
    });

    return () => cancelAnimationFrame(rafId);
  }, [value, autoResize]);

  return { ref, height };
}
