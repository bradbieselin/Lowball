import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  const query = searchQueries[0] || 'product';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `You are a shopping deal finder. Given a product search query and estimated retail price, return realistic current deals from major US retailers as a JSON array. Each deal must have these fields:
- retailer: store name (use real stores: Amazon, Walmart, Target, Best Buy, eBay, Costco, etc.)
- productTitle: the product listing title on that retailer
- price: your best estimate of the current selling price as a number (be as accurate as possible based on your training data)
- originalPrice: MSRP/list price as a number, or null
- condition: "New", "Refurbished", "Used - Like New", or "Used"
- productUrl: a SEARCH URL for that retailer so the user can find the product. Use these exact patterns:
  - Amazon: https://www.amazon.com/s?k=ENCODED_QUERY
  - Walmart: https://www.walmart.com/search?q=ENCODED_QUERY
  - Target: https://www.target.com/s?searchTerm=ENCODED_QUERY
  - Best Buy: https://www.bestbuy.com/site/searchpage.jsp?st=ENCODED_QUERY
  - eBay: https://www.ebay.com/sch/i.html?_nkw=ENCODED_QUERY
  - Costco: https://www.costco.com/CatalogSearch?keyword=ENCODED_QUERY

Replace ENCODED_QUERY with a URL-encoded search term for that specific product.

Return 4-6 deals sorted by price ascending. Prices should be your best realistic estimates. Include at least one used/refurbished deal from eBay at a lower price.

Return ONLY a valid JSON array, no markdown or explanation.`,
      },
      {
        role: 'user',
        content: `Find deals for: "${query}"${estimatedRetailPrice ? ` (estimated retail price: $${estimatedRetailPrice})` : ''}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((d: any) => {
      const price = typeof d.price === 'number' ? d.price : parseFloat(d.price) || 0;
      const originalPrice = d.originalPrice != null ? (typeof d.originalPrice === 'number' ? d.originalPrice : parseFloat(d.originalPrice)) : estimatedRetailPrice;
      const savingsAmount = originalPrice ? originalPrice - price : null;
      const savingsPercent = originalPrice && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;

      return {
        retailer: d.retailer || 'Unknown',
        retailerLogoUrl: null,
        productTitle: d.productTitle || query,
        price,
        originalPrice,
        currency: 'USD',
        condition: d.condition || 'New',
        productUrl: d.productUrl || `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`,
        imageUrl: null,
        savingsAmount,
        savingsPercent,
      };
    }).sort((a: DealResult, b: DealResult) => a.price - b.price);
  } catch {
    console.error('Failed to parse deals response:', content);
    return [];
  }
}
