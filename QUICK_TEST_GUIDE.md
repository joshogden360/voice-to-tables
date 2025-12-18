# Quick Test Guide - Voice to Tables v0.2.0

## 🚀 Everything is Running!

### Web App
🌐 **URL:** http://localhost:3000  
✅ **Status:** Development server running  
🔗 **Network:** Also available at http://192.168.1.111:3000

### iOS
📱 **Status:** Xcode opened - ready to build and run  
🎯 **Action:** Select simulator and click Run (⌘R)

### Android  
🤖 **Status:** Android Studio opened - ready to build and run  
🎯 **Action:** Select emulator and click Run (green play button)

---

## ⚡ Quick Test Flow (5 Minutes)

### 1️⃣ Web Test (2 minutes)
```bash
# Already running at: http://localhost:3000

1. Open browser → http://localhost:3000
2. Sign in with Clerk (email or Google)
3. Type a test message
4. Verify it appears in chat
5. Check Convex dashboard for data with userId
```

### 2️⃣ iOS Test (2 minutes)
```bash
# Xcode is already open

1. In Xcode: Select "iPhone 15 Pro" simulator
2. Click Run (⌘R)
3. Wait for build to complete
4. Tap "Sign in" in app
5. Safari opens → complete sign-in
6. Verify app reopens and you're logged in
```

### 3️⃣ Android Test (2 minutes)
```bash
# Android Studio is already open

1. In Android Studio: Select "Pixel 8 Pro" emulator
2. Click Run (green play button)
3. Wait for build to complete
4. Tap "Sign in" in app
5. Chrome Custom Tab opens → complete sign-in
6. Verify app reopens and you're logged in
```

---

## 🔍 Critical Checks

### ✅ Web
- [ ] Sign-in screen appears
- [ ] Can sign in successfully
- [ ] User button shows in header
- [ ] Messages save and display

### ✅ iOS
- [ ] App builds without errors
- [ ] Sign-in button works
- [ ] Safari opens for OAuth
- [ ] **Deep link redirect works** ← CRITICAL
- [ ] User logged in after redirect

### ✅ Android
- [ ] App builds without errors
- [ ] Sign-in button works
- [ ] Chrome Custom Tab opens
- [ ] **Deep link redirect works** ← CRITICAL
- [ ] User logged in after redirect

---

## 🐛 Quick Fixes

### Web: "Missing Clerk Key" Error
```bash
# Check your .env file has:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# If missing, add it and restart:
# Stop: Ctrl+C in terminal
# Start: npm run dev
```

### iOS/Android: OAuth Doesn't Redirect Back
```bash
# iOS - Test deep link manually:
xcrun simctl openurl booted "voicetotables://oauth-callback"

# Android - Test deep link manually:
adb shell am start -W -a android.intent.action.VIEW \
  -d "voicetotables://oauth-callback" \
  com.voicetotables.app

# If deep link doesn't work, check:
# - iOS: Info.plist has voicetotables URL scheme
# - Android: AndroidManifest.xml has intent-filter
# - Clerk: Dashboard has voicetotables://oauth-callback redirect URL
```

---

## 📊 Expected Results

### Convex Dashboard
After sending a message, check https://dashboard.convex.dev:

**Messages Table:**
```
userId: "user_2abc..." ← From Clerk auth
sessionId: "user_2abc_web_1734567890"
content: "Test message"
```

**Sessions Table:**
```
userId: "user_2abc..." ← From Clerk auth
platform: "web" (or "ios" or "android")
isActive: true
```

### Clerk Dashboard
Check https://dashboard.clerk.com → Events:
- Sign-in events
- OAuth redirects
- Session tokens issued

---

## 🎯 Success = All 3 Platforms Working

✅ **Web:** Sign in → Send message → Data saves  
✅ **iOS:** Sign in → OAuth redirect → User logged in  
✅ **Android:** Sign in → OAuth redirect → User logged in  

If all three work, your implementation is **production-ready**! 🎉

---

## 📞 Need Help?

**Check these files:**
- [TESTING_SESSION.md](./TESTING_SESSION.md) - Detailed testing guide
- [CLERK_SETUP.md](./CLERK_SETUP.md) - Clerk configuration
- [MOBILE_SETUP_CHECKLIST.md](./MOBILE_SETUP_CHECKLIST.md) - Mobile setup

**Common Issues:**
- Missing environment variables → Check `.env`
- OAuth redirect fails → Check deep link configuration
- Convex errors → Check Convex dashboard logs
- Build errors → Check Xcode/Android Studio console

---

**Happy Testing!** 🚀

**Current Time:** Ready to test now!  
**Estimated Time:** 10-15 minutes for all platforms

