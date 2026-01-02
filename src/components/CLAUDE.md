# CLAUDE.md - src/components/

This file provides guidance to Claude Code (claude.ai/code) when working with React components.

## Purpose

This directory contains reusable React components for the DALL-E 3 Web UI. All components use TypeScript strict mode and integrate with Ant Design for styling.

## Components Overview

| Component | Purpose | Props |
|-----------|---------|-------|
| `ThemedApp.tsx` | Ant Design ConfigProvider wrapper | `children: ReactNode` |
| `ThemeToggle.tsx` | Dark/light mode toggle button | None |
| `ValidationDialog.tsx` | Configuration error modal | `errors: string[]` |

## Component Details

### `ThemedApp.tsx`

**Purpose:** Wraps the application with Ant Design ConfigProvider for dynamic theming.

**Props:**
```typescript
interface ThemedAppProps {
  children: React.ReactNode;
}
```

**Features:**
- Applies Ant Design theme tokens
- Switches between dark/light algorithms
- Custom color configuration (primary: #a855f7 purple)
- Component-specific token overrides

**Theme Configuration:**
- Primary color: `#a855f7` (purple)
- Dark background: `#0a0a12`
- Light background: `#f8f9fc`
- Border radius: 12px

**Usage:**
```tsx
<ThemedApp>
  <App />
</ThemedApp>
```

**Note:** This component was migrated from Next.js AppProps pattern to accept children directly.

---

### `ThemeToggle.tsx`

**Purpose:** Animated toggle button for switching between dark and light themes.

**State:** Uses `useTheme()` hook from `lib/theme.tsx`

**Features:**
- Smooth Framer Motion animations (scale, opacity)
- Sun icon for light mode, moon icon for dark mode
- Hover and tap animations
- Positioned in top-right corner
- Updates both React state and DOM classes

**Animation Details:**
```typescript
// Scale animation on hover/tap
scale: hovered ? 1.1 : 1

// Opacity transition
opacity: isDark ? 0 : 1 (sun)
opacity: isDark ? 1 : 0 (moon)
```

**Theme Persistence:**
- Saves preference to localStorage
- Respects system preference on first visit
- Updates `html` element class (`dark-theme`/`light-theme`)

**Usage:**
```tsx
import { ThemeToggle } from './components/ThemeToggle';

<ThemeToggle />
```

---

### `ValidationDialog.tsx`

**Purpose:** Modal dialog for displaying configuration errors to users.

**Props:**
```typescript
interface ValidationDialogProps {
  errors: string[];
  open: boolean;
  onClose: () => void;
}
```

**Features:**
- Ant Design Modal component
- Lists all validation errors
- Clear title and instructions
- "OK" button to dismiss
- Warning icon styling

**Error Display:**
- Each error rendered as a list item
- Styled with red color for visibility
- Scrollable for long error lists

**Usage:**
```tsx
import { ValidationDialog } from './components/ValidationDialog';

<ValidationDialog
  errors={['OPENAI_API_KEY is required', 'OPENAI_BASE_URL is required']}
  open={hasErrors}
  onClose={() => setShowErrors(false)}
/>
```

**Common Errors:**
- Missing `OPENAI_API_KEY`
- Invalid `OPENAI_BASE_URL`
- Missing environment variables

---

## Common Patterns

### Ant Design Integration

All components use Ant Design components with custom theming:

```tsx
import { Modal, Button } from 'antd';

<Modal
  title="Title"
  open={open}
  onCancel={onClose}
  footer={<Button onClick={onClose}>OK</Button>}
>
  {children}
</Modal>
```

### Framer Motion Animations

Used for smooth transitions:

```tsx
import { motion } from 'framer-motion';

<motion.div
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  {children}
</motion.div>
```

### TypeScript Props

All components use TypeScript interfaces:

```tsx
interface ComponentProps {
  // prop definitions
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // component logic
}
```

## Dependencies

- **react** 19.2.3 - Component library
- **antd** 6.1.3 - UI components
- **framer-motion** 12.23.26 - Animations
- **../lib/theme** - Theme context hook
- **../../types** - Shared TypeScript types

## Notes

- All components are functional components (no classes)
- TypeScript strict mode is enabled
- No Next.js-specific code (fully migrated)
- Components are server-side render compatible
- Theme switching updates CSS variables globally
