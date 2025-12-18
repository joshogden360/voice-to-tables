import React from 'react';
import { SignIn, SignedIn, SignedOut, UserButton, useClerk } from '@clerk/clerk-react';
import { LoadingScreen } from './LoadingScreen';

/**
 * AuthWrapper - Handles authentication UI
 * Shows sign-in screen when not authenticated
 * Shows app content when authenticated
 */

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { loaded } = useClerk();
  
  // Show loading screen while Clerk initializes
  if (!loaded) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      {/* When user is signed out, show full-screen sign-in */}
      <SignedOut>
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-white p-6">
          <div className="w-full max-w-[420px]">
            {/* Branding */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter text-slate-900">
                  Voice
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium uppercase tracking-[0.2em] mt-3">
                Conversational Intelligence
              </p>
            </div>
            
            {/* Sign-in card */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200/40 overflow-hidden">
              <SignIn 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none bg-transparent border-0 py-8",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-300 rounded-xl",
                    formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all duration-300 rounded-xl py-3 text-sm font-bold uppercase tracking-widest",
                    footerActionLink: "text-emerald-600 hover:text-emerald-700 font-bold",
                    identityPreviewEditButton: "text-emerald-600 hover:text-emerald-700",
                    formFieldInput: "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all rounded-xl py-3",
                    formFieldLabel: "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2",
                    footer: "bg-slate-50/50 border-t border-slate-100 py-6",
                    cardBox: "shadow-none",
                  }
                }}
                routing="hash"
              />
            </div>
            
            {/* Footer */}
            <p className="mt-8 text-center text-xs text-slate-400 font-light">
              Available on Web, iOS & Android
            </p>
          </div>
        </div>
      </SignedOut>

      {/* When user is signed in, show app with user button */}
      <SignedIn>
        {/* User button will be integrated into the header */}
        {children}
      </SignedIn>
    </>
  );
};

/**
 * AuthUserButton - Displays user profile and sign-out option
 * To be placed in the app header
 */
export const AuthUserButton: React.FC = () => {
  return (
    <div className="relative">
      <UserButton 
        appearance={{
          elements: {
            avatarBox: "w-9 h-9 ring-2 ring-emerald-200 ring-offset-2 hover:ring-emerald-300 transition-all",
            userButtonPopoverCard: "shadow-2xl border border-slate-100",
          }
        }}
        afterSignOutUrl="/sign-in"
      />
    </div>
  );
};

