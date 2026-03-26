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
        content: `You are a product identification expert. Your job is to identify EXACTLY what product is shown in a photo so a user can find deals on it online.

Given a photo, return a JSON object with these exact fields:
- productName: The SPECIFIC product name (string). You MUST include the exact brand and model if visible. Example: "Apple AirPods Pro 2nd Generation", NOT just "wireless earbuds". If the item is generic/unbranded (e.g. a paper cup, plastic bag), describe it generically — do NOT guess a brand.
- brand: brand name ONLY if clearly visible on the product (logo, label, printed text), otherwise null. Do NOT guess or infer a brand.
- model: model number/name if visible, otherwise null
- category: product category like "Electronics", "Clothing", "Home & Kitchen", etc.
- attributes: object with descriptive key-value pairs (color, size, material, etc.)
- estimatedRetailPrice: estimated MSRP in USD as a number, or null if unknown. For generic/disposable items, reflect actual low cost.
- aiConfidence: your confidence from 0.0 to 1.0. Be VERY conservative and honest:
  * 0.9-1.0: You can read the EXACT brand name, model number, and product name clearly in the image
  * 0.7-0.89: You can identify the brand and general product but not the exact model/variant
  * 0.5-0.69: You can make an educated guess but aren't certain of the exact product
  * 0.2-0.49: The product is generic, blurry, partially obscured, or you're mostly guessing
  * NEVER give 0.8+ confidence unless you can clearly see identifying branding/model info
- searchQueries: array of 3-5 search strings to find this EXACT product for purchase online. Be specific — include brand, model, color, size when known. For generic items, search generically.

CRITICAL RULES:
1. Identify what is ACTUALLY in the photo. Do NOT upgrade, embellish, or substitute a different product.
2. If you cannot clearly identify the product, say so with low confidence — do not fabricate a specific product.
3. The searchQueries must match the identified product EXACTLY, not similar or related products.
4. A blurry or distant photo should result in LOW confidence, even if you think you know what it might be.

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
