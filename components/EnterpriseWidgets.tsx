import React, { useState } from 'react';
import { Template, JournalEntry, TableData } from '../types';
import { History, Database, ListChecks, Check, Database as DataIcon, PlusCircle, ArrowRight } from 'lucide-react';
import { DataTableWidget } from './ActionWidgets';

// --- Briefing Header (Mini Version for Top Bar) ---
interface BriefingHeaderProps {
  template: Template;
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({ template }) => {
  return (
    <div className="flex flex-col items-center gap-1 animate-in fade-in max-w-[240px] md:max-w-none">
      <div className="flex items-center gap-2">
          {/* Template Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/10 cursor-default border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">
              {template.name}
            </span>
          </div>
      </div>
      <p className="text-[9px] font-medium text-slate-400 tracking-[0.1em] uppercase hidden sm:block">Channel: <span className="text-slate-600">{template.syncDestination}</span></p>
    </div>
  );
};

// --- Journal Sidebar (Refactored for Pane) ---
interface JournalSidebarProps {
  entries: JournalEntry[];
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({ entries }) => {
  return (
    <div className="flex flex-col h-full w-full bg-slate-50/30 backdrop-blur-3xl border-r border-slate-200/50">
       <div className="p-8 pb-4">
          <div className="flex items-center gap-3 text-slate-900 mb-2">
             <History size={18} className="text-emerald-600" />
             <span className="text-sm font-serif font-bold tracking-tight">Executive Archive</span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Recent Intelligence</p>
       </div>
       
       <div className="flex-1 flex flex-col gap-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          {entries.length > 0 ? (
              entries.map(entry => (
                 <div key={entry.id} className="group flex flex-col gap-2 p-5 rounded-2xl hover:bg-white bg-transparent transition-all duration-300 cursor-pointer border border-transparent hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{entry.date}</span>
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${entry.status === 'Synced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                           {entry.status}
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900 transition-colors leading-tight">{entry.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{entry.preview}</p>
                    </div>
                    {/* Hover Arrow */}
                    <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-emerald-600">
                        <ArrowRight size={14} />
                    </div>
                 </div>
              ))
          ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-300 gap-4 opacity-70">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center">
                    <PlusCircle size={32} strokeWidth={1} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Clear Records</p>
                    <p className="text-[10px] mt-1">Initiate a session to begin</p>
                  </div>
              </div>
          )}
       </div>
       
       <div className="p-6 pt-4 border-t border-slate-200/50 bg-white/40">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-900/20 cursor-pointer hover:scale-[1.02] transition-all border border-white/10 group">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30 group-hover:bg-emerald-400 transition-colors">
                    <Check size={20} strokeWidth={3} />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-tight">Corporate Assistant</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status: Online</span>
                </div>
            </div>
       </div>
    </div>
  );
};

// --- Template Switcher Widget ---
interface TemplateSwitcherProps {
  templates: Template[];
  activeTemplate: Template;
  onSelect: (id: string) => void;
  onEasterEgg?: () => void;
}

export const TemplateSwitcher: React.FC<TemplateSwitcherProps> = ({ templates, activeTemplate, onSelect, onEasterEgg }) => {
  return (
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-slate-900/20">
          {templates.map(t => {
              const isActive = t.id === activeTemplate.id;
              return (
                  <button
                      key={t.id}
                      onClick={() => onSelect(t.id)}
                      onDoubleClick={(e) => {
                          if (t.id === 'meeting-master' && onEasterEgg) {
                              e.preventDefault();
                              onEasterEgg();
                          }
                      }}
                      className={`
                          px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap
                          ${isActive 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/20' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'}
                      `}
                  >
                      {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                      {t.name}
                  </button>
              );
          })}
      </div>
  );
};

// --- Right Panel (New Component) ---
interface RightPanelProps {
    requirements: { label: string; completed: boolean }[];
    tableData?: TableData | null;
    onUpdateTable?: (data: TableData) => void;
    onClose?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ requirements, tableData, onUpdateTable, onClose }) => {
    const [activeTab, setActiveTab] = useState<'data' | 'tasks'>('data');

    return (
        <div className="flex flex-col h-full w-full bg-slate-50/50">
            {/* Tabs */}
            <div className="flex items-center p-3 gap-3 border-b border-slate-200/50 bg-white/60 backdrop-blur-2xl">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-2 -ml-1 text-slate-400 hover:text-slate-900 rounded-xl md:hidden"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                )}
                <div className="flex-1 flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('data')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'data' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <DataIcon size={14} />
                        Intelligence
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all relative ${activeTab === 'tasks' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ListChecks size={14} />
                        Field Guide
                        {requirements.some(r => !r.completed) && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white shadow-lg shadow-emerald-500/40 ring-2 ring-white animate-bounce">{requirements.filter(r => !r.completed).length}</span>}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {activeTab === 'data' ? (
                    <div className="h-full">
                        {tableData ? (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                                <DataTableWidget data={tableData} onUpdate={onUpdateTable} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-6 opacity-60">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/50 flex items-center justify-center border border-slate-100">
                                    <DataIcon size={40} strokeWidth={1} className="text-slate-300" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Awaiting Signal</p>
                                    <p className="text-[11px] mt-2 max-w-[200px] leading-relaxed">Structural data will be visualized here upon verbal confirmation.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-8 duration-700">
                         <div className="mb-6">
                            <h3 className="text-lg font-serif font-bold text-slate-900">Requirement Tracking</h3>
                            <p className="text-xs text-slate-500 mt-1">Cross-referencing verified data points.</p>
                         </div>
                         
                         {requirements.map((req, i) => (
                             <div key={i} className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${req.completed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/30'}`}>
                                 <div className="flex items-center gap-4">
                                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${req.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'border-slate-200 text-transparent group-hover:border-emerald-300'}`}>
                                        <Check size={14} strokeWidth={3} />
                                     </div>
                                     <div className="flex flex-col">
                                        <span className={`text-xs font-bold tracking-tight ${req.completed ? 'text-emerald-700 line-through opacity-60' : 'text-slate-700'}`}>{req.label}</span>
                                        {!req.completed && <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Awaiting Confirmation</span>}
                                     </div>
                                 </div>
                             </div>
                         ))}
                    </div>
                )}
            </div>
        </div>
    );
};