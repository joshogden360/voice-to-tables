import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

/**
 * AuthService - Cross-platform authentication handler
 * Supports Web, iOS, and Android platforms
 * 
 * For Capacitor (iOS/Android):
 * - Uses system browser for OAuth flows
 * - Handles deep link callbacks
 * - Stores tokens securely
 */

export interface UserProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: number;
}

class AuthService {
  private platform: 'web' | 'ios' | 'android';
  private deepLinkListener: any = null;

  constructor() {
    this.platform = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
    console.log('[AuthService] Platform detected:', this.platform);
  }

  /**
   * Initialize authentication service
   * Sets up deep link handling for mobile OAuth callbacks
   */
  async initialize(): Promise<void> {
    if (this.platform !== 'web') {
      console.log('[AuthService] Setting up deep link handler for mobile OAuth');
      
      // Register deep link handler for OAuth callbacks
      this.deepLinkListener = await App.addListener('appUrlOpen', (data) => {
        console.log('[AuthService] Deep link received:', data.url);
        
        // Extract auth token from deep link if present
        const url = new URL(data.url);
        const token = url.searchParams.get('token');
        const clerkToken = url.searchParams.get('__clerk_status');
        
        if (token || clerkToken) {
          console.log('[AuthService] Auth callback detected in deep link');
          // Clerk will handle the token automatically via the web SDK
          // Just need to close the browser
          Browser.close();
        }
      });
    }
  }

  /**
   * Clean up listeners
   */
  async cleanup(): Promise<void> {
    if (this.deepLinkListener) {
      this.deepLinkListener.remove();
      this.deepLinkListener = null;
    }
  }

  /**
   * Check if running on native mobile platform
   */
  isMobilePlatform(): boolean {
    return this.platform === 'ios' || this.platform === 'android';
  }

  /**
   * Get platform identifier
   */
  getPlatform(): string {
    return this.platform;
  }

  /**
   * Open OAuth URL in system browser (for mobile)
   * On web, Clerk handles this natively
   */
  async openOAuthBrowser(url: string): Promise<void> {
    if (this.isMobilePlatform()) {
      console.log('[AuthService] Opening OAuth URL in system browser:', url);
      await Browser.open({
        url,
        presentationStyle: 'popover',
        toolbarColor: '#ffffff',
      });
    } else {
      // On web, just redirect
      window.location.href = url;
    }
  }

  /**
   * Generate unique session ID for authenticated user
   * Format: {userId}_{platform}_{timestamp}
   */
  generateSessionId(userId: string): string {
    const timestamp = Date.now();
    return `${userId}_${this.platform}_${timestamp}`;
  }

  /**
   * Get stored session ID for user
   * Returns cached session ID or generates new one
   */
  getSessionId(userId: string): string {
    const storageKey = `session_${userId}`;
    let sessionId = localStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = this.generateSessionId(userId);
      localStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Clear session data
   */
  clearSession(userId: string): void {
    const storageKey = `session_${userId}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Store user preferences
   */
  storeUserPreferences(userId: string, preferences: any): void {
    const key = `preferences_${userId}`;
    localStorage.setItem(key, JSON.stringify(preferences));
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): any {
    const key = `preferences_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

export const authService = new AuthService();

