/**
 * AdManager handles AdMob Banner Ads integration.
 * ONLY Banner Ads, NO Fullscreen/Interstitial Ads.
 * Uses test ads in dev, production IDs in release.
 */
export class AdManager {
  constructor() {
    this.initialized = false;
    this.testBannerId = 'ca-app-pub-3940256099942544/6300978111';
    this.prodBannerId = 'ca-app-pub-6924423095909700/1256205488';
    this._isProduction = false;
  }

  get bannerId() {
    return this._isProduction ? this.prodBannerId : this.testBannerId;
  }

  async initialize() {
    try {
      if (window.Capacitor && window.Capacitor.isPluginAvailable('AdMob')) {
        const { AdMob, BannerAdSize, BannerAdPosition } = await import(/* @vite-ignore */ '@capacitor-community/admob');
        await AdMob.initialize({
          requestTrackingAuthorization: false,
          testingDevices: this._isProduction ? [] : ['EMULATOR'],
          initializeForTesting: !this._isProduction
        });
        await AdMob.showBanner({
          adId: this.bannerId,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0
        });
        this.initialized = true;
      } else {
        console.log('Web mode - CSS banner placeholder');
      }
    } catch (err) {
      console.warn('AdMob init:', err.message);
    }
  }

  enableProduction(id = null) {
    this._isProduction = true;
    if (id) this.prodBannerId = id;
  }

  setCustomBannerId(customId) {
    if (customId) this.prodBannerId = customId;
  }
}

