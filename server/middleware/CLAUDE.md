# CLAUDE.md - server/middleware/

This file provides guidance to Claude Code (claude.ai/code) when working with Express middleware.

## Purpose

This directory contains Express middleware for centralized error handling across all API routes.

## File Structure

```
server/middleware/
└── error.ts    # Centralized error handling middleware
```

## Middleware

### `error.ts` - Error Handler

**Purpose:** Catches and formats errors from all API routes, returning consistent error responses.

#### Exported Functions

##### `errorHandler(err: Error, req: Request, res: Response, next: NextFunction)`
Express error handling middleware.

**Signature:**
```typescript
function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void
```

**Features:**
- Logs error details to console
- Returns JSON error responses
- Distinguishes between client and server errors
- Prevents leaking sensitive information

**Error Response Format:**
```typescript
{
  error: string;      // Error message
  status?: number;    // HTTP status code (if applicable)
}
```

#### Error Classification

| Error Type | Status Code | Response |
|------------|-------------|----------|
| `TypeError` (route not found) | 404 | Resource not found |
| Validation errors | 400 | Bad request |
| API errors | 500 | Internal server error |
| Unknown errors | 500 | Internal server error |

#### Usage in Server

```typescript
// In server/index.ts
import { errorHandler } from './middleware/error';

// After all routes
app.use(errorHandler);

// This catches errors from:
// - /api/config
// - /api/images
// - /api/download
// - All other routes
```

## Error Handling Pattern

### Throwing Errors in Routes

```typescript
// In route handlers
router.post('/api/images', async (req, res, next) => {
  try {
    // Route logic
    const result = await generateImages(req.body);
    res.json({ result });
  } catch (error) {
    // Pass to error handler
    next(error);
  }
});
```

### Custom Error Classes

You can create custom error classes for specific error types:

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// In route
if (!req.body.prompt) {
  throw new ValidationError('Prompt is required');
}
```

## Error Response Examples

### Client Error (4xx)

```json
{
  "error": "Prompt is required and must be between 1 and 4000 characters."
}
```

### Server Error (5xx)

```json
{
  "error": "Internal server error"
}
```

### Not Found (404)

```json
{
  "error": "Resource not found"
}
```

## Security Considerations

The error handler:
- **Never** leaks stack traces to clients
- **Never** exposes internal file paths
- **Never** reveals environment variable values
- Logs detailed errors server-side for debugging

## Dependencies

- **express** - Express types (Request, Response, NextFunction)
- **morgan** - HTTP request logger (logs errors)

## Adding New Middleware

When adding new middleware:

1. Create file in this directory
2. Export middleware function
3. Import and use in `server/index.ts`
4. Add documentation here
5. Follow naming convention: `{purpose}.ts`

### Example: Rate Limiting

```typescript
// rate-limit.ts
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// In server/index.ts
import { rateLimiter } from './middleware/rate-limit';

app.use('/api/', rateLimiter);
```

## Notes

- Error handler should be last middleware (after all routes)
- Use `next(error)` to pass errors to the handler
- Errors are logged with morgan for monitoring
- All errors return JSON responses
- Type-safe with TypeScript strict mode
