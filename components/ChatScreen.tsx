import React, { useRef, useEffect } from 'react';
import { useChatViewModel } from '../hooks/useChatViewModel';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { Boxes, Trash2, Menu } from 'lucide-react';

export const ChatScreen: React.FC = () => {
  const { messages, isLoading, error, sendMessage, transcribeAudio, clearConversation } = useChatViewModel();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800">Agent Chat</h1>
            <div className="flex items-center gap-1.5">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
               <span className="text-xs text-slate-500 font-medium">Inventory Module Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={clearConversation}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear History"
            >
                <Trash2 size={20} />
            </button>
            <button className="md:hidden p-2 text-slate-400 hover:text-slate-600">
                <Menu size={20} />
            </button>
        </div>
      </header>

      {/* Message List */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start mb-6">
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Boxes size={16} className="text-indigo-600 animate-pulse" />
                 </div>
                 <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                 </div>
               </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex justify-center my-4">
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm border border-red-100 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input Area */}
      <ChatInput 
        onSend={sendMessage} 
        onTranscribe={transcribeAudio}
        disabled={isLoading} 
      />
    </div>
  );
};