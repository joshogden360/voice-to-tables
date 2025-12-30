import React from 'react';
import { MessageSquare, Search, Gift, Truck, Heart, Database, AlertCircle, CreditCard } from 'lucide-react';

// Helper Icons
const MapPinIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const SparklesIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></svg>;
const MailIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
const BoxIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-9"/></svg>;
const LightningIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

interface ReindeerProps {
    name: string;
    role: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const REINDEER_DATA: ReindeerProps[] = [
    { name: 'Rudolph', role: 'Lead Coordinator', description: 'Guides the whole team, handles complex requests', icon: <div className="w-3 h-3 rounded-full bg-red-500" />, color: 'bg-red-50 text-red-700 border-red-100' },
    { name: 'Dasher', role: 'Quick Search', description: 'Fast lookups and finding information', icon: <Search size={14} />, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { name: 'Dancer', role: 'Address Expert', description: 'Verifies and formats addresses', icon: <MapPinIcon />, color: 'bg-orange-50 text-orange-700 border-orange-100' },
    { name: 'Prancer', role: 'Budget Calculator', description: 'Keeps track of costs and spending', icon: <SparklesIcon />, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    { name: 'Vixen', role: 'Gift Advisor', description: 'Suggests perfect gifts for everyone', icon: <Gift size={14} />, color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { name: 'Comet', role: 'Card Tracker', description: 'Tracks which cards have been sent', icon: <MailIcon />, color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    { name: 'Cupid', role: 'Relationship Insights', description: 'Helps maintain connections', icon: <Heart size={14} />, color: 'bg-pink-50 text-pink-700 border-pink-100' },
    { name: 'Donner', role: 'Inventory Manager', description: 'Tracks supplies and reminds to reorder', icon: <BoxIcon />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { name: 'Blitzen', role: 'Quick Responses', description: 'Fast, simple answers', icon: <LightningIcon />, color: 'bg-slate-50 text-slate-700 border-slate-100' },
];


export const ReindeerGrid: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🦌</span>
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Reindeer Network</h2>
                </div>
                <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full font-bold">AI Agents</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {REINDEER_DATA.map((deer) => (
                    <button key={deer.name} className="flex flex-col items-start p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group text-left bg-white">
                        <div className="flex items-center gap-2 mb-2 w-full">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${deer.color === 'bg-red-50 text-red-700 border-red-100' ? 'bg-red-100' : 'bg-slate-50'}`}>
                                {deer.icon}
                            </div>
                            <span className="font-bold text-sm text-slate-800">{deer.name}</span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{deer.role}</div>
                        <p className="text-[10px] text-slate-400 leading-snug">{deer.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
