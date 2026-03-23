import OpenAI from 'openai';

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

export async function identifyProduct(imageBase64: string): Promise<ProductIdentification> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1000,
    messages: [
      {
        role: 'system',
        content: `You are a product identification expert. Given a photo, identify the product and return a JSON object with these exact fields:
- productName: full product name (string)
- brand: brand name or null
- model: model number/name or null
- category: product category like "Electronics", "Clothing", "Home & Kitchen", etc.
- attributes: object with descriptive key-value pairs (color, size, material, etc.)
- estimatedRetailPrice: estimated MSRP in USD as a number, or null if unknown
- aiConfidence: your confidence from 0.0 to 1.0
- searchQueries: array of 3-5 search strings someone would use to find this product online for purchase

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
              detail: 'low',
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
      attributes: parsed.attributes || {},
      estimatedRetailPrice: typeof parsed.estimatedRetailPrice === 'number' ? parsed.estimatedRetailPrice : null,
      aiConfidence: typeof parsed.aiConfidence === 'number' ? parsed.aiConfidence : 0.5,
      searchQueries: Array.isArray(parsed.searchQueries) ? parsed.searchQueries : [parsed.productName || 'product'],
    };
  } catch {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to identify product from image');
  }
}
