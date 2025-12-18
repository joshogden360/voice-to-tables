# Mobile Setup Checklist

Quick reference guide for setting up Voice to Tables on iOS and Android.

---

## Prerequisites

- [ ] Clerk account created
- [ ] Clerk application configured
- [ ] Deep link URL added to Clerk: `voicetotables://oauth-callback`
- [ ] Environment variables set in `.env`

---

## iOS Setup

### 1. Install Dependencies
```bash
npm install
npm run build
npx cap sync ios
```

### 2. Configure URL Scheme
Edit `ios/App/App/Info.plist`:

**Add this BEFORE the closing `</dict>` tag:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>voicetotables</string>
        </array>
        <key>CFBundleURLName</key>
        <string>com.voicetotables.app</string>
    </dict>
</array>
```

### 3. Add Microphone Permission
Still in `Info.plist`, add:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Voice to Tables needs microphone access to process your voice input and generate tables.</string>
```

### 4. Build and Test
```bash
npx cap open ios
```

In Xcode:
1. Select your target device/simulator
2. Click Run (⌘R)
3. Test sign-in flow
4. Check OAuth redirect works

### 5. Troubleshooting iOS

**OAuth doesn't redirect back:**
```bash
# Test deep link manually in Safari
# Open this URL: voicetotables://oauth-callback?test=1
# Should open your app
```

**Microphone not working:**
- Check Privacy settings on device
- Verify `Info.plist` has microphone permission
- Test on physical device (simulator has limited audio)

---

## Android Setup

### 1. Install Dependencies
```bash
npm install
npm run build
npx cap sync android
```

### 2. Configure Intent Filter
Edit `android/app/src/main/AndroidManifest.xml`:

**Inside the `<activity>` tag for MainActivity, add:**
```xml
<!-- Deep link for OAuth callbacks -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data 
        android:scheme="voicetotables" 
        android:host="oauth-callback" />
</intent-filter>
```

**Full MainActivity example:**
```xml
<activity
    android:name=".MainActivity"
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:label="@string/title_activity_main"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:launchMode="singleTask"
    android:exported="true">
    
    <!-- Default launcher intent -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- Deep link for OAuth (ADD THIS) -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data 
            android:scheme="voicetotables" 
            android:host="oauth-callback" />
    </intent-filter>
    
</activity>
```

### 3. Add Microphone Permission
In `AndroidManifest.xml`, add before `<application>` tag:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### 4. Build and Test
```bash
npx cap open android
```

In Android Studio:
1. Select your emulator/device
2. Click Run
3. Test sign-in flow
4. Check OAuth redirect works

### 5. Troubleshooting Android

**OAuth doesn't redirect back:**
```bash
# Test deep link manually via adb
adb shell am start -W -a android.intent.action.VIEW \
  -d "voicetotables://oauth-callback?test=1" \
  com.voicetotables.app
```

**"App not installed" error:**
```bash
# Clear app data and reinstall
adb uninstall com.voicetotables.app
./gradlew installDebug
```

**Microphone permission denied:**
- Check app permissions in Android settings
- Verify `AndroidManifest.xml` has RECORD_AUDIO permission
- Request permission at runtime (already handled by app)

---

## Clerk Dashboard Configuration

### Web Redirect URLs
```
http://localhost:3000
http://localhost:3000/sign-in
http://localhost:3000/sign-up
```

### Mobile Redirect URLs
```
voicetotables://oauth-callback
```

### Steps in Clerk Dashboard:
1. Go to https://dashboard.clerk.com
2. Select your application
3. Navigate to **Paths** section
4. Under **Redirect URLs**, add:
   - Web URLs (for development and production)
5. Under **Mobile** tab, add:
   - `voicetotables://oauth-callback`
6. Click **Save**

---

## Testing Deep Links

### iOS (in Simulator or Device)
```bash
# Option 1: Use Safari
# Open Safari and type: voicetotables://oauth-callback

# Option 2: Use xcrun (Simulator only)
xcrun simctl openurl booted "voicetotables://oauth-callback"

# Option 3: Use terminal command
open "voicetotables://oauth-callback"
```

### Android (in Emulator or Device)
```bash
# Use adb
adb shell am start -W -a android.intent.action.VIEW \
  -d "voicetotables://oauth-callback" \
  com.voicetotables.app

# Should launch the app immediately
```

---

## Common Issues

### Issue: "Invalid redirect URL"
**Solution:**
- Check Clerk dashboard has `voicetotables://oauth-callback` added
- Ensure no typos in URL scheme
- Try lowercase only: `voicetotables` (not `voiceToTables`)

### Issue: Deep link opens browser, not app
**Solution iOS:**
- Rebuild app after modifying `Info.plist`
- Uninstall old version first
- Verify URL scheme is lowercase and alphanumeric only

**Solution Android:**
- Rebuild app after modifying `AndroidManifest.xml`
- Clear app data: `adb shell pm clear com.voicetotables.app`
- Verify `android:autoVerify="true"` is present

### Issue: OAuth works on web but not mobile
**Solution:**
- Verify Clerk dashboard has mobile redirect URL
- Check browser console for Clerk errors
- Test deep link independently (see Testing section above)
- Ensure `@capacitor/browser` and `@capacitor/app` are installed

### Issue: App crashes on sign-in
**Solution:**
- Check browser console / native logs
- Verify environment variables are set correctly
- Ensure Convex backend is running: `npx convex dev`
- Check ErrorBoundary for specific error message

---

## Build for Production

### iOS App Store
```bash
# 1. Build production web app
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open Xcode
npx cap open ios

# 4. In Xcode:
# - Select "Any iOS Device (arm64)"
# - Product → Archive
# - Upload to App Store Connect
```

### Android Play Store
```bash
# 1. Build production web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build release APK/AAB
cd android
./gradlew bundleRelease

# 4. Sign and upload to Play Console
# File: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Verification Checklist

### Pre-Launch Testing
- [ ] Web authentication works (localhost)
- [ ] iOS authentication works (simulator)
- [ ] iOS authentication works (physical device)
- [ ] Android authentication works (emulator)
- [ ] Android authentication works (physical device)
- [ ] Deep links tested on all platforms
- [ ] Microphone permissions granted correctly
- [ ] Sessions persist after app restart
- [ ] Sign out works correctly
- [ ] Multiple user accounts tested

### Production Checklist
- [ ] Production URLs added to Clerk dashboard
- [ ] Environment variables set in hosting platform
- [ ] Convex backend deployed to production
- [ ] Privacy policy added to Clerk settings
- [ ] App store listings created
- [ ] App icons and splash screens configured
- [ ] Test builds uploaded to TestFlight/Play Internal Testing
- [ ] Beta testers recruited
- [ ] Production deep links tested
- [ ] Analytics configured (optional)

---

## Support

If you encounter issues:
1. Check [CLERK_SETUP.md](./CLERK_SETUP.md) for detailed auth setup
2. Check [README.md](./README.md) for general troubleshooting
3. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details
4. Check Clerk Dashboard → Events for auth logs
5. Check Convex Dashboard → Logs for backend errors

---

**Last Updated:** December 18, 2025  
**Version:** 0.2.0

