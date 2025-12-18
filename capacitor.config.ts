import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voice.app',
  appName: 'Voice',
  webDir: 'dist',
  android: {
    // Enable WebView debugging for console logs
    webContentsDebuggingEnabled: true,
    // Allow mixed content (http/https) if needed
    allowMixedContent: true
  },
  ios: {
    // Enable WebView debugging for Safari Web Inspector
    webContentsDebuggingEnabled: true,
    // Allow inline media playback (required for audio)
    allowsLinkPreview: false
  },
  server: {
    // CRITICAL: This makes Android treat the app as a "Secure Context"
    // Required for navigator.mediaDevices.getUserMedia to work
    androidScheme: 'https',
    iosScheme: 'capacitor',
    cleartext: true
  },
  plugins: {
    // Deep linking configuration for Clerk OAuth
    // Format: voicetotables://
    App: {
      appUrlOpen: {
        // Deep link scheme for authentication callbacks
        // Must match Clerk dashboard redirect URL settings
        schemes: ['voice']
      }
    }
  }
};

export default config;
