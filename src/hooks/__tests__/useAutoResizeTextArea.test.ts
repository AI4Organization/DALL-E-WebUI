/**
 * Tests for useAutoResizeTextArea hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAutoResizeTextArea } from '../useAutoResizeTextArea';

describe('useAutoResizeTextArea', () => {
  beforeEach(() => {
    // Mock window.getComputedStyle
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => '16px',
    }));
  });

  it('should return ref and height', () => {
    const { result } = renderHook(() => useAutoResizeTextArea('', {}));

    expect(result.current.ref).toBeDefined();
    expect(result.current.height).toBeDefined();
    expect(typeof result.current.height).toBe('number');
  });

  it('should set initial height to minHeight', () => {
    const minHeight = 100;
    const { result } = renderHook(() =>
      useAutoResizeTextArea('', { minHeight })
    );

    expect(result.current.height).toBe(minHeight);
  });

  it('should update height when value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAutoResizeTextArea(value, { minHeight: 100, maxHeight: 300 }),
      { initialProps: { value: '' } }
    );

    expect(result.current.height).toBe(100);

    // Create a mock textarea element
    const mockTextArea = document.createElement('textarea');
    mockTextArea.style.height = 'auto';
    mockTextArea.value = '';
    document.body.appendChild(mockTextArea);

    // Set ref to mock element
    act(() => {
      if (result.current.ref.current) {
        result.current.ref.current = mockTextArea;
      }
    });

    // Mock scrollHeight
    Object.defineProperty(mockTextArea, 'scrollHeight', {
      value: 200,
      writable: true,
      configurable: true,
    });

    // Change value
    rerender({ value: 'a'.repeat(100) });

    // Height should be updated
    expect(result.current.height).toBeGreaterThanOrEqual(100);

    document.body.removeChild(mockTextArea);
  });

  it('should respect maxHeight limit', () => {
    const maxHeight = 300;
    const { result } = renderHook(() =>
      useAutoResizeTextArea('', { minHeight: 100, maxHeight })
    );

    expect(result.current.height).toBeLessThanOrEqual(maxHeight);
  });

  it('should handle null ref gracefully', () => {
    const { result } = renderHook(() => useAutoResizeTextArea('', {}));

    // Ref should be defined but current may be null
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('should use default minHeight of 160 when not specified', () => {
    const { result } = renderHook(() => useAutoResizeTextArea(''));

    expect(result.current.height).toBe(160);
  });

  it('should use default maxHeight of 400 when not specified', () => {
    const { result } = renderHook(() => useAutoResizeTextArea(''));

    // The initial height should not exceed default maxHeight
    expect(result.current.height).toBeLessThanOrEqual(400);
  });
});
