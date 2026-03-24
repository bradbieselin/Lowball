import { loadAd, showAd, isAdLoaded } from '../services/ads';
import { usePurchases } from './usePurchases';

export function useAds() {
  const { isAdFree } = usePurchases();
  const shouldShowAds = !isAdFree;

  const wrappedShowAd = async (): Promise<void> => {
    if (!shouldShowAds) return;
    await showAd();
  };

  return {
    shouldShowAds,
    loadAd,
    showAd: wrappedShowAd,
    isAdLoaded,
  };
}
