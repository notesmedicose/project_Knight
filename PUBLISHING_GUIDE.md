# 🚀 Knight 3D Chess — Google Play Store Publishing Guide

## 🔥 FINAL 7 STEPS TO LAUNCH

Everything below is **already done by Cline**:
- ✅ Talking Tom Feature (slang, hints, friend mode)
- ✅ QA / Peer Review (20+ issues fixed)
- ✅ Privacy Policy (in-app modal + privacy.html)
- ✅ Error boundary, back button, offline SW, game save
- ✅ AdMob App ID configured (`ca-app-pub-6924423095909700~4384363489`)
- ✅ Banner Ad Unit configured (`ca-app-pub-6924423095909700/1256205488`)
- ✅ `enableProduction()` called in main.js
- ✅ Production build settings (minify, shrink, optimize)

---

## 👇 7 REMAINING TASKS (You Do These)

### ☐ 1. Place `google-services.json`
> ✅ *You said this is done — make sure the file is at:*
> **`android/app/google-services.json`**

### ☐ 2. Generate a Keystore
```powershell
cd android\app
keytool -genkey -v -keystore knight-chess-release.keystore `
  -alias knight-chess -keyalg RSA -keysize 2048 -validity 10000
```
> Save the passwords somewhere safe!

### ☐ 3. Update Signing Config
Open **`android/app/build.gradle`** and uncomment/fill:
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
Use environment variables or a `keystore.properties` file (never commit passwords!).

### ☐ 4. Build the Signed APK
```bash
npx cap sync android
cd android
./gradlew assembleRelease
# APK → android/app/build/outputs/apk/release/app-release.apk
```

### ☐ 5. Test the APK
Install on 3+ real Android devices and test:
- Play vs Bot (Easy / Medium / Hard)
- Pass & Play (Friend mode)
- Talking Tom messages & hints
- Undo, Reset, Camera, Sound toggle
- Back button, app minimize/restore

### ☐ 6. Prepare Store Assets
| Asset | Size | Tips |
|-------|------|------|
| 📸 Screenshots | 1280x720+ | 8+ screenshots of gameplay |
| 🖼️ Feature Graphic | 1024x500 | Game title + chess piece on dark bg |
| 🎨 App Icon | 512x512 | Use existing mipmap icons |

### ☐ 7. Upload to Play Console
- Go to [play.google.com/console](https://play.google.com/console)
- Create a new app → **Knight 3D Chess**
- Upload the signed APK from step 4
- Fill in store listing (description below)
- Complete Content Rating questionnaire (should be **Everyone**)
- Declare Ads: **Yes, this app contains ads**
- Add Privacy Policy URL: *(use your own hosted URL or a privacy policy service)*

---

## 📝 Store Description (Copy/Paste)

**Short:** 3D Chess Game with AI — Play offline vs bot or friends!

**Full:**
Experience chess like never before with Knight 3D Chess! Featuring stunning procedurally-generated 3D pieces, a smart AI opponent, and the charismatic Talking Tom who motivates your best moves with style.

- 🤖 **Play vs Bot** — 3 difficulty levels (Easy/Medium/Hard)
- 👥 **Pass & Play** — Play with a friend on the same device
- 🗣️ **Talking Tom** — Slang motivation after great moves + hints when stuck
- ♟️ **100% OFFLINE** — No internet or account needed
- 🎨 **Procedural 3D Graphics** — Unique pieces every game

---

## 📦 Quick Reference

```
Project:     C:\Users\user\Desktop\project knight
GitHub:      https://github.com/notesmedicose/project_Knight
Package:     com.knightchess.game
AdMob App:   ca-app-pub-6924423095909700~4384363489
Banner Unit: ca-app-pub-6924423095909700/1256205488
APK Path:    android/app/build/outputs/apk/release/app-release.apk
```

---

*Good luck with your launch! 🎉*
