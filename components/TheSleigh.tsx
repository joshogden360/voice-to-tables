import React from 'react';
import { Mic, Send, Globe, Wifi } from 'lucide-react';

interface TheSleighProps {
    isListening: boolean;
    onToggleListening: () => void;
    currentInput: string;
    onInputChange: (val: string) => void;
    onSend: () => void;
}

export const TheSleigh: React.FC<TheSleighProps> = ({ 
    isListening, 
    onToggleListening, 
    currentInput, 
    onInputChange, 
    onSend 
}) => {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 mb-6">
            <div className="flex items-center gap-2 mb-8">
                <span className="text-xl">🛷</span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">The Sleigh <span className="text-slate-400 font-normal normal-case tracking-normal ml-2">(Voice Interface)</span></h2>
            </div>

            <div className="flex flex-col items-center justify-center mb-8">
                <button 
                    onClick={onToggleListening}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-santa-600 shadow-2xl shadow-santa-500/50 scale-110' : 'bg-santa-500 hover:bg-santa-600 shadow-xl shadow-santa-500/30'}`}
                >
                    {isListening && (
                        <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                    )}
                    <Mic className="text-white w-10 h-10" strokeWidth={2} />
                </button>
                <div className="mt-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tap to talk to Santa</span>
                </div>
            </div>

            <div className="relative">
                <input 
                    type="text" 
                    value={currentInput}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder="Or type your message here..."
                    className="w-full bg-slate-50 border-0 rounded-xl px-5 py-4 text-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-santa-100 transition-all font-medium"
                />
                <button 
                    onClick={onSend}
                    className="absolute right-2 top-2 bottom-2 bg-santa-400 hover:bg-santa-500 text-white px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
