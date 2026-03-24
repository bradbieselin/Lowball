import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkAdFreeEntitlement,
  purchaseRemoveAds,
  restorePurchases,
  addCustomerInfoListener,
} from '../services/purchases';
import { syncSubscription } from '../services/api';

export function usePurchases() {
  const [isAdFree, setIsAdFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  // Check entitlement on mount
  useEffect(() => {
    checkAdFreeEntitlement().then(setIsAdFree);
  }, []);

  // Listen for customer info changes (handles refunds, renewals, etc.)
  useEffect(() => {
    const unsubscribe = addCustomerInfoListener((adFree) => {
      setIsAdFree(adFree);
      // Sync to backend so server stays in sync with RevenueCat
      syncSubscription(adFree ? 'pro' : 'free').catch((err) => {
        console.warn('Background subscription sync failed:', err);
      });
    });
    return unsubscribe;
  }, []);

  const buyRemoveAds = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setLoading(true);
    try {
      const success = await purchaseRemoveAds();
      if (success) {
        setIsAdFree(true);
        try {
          await syncSubscription('pro');
        } catch (err) {
          console.warn('Subscription sync failed after purchase:', err);
        }
      }
      return success;
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setLoading(true);
    try {
      const hasEntitlement = await restorePurchases();
      setIsAdFree(hasEntitlement);
      if (hasEntitlement) {
        try {
          await syncSubscription('pro');
        } catch (err) {
          console.warn('Subscription sync failed after restore:', err);
        }
      }
      return hasEntitlement;
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, []);

  return { isAdFree, loading, buyRemoveAds, restore };
}
