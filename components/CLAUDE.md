# CLAUDE.md - components/

This directory contains reusable React components for the DALL-E 3 Web UI application.

## Components

### `ThemedApp.tsx`
**Purpose**: Main app wrapper that provides Ant Design ConfigProvider with dynamic theme configuration.

**Features**:
- Wraps the entire app with Ant Design's `ConfigProvider`
- Dynamically switches between light and dark Ant Design algorithms
- Configures comprehensive theme tokens for both light and dark modes
- Component-specific theme overrides (Select, Modal, Input, Card, Image)

**Theme Configuration**:
- Primary color: `#a855f7` (purple)
- Border radius: 12px
- Light mode background: `#f8f9fc`
- Dark mode background: `#0a0a12`
- Glass-morphism effects on containers

**Usage**:
```tsx
import { ThemedApp } from '../components/ThemedApp';

<ThemeProvider>
  <ThemedApp {...appProps} />
</ThemeProvider>
```

### `ThemeToggle.tsx`
**Purpose**: Animated toggle button for switching between dark and light themes.

**Features**:
- Fixed position button in top-right corner
- Smooth Framer Motion animations for sun/moon icons
- Glass-morphism styling with backdrop blur
- Hover and tap animations (scale effects)
- Accessible aria-labels for screen readers

**Icons**:
- Sun icon (yellow): Active in light mode
- Moon icon (purple): Active in dark mode
- Icons rotate and fade in/out during theme transitions

**Styling**:
- Circular button (3.5rem diameter)
- Uses CSS custom properties for theme colors
- Box shadow for depth
- Border with glass effect

**Usage**:
```tsx
import { ThemeToggle } from '../components/ThemeToggle';

// Render in your app for theme switching
<ThemeToggle />
```

### `ValidationDialog.tsx`
**Purpose**: Modal dialog for displaying configuration validation errors to users.

**Features**:
- Ant Design Modal integration
- Displays error title and details
- User-friendly error messages
- OK button to dismiss

**Usage**:
```tsx
import { ValidationDialog } from '../components/ValidationDialog';

<ValidationDialog
  visible={hasError}
  title="Configuration Error"
  details={errorMessages}
  onClose={handleClose}
/>
```

## Dependencies

- **Ant Design**: UI component library (`antd`)
- **Framer Motion**: Animation library (`framer-motion`)
- **React**: UI library (`react`)
- **Theme Context**: From `../lib/theme.tsx`

## Client-Side Components

All components in this directory use `'use client'` directive since they:
- Use React hooks (useState, useEffect, useContext)
- Require browser APIs (localStorage)
- Handle user interactions
- Use Framer Motion animations

## Styling Approach

- **Ant Design**: Primary UI framework
- **Inline Styles**: For dynamic theme values
- **CSS Variables**: Used in ThemeToggle for theme-aware colors
- **Framer Motion**: For smooth animations and transitions

## Notes

- All components are TypeScript with proper type annotations
- Components use the `useTheme` hook from `lib/theme.tsx`
- Theme state is managed by ThemeProvider in `pages/_app.tsx`
- Theme preference persists in localStorage
