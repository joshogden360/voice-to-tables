import React from 'react';
import { Users, MapPin, Mail, Coins } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string;
    subtext: string;
    icon: React.ReactNode;
    colorClass: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, icon, colorClass }) => (
    <div className="flex-1 min-w-[100px] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-start gap-3">
        <div className="flex items-center justify-between w-full">
            <span className={`text-[10px] font-bold uppercase tracking-wider text-slate-400`}>{label}</span>
            {/* <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 text-${colorClass.split('-')[1]}-600`}>
                {icon}
            </div> */}
        </div>
        <div>
            <div className="text-2xl font-serif font-bold text-slate-900">{value}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1 leading-snug">{subtext}</div>
        </div>
    </div>
);

export const NorthPoleHQ: React.FC = () => {
    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📊</span>
                <h2 className="text-sm font-bold text-slate-900">North Pole HQ</h2>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex-1 min-w-[90px] bg-white rounded-[20px] pt-5 px-4 pb-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Nice List Total</div>
                    <div className="text-3xl font-serif font-black text-slate-900 mb-1">39</div>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-center inline-block leading-tight">13 family</span>
                    <div className="mt-1 text-[9px] text-slate-400">25 friends</div>
                </div>

                 <div className="flex-1 min-w-[90px] bg-white rounded-[20px] pt-5 px-4 pb-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-green-50 rounded-full -mr-4 -mt-4" />
                    <div className="relative z-10">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Address Ready</div>
                        <div className="text-3xl font-serif font-black text-green-600 mb-1">10</div>
                        <span className="text-[9px] font-bold bg-red-50 text-red-500 px-1.5 py-0.5 rounded text-center inline-block leading-tight animate-pulse">!</span>
                        <div className="mt-1 text-[9px] text-slate-400 w-16 leading-tight">23 need lookup</div>
                    </div>
                </div>

                 <div className="flex-1 min-w-[90px] bg-white rounded-[20px] pt-5 px-4 pb-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Cards Sent</div>
                    <div className="text-3xl font-serif font-black text-slate-900 mb-1">0</div>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-center inline-block leading-tight">Start</span>
                    <div className="mt-1 text-[9px] text-slate-400">39 remaining</div>
                </div>

                <div className="flex-1 min-w-[90px] bg-white rounded-[20px] pt-5 px-4 pb-4 border-2 border-amber-100 shadow-sm hover:shadow-md transition-shadow bg-amber-50/30">
                     <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600/60 mb-3">Cookie Jar Budget</div>
                     <div className="text-3xl font-serif font-black text-amber-500 mb-1">$43.47</div>
                     <div className="text-[9px] text-slate-400 leading-tight">remaining of $43.47</div>
                </div>
            </div>
        </div>
    );
};
