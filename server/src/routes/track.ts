import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// POST /api/track/click
router.post('/click', async (req: AuthenticatedRequest, res: Response) => {
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

    // Verify the deal belongs to the scan
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, scanId },
    });
    if (!deal) {
      res.status(404).json({ error: 'Deal not found for this scan' });
      return;
    }

    const click = await prisma.$transaction(async (tx) => {
      const created = await tx.clickTracking.create({
        data: {
          userId: req.userId!,
          scanId,
          dealId,
          retailer,
          price,
        },
      });

      await tx.user.update({
        where: { id: req.userId! },
        data: { totalClicks: { increment: 1 } },
      });

      return created;
    });

    res.json(click);
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

export default router;
