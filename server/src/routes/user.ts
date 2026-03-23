import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/user/profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/user/profile — update email
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { email },
    });
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/user/stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        totalScans: true,
        totalSavings: true,
        totalClicks: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const dealsCount = await prisma.deal.count({
      where: { scan: { userId: req.userId! } },
    });

    res.json({ ...user, dealsFound: dealsCount });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/track/click
router.post('/track/click', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scanId, dealId, retailer, price } = req.body;
    if (!scanId || !dealId || !retailer || price == null) {
      res.status(400).json({ error: 'scanId, dealId, retailer, and price are required' });
      return;
    }
    if (typeof scanId !== 'string' || typeof dealId !== 'string' || typeof retailer !== 'string' || typeof price !== 'number') {
      res.status(400).json({ error: 'Invalid parameter types' });
      return;
    }
    if (retailer.length > 100 || price < 0 || price > 999999) {
      res.status(400).json({ error: 'Invalid parameter values' });
      return;
    }

    // Verify the scan belongs to this user
    const scan = await prisma.scan.findFirst({
      where: { id: scanId, userId: req.userId! },
    });
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    const click = await prisma.clickTracking.create({
      data: {
        userId: req.userId!,
        scanId,
        dealId,
        retailer,
        price,
      },
    });

    await prisma.user.update({
      where: { id: req.userId! },
      data: { totalClicks: { increment: 1 } },
    });

    res.json(click);
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
