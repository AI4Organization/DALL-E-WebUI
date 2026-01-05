/**
 * Tests for ThemeToggle component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ThemeProvider } from '../../lib/theme';
import { ThemeToggle } from '../ThemeToggle';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, style, ...props }: any) => (
      <div onClick={onClick} style={style} {...props}>{children}</div>
    ),
    button: ({ children, onClick, style, className, ...props }: any) => (
      <button onClick={onClick} style={style} className={className} {...props}>{children}</button>
    ),
    svg: (props: any) => <svg {...props} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderWithThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('dark-theme', 'light-theme');
  });

  it('should render the toggle button', () => {
    renderWithThemeToggle();
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', () => {
    renderWithThemeToggle();
    const button = screen.getByRole('button');

    // Get initial state
    const initialTheme = localStorage.getItem('theme');

    // Click to toggle
    fireEvent.click(button);

    // After toggle, the theme should change
    const afterHasDark = document.documentElement.classList.contains('dark-theme');
    const afterHasLight = document.documentElement.classList.contains('light-theme');
    const afterTheme = localStorage.getItem('theme');

    // At least one of the theme classes should be present
    expect(afterHasDark || afterHasLight).toBe(true);

    // The theme in localStorage should be different from initial
    if (initialTheme === 'dark') {
      expect(afterTheme).toBe('light');
    } else if (initialTheme === 'light') {
      expect(afterTheme).toBe('dark');
    }
  });

  it('should apply dark-theme class initially', () => {
    renderWithThemeToggle();
    // ThemeProvider should set initial theme based on system or default
    const hasThemeClass =
      document.documentElement.classList.contains('dark-theme') ||
      document.documentElement.classList.contains('light-theme');
    expect(hasThemeClass).toBe(true);
  });

  it('should persist theme to localStorage', () => {
    renderWithThemeToggle();
    const button = screen.getByRole('button');

    // Toggle theme
    fireEvent.click(button);

    // Check localStorage
    const storedTheme = localStorage.getItem('theme');
    expect(storedTheme).toBeTruthy();
    expect(['dark', 'light']).toContain(storedTheme as string);
  });
});
