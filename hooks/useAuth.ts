import { useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { authService, UserProfile } from '../services/authService';

/**
 * Custom authentication hook
 * Wraps Clerk's useUser and provides cross-platform session management
 */
export function useAuth() {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth service
  useEffect(() => {
    authService.initialize().then(() => {
      console.log('[useAuth] Auth service initialized');
      setIsInitialized(true);
    });

    return () => {
      authService.cleanup();
    };
  }, []);

  // Generate/retrieve session ID when user signs in
  useEffect(() => {
    if (isSignedIn && user && isInitialized) {
      const userSessionId = authService.getSessionId(user.id);
      setSessionId(userSessionId);
      console.log('[useAuth] Session ID for user:', userSessionId);
    } else {
      setSessionId(null);
    }
  }, [isSignedIn, user, isInitialized]);

  // Map Clerk user to our UserProfile
  const userProfile: UserProfile | null = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || null,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt || Date.now(),
  } : null;

  const signOut = useCallback(async () => {
    if (user) {
      authService.clearSession(user.id);
    }
    await clerkSignOut();
    setSessionId(null);
  }, [user, clerkSignOut]);

  const storePreferences = useCallback((preferences: any) => {
    if (user) {
      authService.storeUserPreferences(user.id, preferences);
    }
  }, [user]);

  const getPreferences = useCallback(() => {
    if (user) {
      return authService.getUserPreferences(user.id);
    }
    return null;
  }, [user]);

  return {
    // User state
    user: userProfile,
    isSignedIn: isSignedIn || false,
    isLoaded: isUserLoaded && isInitialized,
    
    // Session management
    sessionId,
    
    // Platform info
    platform: authService.getPlatform(),
    isMobilePlatform: authService.isMobilePlatform(),
    
    // Actions
    signOut,
    storePreferences,
    getPreferences,
  };
}

