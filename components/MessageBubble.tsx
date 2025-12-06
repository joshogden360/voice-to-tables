import React from 'react';
import { ChatMessage, Role } from '../types';
import { Bot, User, Play, Image as ImageIcon } from 'lucide-react';
import { ActionContainer } from './ActionWidgets';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  // Simple formatter for bold text
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-slate-200'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={18} />}
        </div>

        {/* Content Container */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 w-full`}>
          
          {/* Attachments (User sent or AI generated) */}
          {message.attachments && message.attachments.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-1">
                {message.attachments.map((att, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm max-w-[200px] md:max-w-[300px]">
                     {att.type === 'image' ? (
                        <img 
                          src={att.url || `data:${att.mimeType};base64,${att.content}`} 
                          alt="content" 
                          className="w-full h-auto object-cover" 
                        />
                     ) : (
                        <div className="bg-slate-900 w-48 h-32 flex items-center justify-center text-white">
                           <Play size={24} className="fill-current" />
                           <span className="sr-only">Video Attachment</span>
                        </div>
                     )}
                     <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 rounded-full backdrop-blur-md">
                       {att.type === 'image' ? 'Image' : 'Video'}
                     </div>
                  </div>
                ))}
             </div>
          )}

          {/* Text Bubble */}
          {message.content && (
            <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
              isUser 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
            }`}>
               {formatContent(message.content)}
            </div>
          )}
          
          {/* Action Widget (Server Actions like List/Camera) */}
          {message.action && (
            <div className="w-full max-w-sm">
               <ActionContainer action={message.action} data={message.actionData} />
            </div>
          )}
          
          {/* Timestamp */}
          <span className="text-[10px] text-slate-400 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  );
};