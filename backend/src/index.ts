import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import accountRoutes from './routes/accountRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import documentRoutes from './routes/documentRoutes';
import tagRoutes from './routes/tagRoutes';
import aiRoutes from './routes/aiRoutes';
import importRoutes from './routes/importRoutes';
import reportRoutes from './routes/reportRoutes';
import { userContextMiddleware, ensureDefaultUser } from './middleware/userContext';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Home Budget Manager API is running' });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Home Budget Manager API',
    version: '1.0.0'
  });
});

// Apply user context middleware to all API routes
// This attaches req.userId to all requests for user-specific data access
// TODO: Replace with JWT authentication middleware when multi-user auth is implemented
app.use('/api', userContextMiddleware);

// Account routes
app.use('/api/accounts', accountRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// Tag routes
app.use('/api/tags', tagRoutes);

// Document routes
app.use('/api/documents', documentRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Import routes
app.use('/api/import', importRoutes);

// Report routes
app.use('/api/reports', reportRoutes);

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

// Start server
initializeApp().then(() => {
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
});

export default app;
