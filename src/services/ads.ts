// AdMob interstitial ad service
// NOTE: react-native-google-mobile-ads requires a development build.
// In Expo Go, all functions are safe no-ops.

let InterstitialAd: any = null;
let AdEventType: any = null;
let interstitial: any = null;
let adLoaded = false;
let adShowing = false;

// Test interstitial unit ID — swap via env var for production
const INTERSTITIAL_ID =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ||
  'ca-app-pub-3940256099942544/4411468910'; // Google test interstitial

function initAd() {
  if (interstitial) return;
  try {
    // Dynamic import to avoid crash in Expo Go
    const admob = require('react-native-google-mobile-ads');
    InterstitialAd = admob.InterstitialAd;
    AdEventType = admob.AdEventType;

    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      adLoaded = true;
    });

    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      adLoaded = false;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      adLoaded = false;
      adShowing = false;
      // Preload the next ad
      try { interstitial.load(); } catch {}
    });
  } catch {
    // react-native-google-mobile-ads not available (Expo Go)
    interstitial = null;
  }
}

export function loadAd(): void {
  try {
    initAd();
    if (interstitial && !adLoaded) {
      interstitial.load();
    }
  } catch {
    // Silent fail — ads are never critical
  }
}

export function isAdLoaded(): boolean {
  return adLoaded;
}

export function showAd(): Promise<void> {
  return new Promise((resolve) => {
    if (!interstitial || !adLoaded || adShowing) {
      resolve();
      return;
    }

    adShowing = true;

    // Listen for close to resolve the promise
    const unsubscribe = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      unsubscribe();
      resolve();
    });

    // Also resolve on error so we never block
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      unsubError();
      adShowing = false;
      resolve();
    });

    try {
      interstitial.show();
    } catch {
      adShowing = false;
      resolve();
    }
  });
}
