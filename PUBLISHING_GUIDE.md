# 🚀 Knight 3D Chess — Google Play Store Publishing Guide

## Complete Step-by-Step Launch Checklist

---

## 📋 PREREQUISITES (Do these first)

### 1. Create a Google Play Developer Account
- Go to [play.google.com/console](https://play.google.com/console)
- Pay the one-time $25 registration fee
- Complete your developer account profile

### 2. Create a Firebase Project (for AdMob)
- Go to [console.firebase.google.com](https://console.firebase.google.com)
- Click **Add Project** → Name it `Knight 3D Chess`
- Register your app with package name: **`com.knightchess.game`**
- Download the generated `google-services.json` file
- **Replace** `android/app/google-services.json` with the downloaded file

### 3. Set Up AdMob
- Go to [apps.admob.com](https://apps.admob.com)
- Create a new app → Android → `com.knightchess.game`
- Create a **Banner Ad Unit** (NOT interstitial, NOT rewarded)
  - Format: **Banner**
  - Name: `In-Game Banner`
- Copy your **Ad Unit ID** (looks like `ca-app-pub-XXXXXXXXXXXXX/XXXXXXXXXXX`)
## 🔧 CODE CONFIGURATION

### 4. Configure Production AdMob IDs

**File: `capacitor.config.json`**
```json
{
  "appId": "com.knightchess.game",
  "appName": "Knight 3D Chess",
  "plugins": {
    "AdMob": {
      "appId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
    }
  }
}
```
> Replace the test AdMob App ID with your **real production App ID** from AdMob.

**File: `src/ads/AdManager.js`**
```javascript
// CHANGE THIS LINE:
this.prodBannerId = 'ca-app-pub-XXXXXXXXXXXXX/XXXXXXXXXXX';
// ^ Replace with your REAL banner ad unit ID
```

**File: `android/app/src/main/AndroidManifest.xml`**
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

### 5. Call Production Mode
In `src/main.js`, update the AdManager initialization:
```javascript
this.ads = new AdManager();
this.ads.enableProduction(); // Uses prodBannerId
```
## 🔐 GENERATE A SIGNING KEYSTORE

### 6. Create Keystore (Windows)
```powershell
cd android\app
keytool -genkey -v -keystore knight-chess-release.keystore `
  -alias knight-chess -keyalg RSA -keysize 2048 -validity 10000
```

You will be asked for:
- **Keystore password** → SAVE THIS SAFELY!
- **Key password** → Can be same as keystore password
- **Name/Org details** → Can be anything

### 7. Update Signing Config

**File: `android/app/build.gradle`**
Uncomment and fill in the signing config:
```gradle
signingConfigs {
    release {
        storeFile file('knight-chess-release.keystore')
        storePassword System.getenv('KEYSTORE_PASSWORD')
        keyAlias System.getenv('KEY_ALIAS')
        keyPassword System.getenv('KEY_PASSWORD')
    }
}
```

> **⚠️ NEVER commit passwords to Git!** Use environment variables.
## 📦 BUILD THE RELEASE APK

### 8. Sync Capacitor
```bash
npx cap sync android
```

### 9. Build Release APK
```bash
cd android
./gradlew assembleRelease
```

### 10. Locate the APK
The signed APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🧪 PRE-LAUNCH TESTING

### 11. Test on Real Devices
- Install the APK on at least 3 different Android devices
- Test: Play vs Bot (Easy/Medium/Hard)
- Test: Pass & Play (Friend mode)
- Test: Undo, Reset, Camera, Sound toggle
- Test: Talking Tom messages and hints
- Test: Pawn promotion
- Test: Back button behavior
- Test: App minimize and restore

### 12. Use Google Pre-Launch Report
- Upload your APK to Play Console as an **Internal Test Track**
- Google will test it on multiple devices and report crashes

### 13. Content Rating
- Complete the **Content Rating** questionnaire in Play Console
- This app should be rated **Everyone / E for Everyone**
## 🌐 GOOGLE PLAY STORE LISTING

### 14. Store Listing Information

**App Name:** `Knight 3D Chess`
**Short Description (80 chars):**
> 3D Chess Game with AI — Play offline vs bot or friends!

**Full Description:**
Experience chess like never before with Knight 3D Chess! Featuring stunning procedurally-generated 3D pieces, a smart AI opponent, and the charismatic Talking Tom who motivates your best moves with style.

🎮 **GAME MODES:**
- 🤖 **Play vs Bot** — Challenge AI at Easy, Medium, or Hard difficulty
- 👥 **Pass & Play** — Play with a friend on the same device

🗣️ **TALKING TOM FEATURE:**
- Get slang-filled motivation after great moves
- Ask Tom for hints when you are stuck
- In friend mode, Tom stays quiet unless asked

♟️ **FEATURES:**
- 100% OFFLINE — No internet required to play
- NO ACCOUNT NEEDED — Just tap and play
- Procedural 3D graphics — unique pieces every game
- Smart AI with adjustable difficulty levels
- Undo moves, reset camera, toggle sound
- Clean, modern dark theme UI

**Tags:** chess, 3d, board game, offline, ai, strategy

### 15. Screenshots
Take at least **8 screenshots** (1280x720 or 1920x1080):
1. Main Menu screen
2. Bot difficulty selection
3. Game board at start
4. Mid-game with pieces captured
5. Talking Tom showing a message
6. Friend / Pass & Play mode
7. Pawn promotion modal
8. Game over / checkmate screen

### 16. Graphic Assets

| Asset | Size | Notes |
|-------|------|-------|
| App Icon | 512x512 PNG | Use existing mipmap icons |
| Feature Graphic | 1024x500 PNG | Game title + chess piece on dark bg |
| Phone Screenshots | 1280x720+ PNG | At least 8 |
| Tablet Screenshots | 1920x1080+ PNG | At least 4 |

### 17. App Category
- **Category:** Games -> Board
- **Tags:** Chess, Board, Strategy, 3D, Offline
## 📱 WHAT YOU MUST SHARE TO ENABLE ADMOB

To enable AdMob for production, you must provide **3 things**:

| # | Item | Where to Put It | How to Get It |
|---|------|----------------|---------------|
| 1 | **AdMob App ID** | `capacitor.config.json` + `AndroidManifest.xml` | Create app in [AdMob Console](https://apps.admob.com) |
| 2 | **Banner Ad Unit ID** | `src/ads/AdManager.js` (prodBannerId) | Create ad unit in AdMob Console |
| 3 | **google-services.json** | `android/app/google-services.json` | Download from [Firebase Console](https://console.firebase.google.com) |

> ⚠️ **I CANNOT generate these for you** — they must come from your own AdMob account.

### Step-by-Step Firebase + AdMob Setup:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Add project** → Name: `Knight 3D Chess`
3. Click **Add app** → Select **Android** icon
4. Package name: `com.knightchess.game`
5. Download the `google-services.json` file
6. Replace the placeholder at `android/app/google-services.json`
7. In Firebase Console → **AdMob** → Link your AdMob account
8. In [AdMob Console](https://apps.admob.com) create your app & banner ad unit
9. Copy the **App ID** and **Ad Unit ID** into the files mentioned above
10. In `src/main.js` call `this.ads.enableProduction()` before `this.ads.initialize()`

---

## ✅ FINAL LAUNCH CHECKLIST

```
[ ] Google Play Developer Account created ($25)
[ ] Firebase project created
[ ] google-services.json downloaded and placed
[ ] AdMob account created and linked to Firebase
[ ] Real AdMob App ID in capacitor.config.json
[ ] Real Banner Ad Unit ID in AdManager.js (prodBannerId)
[ ] Real AdMob App ID in AndroidManifest.xml
[ ] ads.enableProduction() called in main.js
[ ] Keystore generated (knight-chess-release.keystore)
[ ] Signing config updated in build.gradle
[ ] npx cap sync android completed
[ ] ./gradlew assembleRelease builds successfully
[ ] APK tested on 3+ real devices
[ ] 8+ screenshots taken and uploaded
[ ] Feature Graphic created (1024x500)
[ ] App Icon uploaded (512x512)
[ ] Store Listing completed (title, desc, tags)
[ ] Content Rating questionnaire completed
[ ] Privacy Policy URL added to store listing
[ ] Ads declaration completed (app contains ads)
[ ] Min API level 22 meets Google requirements
```

---

*Generated for Knight 3D Chess v1.0.0 - Happy Launching!* 🎉
