<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ByBBPN5L4qeQJc5loGFFYDmng-F5g4Ka

## Run Locally

**Prerequisites:**  Node.js

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local and add your Gemini API key
   # Get your key at: https://aistudio.google.com/apikey
   ```

3. **Run the web app:**
   ```bash
   npm run dev
   ```
   
   Visit http://localhost:3000 to use the app in your browser.

### Run on Android

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Sync to Android:**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio or build via CLI:**
   ```bash
   cd android
   ./gradlew installDebug
   ```

4. **Launch on emulator/device:**
   ```bash
   adb shell am start -n com.voicetotables.app/.MainActivity
   ```

## API Keys & Configuration

This app supports multiple AI providers and services. Currently, only Gemini is active.

### Active Services
- **Google Gemini** (Required) - Get your key at https://aistudio.google.com/apikey

### Planned Services
- **Anthropic Claude** - For future AI features
- **OpenAI GPT** - For future AI features  
- **ElevenLabs** - For text-to-speech voice features
- **x402 Payments** - For monetization ([Learn more](https://github.com/coinbase/x402))

See `.env.example` for all configuration options.

## Version History

### v0.1.0 (2025-12-17)

#### Export Statistics:
- **8 Components**: React components for chat interface and widgets
- **1 Hook**: Custom React hook for chat view model
- **2 Services**: Chat repository and iOS-compatible audio streaming
- **Mobile Platforms**: Full iOS and Android support via Capacitor

#### Major Changes:
- **Mobile Platform Support**: Added complete Capacitor integration for iOS and Android deployment
- **iOS Audio Compatibility**: Implemented new AudioStreamPlayer service to fix iOS audio playback issues
- **Enhanced Documentation**: Added comprehensive setup instructions for web and mobile platforms
- **API Configuration**: Documented multi-provider support (Gemini active, Claude/OpenAI/ElevenLabs planned)

#### Technical Improvements:
- Migrated from Gemini 2.5 Flash to Gemini 2.0 Flash for Live API
- Implemented iOS-compatible audio streaming with proper Audio Session management
- Added extensive debug logging throughout audio pipeline for troubleshooting
- Enhanced error handling in live session management
- Improved microphone access flow to prevent iOS Audio Session interruption

#### Bug Fixes:
- Fixed iOS audio playback by implementing streaming audio player
- Resolved audio context initialization order for iOS compatibility
- Fixed microphone button state management with proper disabled state handling

#### Documentation:
- Added Android build and deployment instructions
- Added iOS build and deployment instructions
- Created .env.example template for API key configuration
- Documented planned service integrations (Claude, OpenAI, ElevenLabs, x402)
- Enhanced Quick Start guide with step-by-step instructions
