import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import accountRoutes from './routes/accountRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import documentRoutes from './routes/documentRoutes';
import aiRoutes from './routes/aiRoutes';
import importRoutes from './routes/importRoutes';
import reportRoutes from './routes/reportRoutes';

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

// Account routes
app.use('/api/accounts', accountRoutes);

// Transaction routes
app.use('/api/transactions', transactionRoutes);

// Category routes
app.use('/api/categories', categoryRoutes);

// Document routes
app.use('/api/documents', documentRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Import routes
app.use('/api/import', importRoutes);

// Report routes
app.use('/api/reports', reportRoutes);

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export default app;
