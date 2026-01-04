import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import configRouter from './routes/config';
import imagesRouter from './routes/images';
import downloadRouter from './routes/download';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for image data URLs
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Rate limiting middleware (prevents API abuse)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    details: ['Please slow down. Maximum 100 requests per minute.']
  }
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// API routes
app.use('/api/config', configRouter);
app.use('/api/images', imagesRouter);
app.use('/api/download', downloadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
