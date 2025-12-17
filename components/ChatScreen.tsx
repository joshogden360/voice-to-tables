import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useChatViewModel } from '../hooks/useChatViewModel';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { BriefingHeader, JournalSidebar, RightPanel, TemplateSwitcher } from './EnterpriseWidgets';
import { Trash2, PanelLeft, PanelRight, Snowflake, RefreshCw } from 'lucide-react';

// --- Snowfall Component ---
const Snowfall: React.FC<{ intensity: number }> = ({ intensity }) => {
  // Determine number of flakes based on intensity (0 to 1) -> 0 to 200 flakes
  const flakeCount = Math.floor(intensity * 200);

  const flakes = useMemo(() => {
    return Array.from({ length: 200 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 5 + 5 + 's',
      animationDelay: Math.random() * 5 + 's',
      // Increased opacity and size for better visibility
      opacity: Math.random() * 0.5 + 0.3, 
      size: Math.random() * 0.8 + 0.4 + 'rem', // Slightly larger for icons
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <style>
        {`
          @keyframes snowfall {
            0% { transform: translateY(-10vh) translateX(0) rotate(0deg); }
            100% { transform: translateY(110vh) translateX(20px) rotate(360deg); }
          }
        `}
      </style>
      {flakes.slice(0, flakeCount).map((flake) => (
        <div
          key={flake.id}
          className="absolute text-white/80"
          style={{
            left: `${flake.left}%`,
            top: `-20px`,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration} linear infinite`,
            animationDelay: flake.animationDelay,
          }}
        >
           <Snowflake strokeWidth={1.5} className="w-full h-full" />
        </div>
      ))}
    </div>
  );
};

export const ChatScreen: React.FC = () => {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    transcribeAudio, 
    clearConversation, 
    toggleLiveSession, 
    liveState, 
    error,
    updateMessageData,
    activeTemplate,
    changeTemplate,
    templates,
    history,
    requirements,
    activeTableData,
    activeTableId,
    setActiveTableId,
    getAudioDebugInfo
  } = useChatViewModel();
  
  // Debug state display
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  useEffect(() => {
    // Update debug info periodically when connected
    const updateDebug = () => {
      const audioInfo = getAudioDebugInfo();
      const info = `State: ${liveState} | Sent: ${audioInfo.sent} | Recv: ${audioInfo.received}${error ? ` | Err: ${error}` : ''}`;
      setDebugInfo(info);
    };
    
    updateDebug();
    
    // Update every 500ms while connected
    if (liveState === 'connected') {
      const interval = setInterval(updateDebug, 500);
      return () => clearInterval(interval);
    }
  }, [liveState, error, getAudioDebugInfo]);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Panel States - Default closed on mobile
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  
  // Easter Egg State
  const [showManifest, setShowManifest] = useState(false);
  
  // Snow State
  const [snowIntensity, setSnowIntensity] = useState(0.5); // Default to stronger snow

  // Auto-open right panel when a table is active
  useEffect(() => {
    if (activeTableData) {
        setRightOpen(true);
    }
  }, [activeTableId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex h-full w-full bg-gradient-to-br from-rose-100/40 via-slate-50 to-rose-200/40 text-slate-900 font-sans overflow-hidden relative selection:bg-rose-200 selection:text-rose-900">
      
      {/* Background Decor - Christmas Theme (Red Only Glows) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-noise opacity-30 z-10 mix-blend-overlay"></div>
          {/* Top Red Glow - More Intense */}
          <div className="absolute top-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-red-600/20 rounded-full blur-[100px] opacity-70 mix-blend-multiply animate-pulse duration-[10000ms]"></div>
          {/* Bottom Red Glow - More Intense */}
          <div className="absolute bottom-[-10%] right-[-20%] w-[50rem] h-[50rem] bg-rose-600/25 rounded-full blur-[80px] opacity-70 mix-blend-multiply animate-pulse duration-[8000ms]"></div>
      </div>

      {/* Snowfall Layer */}
      <Snowfall intensity={snowIntensity} />
      
      {/* Debug Info Overlay - Shows state and errors on screen */}
      {(error || liveState !== 'disconnected') && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md font-mono max-w-[90%] truncate">
          {debugInfo}
        </div>
      )}

      {/* Intensity Slider (Bottom Right - Highly Visible) - Hidden on mobile for space */}
      <div className="hidden md:flex absolute bottom-6 right-6 z-30 items-center gap-3 bg-white/90 backdrop-blur-md p-3 rounded-full border border-rose-200 shadow-xl shadow-rose-900/10 animate-in slide-in-from-bottom-10 fade-in duration-1000">
          <Snowflake size={18} className={`text-rose-500 ${snowIntensity > 0.8 ? 'animate-spin' : ''}`} />
          <div className="flex flex-col w-32">
             <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01"
                value={snowIntensity}
                onChange={(e) => setSnowIntensity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-rose-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                title="Snow Intensity"
             />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-800 w-12 text-right">Let it snow</span>
      </div>

      {/* EASTER EGG OVERLAY: SCRIPT MANIFEST */}
      {showManifest && (
        <div 
            className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-500 cursor-pointer"
            onClick={() => setShowManifest(false)}
        >
            <div className="max-w-3xl w-full p-12 md:p-16 text-rose-50 font-mono text-sm leading-relaxed border border-rose-500/30 rounded-lg bg-black/40 shadow-2xl relative overflow-hidden group">
                {/* Vintage CRT scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
                
                <div className="relative z-20">
                    <div className="mb-12 text-center border-b border-rose-500/30 pb-6">
                        <h2 className="text-3xl font-bold tracking-[0.3em] text-rose-500 uppercase font-sans">Technical Manifest</h2>
                        <p className="mt-2 text-[10px] text-slate-400 uppercase tracking-widest">Confidential • Architecture Review</p>
                    </div>

                    <div className="space-y-8 font-mono">
                        <div>
                            <p className="text-slate-400 mb-1 text-xs uppercase tracking-widest">Scene: Browser Window - Day</p>
                            <p className="text-rose-200">REACT 19 initializes the view. TYPESCRIPT ensures type safety.</p>
                        </div>

                        <div className="pl-8 border-l-2 border-rose-500/20">
                            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Audio Engine (V.O.)</h3>
                            <p className="text-slate-300">
                                I am utilizing the Web Audio API. I bypass standard browser decoders for raw speed.<br/><br/>
                                I encode 16-bit PCM audio at 16kHz for the uplink.<br/>
                                I decode incoming chunks at 24kHz for the downlink.<br/>
                                My buffers are scheduled manually for zero-latency gapless playback.
                            </p>
                        </div>

                        <div className="pl-8 border-l-2 border-rose-500/20">
                            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Google GenAI SDK (Entering)</h3>
                            <p className="text-slate-300">
                                I connect via WebSockets using the Live API. My model is Gemini 2.5 Flash.<br/>
                                I listen. I speak. When I hear structured data, I trigger the 'generateTable' tool.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">System</h3>
                            <p className="text-rose-200">
                                The schema is dynamic. It changes based on the user's template.<br/>
                                Unstructured voice becomes structured JSON.<br/>
                                Instantaneously.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 text-center opacity-50 text-[10px] uppercase tracking-[0.2em] animate-pulse">
                        End of Transmission
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- LEFT PANEL: JOURNAL --- */}
      <div className={`
        ${leftOpen ? 'fixed md:relative left-0 top-0 w-64 md:w-64 translate-x-0 z-50 md:z-20' : 'fixed md:relative w-0 -translate-x-full'} 
        h-full flex-shrink-0 bg-white/95 md:bg-white/40 backdrop-blur-xl border-r border-white/50 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden shadow-2xl md:shadow-none
      `}>
          <div className="w-64 h-full">
             <JournalSidebar entries={history} />
          </div>
      </div>
      
      {/* Mobile Overlay for Left Panel */}
      {leftOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setLeftOpen(false)}
        />
      )}

      {/* --- CENTER PANEL: WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative bg-transparent">
        
        {/* Sticky Header */}
        <header className="h-auto min-h-16 pt-safe flex items-center justify-between px-3 md:px-4 border-b border-white/30 bg-white/20 backdrop-blur-md z-30 flex-shrink-0">
            <div className="flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => setLeftOpen(!leftOpen)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white/50 rounded-lg transition-colors touch-manipulation"
                  aria-label="Toggle History"
                >
                    <PanelLeft size={20} className={!leftOpen ? 'opacity-50' : ''} />
                </button>
                <div className="h-4 w-px bg-slate-300/50 hidden md:block"></div>
                <h1 className="text-base md:text-lg font-serif italic text-slate-800 hidden sm:block">Voice to Data <span className="text-[10px] md:text-xs not-italic text-rose-500/80 tracking-widest ml-1 md:ml-2 font-sans uppercase">Holiday</span></h1>
            </div>

            {/* Briefing Info Centered - Responsive */}
            <div className="flex-1 flex justify-center px-2">
                 <BriefingHeader template={activeTemplate} />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                 <button 
                    onClick={clearConversation}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors touch-manipulation"
                    title="Start Fresh"
                    aria-label="Clear conversation"
                >
                    <RefreshCw size={18} />
                </button>
                <div className="h-4 w-px bg-slate-300/50 hidden md:block"></div>
                <button 
                  onClick={() => setRightOpen(!rightOpen)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white/50 rounded-lg transition-colors touch-manipulation"
                  aria-label="Toggle Data Panel"
                >
                    <PanelRight size={20} className={!rightOpen ? 'opacity-50' : ''} />
                </button>
            </div>
        </header>

        {/* Scrollable Chat Area */}
        <main className="flex-1 overflow-y-auto relative scrollbar-hide">
            <div className="min-h-full flex flex-col justify-end pb-64 md:pb-56 pt-6 md:pt-10 px-3 md:px-12 max-w-4xl mx-auto">
                {messages.map((msg) => (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    onUpdateTable={(newData) => {
                        updateMessageData(msg.id, newData);
                        setActiveTableId(msg.id); // Sync right panel on edit
                    }}
                    onFocus={() => {
                        if (msg.actionData) setActiveTableId(msg.id); // Sync right panel on click
                    }}
                />
                ))}
                <div ref={bottomRef} />
            </div>
        </main>

        {/* Floating Input Controls */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-40 pb-safe">
             {/* Template Switcher */}
            <div className="absolute bottom-40 md:bottom-48 left-0 right-0 flex justify-center pb-2 md:pb-4 px-2 animate-in slide-in-from-bottom-4 duration-1000 pointer-events-auto">
                <TemplateSwitcher 
                    templates={templates} 
                    activeTemplate={activeTemplate} 
                    onSelect={changeTemplate}
                    onEasterEgg={() => setShowManifest(true)}
                />
            </div>

            <ChatInput 
                onSend={sendMessage} 
                onTranscribe={transcribeAudio}
                onToggleLive={toggleLiveSession}
                liveState={liveState}
                disabled={false} 
            />
        </div>
      </div>

      {/* --- RIGHT PANEL: DATA & TOOLS --- */}
      <div className={`
        ${rightOpen ? 'fixed md:relative right-0 top-0 w-full md:w-96 translate-x-0 z-50 md:z-20' : 'fixed md:relative w-0 translate-x-full'} 
        h-full flex-shrink-0 bg-white/95 md:bg-white/60 backdrop-blur-2xl border-l border-white/50 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] overflow-hidden shadow-2xl
      `}>
         <div className="w-full md:w-96 h-full flex flex-col">
             <RightPanel 
                requirements={requirements} 
                tableData={activeTableData} 
                onUpdateTable={(newData) => activeTableId && updateMessageData(activeTableId, newData)}
                onClose={() => setRightOpen(false)}
             />
         </div>
      </div>
      
      {/* Mobile Overlay for Right Panel */}
      {rightOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setRightOpen(false)}
        />
      )}
    </div>
  );
};