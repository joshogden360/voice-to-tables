# Clerk Authentication Setup Guide

This guide will help you configure Clerk authentication for Voice to Tables across Web, iOS, and Android platforms.

## Prerequisites

- Node.js installed
- Convex backend set up
- Clerk account (free at https://clerk.com)

---

## 1. Create Clerk Application

1. **Sign up / Sign in to Clerk:**
   - Visit https://dashboard.clerk.com
   - Create a new account or sign in

2. **Create Application:**
   - Click "Add application"
   - Name: `Voice to Tables`
   - Choose authentication methods:
     - ✅ Email
     - ✅ Google (recommended)
     - ✅ Apple (for iOS users)
     - Optional: GitHub, Microsoft, etc.

3. **Get Publishable Key:**
   - Copy your **Publishable Key** (starts with `pk_test_...`)
   - Add to `.env`:
     ```bash
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
     ```

---

## 2. Configure Redirect URLs

### Web Application
In Clerk Dashboard → **Paths** section:

**Home URL:**
```
http://localhost:3000
https://your-production-domain.com
```

**Sign-in URL:**
```
http://localhost:3000/sign-in
https://your-production-domain.com/sign-in
```

**Sign-up URL:**
```
http://localhost:3000/sign-up
https://your-production-domain.com/sign-up
```

**After sign-in URL:**
```
http://localhost:3000
https://your-production-domain.com
```

### Mobile Applications (iOS & Android)

In Clerk Dashboard → **Paths** section → **Mobile** tab:

**Custom Redirect URL (Deep Link):**
```
voicetotables://oauth-callback
```

This must match the deep link scheme in `capacitor.config.ts` (`voicetotables://`).

---

## 3. iOS Configuration

### Add URL Scheme to Info.plist

Edit `ios/App/App/Info.plist` and add:

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

### Universal Links (Optional - for production)

For better UX in production, configure Universal Links:

1. In Clerk Dashboard → **Paths** → **iOS Universal Links**
2. Add your domain: `https://your-domain.com`
3. Upload `apple-app-site-association` file to your web server

---

## 4. Android Configuration

### Add Intent Filter to AndroidManifest.xml

Edit `android/app/src/main/AndroidManifest.xml`:

```xml
<activity
    android:name=".MainActivity"
    android:configChanges="..."
    android:theme="@style/AppTheme"
    android:launchMode="singleTask">
    
    <!-- Existing intent filters -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- ADD THIS: Deep link for OAuth callbacks -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="voicetotables" android:host="oauth-callback" />
    </intent-filter>
    
</activity>
```

### App Links (Optional - for production)

For better UX, configure Android App Links:

1. In Clerk Dashboard → **Paths** → **Android App Links**
2. Add your domain: `https://your-domain.com`
3. Upload `assetlinks.json` file to `https://your-domain.com/.well-known/`

---

## 5. Testing Authentication

### Web (Development)
```bash
npm run dev
```
- Visit http://localhost:3000
- You should see the sign-in screen
- Sign in with email or OAuth provider
- App should load after authentication

### iOS (Simulator)
```bash
npm run build
npx cap sync ios
npx cap open ios
```
- Build and run in Xcode
- Click "Sign In"
- System browser will open for authentication
- After sign-in, app should redirect back automatically

### Android (Emulator)
```bash
npm run build
npx cap sync android
npx cap open android
```
- Build and run in Android Studio
- Click "Sign In"
- Chrome Custom Tab will open for authentication
- After sign-in, app should redirect back automatically

---

## 6. Troubleshooting

### "Missing Clerk Publishable Key" Error
- Ensure `.env` has `VITE_CLERK_PUBLISHABLE_KEY` set
- Restart dev server after adding environment variables

### OAuth Not Redirecting Back to App (Mobile)
- Verify deep link scheme matches in:
  - `capacitor.config.ts` → `plugins.App.appUrlOpen.schemes`
  - Clerk Dashboard → Mobile redirect URLs
  - iOS `Info.plist` → `CFBundleURLSchemes`
  - Android `AndroidManifest.xml` → `<data android:scheme="..."`

### "Invalid Redirect URL" Error
- Check Clerk Dashboard → **Paths**
- Ensure all development and production URLs are added
- Format: `voicetotables://oauth-callback` (no trailing slash)

### Deep Links Not Working on iOS
- Rebuild the app after modifying `Info.plist`
- Check scheme is lowercase and alphanumeric
- Test deep link in Safari: `voicetotables://oauth-callback`

### Deep Links Not Working on Android
- Rebuild the app after modifying `AndroidManifest.xml`
- Check `android:autoVerify="true"` is present
- Test deep link with adb:
  ```bash
  adb shell am start -W -a android.intent.action.VIEW \
    -d "voicetotables://oauth-callback" com.voicetotables.app
  ```

---

## 7. Production Deployment

### Update Environment Variables
1. Set production Clerk key in hosting platform (Vercel, Netlify, etc.):
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
   ```

2. Add production URLs to Clerk Dashboard:
   - `https://your-production-domain.com`
   - `https://your-production-domain.com/sign-in`
   - `https://your-production-domain.com/sign-up`

### App Store Submission
1. **iOS:**
   - Add Privacy Policy URL in App Store Connect
   - Declare data collection for authentication
   - Test Universal Links in production build

2. **Android:**
   - Add Privacy Policy URL in Google Play Console
   - Declare permissions in Play Console
   - Test App Links in production build

---

## 8. Security Best Practices

✅ **Use Environment Variables**
- Never commit `.env` to version control
- Use separate keys for development and production

✅ **Enable Multi-Factor Authentication**
- In Clerk Dashboard → **User & Authentication** → **Multi-factor**
- Recommended for enterprise deployments

✅ **Configure Session Management**
- In Clerk Dashboard → **Sessions and tokens**
- Set session timeout (default: 7 days)
- Enable "Require re-authentication for sensitive actions"

✅ **Monitor Authentication Events**
- Use Clerk Dashboard → **Events** to track sign-ins
- Set up webhooks for user events (optional)

---

## Additional Resources

- [Clerk React Docs](https://clerk.com/docs/quickstarts/react)
- [Clerk Capacitor Guide](https://clerk.com/docs/references/capacitor/overview)
- [Convex Auth Integration](https://docs.convex.dev/auth/clerk)
- [Deep Linking in Capacitor](https://capacitorjs.com/docs/guides/deep-links)

---

## Support

If you encounter issues:
1. Check Clerk Dashboard logs (Clerk → **Events**)
2. Check browser console for errors
3. Check native app logs (Xcode Console / Android Logcat)
4. Visit [Clerk Discord](https://clerk.com/discord) for community support

