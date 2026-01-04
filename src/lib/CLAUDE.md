# CLAUDE.md - src/lib/

This file provides guidance to Claude Code (claude.ai/code) when working with frontend utility libraries.

## Purpose

This directory contains client-side utility modules and React contexts for the frontend application.

## File Structure

```
src/lib/
└── theme.tsx    # Theme context and provider
```

## Modules

### `theme.tsx` - Theme Context

**Purpose:** Provides React context for dark/light theme management with localStorage persistence and system preference detection.

#### Types

```typescript
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;           // Current theme
  toggleTheme: () => void;  // Switch between themes
  mounted: boolean;       // Hydration state
}
```

#### Exported Components

##### `ThemeProvider`
React context provider for theme management.

**Props:**
```typescript
interface ThemeProviderProps {
  children: ReactNode;
}
```

**Features:**
- Manages theme state (dark/light)
- Persists theme to localStorage
- Detects system preference on first load
- Updates DOM classes for CSS variables
- Prevents hydration mismatch with `mounted` state

**Lifecycle:**

1. **Initial Mount:**
   - Sets `mounted` to `true` after hydration
   - Checks localStorage for saved theme
   - Falls back to system preference if no saved theme

2. **Theme Change:**
   - Updates `theme` state
   - Updates DOM: `document.documentElement.classList`
   - Saves to localStorage

**CSS Classes:**
- `.dark-theme` - Applied when dark mode is active
- `.light-theme` - Applied when light mode is active

**Hydration Safety:**
- Always renders with default theme until `mounted = true`
- Prevents React hydration mismatch errors
- Ensures consistent SSR/client rendering

#### Exported Hooks

##### `useTheme()`
Hook to access theme context.

**Returns:** `ThemeContextType`

**Throws:** Error if used outside `ThemeProvider`

```typescript
const { theme, toggleTheme, mounted } = useTheme();
```

## Usage Examples

### Setting Up Theme Provider

```tsx
// In src/index.tsx
import { ThemeProvider } from './lib/theme';
import { ThemedApp } from './components/ThemedApp';
import App from './App';

root.render(
  <ThemeProvider>
    <ThemedApp>
      <App />
    </ThemedApp>
  </ThemeProvider>
);
```

### Using Theme in Components

```tsx
import { useTheme } from '../lib/theme';

function MyComponent() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return null;  // Prevent hydration mismatch
  }

  return (
    <div className={`${theme}-theme`}>
      <button onClick={toggleTheme}>
        Switch to {theme === 'dark' ? 'light' : 'dark'} mode
      </button>
    </div>
  );
}
```

### Conditional Rendering Based on Theme

```tsx
const { theme } = useTheme();

{theme === 'dark' && <DarkModeContent />}
{theme === 'light' && <LightModeContent />}
```

## Theme CSS Variables

The theme works with CSS variables defined in `src/styles/globals.css`:

**Dark Theme Variables:**
```css
.dark-theme {
  --color-background: #0a0a12;
  --color-text-primary: #ffffff;
  --color-card-bg: rgba(15, 15, 25, 0.85);
  /* ... */
}
```

**Light Theme Variables:**
```css
.light-theme {
  --color-background: #f8f9fc;
  --color-text-primary: #1a1a2e;
  --color-card-bg: rgba(255, 255, 255, 0.95);
  /* ... */
}
```

## Storage

### localStorage Key
```typescript
localStorage.setItem('theme', 'dark' | 'light');
```

### System Preference Detection
```typescript
window.matchMedia('(prefers-color-scheme: dark)').matches
```

## Dependencies

- **react** - Context and hooks (createContext, useContext, useState, useEffect)
- **react-dom** - DOM manipulation (document.documentElement)

## Adding New Utilities

When adding new utilities to this directory:

1. Create file with descriptive name
2. Export functions/components
3. Add TypeScript types
4. Update this documentation
5. Consider client-side only code (use 'use client' directive)

### Example: API Utility

```typescript
// api.ts
'use client';

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export async function generateImages(params: ImageGenerationParams) {
  const response = await axios.post(`${API_BASE_URL}/api/images`, params);
  return response.data;
}
```

## Notes

- Theme context is client-side only (marked with 'use client')
- `mounted` state prevents hydration mismatch
- localStorage persists theme across sessions
- System preference detected on first visit only
- Theme changes update CSS variables globally
- Works with Ant Design ConfigProvider in `ThemedApp.tsx`
