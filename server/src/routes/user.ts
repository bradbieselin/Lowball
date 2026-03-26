import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

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
    // Update email in Supabase Auth first
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      req.userId!,
      { email }
    );
    if (authError) {
      console.error('Supabase auth email update error:', authError);
      res.status(500).json({ error: 'Failed to update email in auth system' });
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

// POST /api/user/sync-subscription
// Verifies the user's entitlement with RevenueCat before updating the subscription status.
router.post('/sync-subscription', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || typeof status !== 'string' || !['free', 'pro'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be "free" or "pro".' });
      return;
    }

    // Server-side verification: check RevenueCat for the user's actual entitlements
    const rcApiKey = process.env.REVENUECAT_API_KEY;
    if (status === 'pro' && !rcApiKey) {
      res.status(503).json({ error: 'Purchase verification is not configured. Cannot upgrade.' });
      return;
    }
    if (rcApiKey && status === 'pro') {
      try {
        const rcRes = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${req.userId}`,
          { headers: { Authorization: `Bearer ${rcApiKey}` } }
        );
        if (rcRes.ok) {
          const rcData = await rcRes.json() as any;
          const adFree = rcData?.subscriber?.entitlements?.ad_free;
          if (!adFree || !adFree.is_active) {
            res.status(403).json({ error: 'No active ad_free entitlement found. Purchase not verified.' });
            return;
          }
        } else {
          console.error('RevenueCat API error:', rcRes.status);
          // If RevenueCat is unreachable, reject the upgrade to be safe
          res.status(502).json({ error: 'Unable to verify purchase. Please try again.' });
          return;
        }
      } catch (rcError) {
        console.error('RevenueCat verification failed:', rcError);
        res.status(502).json({ error: 'Unable to verify purchase. Please try again.' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { subscriptionStatus: status },
    });
    res.json({ subscriptionStatus: user.subscriptionStatus });
  } catch (error) {
    console.error('Sync subscription error:', error);
    res.status(500).json({ error: 'Failed to sync subscription' });
  }
});

// GET /api/user/saved-scans
router.get('/saved-scans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const [savedScans, total] = await Promise.all([
      prisma.savedScan.findMany({
        where: { userId: req.userId! },
        include: {
          scan: {
            include: { deals: { orderBy: { price: 'asc' }, take: 1 } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.savedScan.count({ where: { userId: req.userId! } }),
    ]);

    res.json({
      savedScans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get saved scans error:', error);
    res.status(500).json({ error: 'Failed to fetch saved scans' });
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

// DELETE /api/user/account — permanently delete user and all data
router.delete('/account', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Delete from app_users first (cascades to scans, deals, saved_scans, click_tracking)
    await prisma.user.delete({ where: { id: req.userId! } });

    // Delete from Supabase Auth
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.userId!);
    if (error) {
      console.error('Supabase auth delete error:', error);
      // Data is already deleted from our DB, so still return success
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
