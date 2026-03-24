import { useCallback } from 'react';
import { loadAd, showAd, isAdLoaded } from '../services/ads';
import { usePurchases } from './usePurchases';

export function useAds() {
  const { isAdFree } = usePurchases();
  const shouldShowAds = !isAdFree;

  const wrappedShowAd = useCallback(async (): Promise<void> => {
    if (isAdFree) return;
    await showAd();
  }, [isAdFree]);

  return {
    shouldShowAds,
    loadAd,
    showAd: wrappedShowAd,
    isAdLoaded,
  };
}
