/**
 * AdManager handles AdMob Banner Ads integration.
 * Ensures strict compliance with user requirement: ONLY Banner Ads, NO Fullscreen/Interstitial Ads.
 */
export class AdManager {
  constructor() {
    this.initialized = false;
    this.bannerId = 'ca-app-pub-3940256099942544/6300978111'; // Google AdMob standard Test Banner ID
  }

  async initialize() {
    try {
      // Check if running inside Capacitor native context
      if (window.Capacitor && window.Capacitor.isPluginAvailable('AdMob')) {
        const admobModule = await import(/* @vite-ignore */ '@capacitor-community/admob');
        const { AdMob, BannerAdSize, BannerAdPosition } = admobModule;
        await AdMob.initialize({
          requestTrackingAuthorization: false,
          testingDevices: [],
          initializeForTesting: true
        });

        // Show Banner at bottom of screen
        await AdMob.showBanner({
          adId: this.bannerId,
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0
        });
        this.initialized = true;
        console.log('Native AdMob Banner initialized successfully');
      } else {
        console.log('Web environment detected - showing CSS banner placeholder');
      }
    } catch (err) {
      console.warn('AdMob initialization notice:', err.message);
    }
  }

  setCustomBannerId(customId) {
    if (customId) {
      this.bannerId = customId;
    }
  }
}
