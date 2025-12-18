import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingScreen - Shows while authentication is initializing
 */
export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-white">
      <div className="text-center">
        <div className="relative mb-6">
          <Loader2 
            className="w-12 h-12 text-emerald-600 animate-spin mx-auto" 
            strokeWidth={2}
          />
          <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse"></div>
        </div>
        
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <h1 className="text-3xl font-serif font-bold tracking-tight text-slate-900">
            Voice
          </h1>
        </div>
        
        <p className="text-sm text-slate-500 animate-pulse font-light">
          Loading...
        </p>
      </div>
    </div>
  );
};

