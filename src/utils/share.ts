import { Share } from 'react-native';
import { formatPrice } from './formatters';

const APP_STORE_LINK = 'https://apps.apple.com/app/lowball/id0000000000';

export async function shareDeals(
  productName: string,
  lowestPrice: number,
  estimatedRetailPrice?: number,
) {
  try {
    const priceStr = formatPrice(lowestPrice);
    let message = `I found ${productName || 'a product'} for just ${priceStr}!`;

    if (estimatedRetailPrice && estimatedRetailPrice > lowestPrice && Number.isFinite(estimatedRetailPrice)) {
      const retailStr = formatPrice(estimatedRetailPrice);
      const savingsPercent = Math.round(
        ((estimatedRetailPrice - lowestPrice) / estimatedRetailPrice) * 100
      );
      message += ` The retail price is ${retailStr}. That's ${savingsPercent}% off!`;
    }

    message += `\n\nFound with Lowball — snap a photo, find it cheaper.\n${APP_STORE_LINK}`;

    await Share.share({ message });
  } catch {
    // User cancelled share sheet or share failed — silently ignore
  }
}
