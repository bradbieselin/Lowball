import { useState, useEffect, useCallback } from 'react';
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

  // Check entitlement on mount
  useEffect(() => {
    checkAdFreeEntitlement().then(setIsAdFree);
  }, []);

  // Listen for customer info changes
  useEffect(() => {
    const unsubscribe = addCustomerInfoListener(setIsAdFree);
    return unsubscribe;
  }, []);

  const buyRemoveAds = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await purchaseRemoveAds();
      if (success) {
        setIsAdFree(true);
        syncSubscription('pro').catch(() => {});
      }
      return success;
    } finally {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const hasEntitlement = await restorePurchases();
      setIsAdFree(hasEntitlement);
      if (hasEntitlement) {
        syncSubscription('pro').catch(() => {});
      }
      return hasEntitlement;
    } finally {
      setLoading(false);
    }
  }, []);

  return { isAdFree, loading, buyRemoveAds, restore };
}
