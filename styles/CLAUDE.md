# CLAUDE.md - styles/

This directory contains all CSS styling for the application.

## Files

### `globals.css`
Global CSS styles imported in `pages/_app.js`. Contains base styles applied to the entire application.

### `Home.module.css`
CSS Module (component-scoped styles) for `pages/index.js`.

**Classes**:
- `.container` - Main page container
- `.main` - Main content area
- `.title` - Page title styling
- `.titleColor` - Colored accent for "DALL-E 3" text
- `.description` - Prompt input area styling
- `.grid` - Results grid layout
- `.card` - Individual image card
- `.imgPreview` - Preview image styling with click-to-download
- `.error` - Error message display

## Usage

CSS Modules are imported in React components:
```javascript
import styles from "../styles/Home.module.css";
// Used as: className={styles.container}
```

Global styles are imported once in `_app.js`:
```javascript
import '../styles/globals.css'
```
