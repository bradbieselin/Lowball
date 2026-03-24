import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('FATAL: OPENAI_API_KEY must be set');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProductIdentification {
  productName: string;
  brand: string | null;
  model: string | null;
  category: string;
  attributes: Record<string, string>;
  estimatedRetailPrice: number | null;
  aiConfidence: number;
  searchQueries: string[];
}

export async function generateSearchQueries(productName: string, category: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: `Given a product name and category, return a JSON array of 3-5 optimized search queries for finding this product on shopping sites. Include the full product name, abbreviated versions, and variations with "buy" or "deal" appended. Return ONLY a valid JSON array of strings, no markdown.`,
      },
      {
        role: 'user',
        content: `Product: "${productName}", Category: "${category}"`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [productName];

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [productName];
    return parsed.filter((q: unknown) => typeof q === 'string' && q.length > 0);
  } catch {
    return [productName];
  }
}

export async function identifyProduct(imageBase64: string): Promise<ProductIdentification> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: `You are a product identification expert. Given a photo, identify the product and return a JSON object with these exact fields:
- productName: full product name (string). If the item is generic, unbranded, or disposable (e.g. a paper cup, plastic bag, napkin), say exactly what it is — do NOT guess a brand or specific commercial product. For example: "Disposable Paper Coffee Cup", not "Yeti Rambler Mug".
- brand: brand name if clearly visible on the product (logo, label, text), otherwise null. Do NOT guess or infer a brand that isn't visibly printed on the item.
- model: model number/name if visible, otherwise null
- category: product category like "Electronics", "Clothing", "Home & Kitchen", etc.
- attributes: object with descriptive key-value pairs (color, size, material, etc.)
- estimatedRetailPrice: estimated MSRP in USD as a number, or null if unknown. For generic/disposable items, this should reflect the actual low cost (e.g. $0.10 for a paper cup, not $15 for a mug).
- aiConfidence: your confidence from 0.0 to 1.0. Be honest: if the product is generic, unbranded, or hard to identify precisely, confidence should be LOW (0.2-0.4). Only use high confidence (0.8+) when you can clearly identify a specific branded product with visible branding.
- searchQueries: array of 3-5 search strings someone would use to find this EXACT product online for purchase. For generic items, search for the generic item (e.g. "paper coffee cups bulk"), NOT for branded alternatives.

IMPORTANT: Identify what is ACTUALLY in the photo. Do not upgrade, embellish, or substitute a fancier product. A disposable cup is a disposable cup, not a branded tumbler.

Return ONLY valid JSON, no markdown or explanation.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Identify this product:',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'auto',
            },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI vision model');
  }

  try {
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      productName: parsed.productName || 'Unknown Product',
      brand: parsed.brand || null,
      model: parsed.model || null,
      category: parsed.category || 'Other',
      attributes: parsed.attributes && typeof parsed.attributes === 'object' && !Array.isArray(parsed.attributes)
        ? Object.fromEntries(Object.entries(parsed.attributes).map(([k, v]) => [k, String(v)]))
        : {},
      estimatedRetailPrice: typeof parsed.estimatedRetailPrice === 'number' ? parsed.estimatedRetailPrice : null,
      aiConfidence: typeof parsed.aiConfidence === 'number' ? parsed.aiConfidence : 0.5,
      searchQueries: Array.isArray(parsed.searchQueries)
        ? parsed.searchQueries.filter((q: unknown) => typeof q === 'string' && q.length > 0)
        : [parsed.productName || 'product'],
    };
  } catch {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to identify product from image');
  }
}
