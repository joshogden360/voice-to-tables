import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Attachment, LiveConnectionState } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[], isEditMode: boolean) => void;
  onTranscribe: (blob: Blob) => Promise<string>;
  onToggleLive: () => void;
  liveState: LiveConnectionState;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onToggleLive, liveState, disabled }) => {
  const isConnected = liveState === LiveConnectionState.CONNECTED;
  const isConnecting = liveState === LiveConnectionState.CONNECTING;

  // Visualizer simulation
  const [visualData, setVisualData] = useState<number[]>(new Array(12).fill(0.2));
  
  useEffect(() => {
    if (isConnected) {
        const interval = setInterval(() => {
            setVisualData(prev => prev.map(() => Math.random() * 0.8 + 0.2));
        }, 80);
        return () => clearInterval(interval);
    } else {
        setVisualData(new Array(12).fill(0.2));
    }
  }, [isConnected]);

  return (
    <div className="w-full h-48 flex flex-col items-center justify-end pointer-events-none bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent pb-10">
      <div className="max-w-md w-full mx-auto flex flex-col items-center gap-6 pointer-events-auto relative">
        
        {/* Status Text - Floating */}
        <div className={`transition-all duration-700 transform ${isConnected || isConnecting ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
           <span className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase font-sans flex items-center gap-2 bg-white/50 px-4 py-1 rounded-full backdrop-blur-md border border-white/50 shadow-sm">
              {isConnecting ? (
                  <>Connecting...</>
              ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                    Live Interview
                  </>
              )}
           </span>
        </div>

        {/* Hero Mic Container */}
        <div className="relative group flex items-center justify-center">
            
            {/* Idle Breathing Ring */}
            {!isConnected && !isConnecting && (
                <div className="absolute inset-0 bg-rose-500/5 rounded-full blur-xl animate-[pulse_4s_ease-in-out_infinite] scale-150"></div>
            )}

            {/* Active Glow - Red Only */}
            {isConnected && (
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-400 to-red-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
            )}
            
            {/* The Glass Button */}
            <button 
                onClick={onToggleLive}
                disabled={disabled || isConnecting}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) backdrop-blur-xl border border-white/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 ${
                    isConnected
                    ? 'bg-white/90 text-rose-600' 
                    : 'bg-white/80 text-slate-700 hover:text-rose-600'
                }`}
            >
                {/* Internal Visualizer Ring */}
                {isConnected ? (
                     <div className="absolute inset-0 flex items-center justify-center gap-1">
                        {visualData.slice(0, 5).map((h, i) => (
                            <div 
                                key={i}
                                className="w-1 bg-rose-400 rounded-full transition-all duration-75 ease-linear opacity-80"
                                style={{ height: `${h * 40}px` }}
                            />
                        ))}
                     </div>
                ) : (
                    isConnecting ? (
                        <div className="w-8 h-8 border-2 border-slate-300 border-t-rose-500 rounded-full animate-spin"></div>
                    ) : (
                        <Mic size={32} strokeWidth={1.5} className="opacity-80" />
                    )
                )}
            </button>
        </div>
      </div>
    </div>
  );
};