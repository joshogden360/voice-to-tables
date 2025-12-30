import React, { useRef, useEffect, useState } from 'react';
import { useChatViewModel } from '../hooks/useChatViewModel';
import { useAuth } from '../hooks/useAuth';
import { TheSleigh } from './TheSleigh';
import { ReindeerGrid } from './ReindeerGrid';
import { NorthPoleHQ } from './NorthPoleHQ';
import { NiceListPreview } from './NiceListPreview';
import { MessageBubble } from './MessageBubble';
import { AuthUserButton } from './AuthWrapper';
import { Sparkles } from 'lucide-react';

export const ChatScreen: React.FC = () => {
  const { user } = useAuth();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    toggleLiveSession, 
    liveState, 
    error,
    updateMessageData,
    submitToMaster,
    activeTemplate,
    activeTableId,
    setActiveTableId,
    getAudioDebugInfo
  } = useChatViewModel();
  
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Local Input State for The Sleigh
  const [textInput, setTextInput] = useState('');

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
      if (textInput.trim()) {
          sendMessage(textInput);
          setTextInput('');
      }
  };

  const handleVerifyTable = async (data: any) => {
       // Placeholder for verification logic
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-900 font-sans overflow-hidden relative selection:bg-santa-100 selection:text-santa-900">
      
      {/* --- HEADER --- */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <span className="text-xl">🎅</span>
              </div>
              <div>
                <h1 className="text-lg font-serif font-black tracking-tight text-slate-900 leading-none">Santa's Workshop</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Voice-to-Voice Agentic Network</p>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                  <Sparkles size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Powered</span>
              </div>
              <AuthUserButton />
          </div>
      </header>

      {/* --- MAIN DASHBOARD GRID --- */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              
              {/* LEFT COLUMN: INTERACTION (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                  
                  {/* 1. THE SLEIGH (Voice Input) */}
                  <TheSleigh 
                      isListening={liveState === 'connected' || liveState === 'connecting'}
                      onToggleListening={toggleLiveSession}
                      currentInput={textInput}
                      onInputChange={setTextInput}
                      onSend={handleSend}
                  />

                  {/* 2. MESSAGE SCROLL (History) */}
                  <div className="flex-1 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[400px] flex flex-col">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-4">
                          <span className="text-xl">📜</span>
                          <h2 className="text-sm font-bold text-slate-900">Message Scroll</h2>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 space-y-4">
                          {messages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                  <p className="text-sm">Start talking to see your conversation here!</p>
                              </div>
                          ) : (
                              messages.map((msg) => (
                                <MessageBubble 
                                    key={msg.id} 
                                    message={msg} 
                                    isLast={isLoading && msg.id === messages[messages.length - 1].id}
                                    hideIfAssistant={false}
                                    onUpdateTable={(newData) => {
                                        updateMessageData(msg.id, newData);
                                        setActiveTableId(msg.id); 
                                    }}
                                    onVerifyTable={handleVerifyTable}
                                    onFocus={() => {
                                        if (msg.actionData) setActiveTableId(msg.id);
                                    }}
                                />
                              ))
                          )}
                          <div ref={bottomRef} />
                      </div>
                  </div>

                  {/* 3. REINDEER NETWORK (Agents) */}
                  <ReindeerGrid />
              </div>

              {/* RIGHT COLUMN: DATA (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto scrollbar-hide">
                  
                  {/* 1. NORTH POLE HQ (Metrics) */}
                  <NorthPoleHQ />

                  {/* 2. ELF ALERT (Notification) */}
                  <div className="bg-yellow-50 border border-yellow-100 rounded-3xl p-6 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 text-yellow-100 text-9xl">⚠️</div>
                      <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">⚠️</span>
                              <h3 className="text-sm font-bold text-slate-900">Elf Alert!</h3>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                              <strong className="text-slate-900">23 addresses</strong> still need to be found! Try saying: 
                              <em className="block mt-2 text-yellow-700 bg-yellow-100/50 p-2 rounded-lg not-italic">"Hey Santa, help me find missing addresses"</em>
                          </p>
                      </div>
                  </div>

                  {/* 3. NICE LIST PREVIEW (Data Sidebar) */}
                  <div className="flex-1 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                      <NiceListPreview />
                  </div>
                  
                  {/* 4. WORKSHOP GLOSSARY (Legend) */}
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                      <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg">📚</span>
                          <h2 className="text-sm font-bold text-slate-900">Workshop Glossary</h2>
                      </div>
                      <ul className="space-y-3 text-[10px] text-slate-500 font-medium">
                          <li className="flex items-center gap-2">
                              <span>🛷</span> 
                              <span><strong className="text-slate-700">The Sleigh</strong> = Voice input/output system</span>
                          </li>
                          <li className="flex items-center gap-2">
                              <span>📋</span> 
                              <span><strong className="text-slate-700">Nice List</strong> = Your contact database</span>
                          </li>
                          <li className="flex items-center gap-2">
                              <span>🍪</span> 
                              <span><strong className="text-slate-700">Cookie Jar</strong> = Budget tracker</span>
                          </li>
                          <li className="flex items-center gap-2">
                              <span>🏗️</span> 
                              <span><strong className="text-slate-700">Chimney</strong> = API gateway (how data flows)</span>
                          </li>
                           <li className="flex items-center gap-2">
                              <span>🦌</span> 
                              <span><strong className="text-slate-700">Reindeer</strong> = AI Agents handling specific jobs</span>
                          </li>
                          <li className="flex items-center gap-2">
                              <span>📊</span> 
                              <span><strong className="text-slate-700">North Pole HQ</strong> = Main dashboard</span>
                          </li>
                      </ul>
                  </div>

              </div>

          </div>
      </main>
    </div>
  );
};