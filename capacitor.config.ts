import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.voicetotables.app',
  appName: 'VoiceToTables',
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
  }
};

export default config;
