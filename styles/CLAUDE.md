# CLAUDE.md - styles/

**Note**: This directory is no longer actively used. The application has been migrated to use Ant Design for all UI components and styling.

## Previous Contents

This directory previously contained:
- `globals.css` - Global CSS styles (removed)
- `Home.module.css` - Component-scoped styles (removed)

## Current Styling Approach

The application now uses **Ant Design** for all UI components and styling:
- Components: `Button`, `Input`, `Select`, `Card`, `Image`, `Modal`, `Alert`, `Spin`, etc.
- Layout: `Row`, `Col`, `Space` for responsive grid layouts
- Theme: Custom theme configured in `pages/_app.tsx` with ConfigProvider
- Primary color: `#5f9ea0` (cadetblue)
- Typography: `Typography.Title`, `Typography.Text` components
- Icons: `@ant-design/icons` package

## Theme Configuration

The Ant Design theme is configured in `pages/_app.tsx`:

```typescript
import { ConfigProvider, theme as antTheme } from 'antd';

const customTheme = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#5f9ea0', // cadetblue
    borderRadius: 6,
  },
};
```

For styling changes, modify the Ant Design theme tokens or use Ant Design's built-in style props (e.g., `style` prop on components).
