import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { authMiddleware } from './middleware/auth';
import { generalLimiter, scanLimiter } from './middleware/rateLimit';
import scanRoutes from './routes/scan';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));

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
app.use('/api', authMiddleware, userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
