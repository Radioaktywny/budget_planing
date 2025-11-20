import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import accountRoutes from './routes/accountRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import documentRoutes from './routes/documentRoutes';
import tagRoutes from './routes/tagRoutes';
import aiRoutes from './routes/aiRoutes';
import importRoutes from './routes/importRoutes';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import { requireAuth } from './middleware/auth';
import { ensureDefaultUser } from './middleware/userContext';
import {
  apiRateLimiter,
  sanitizeInput,
  corsOptions,
} from './middleware/security';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Security middleware
// Helmet sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for development
}));

// CORS configuration
if (process.env.NODE_ENV === 'production') {
  app.use(cors(corsOptions));
} else {
  // In development, allow all origins
  app.use(cors());
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(sanitizeInput);

// Rate limiting for API endpoints (except auth which has its own)
app.use('/api', apiRateLimiter);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Home Budget Manager API is running' });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Home Budget Manager API',
    version: '1.0.0',
    authentication: 'enabled'
  });
});

// Authentication routes (public - no authentication required)
app.use('/api/auth', authRoutes);

// Protected API routes - use JWT authentication
// Apply requireAuth middleware to all protected routes
app.use('/api/accounts', requireAuth, accountRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/categories', requireAuth, categoryRoutes);
app.use('/api/tags', requireAuth, tagRoutes);
app.use('/api/documents', requireAuth, documentRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/import', requireAuth, importRoutes);
app.use('/api/reports', requireAuth, reportRoutes);

// Legacy routes with userContextMiddleware for backward compatibility
// These will be deprecated once frontend is updated to use authentication
// Uncomment these if you need backward compatibility during migration
// app.use('/api/legacy', userContextMiddleware);
// app.use('/api/legacy/accounts', accountRoutes);
// app.use('/api/legacy/transactions', transactionRoutes);
// ... etc

// Initialize application
async function initializeApp() {
  try {
    // Ensure default user exists in database
    await ensureDefaultUser();
    console.log('✓ Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeApp().then(() => {
    app.listen(port, () => {
      console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
    });
  });
} else {
  // Initialize app for tests without starting the server
  initializeApp();
}

export default app;
