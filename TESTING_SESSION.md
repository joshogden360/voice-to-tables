# Testing Session - Voice to Tables v0.2.0

**Date:** December 18, 2025  
**Testing:** Web + iOS + Android with Clerk Authentication

---

## ✅ Code Review Summary

### Your Improvements
You successfully upgraded the authentication integration to use **Convex's native Clerk support**:

1. **✅ ConvexProviderWithClerk** - Automatic auth token passing
2. **✅ Server-side authentication** - Using `ctx.auth.getUserIdentity()`
3. **✅ Removed manual userId passing** - More secure, follows best practices
4. **✅ Enhanced security** - Ownership validation in all mutations

### What Changed
```typescript
// BEFORE: Manual userId passing (your initial implementation)
await sendMessageMutation({ userId: user!.id, sessionId, ... });

// AFTER: Automatic userId from auth context (your improvement) ✅
await sendMessageMutation({ sessionId, ... });
// Backend gets userId from: await ctx.auth.getUserIdentity()
```

**This is the recommended Convex + Clerk pattern!** 🎉

---

## 🚀 Current Status

### Web App
- ✅ **Running:** http://localhost:3000
- ✅ **Built:** Production build successful
- 🟢 **Status:** Ready for testing

### iOS
- ✅ **Synced:** Web assets copied to iOS
- ✅ **Xcode:** Project opened
- 🔶 **Action Required:** Build and run in Xcode

### Android
- ✅ **Synced:** Web assets copied to Android
- ✅ **Android Studio:** Project opened
- 🔶 **Action Required:** Build and run in Android Studio

---

## 📋 Testing Checklist

### 1. Web Testing (http://localhost:3000)

#### Authentication Flow
- [ ] **Visit:** http://localhost:3000
- [ ] **Verify:** Sign-in screen appears with Clerk UI
- [ ] **Test:** Sign in with email/password or OAuth
- [ ] **Verify:** Redirects to main app after sign-in
- [ ] **Check:** User button appears in header

#### Data Operations
- [ ] **Create session:** Start a new conversation
- [ ] **Send message:** Type and send a test message
- [ ] **Verify storage:** Message appears in UI
- [ ] **Check Convex:** Open Convex dashboard, verify data has userId
- [ ] **Test tables:** Generate a table (via voice or template)
- [ ] **Verify ownership:** Check table has correct userId in database

#### Session Persistence
- [ ] **Refresh page:** Data persists after reload
- [ ] **Sign out:** Click user button → Sign out
- [ ] **Verify:** Redirects to sign-in screen
- [ ] **Sign in again:** Same user account
- [ ] **Verify:** Previous session data loads

---

### 2. iOS Testing (Xcode)

#### Initial Setup
```bash
# In Xcode:
# 1. Select target: App
# 2. Select device: iPhone 15 Pro (or any simulator)
# 3. Click Run button (⌘R)
```

#### Pre-Flight Checklist
- [ ] **Verify Info.plist** has URL scheme:
  ```xml
  <key>CFBundleURLSchemes</key>
  <array>
      <string>voicetotables</string>
  </array>
  ```

- [ ] **Verify microphone permission:**
  ```xml
  <key>NSMicrophoneUsageDescription</key>
  <string>Voice to Tables needs microphone access...</string>
  ```

#### Authentication Flow
- [ ] **Launch app:** Build and run in simulator
- [ ] **Verify:** Sign-in screen appears
- [ ] **Tap:** "Sign in" button
- [ ] **Verify:** Safari opens for OAuth
- [ ] **Sign in:** Complete authentication in Safari
- [ ] **Verify:** Redirects back to app (deep link)
- [ ] **Check:** User logged in, main screen appears

#### Deep Link Testing
```bash
# While simulator is running, test deep link:
xcrun simctl openurl booted "voicetotables://oauth-callback?test=1"

# Expected: App should open and handle the deep link
```

#### Data Operations
- [ ] **Create session:** Start conversation
- [ ] **Send message:** Type a message
- [ ] **Verify:** Message syncs to Convex
- [ ] **Close app:** Swipe up to close
- [ ] **Reopen app:** Data persists
- [ ] **Sign out:** Test sign-out flow

---

### 3. Android Testing (Android Studio)

#### Initial Setup
```bash
# In Android Studio:
# 1. Select device: Pixel 8 Pro (or any emulator)
# 2. Click Run button (green play icon)
```

#### Pre-Flight Checklist
- [ ] **Verify AndroidManifest.xml** has intent filter:
  ```xml
  <intent-filter android:autoVerify="true">
      <data android:scheme="voicetotables" android:host="oauth-callback" />
  </intent-filter>
  ```

- [ ] **Verify permissions:**
  ```xml
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
  ```

#### Authentication Flow
- [ ] **Launch app:** Build and run on emulator
- [ ] **Verify:** Sign-in screen appears
- [ ] **Tap:** "Sign in" button
- [ ] **Verify:** Chrome Custom Tab opens
- [ ] **Sign in:** Complete authentication
- [ ] **Verify:** Redirects back to app
- [ ] **Check:** User logged in, main screen appears

#### Deep Link Testing
```bash
# While emulator is running, test deep link:
adb shell am start -W -a android.intent.action.VIEW \
  -d "voicetotables://oauth-callback?test=1" \
  com.voicetotables.app

# Expected: App should open and handle the deep link
```

#### Data Operations
- [ ] **Create session:** Start conversation
- [ ] **Send message:** Type a message
- [ ] **Verify:** Message syncs to Convex
- [ ] **Close app:** Back button to close
- [ ] **Reopen app:** Data persists
- [ ] **Sign out:** Test sign-out flow

---

## 🔍 What to Look For

### Success Indicators ✅
- Sign-in screen appears on first launch
- OAuth flow completes and redirects back to app
- Messages save with userId in Convex database
- Data persists after app restart
- User button shows in header
- Sign out redirects to sign-in screen

### Common Issues ⚠️

**Issue: "Missing Clerk Publishable Key"**
- ✅ **Check:** `.env` has `VITE_CLERK_PUBLISHABLE_KEY`
- ✅ **Fix:** Add key and restart dev server

**Issue: OAuth doesn't redirect back (Mobile)**
- ✅ **Check:** Deep link configured (see checklists above)
- ✅ **Test:** Deep link manually (see testing commands)
- ✅ **Check:** Clerk dashboard has `voicetotables://oauth-callback`

**Issue: "Not authenticated" errors in Convex**
- ✅ **Check:** User is signed in
- ✅ **Check:** `ConvexProviderWithClerk` is used (not `ConvexProvider`)
- ✅ **Check:** Convex backend is running

**Issue: Data not appearing**
- ✅ **Check:** Convex dev server running
- ✅ **Check:** Network tab in browser for errors
- ✅ **Check:** Convex dashboard for recent operations

---

## 🛠️ Debugging Tools

### Browser Developer Tools (Web)
```javascript
// In browser console:
localStorage // Check for session data
// Should see clerk session tokens
```

### Xcode Console (iOS)
- View → Debug Area → Activate Console
- Look for `[AuthService]`, `[useAuth]`, `[ChatRepository]` logs

### Android Logcat (Android)
- View → Tool Windows → Logcat
- Filter: `voicetotables`
- Look for authentication and deep link logs

### Convex Dashboard
- Visit: https://dashboard.convex.dev
- Check **Logs** tab for function calls
- Check **Data** tab for stored messages/tables
- Verify `userId` field is populated

---

## 📊 Expected Database Structure

After testing, your Convex database should have:

### Sessions Table
```javascript
{
  _id: "...",
  userId: "user_xxx", // From Clerk
  sessionId: "user_xxx_web_1234567890",
  platform: "web", // or "ios" or "android"
  templateId: "holiday-prep",
  createdAt: 1234567890,
  lastActiveAt: 1234567890,
  isActive: true
}
```

### Messages Table
```javascript
{
  _id: "...",
  userId: "user_xxx", // From Clerk auth context
  sessionId: "user_xxx_web_1234567890",
  role: "user",
  content: "Test message",
  timestamp: 1234567890
}
```

### Tables Table
```javascript
{
  _id: "...",
  userId: "user_xxx", // From Clerk auth context
  sessionId: "user_xxx_web_1234567890",
  title: "Holiday Feast",
  columns: ["Dish", "Status"],
  rows: [...],
  createdAt: 1234567890,
  lastUpdatedAt: 1234567890
}
```

---

## 🎯 Next Steps After Testing

### If Tests Pass ✅
1. **Deploy Convex:** `npx convex deploy`
2. **Update .env:** Add production Clerk key
3. **Configure production URLs:** In Clerk dashboard
4. **Test production build:** `npm run build && npm run preview`
5. **Prepare for app stores:** Follow deployment guides

### If Tests Fail ⚠️
1. **Check logs:** Browser console, Xcode console, Logcat
2. **Verify environment:** All variables in `.env`
3. **Check Clerk dashboard:** Events tab for errors
4. **Check Convex dashboard:** Logs tab for backend errors
5. **Review setup docs:** CLERK_SETUP.md, MOBILE_SETUP_CHECKLIST.md

---

## 📸 Screenshots to Capture

Document your testing with screenshots:

### Web
- [ ] Sign-in screen
- [ ] Signed-in main screen with user button
- [ ] Message in conversation
- [ ] Table generated
- [ ] Convex dashboard showing data with userId

### iOS
- [ ] Sign-in screen on simulator
- [ ] Safari OAuth screen
- [ ] Main screen after sign-in
- [ ] Deep link test result

### Android
- [ ] Sign-in screen on emulator
- [ ] Chrome Custom Tab OAuth
- [ ] Main screen after sign-in
- [ ] Deep link test result

---

## 🎉 Success Criteria

Your v0.2.0 implementation is successful if:

✅ Users can sign in on Web, iOS, and Android  
✅ OAuth redirects work on all platforms  
✅ Data saves with correct userId in Convex  
✅ Sessions persist across app restarts  
✅ Users can only see their own data  
✅ Sign out works correctly  
✅ Deep links function on mobile  

---

**Ready to test!** Start with the web app at http://localhost:3000, then move to iOS and Android.

Good luck! 🚀

