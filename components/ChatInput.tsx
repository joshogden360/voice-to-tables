import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X, Image as ImageIcon, Video, Wand2 } from 'lucide-react';
import { Attachment } from '../types';

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[], isEditMode: boolean) => void;
  onTranscribe: (blob: Blob) => Promise<string>;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onTranscribe, disabled }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if ((text.trim() || attachments.length > 0) && !disabled) {
      onSend(text, attachments, isEditMode);
      setText('');
      setAttachments([]);
      setIsEditMode(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- File Handling ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const type = file.type.startsWith('image') ? 'image' : 'video';
        
        setAttachments(prev => [...prev, {
          type,
          content: base64,
          mimeType: file.type,
          url: URL.createObjectURL(file) // For preview
        }]);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (attachments.length <= 1) setIsEditMode(false); // Reset edit mode if no images left
  };

  // --- Audio Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' }); // or webm
        setIsTranscribing(true);
        try {
           const transcribedText = await onTranscribe(blob);
           setText(prev => (prev ? prev + " " + transcribedText : transcribedText));
        } finally {
           setIsTranscribing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const hasImage = attachments.some(a => a.type === 'image');

  return (
    <div className="bg-white border-t border-slate-200 p-4 pb-6 md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-3 overflow-x-auto py-2">
             {attachments.map((att, idx) => (
               <div key={idx} className="relative group flex-shrink-0">
                  {att.type === 'image' ? (
                    <img src={att.url} alt="attachment" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                  ) : (
                    <div className="h-20 w-20 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                      <Video size={24} />
                    </div>
                  )}
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-2 -right-2 bg-slate-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
               </div>
             ))}
          </div>
        )}

        {/* Edit Mode Toggle (Only if Image is present) */}
        {hasImage && (
           <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isEditMode 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200 ring-2 ring-purple-100' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Wand2 size={12} />
                {isEditMode ? 'Magic Edit Mode On' : 'Magic Edit Mode Off'}
              </button>
              <span className="text-[10px] text-slate-400">
                {isEditMode ? "Describe how to edit the image." : "Ask questions about the image."}
              </span>
           </div>
        )}

        <div className="flex items-end gap-2 bg-slate-100 rounded-2xl p-2 border border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          
          {/* File Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileSelect}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-white" 
            disabled={disabled}
            title="Attach Image or Video"
          >
             <Paperclip size={20} />
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : (isTranscribing ? "Transcribing..." : "Message or attach media...")}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 px-2 text-slate-800 placeholder:text-slate-400"
            rows={1}
            disabled={disabled || isRecording || isTranscribing}
          />
          
          {/* Mic Button */}
          <button 
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2 transition-colors rounded-full hover:bg-white ${
               isRecording ? 'text-red-500 animate-pulse bg-red-50' : 'text-slate-400 hover:text-indigo-600'
            }`} 
            disabled={disabled}
            title="Hold to Speak"
          >
             <Mic size={20} />
          </button>

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={(!text.trim() && attachments.length === 0) || disabled}
            className={`p-2 rounded-xl transition-all duration-200 ${
              (text.trim() || attachments.length > 0) && !disabled 
                ? (isEditMode ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700' : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700')
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isEditMode ? <Wand2 size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};