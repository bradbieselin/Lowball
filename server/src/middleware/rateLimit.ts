import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import type { AuthenticatedRequest } from './auth'; // used by scanLimiter

// Strictest — protects paid API calls (OpenAI + SerpAPI)
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthenticatedRequest;
    return authReq.userId || req.ip || 'anon';
  },
  message: { error: "You're scanning too fast. Please wait a moment and try again." },
});

// Moderate — baseline for all API routes
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator: (req: Request) => {
    return req.ip || 'anon';
  },
  message: { error: 'Too many requests. Please slow down.' },
});

// Auth — prevents brute force (keyed by IP, longer window)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many attempts. Please try again later.' },
});
