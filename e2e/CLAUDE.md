# CLAUDE.md - e2e/

This file provides guidance to Claude Code (claude.ai/code) when working with end-to-end tests.

## Purpose

This directory contains Playwright end-to-end tests for the DALL-E 3 Web UI. E2E tests verify the entire application flow from the user's perspective, testing real browser interactions.

## Test Configuration

**Configuration File:** `playwright.config.ts`

**Key Settings:**
- **Browser:** Chromium (default)
- **Base URL:** `http://localhost:3000` (frontend dev server)
- **Timeout:** 30 seconds for actions
- **Retries:** 0 (disabled)
- **Screenshot Directory:** `e2e/screenshots/`
- **Trace Directory:** `e2e/traces/`

**Test Environment:**
- Tests run in headless mode by default
- Can run in headed mode for debugging with `npm run test:e2e:debug`
- Screenshot on failure is enabled
- Video recording is enabled

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in debug mode (headed browser)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/image-generation.spec.ts

# Run with UI mode (interactive test runner)
npx playwright test --ui
```

**Prerequisites:**
- Frontend dev server must be running on port 3000 (`npm run dev:rsbuild`)
- Backend API server must be running on port 3001 (`npm run dev:backend`)
- Valid `OPENAI_API_KEY` in `.env` file

## Test Structure

```
e2e/
├── example.spec.ts          # Example/demo test
└── screenshots/             # Failure screenshots (auto-generated)
```

## Writing E2E Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to page before each test
    await page.goto('/');
  });

  test('does something', async ({ page }) => {
    // Arrange
    const element = page.locator('selector');

    // Act
    await element.click();

    // Assert
    await expect(element).toBeVisible();
  });
});
```

### Common Playwright Patterns

#### Page Navigation
```typescript
await page.goto('/');
await page.waitForLoadState('networkidle');
```

#### Filling Inputs
```typescript
// Textarea
await page.fill('textarea[placeholder*="prompt"]', 'A cat sleeping');

// Number input
await page.fill('input[type="number"]', '4');
```

#### Select Dropdowns
```typescript
// By visible text
await page.selectOption('select', 'DALL-E 3');

// By value
await page.selectOption('select', { value: 'dall-e-3' });
```

#### Clicking Buttons
```typescript
await page.click('button:has-text("Generate")');
await page.click('button[type="button"]');
```

#### Waiting for Elements
```typescript
// Wait for element to appear
await page.waitForSelector('img[alt*="Generated"]', { timeout: 30000 });

// Wait for condition
await page.waitForURL('**/success');

// Wait for load state
await page.waitForLoadState('domcontentloaded');
```

#### Assertions
```typescript
// Element visibility
await expect(page.locator('.my-element')).toBeVisible();

// Element count
await expect(page.locator('img').toHaveCount(4);

// Text content
await expect(page.locator('h1')).toHaveText('Title');

// Attribute value
await expect(page.locator('input')).toHaveValue('text');
```

#### Handling Async Operations
```typescript
// Wait for API call completion
await Promise.all([
  page.waitForResponse(resp => resp.url().includes('/api/images')),
  page.click('button:has-text("Generate")'),
]);

// Wait for multiple images
await page.waitForSelector('img[alt*="Generated"]', { timeout: 60000 });
```

#### Taking Screenshots
```typescript
await page.screenshot({ path: 'screenshot.png' });
await page.screenshot({ path: 'full-page.png', fullPage: true });
```

## Page Objects Pattern

For complex interactions, consider using page objects:

```typescript
// e2e/pages/AppPage.ts
export class AppPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  async setPrompt(text: string) {
    await this.page.fill('textarea[placeholder*="prompt"]', text);
  }

  async selectModel(model: string) {
    await this.page.selectOption('select', model);
  }

  async generateImages() {
    await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/api/images')),
      this.page.click('button:has-text("Generate")'),
    ]);
  }

  async waitForImages() {
    await this.page.waitForSelector('img[alt*="Generated"]', { timeout: 60000 });
  }

  async getImageCount() {
    return await this.page.locator('img[alt*="Generated"]').count();
  }
}
```

Usage:
```typescript
import { test, expect } from '@playwright/test';
import { AppPage } from './pages/AppPage';

test('generates images', async ({ page }) => {
  const app = new AppPage(page);

  await app.goto();
  await app.setPrompt('A cat');
  await app.selectModel('dall-e-3');
  await app.generateImages();
  await app.waitForImages();

  const count = await app.getImageCount();
  expect(count).toBeGreaterThan(0);
});
```

## Selectors

Use semantic, resilient selectors:

| Selector Type | Example | Notes |
|---------------|---------|-------|
| By text | `button:has-text("Generate")` | Prefers user-visible text |
| By role | `page.getByRole('button')` | Most semantic |
| By label | `page.getByLabel('Email')` | Form inputs |
| By placeholder | `page.getByPlaceholder('prompt')` | Input fields |
| By alt text | `page.getByAltText('Generated')` | Images |
| By test id | `page.getByTestId('submit')` | Most reliable |
| CSS selector | `.my-class` | Less resilient |

**Preferred approach:** Use text, role, and label selectors over CSS classes.

## Test Scenarios

### Image Generation Flow
```typescript
test('generates an image successfully', async ({ page }) => {
  await page.goto('/');

  // Enter prompt
  await page.fill('textarea[placeholder*="prompt"]', 'A cat on windowsill');

  // Click generate
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/images')),
    page.click('button:has-text("Generate")'),
  ]);

  // Wait for result
  await page.waitForSelector('img[alt*="Generated"]', { timeout: 60000 });

  // Verify image exists
  const images = await page.locator('img[alt*="Generated"]').count();
  expect(images).toBeGreaterThan(0);
});
```

### Model Switching
```typescript
test('switches between models', async ({ page }) => {
  await page.goto('/');

  // Switch to DALL-E 2
  await page.selectOption('select', 'DALL-E 2');

  // Verify quality shows only Standard option
  const qualityOptions = await page.locator('select[aria-label*="Quality"] option').count();
  expect(qualityOptions).toBe(1);
});
```

### Theme Toggle
```typescript
test('toggles dark/light theme', async ({ page }) => {
  await page.goto('/');

  // Click theme toggle
  await page.click('[aria-label*="theme"]');

  // Check for dark theme class
  const html = page.locator('html');
  await expect(html).toHaveClass(/dark-theme/);
});
```

### Error Handling
```typescript
test('shows error on invalid API key', async ({ page }) => {
  // Set invalid API key (would need to mock or configure)

  await page.goto('/');
  await page.fill('textarea[placeholder*="prompt"]', 'Test');
  await page.click('button:has-text("Generate")');

  // Wait for error toast
  await page.waitForSelector('.sonner-toast');

  // Verify error message
  const toast = page.locator('.sonner-toast');
  await expect(toast).toContainText('error');
});
```

## Debugging

### Debug Mode

Run tests with headed browser to see what's happening:

```bash
npm run test:e2e:debug
```

### Screenshots on Failure

Screenshots are automatically saved to `e2e/screenshots/` on test failure.

### Manual Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### Slow Motion

```typescript
test.slow(); // Slows down all actions by factor
```

### Step-by-Step Execution

```bash
npx playwright test --debug
```

## Trace Viewer

View traces after test run:

```bash
npx playwright show-trace e2e/traces/[trace-name].zip
```

## Best Practices

1. **Wait for the right thing**
   - Use `waitForResponse` for API calls
   - Use `waitForSelector` for DOM elements
   - Avoid `setTimeout` (brittle)

2. **Use resilient selectors**
   - Prefer user-visible text over CSS classes
   - Use data-testid for elements with no visible text
   - Avoid implementation-detail selectors

3. **Test user behavior**
   - Test what users see and do
   - Avoid testing internal implementation
   - Use real user workflows

4. **Keep tests independent**
   - Each test should work in isolation
   - Clean up state in `beforeEach` or `afterEach`

5. **Use descriptive test names**
   - Should describe what is being tested
   - Should describe the expected outcome

## CI/CD Integration

E2E tests should run in CI after build:

```yaml
# .github/workflows/e2e.yml example
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Dependencies

- **@playwright/test** - Playwright test runner
- **Playwright browsers** - Browser binaries (Chromium, Firefox, WebKit)
- **TypeScript** - Type definitions for tests

## Adding New Tests

When adding new E2E tests:

1. Create test file in `e2e/` directory
2. Import `test` and `expect` from Playwright
3. Use `test.describe()` for grouping related tests
4. Use descriptive test names
5. Include setup in `test.beforeEach()` if needed
6. Use page objects for complex interactions
7. Add comments for complex test scenarios
8. Update this documentation

## Notes

- E2E tests require the full application stack to be running
- Tests are slower than unit/component tests
- Use E2E tests for critical user workflows
- Keep E2E tests focused on user-visible behavior
- Screenshots are automatically captured on failure
- Video recording helps debug flaky tests
