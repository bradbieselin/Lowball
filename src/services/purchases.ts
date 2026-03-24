// RevenueCat purchases service
// NOTE: react-native-purchases requires a development build.
// In Expo Go, all functions are safe no-ops.

let Purchases: any = null;
let initialized = false;

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';
const PRODUCT_ID = 'lowball_remove_ads';
const ENTITLEMENT_ID = 'ad_free';

function getPurchases(): any {
  if (Purchases) return Purchases;
  try {
    Purchases = require('react-native-purchases').default;
    return Purchases;
  } catch {
    return null;
  }
}

export async function initializePurchases(userId: string): Promise<void> {
  if (initialized || !REVENUECAT_API_KEY) return;
  const P = getPurchases();
  if (!P) return;

  try {
    P.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId });
    initialized = true;
  } catch (err) {
    console.error('RevenueCat init error:', err);
  }
}

export async function purchaseRemoveAds(): Promise<boolean> {
  const P = getPurchases();
  if (!P) throw new Error('Purchases not available');

  try {
    const offerings = await P.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find(
      (p: any) => p.product?.identifier === PRODUCT_ID
    ) ?? offerings?.current?.availablePackages?.[0];

    if (!pkg) {
      throw new Error('Remove Ads product not found. Please try again later.');
    }

    const { customerInfo } = await P.purchasePackage(pkg);
    return customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  } catch (err: any) {
    // User cancelled — not an error
    if (err.userCancelled) return false;
    throw new Error(err.message || 'Purchase failed. Please try again.');
  }
}

export async function restorePurchases(): Promise<boolean> {
  const P = getPurchases();
  if (!P) return false;

  try {
    const customerInfo = await P.restorePurchases();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to restore purchases.');
  }
}

export async function checkAdFreeEntitlement(): Promise<boolean> {
  const P = getPurchases();
  if (!P) return false;

  try {
    const customerInfo = await P.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] != null;
  } catch {
    return false;
  }
}

export function addCustomerInfoListener(callback: (isAdFree: boolean) => void): () => void {
  const P = getPurchases();
  if (!P) return () => {};

  try {
    const listener = (info: any) => {
      callback(info.entitlements.active[ENTITLEMENT_ID] != null);
    };
    P.addCustomerInfoUpdateListener(listener);
    return () => P.removeCustomerInfoUpdateListener(listener);
  } catch {
    return () => {};
  }
}
