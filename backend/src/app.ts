import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import ideaRoutes from './routes/ideaRoutes';
import userRoutes from './routes/userRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import ratingRoutes from './routes/ratingRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Idea routes (includes feedback and rating routes)
  app.use('/api/ideas', ideaRoutes);
  app.use('/api/ideas', feedbackRoutes);
  app.use('/api/ideas', ratingRoutes);

  // User routes
  app.use('/api/users', userRoutes);

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
}
