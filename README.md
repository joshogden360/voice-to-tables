<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Voice

Transform conversations into structured data with AI-powered voice processing.

**Multi-platform support:** Web, iOS, and Android  
**Real-time collaboration:** Powered by Convex backend  
**Secure authentication:** Clerk integration for all platforms

View your app in AI Studio: https://ai.studio/apps/drive/1ByBBPN5L4qeQJc5loGFFYDmng-F5g4Ka

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Authentication Setup](#authentication-setup)
- [Platform-Specific Builds](#platform-specific-builds)
- [API Keys & Configuration](#api-keys--configuration)
- [Version History](#version-history)

---

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Convex account** - [Sign up free](https://www.convex.dev/)
- **Clerk account** - [Sign up free](https://clerk.com/)
- **Google Gemini API key** - [Get yours](https://aistudio.google.com/apikey)

### Platform-Specific Requirements

**For iOS:**
- macOS with Xcode installed
- iOS Simulator or physical device

**For Android:**
- Android Studio
- Android SDK and emulator or physical device

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

See [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) for detailed configuration.

Create a `.env` file in the project root:

```bash
# Google Gemini API (Required)
API_KEY=your_gemini_api_key_here

# Convex Backend (Required)
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication (Required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
```

### 3. Set Up Convex Backend

```bash
# Initialize Convex (first time only)
npx convex dev

# This will:
# 1. Create a new Convex deployment
# 2. Push your schema and functions
# 3. Give you a deployment URL
# 4. Add VITE_CONVEX_URL to your .env
```

### 4. Configure Clerk Authentication

Follow the detailed guide in [CLERK_SETUP.md](./CLERK_SETUP.md) to:
- Create a Clerk application
- Configure redirect URLs for web and mobile
- Set up deep linking for iOS and Android

**Quick setup:**
1. Visit https://dashboard.clerk.com
2. Create new application
3. Copy publishable key to `.env`
4. Add redirect URL: `voicetotables://oauth-callback`

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000 and sign in to start using the app!

---

## Environment Setup

All required environment variables are documented in [ENV_TEMPLATE.md](./ENV_TEMPLATE.md).

### Required Variables
```bash
API_KEY=                         # Google Gemini API key
VITE_CONVEX_URL=                # Convex deployment URL
VITE_CLERK_PUBLISHABLE_KEY=     # Clerk publishable key
```

### Getting Your Keys

**Google Gemini:**
- Visit https://aistudio.google.com/apikey
- Create a new API key
- Add to `.env` as `API_KEY`

**Convex:**
```bash
npx convex dev
# Copy the deployment URL shown
# Add to .env as VITE_CONVEX_URL
```

**Clerk:**
- Visit https://dashboard.clerk.com
- Create new application
- Copy publishable key
- Add to `.env` as `VITE_CLERK_PUBLISHABLE_KEY`

---

## Authentication Setup

Voice uses **Clerk** for secure, multi-platform authentication.

### Features
- ✅ Email/password authentication
- ✅ OAuth (Google, Apple, GitHub, etc.)
- ✅ Multi-factor authentication
- ✅ Session management
- ✅ Cross-platform support (Web, iOS, Android)

### Setup Guide

See [CLERK_SETUP.md](./CLERK_SETUP.md) for complete setup instructions.

**Quick checklist:**
- [ ] Create Clerk application
- [ ] Add publishable key to `.env`
- [ ] Configure redirect URLs in Clerk Dashboard
- [ ] Set up deep linking for mobile (iOS/Android)
- [ ] Test authentication on all platforms

**Mobile Deep Link:**
```
voicetotables://oauth-callback
```

---

## Platform-Specific Builds

### Web Development
```bash
npm run dev
# Visit http://localhost:3000
```

### Web Production
```bash
npm run build
npm run preview
```

### iOS Build

**Prerequisites:** macOS with Xcode

```bash
# 1. Build web app
npm run build

# 2. Sync to iOS
npx cap sync ios

# 3. Open in Xcode
npx cap open ios

# 4. Build and run in Xcode simulator or device
```

**Important:** Configure deep linking in `ios/App/App/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>voicetotables</string>
        </array>
    </dict>
</array>
```

### Android Build

**Prerequisites:** Android Studio

```bash
# 1. Build web app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. Build and run (or use CLI)
cd android
./gradlew installDebug

# 5. Launch on emulator/device
adb shell am start -n com.voicetotables.app/.MainActivity
```

**Important:** Configure deep linking in `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="voicetotables" android:host="oauth-callback" />
</intent-filter>
```

---

## API Keys & Configuration

### Active Services
| Service | Purpose | Required | Get Key |
|---------|---------|----------|---------|
| **Google Gemini** | AI voice processing & table generation | ✅ Yes | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **Convex** | Real-time database & backend | ✅ Yes | [convex.dev](https://www.convex.dev/) |
| **Clerk** | User authentication (Web, iOS, Android) | ✅ Yes | [clerk.com](https://clerk.com/) |

### Planned Integrations
- **Anthropic Claude** - Alternative AI model
- **OpenAI GPT** - Alternative AI model
- **ElevenLabs** - Enhanced text-to-speech
- **x402 Payments** - Micropayment monetization ([Learn more](https://github.com/coinbase/x402))

---

## Architecture

### Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Mobile:** Capacitor 8 (iOS + Android)
- **Authentication:** Clerk (multi-platform)
- **Backend:** Convex (real-time database)
- **AI:** Google Gemini 2.0 Flash (Live API)
- **Audio:** Web Audio API + custom streaming

### Key Features
- 🎤 Real-time voice-to-data conversion
- 📊 Dynamic table generation from conversation
- 🔄 Live multi-user collaboration
- 🔐 Secure user authentication
- 📱 Native iOS and Android apps
- 🌐 Progressive Web App (PWA)
- ❄️ Holiday-themed UI with customizable snowfall

### Data Architecture
- **Multi-tenancy:** User data is isolated by `userId`
- **Session-based:** Each conversation has a unique `sessionId`
- **Real-time sync:** Convex provides automatic real-time updates
- **Platform tracking:** Sessions track origin (web/ios/android)

---

## Development

### Project Structure
```
voice-to-tables/
├── components/          # React components
│   ├── AuthWrapper.tsx  # Authentication wrapper
│   ├── ChatScreen.tsx   # Main chat interface
│   ├── ErrorBoundary.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication hook
│   └── useChatViewModel.ts
├── services/           # Business logic
│   ├── authService.ts  # Cross-platform auth
│   └── chatRepository.ts
├── convex/             # Backend (Convex)
│   ├── schema.ts       # Database schema
│   ├── messages.ts     # Message functions
│   ├── tables.ts       # Table functions
│   └── sessions.ts     # Session management
├── ios/                # iOS native project
├── android/            # Android native project
└── ...
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npx convex dev       # Start Convex backend
npx cap sync         # Sync web to native platforms
```

---

## Troubleshooting

### "Missing Clerk Publishable Key"
- Ensure `.env` has `VITE_CLERK_PUBLISHABLE_KEY` set
- Restart dev server after adding environment variables

### Authentication Not Working on Mobile
- Verify deep link scheme is configured:
  - `capacitor.config.ts` → `voicetotables`
  - Clerk Dashboard → `voicetotables://oauth-callback`
  - iOS `Info.plist` → URL Schemes
  - Android `AndroidManifest.xml` → Intent Filters

### Convex Connection Errors
- Run `npx convex dev` to start backend
- Check `VITE_CONVEX_URL` is set correctly
- Ensure you're authenticated: `npx convex login`

### Audio Not Working on iOS
- Ensure microphone permissions are granted
- Check iOS `Info.plist` has microphone usage description
- Test on physical device (simulator has limited audio support)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Support

- **Documentation:** [CLERK_SETUP.md](./CLERK_SETUP.md), [ENV_TEMPLATE.md](./ENV_TEMPLATE.md)
- **Issues:** Open an issue on GitHub
- **Email:** support@voicetotables.app

---

## Version History

### v0.2.0 (2025-12-18)

#### Export Statistics:
- **11 Components**: Added LoadingScreen, ErrorBoundary, AuthWrapper
- **2 Hooks**: useAuth (new), useChatViewModel (enhanced)
- **3 Services**: authService (new), chatRepository, AudioStreamPlayer
- **4 Convex Modules**: messages, tables, sessions (new), schema (enhanced)
- **Authentication**: Full Clerk integration for Web, iOS, and Android

#### Major Changes:
- **Multi-Platform Authentication**: Integrated Clerk for secure authentication across Web, iOS, and Android
- **Multi-Tenancy Architecture**: Complete user data isolation with userId-based security
- **Session Management**: Unique session IDs per user with platform tracking
- **Real-time Collaboration**: Enhanced Convex backend with user ownership and session tracking
- **Deep Linking**: OAuth callback support for mobile platforms via `voicetotables://` scheme

#### Technical Improvements:
- Implemented cross-platform authService with deep link handling
- Enhanced Convex schema with users, sessions, and multi-tenant data isolation
- Added useAuth hook wrapping Clerk with session management
- Integrated ErrorBoundary for graceful error handling
- Added LoadingScreen for authentication initialization
- Updated all Convex mutations/queries to require userId for security
- Platform detection (web/ios/android) for analytics and debugging

#### New Features:
- **User Authentication**: Sign in with email, Google, Apple, or other OAuth providers
- **Session Tracking**: Each conversation tracked per user with platform metadata
- **User Preferences**: Store and retrieve user settings (templates, theme, etc.)
- **Data Isolation**: Complete separation of user data in database
- **Auto Session Recovery**: Sessions persist across app restarts

#### Bug Fixes:
- Fixed session ID generation to be user-specific instead of global
- Resolved data leakage by adding userId to all database queries
- Added proper error handling for missing authentication
- Fixed Clerk routing mode for mobile compatibility (hash-based)

#### Documentation:
- Created comprehensive CLERK_SETUP.md guide for authentication setup
- Created ENV_TEMPLATE.md for environment variable configuration
- Enhanced README with authentication setup instructions
- Added troubleshooting section for common authentication issues
- Documented deep linking configuration for iOS and Android

#### Security Enhancements:
- All database queries now require userId (data isolation)
- Session IDs include userId to prevent session hijacking
- Added error boundaries to prevent information leakage
- Implemented secure token storage via localStorage
- Platform-specific security configurations for iOS/Android

---

### v0.1.0 (2025-12-17)

#### Export Statistics:
- **8 Components**: React components for chat interface and widgets
- **1 Hook**: Custom React hook for chat view model
- **2 Services**: Chat repository and iOS-compatible audio streaming
- **Mobile Platforms**: Full iOS and Android support via Capacitor

#### Major Changes:
- **Mobile Platform Support**: Added complete Capacitor integration for iOS and Android deployment
- **iOS Audio Debugging Infrastructure**: Implemented new AudioStreamPlayer service and extensive logging for iOS audio troubleshooting
- **Enhanced Documentation**: Added comprehensive setup instructions for web and mobile platforms
- **API Configuration**: Documented multi-provider support (Gemini active, Claude/OpenAI/ElevenLabs planned)

#### Technical Improvements:
- Migrated from Gemini 2.5 Flash to Gemini 2.0 Flash for Live API
- Implemented AudioStreamPlayer service with iOS Audio Session management
- Added extensive debug logging throughout audio pipeline for troubleshooting
- Enhanced error handling in live session management
- Improved microphone access flow to prevent iOS Audio Session interruption
- Added audio chunk counters for debugging playback issues

#### Known Issues:
- **iOS Audio Playback**: Audio streaming on iOS requires additional debugging and optimization
- Audio chunks are being received but playback may not work consistently on iOS devices

#### Bug Fixes:
- Fixed microphone button state management with proper disabled state handling
- Resolved audio context initialization order for iOS compatibility
- Added proper error handling for microphone access failures

#### Documentation:
- Added Android build and deployment instructions
- Added iOS build and deployment instructions
- Created .env.example template for API key configuration
- Documented planned service integrations (Claude, OpenAI, ElevenLabs, x402)
- Enhanced Quick Start guide with step-by-step instructions
