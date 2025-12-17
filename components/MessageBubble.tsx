import React from 'react';
import { ChatMessage, Role, TableData } from '../types';
import { ActionContainer } from './ActionWidgets';
import { Snowflake, Layers } from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
  onUpdateTable?: (data: TableData) => void;
  onFocus?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onUpdateTable, onFocus }) => {
  const isUser = message.role === Role.USER;
  const isSystem = message.role === Role.SYSTEM;

  // System Messages - Subtle Timeline Events
  if (isSystem) {
      return (
        <div className="flex justify-center w-full my-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-100/50 rounded-full border border-slate-200/50 backdrop-blur-sm">
                <Layers size={12} className="text-slate-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{message.content}</span>
            </div>
        </div>
      );
  }

  // AI Messages are "Questions" - High-End Editorial Style
  if (!isUser) {
    // Check if the message is a structured greeting (Header + Bullets)
    const contentLines = message.content.split('\n');
    const isStructured = contentLines.length > 1;

    return (
      <div className="flex flex-col items-center w-full mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
        
        {/* Organic Blob Avatar - Christmas Edition (Red Only) */}
        <div className="w-16 h-16 mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-400 to-red-400 opacity-20 blur-xl rounded-full"></div>
            <div className="w-full h-full bg-gradient-to-tr from-rose-500 via-red-500 to-rose-400 animate-morph shadow-lg flex items-center justify-center relative z-10">
                 <Snowflake size={24} className="text-white mix-blend-overlay" />
            </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl text-center space-y-8 px-4 w-full">
            {isStructured ? (
                <div className="flex flex-col items-center gap-6 w-full">
                    <h2 className="text-3xl md:text-4xl font-serif text-slate-900 leading-tight">
                        {contentLines[0]}
                    </h2>
                    <div className="text-left bg-white/40 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm ring-1 ring-white/60 w-auto min-w-[300px] max-w-xl mx-auto">
                        <ul className="space-y-3">
                            {contentLines.slice(1).map((line, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-700 font-sans">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                    <span className="text-base md:text-lg leading-relaxed">{line.replace(/^[•-]\s*/, '')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <h2 className="text-3xl md:text-5xl font-serif text-slate-900 leading-[1.15] tracking-tight antialiased drop-shadow-sm">
                    {message.content}
                </h2>
            )}
            
            {message.action && (
                <div className="pt-4 flex justify-center w-full">
                   <div className="w-full max-w-2xl text-left transform transition-all duration-700 hover:scale-[1.01]">
                       <ActionContainer 
                        action={message.action} 
                        data={message.actionData} 
                        onUpdate={onUpdateTable}
                        onFocus={onFocus}
                       />
                   </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  // User Messages are "Surfaces" - Glassmorphism & Gradient Borders
  return (
    <div className="flex justify-center w-full mb-16 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-100 ease-out">
      <div className="max-w-2xl w-full group">
         <div className="backdrop-blur-xl bg-white/70 p-8 rounded-[2rem] border border-white/40 shadow-[0_8px_32px_rgba(30,30,60,0.04)] relative transition-all duration-500 hover:shadow-[0_12px_40px_rgba(30,30,60,0.06)] hover:bg-white/80 ring-1 ring-inset ring-white/60">
            
            {/* Subtle Gradient Edge Overlay */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
            
            {/* Accent Indicator - Rose for Christmas */}
            <div className="absolute -left-3 top-10 bottom-10 w-1 bg-gradient-to-b from-rose-300 to-rose-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
                <p className="text-xl md:text-2xl font-serif italic text-slate-700 leading-relaxed">
                    "{message.content}"
                </p>
                
                {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {message.attachments.map((att, i) => (
                            <div key={i} className="flex-shrink-0 relative rounded-xl overflow-hidden border border-white/50 shadow-sm w-20 h-20 bg-slate-100">
                                {att.type === 'image' ? (
                                    <img src={att.url} alt="attachment" className="w-full h-full object-cover mix-blend-multiply" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <span className="text-[10px] uppercase font-bold tracking-wider">File</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
         </div>
         
         <div className="mt-4 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-60 transition-opacity duration-500">
             <div className="h-px w-8 bg-slate-300"></div>
             <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase font-sans">Recorded</span>
             <div className="h-px w-8 bg-slate-300"></div>
         </div>
      </div>
    </div>
  );
};