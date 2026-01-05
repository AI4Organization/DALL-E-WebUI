# CLAUDE.md - styles/

This directory contains global CSS styles and Tailwind CSS configuration for the OpenDia application.

## Structure

```
src/styles/
  globals.css        # Global styles with Tailwind CSS import and theme variables
  CLAUDE.md          # This file
```

## Current Styling Approach

The application uses a **hybrid styling approach** combining:

1. **Tailwind CSS 4.x** - Utility-first CSS framework
2. **Ant Design** - Component library with theming
3. **Custom CSS Variables** - For theme-aware dynamic styling
4. **Framer Motion** - For smooth animations

## Global CSS (`globals.css`)

### Tailwind CSS Import
```css
@import "tailwindcss";
```

### Theme System
The CSS provides comprehensive dark/light theme support through CSS custom properties:

#### Dark Theme Variables
- Background: `#0a0a12`
- Card background: `rgba(15, 15, 25, 0.85)` (glass effect)
- Text colors: White with varying opacity levels
- Glass morphism effects with backdrop blur

#### Light Theme Variables
- Background: `#f8f9fc`
- Card background: `rgba(255, 255, 255, 0.95)` (glass effect)
- Text colors: Dark slate with varying opacity
- Glass morphism effects

### Custom Animations

```css
@keyframes float     /* Floating animation */
@keyframes pulseGlow /* Pulsing glow effect */
@keyframes shimmer   /* Shimmer effect for buttons */
@keyframes blob      /* Blob morphing animation */
```

### Utility Classes

| Class | Purpose |
|-------|---------|
| `.glass-card` | Glass morphism card with blur (8px border-radius) |
| `.glass-input` | Glass effect input fields (6px border-radius) |
| `.gradient-text` | Purple-pink-cyan gradient text |
| `.bg-gradient-mesh` | Conic gradient mesh background |
| `.bg-gradient-glow` | Linear gradient glow background |
| `.glow-button` | Button with shimmer hover effect |
| `.button-primary` | Primary button with 4px border-radius |
| `.button-secondary` | Secondary button with 4px border-radius |
| `.pill` | Pill-shaped container with 16px border-radius |
| `.line-clamp-3` | Limit text to 3 lines |

### Border Radius Design System

The application uses a graduated border-radius scale to create visual hierarchy:

| Element Type | Border Radius | CSS Variable | Usage |
|-------------|---------------|--------------|-------|
| Buttons (primary & secondary) | 4px | `var(--radius-button-primary/secondary)` | All action buttons |
| Inputs | 6px | `var(--radius-input)` | Text inputs, selects, number inputs |
| Cards | 8px | `var(--radius-card)` | Image result cards |
| Modals | 12px | `var(--radius-modal)` | Modal containers |
| Badges | 12px | `var(--radius-badge)` | Status badges, floating controls |
| Pills | 16px | `var(--radius-pill)` | Pill-shaped elements |
| Circular | 9999px | `var(--radius-circular)` | Avatars, scrollbar thumb |

**Design Principles:**
- Subtle radii (4px) for interactive elements create professional appearance
- Medium radii (6px-8px) for inputs and cards balance refinement with approachability
- Larger radii (12px+) for containers and decorative elements
- Circular elements (9999px) for avatars and purely decorative items

### Ant Design Overrides

The CSS includes extensive Ant Design dropdown styling for both dark and light themes:
- Custom background colors
- Theme-aware hover states
- Selected item highlighting with purple accent
- Portal-rendered dropdown support (`.dark-select-dropdown`, `.light-select-dropdown`)

### Custom Scrollbar

Gradient scrollbar (purple to pink) with hover effect:
```css
::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #a855f7, #ec4899);
}
```

## Tailwind CSS Configuration

Located in `tailwind.config.js`:
- Custom animations
- Custom colors (purple accent, cyan accent, pink accent)
- Custom font families (Outfit for display, Inter for body)

## Theme Toggle

Themes are switched by adding/removing classes on the `html` element:
- `.dark-theme` - Activates dark mode
- `.light-theme` - Activates light mode

This is handled by `lib/theme.tsx` via the `ThemeProvider` component.

## Color Palette

### Primary Colors
- **Purple**: `#a855f7` (main accent)
- **Cyan**: `#22d3d3` (secondary accent)
- **Pink**: `#ec4899` (tertiary accent)

### Theme Variables
All colors use CSS variables for easy theme switching:
- `--color-background`
- `--color-card-bg`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-text-muted`
- `--color-glass-border`
- `--color-input-bg`
- `--color-input-border`

Border radius scale variables (consistent across themes):
- `--radius-button-primary: 4px`
- `--radius-button-secondary: 4px`
- `--radius-input: 6px`
- `--radius-card: 8px`
- `--radius-modal: 12px`
- `--radius-badge: 12px`
- `--radius-pill: 16px`
- `--radius-circular: 9999px`

## Notes

- Glass morphism effects use `backdrop-filter: blur()` for depth
- All transitions use `0.3s` speed for consistency
- `!important` is used strategically for theme variables to ensure proper inheritance
- The styles support both client-side and server-side rendering
- Ant Design theme configuration is handled in `components/ThemedApp.tsx`
