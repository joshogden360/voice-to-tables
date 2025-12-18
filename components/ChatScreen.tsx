import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useChatViewModel } from '../hooks/useChatViewModel';
import { useAuth } from '../hooks/useAuth';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { BriefingHeader, JournalSidebar, RightPanel, TemplateSwitcher } from './EnterpriseWidgets';
import { AuthUserButton } from './AuthWrapper';
import { Trash2, PanelLeft, PanelRight, Snowflake, RefreshCw } from 'lucide-react';

// --- Aura Glow Component ---
const AuraGlow: React.FC<{ intensity: number }> = ({ intensity }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-noise opacity-30 z-10 mix-blend-overlay"></div>
      
      {/* Dynamic Aura Blooms */}
      <div 
        className="absolute top-[-10%] left-[-5%] w-[70rem] h-[70rem] bg-emerald-500/10 rounded-full blur-[120px] mix-blend-multiply animate-aura"
        style={{ opacity: intensity * 0.8 }}
      ></div>
      <div 
        className="absolute bottom-[-5%] right-[-10%] w-[60rem] h-[60rem] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-multiply animate-aura"
        style={{ opacity: intensity * 0.6, animationDelay: '-5s' }}
      ></div>
      <div 
        className="absolute top-[20%] right-[-5%] w-[40rem] h-[40rem] bg-slate-400/5 rounded-full blur-[80px] mix-blend-soft-light animate-aura"
        style={{ opacity: intensity * 0.4, animationDelay: '-2s' }}
      ></div>
    </div>
  );
};

export const ChatScreen: React.FC = () => {
  const { user, platform } = useAuth();
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
  
  // UI Aesthetic State
  const [auraIntensity, setAuraIntensity] = useState(0.6);

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
    <div className="flex h-full w-full bg-[#f8fafc] text-slate-900 font-sans overflow-hidden relative selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Background Aura */}
      <AuraGlow intensity={auraIntensity} />
      
      {/* Debug Info Overlay - Shows state and errors on screen */}
      {(error || liveState !== 'disconnected') && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 text-white text-[10px] px-5 py-1.5 rounded-full backdrop-blur-xl border border-white/10 font-mono shadow-2xl tracking-tight">
          {debugInfo}
        </div>
      )}

      {/* Aura Intensity Widget - Bottom Right */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-30 items-center gap-3 bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-xl border border-slate-200 shadow-lg group">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
            <RefreshCw size={12} className={liveState === 'connected' ? 'animate-spin' : ''} />
          </div>
          <div className="flex flex-col w-24 gap-1">
             <div className="flex justify-between items-center">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Aura</span>
                <span className="text-[8px] font-mono text-emerald-600 font-bold">{Math.round(auraIntensity * 100)}%</span>
             </div>
             <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.01"
                value={auraIntensity}
                onChange={(e) => setAuraIntensity(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                title="Aura Intensity"
             />
          </div>
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
        ${leftOpen ? 'fixed md:relative left-0 top-0 w-72 md:w-72 translate-x-0 z-50 md:z-20' : 'fixed md:relative w-0 -translate-x-full'} 
        h-full flex-shrink-0 bg-white/80 md:bg-white/40 backdrop-blur-3xl border-r border-slate-200/50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden shadow-2xl md:shadow-none
      `}>
          <div className="w-72 h-full">
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
        <header className="h-16 pt-safe flex items-center justify-between px-4 md:px-6 border-b border-slate-200/40 bg-white/40 backdrop-blur-xl z-30 flex-shrink-0 shadow-sm shadow-slate-200/20">
            {/* Left: Panel Toggle */}
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLeftOpen(!leftOpen)}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-95"
                  aria-label="Toggle History"
                >
                    <PanelLeft size={18} className={!leftOpen ? 'opacity-40' : ''} />
                </button>
            </div>

            {/* Center: Branding */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <h1 className="text-xl md:text-2xl font-serif font-black tracking-tighter text-slate-900">
                   Voice
                </h1>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-1.5">
                 <button 
                    onClick={clearConversation}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all group hidden sm:flex"
                    title="Start Fresh"
                    aria-label="Clear conversation"
                >
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>
                <button 
                  onClick={() => setRightOpen(!rightOpen)}
                  className={`p-2 rounded-lg transition-all active:scale-95 ${rightOpen ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                  aria-label="Toggle Data Panel"
                >
                    <PanelRight size={16} />
                </button>
                <div className="h-4 w-px bg-slate-200 mx-0.5"></div>
                <AuthUserButton />
            </div>
        </header>
        
        {/* Template Briefing Bar - Below Header */}
        <div className="h-10 px-4 md:px-6 bg-white/60 backdrop-blur-sm border-b border-slate-100 flex items-center justify-center flex-shrink-0">
            <BriefingHeader template={activeTemplate} />
        </div>

        {/* Scrollable Chat Area */}
        <main className="flex-1 overflow-y-auto relative scrollbar-hide">
            <div className="min-h-full flex flex-col justify-end pb-56 md:pb-52 pt-6 md:pt-8 px-4 md:px-6 max-w-4xl mx-auto">
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
            <div className="absolute bottom-32 md:bottom-36 left-0 right-0 flex justify-center px-4 pointer-events-auto">
                <div className="w-full max-w-4xl flex justify-center">
                    <TemplateSwitcher 
                        templates={templates} 
                        activeTemplate={activeTemplate} 
                        onSelect={changeTemplate}
                        onEasterEgg={() => setShowManifest(true)}
                    />
                </div>
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
        ${rightOpen ? 'fixed md:relative right-0 top-0 w-full md:w-[420px] translate-x-0 z-50 md:z-20' : 'fixed md:relative w-0 translate-x-full'} 
        h-full flex-shrink-0 bg-white/90 md:bg-white/40 backdrop-blur-3xl border-l border-slate-200/50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden shadow-2xl
      `}>
         <div className="w-full md:w-[420px] h-full flex flex-col">
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