import { getJson } from 'serpapi';

// Affiliate tag config — add new programs via env vars
const AFFILIATE_TAGS: Record<string, string | undefined> = {
  amazon: process.env.AMAZON_AFFILIATE_TAG,
  walmart: process.env.WALMART_AFFILIATE_ID,
  ebay: process.env.EBAY_AFFILIATE_ID,
  target: process.env.TARGET_AFFILIATE_ID,
  bestbuy: process.env.BESTBUY_AFFILIATE_ID,
};

function applyAffiliateLink(url: string, retailer: string): string {
  const r = retailer.toLowerCase();

  // Amazon
  if ((r.includes('amazon') || url.includes('amazon.')) && AFFILIATE_TAGS.amazon) {
    try {
      const u = new URL(url);
      u.searchParams.set('tag', AFFILIATE_TAGS.amazon);
      return u.toString();
    } catch {
      return url + (url.includes('?') ? '&' : '?') + `tag=${AFFILIATE_TAGS.amazon}`;
    }
  }

  // eBay
  if ((r.includes('ebay') || url.includes('ebay.')) && AFFILIATE_TAGS.ebay) {
    try {
      const u = new URL(url);
      u.searchParams.set('mkcid', '1');
      u.searchParams.set('mkrid', AFFILIATE_TAGS.ebay);
      return u.toString();
    } catch {
      return url;
    }
  }

  // Walmart
  if ((r.includes('walmart') || url.includes('walmart.')) && AFFILIATE_TAGS.walmart) {
    try {
      const u = new URL(url);
      u.searchParams.set('affiliates_ad_id', AFFILIATE_TAGS.walmart);
      return u.toString();
    } catch {
      return url;
    }
  }

  // Target
  if ((r.includes('target') || url.includes('target.')) && AFFILIATE_TAGS.target) {
    try {
      const u = new URL(url);
      u.searchParams.set('afid', AFFILIATE_TAGS.target);
      return u.toString();
    } catch {
      return url;
    }
  }

  // Best Buy
  if ((r.includes('best buy') || r.includes('bestbuy') || url.includes('bestbuy.')) && AFFILIATE_TAGS.bestbuy) {
    try {
      const u = new URL(url);
      u.searchParams.set('irclickid', AFFILIATE_TAGS.bestbuy);
      return u.toString();
    } catch {
      return url;
    }
  }

  return url;
}

export interface DealResult {
  retailer: string;
  retailerLogoUrl: string | null;
  productTitle: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  condition: string | null;
  productUrl: string;
  imageUrl: string | null;
  savingsAmount: number | null;
  savingsPercent: number | null;
}

export async function searchDeals(
  searchQueries: string[],
  estimatedRetailPrice: number | null
): Promise<DealResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.warn('SERPAPI_API_KEY not set — returning empty deals');
    return [];
  }

  const query = searchQueries[0] || 'product';

  try {
    const response = await getJson({
      api_key: apiKey,
      engine: 'google_shopping',
      q: query,
      google_domain: 'google.com',
      gl: 'us',
      hl: 'en',
      num: 10,
    });

    const results = response.shopping_results ?? [];

    if (results.length === 0) {
      // Try a broader query if the first one returned nothing
      if (searchQueries.length > 1) {
        const fallback = await getJson({
          api_key: apiKey,
          engine: 'google_shopping',
          q: searchQueries[1],
          google_domain: 'google.com',
          gl: 'us',
          hl: 'en',
          num: 10,
        });
        const fallbackResults = fallback.shopping_results ?? [];
        if (fallbackResults.length > 0) {
          return mapResults(fallbackResults, estimatedRetailPrice);
        }
      }
      return [];
    }

    return mapResults(results, estimatedRetailPrice);
  } catch (error) {
    console.error('SerpAPI search error:', error);
    return [];
  }
}

function mapResults(results: any[], estimatedRetailPrice: number | null): DealResult[] {
  return results
    .filter((r: any) => r.price != null)
    .map((r: any) => {
      const priceStr = typeof r.price === 'string' ? r.price : String(r.price);
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
      if (isNaN(price) || price <= 0) return null;

      const originalPrice = r.old_price
        ? parseFloat(String(r.old_price).replace(/[^0-9.]/g, ''))
        : estimatedRetailPrice;

      const savingsAmount = originalPrice && originalPrice > price ? originalPrice - price : null;
      const savingsPercent = originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null;

      // Extract retailer name from source
      const retailer = r.source || r.seller || 'Unknown Retailer';

      return {
        retailer,
        retailerLogoUrl: r.thumbnail || null,
        productTitle: r.title || 'Product',
        price,
        originalPrice: originalPrice || null,
        currency: 'USD',
        condition: r.second_hand_condition || (r.condition?.toLowerCase().includes('refurbish') ? 'Refurbished' : 'New'),
        productUrl: applyAffiliateLink(
          r.link || r.product_link || `https://www.google.com/search?q=${encodeURIComponent(r.title || '')}&tbm=shop`,
          retailer
        ),
        imageUrl: r.thumbnail || null,
        savingsAmount,
        savingsPercent,
      };
    })
    .filter((d: DealResult | null): d is DealResult => d !== null)
    .sort((a, b) => a.price - b.price)
    .slice(0, 8);
}
