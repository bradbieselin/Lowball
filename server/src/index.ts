import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { authMiddleware } from './middleware/auth';
import { generalLimiter } from './middleware/rateLimit';
import prisma from './lib/prisma';
import scanRoutes from './routes/scan';
import userRoutes from './routes/user';
import trackRoutes from './routes/track';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Apply general rate limit to all routes
app.use(generalLimiter);

// Health check (no auth)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes — scan routes get the stricter scanLimiter on POST
app.use('/api/scan', authMiddleware, scanRoutes);
app.use('/api/scans', authMiddleware, scanRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/track', authMiddleware, trackRoutes);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
