import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Ensure app_users record exists (auto-create on first API call)
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {},
      create: {
        id: data.user.id,
        email: data.user.email || '',
      },
    });

    req.userId = data.user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication failed' });
  }
}
