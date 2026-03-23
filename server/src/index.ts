import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { authMiddleware } from './middleware/auth';
import scanRoutes from './routes/scan';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many scan requests, please try again later' },
});

const clickLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests' },
});

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
app.use('/api/scan', authMiddleware, scanLimiter, scanRoutes);
app.use('/api/scans', authMiddleware, scanRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api', authMiddleware, clickLimiter, userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
