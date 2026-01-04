/**
 * Example test to verify Vitest setup
 */

import { describe, it, expect } from 'vitest';

describe('Vitest Setup', () => {
  it('should run a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async tests', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
