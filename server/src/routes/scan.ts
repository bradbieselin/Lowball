import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { scanLimiter } from '../middleware/rateLimit';
import prisma from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { identifyProduct, generateSearchQueries } from '../services/ai';
import { searchDeals } from '../services/deals';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';

const router = Router();

async function uploadImage(base64: string, userId: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  const fileName = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabaseAdmin.storage
    .from('scan-images')
    .upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.warn(`[uploadImage] Failed to upload image for user ${userId}. Scan will proceed without image.`, error);
    return '';
  }

  const { data } = supabaseAdmin.storage.from('scan-images').getPublicUrl(fileName);
  return data.publicUrl;
}

// POST /api/scan — scan a product image
router.post('/', scanLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      res.status(400).json({ error: 'imageBase64 is required' });
      return;
    }
    if (imageBase64.length > 1.4 * 1024 * 1024) {
      res.status(400).json({ error: 'Image too large (max 1MB)' });
      return;
    }

    // Validate that the base64 data is actually a JPEG image
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    if (imageBuffer.length < 3 || imageBuffer[0] !== 0xFF || imageBuffer[1] !== 0xD8) {
      res.status(400).json({ error: 'Invalid image data. Please provide a JPEG image.' });
      return;
    }

    const product = await identifyProduct(imageBase64);
    const deals = await searchDeals(product.searchQueries, product.estimatedRetailPrice);

    const imageUrl = await uploadImage(imageBase64, req.userId!);

    const scan = await prisma.$transaction(async (tx) => {
      const created = await tx.scan.create({
        data: {
          userId: req.userId!,
          imageUrl,
          productName: product.productName,
          brand: product.brand,
          model: product.model,
          category: product.category,
          attributes: product.attributes,
          estimatedRetailPrice: product.estimatedRetailPrice,
          aiConfidence: product.aiConfidence,
          searchQueries: product.searchQueries,
          deals: {
            create: deals.map((d) => ({
              retailer: d.retailer,
              retailerLogoUrl: d.retailerLogoUrl,
              productTitle: d.productTitle,
              price: d.price,
              originalPrice: d.originalPrice,
              currency: d.currency,
              condition: d.condition,
              productUrl: d.productUrl,
              imageUrl: d.imageUrl,
              savingsAmount: d.savingsAmount,
              savingsPercent: d.savingsPercent,
            })),
          },
        },
        include: { deals: true },
      });

      await tx.user.update({
        where: { id: req.userId! },
        data: { totalScans: { increment: 1 } },
      });

      return created;
    });

    res.json(scan);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process scan' });
  }
});

// GET /api/scan/:id — get scan by ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scanId = req.params.id as string;
    const scan = await prisma.scan.findFirst({
      where: { id: scanId, userId: req.userId! },
      include: { deals: { orderBy: { price: 'asc' } } },
    });

    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    res.json(scan);
  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
});

// GET /api/scans — user's scan history (paginated)
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      prisma.scan.findMany({
        where: { userId: req.userId! },
        include: { deals: { orderBy: { price: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.scan.count({ where: { userId: req.userId! } }),
    ]);

    res.json({
      scans,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get scans error:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// POST /api/scan/:id/retry — correct product name and re-search deals
router.post('/:id/retry', scanLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paramId = req.params.id as string;
    const { correctedProductName } = req.body;

    if (!correctedProductName || typeof correctedProductName !== 'string') {
      res.status(400).json({ error: 'correctedProductName is required' });
      return;
    }
    if (correctedProductName.length > 500) {
      res.status(400).json({ error: 'Product name too long' });
      return;
    }

    // Verify ownership
    const existingScan = await prisma.scan.findFirst({
      where: { id: paramId, userId: req.userId! },
    });
    if (!existingScan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    // Generate new search queries and deals BEFORE modifying DB
    const searchQueries = await generateSearchQueries(correctedProductName, existingScan.category);
    const estimatedPrice = existingScan.estimatedRetailPrice
      ? Number(existingScan.estimatedRetailPrice)
      : null;
    const deals = await searchDeals(searchQueries, estimatedPrice);

    // Atomically delete old deals + update scan + create new deals
    const updatedScan = await prisma.$transaction(async (tx) => {
      await tx.deal.deleteMany({ where: { scanId: paramId } });
      return tx.scan.update({
        where: { id: paramId },
        data: {
          productName: correctedProductName,
          aiConfidence: -1, // indicates user_corrected
          searchQueries,
          deals: {
            create: deals.map((d) => ({
              retailer: d.retailer,
              retailerLogoUrl: d.retailerLogoUrl,
              productTitle: d.productTitle,
              price: d.price,
              originalPrice: d.originalPrice,
              currency: d.currency,
              condition: d.condition,
              productUrl: d.productUrl,
              imageUrl: d.imageUrl,
              savingsAmount: d.savingsAmount,
              savingsPercent: d.savingsPercent,
            })),
          },
        },
        include: { deals: { orderBy: { price: 'asc' } } },
      });
    });

    res.json(updatedScan);
  } catch (error) {
    console.error('Retry scan error:', error);
    res.status(500).json({ error: 'Failed to retry scan' });
  }
});

// POST /api/scan/:id/save — bookmark a scan
router.post('/:id/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paramId = req.params.id as string;
    // Verify the scan belongs to this user before saving
    const scan = await prisma.scan.findFirst({
      where: { id: paramId, userId: req.userId! },
    });
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }
    const savedScan = await prisma.savedScan.create({
      data: { userId: req.userId!, scanId: paramId },
    });
    res.json(savedScan);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Scan already saved' });
      return;
    }
    console.error('Save scan error:', error);
    res.status(500).json({ error: 'Failed to save scan' });
  }
});

// DELETE /api/scan/:id/save — remove bookmark
router.delete('/:id/save', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paramId = req.params.id as string;
    await prisma.savedScan.deleteMany({
      where: { userId: req.userId!, scanId: paramId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Unsave scan error:', error);
    res.status(500).json({ error: 'Failed to unsave scan' });
  }
});

export default router;
