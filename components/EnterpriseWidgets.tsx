import React, { useState } from 'react';
import { Template, JournalEntry, TableData } from '../types';
import { History, Database, ListChecks, Check, Database as DataIcon, PlusCircle } from 'lucide-react';
import { DataTableWidget } from './ActionWidgets';

// --- Briefing Header (Mini Version for Top Bar) ---
interface BriefingHeaderProps {
  template: Template;
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({ template }) => {
  return (
    <div className="flex flex-col items-center gap-0.5 animate-in fade-in max-w-[200px] md:max-w-none">
      <div className="flex items-center gap-2">
          {/* Template Badge */}
          <div className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 rounded-full bg-rose-50/50 border border-rose-100/50 cursor-default">
            <span className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[8px] md:text-[9px] uppercase tracking-wider md:tracking-widest font-mono text-rose-800 font-bold truncate">
              {template.name}
            </span>
          </div>
      </div>
      <p className="text-[7px] md:text-[8px] font-mono text-slate-400 tracking-[0.1em] uppercase hidden sm:block truncate">Syncing to {template.syncDestination}</p>
    </div>
  );
};

// --- Journal Sidebar (Refactored for Pane) ---
interface JournalSidebarProps {
  entries: JournalEntry[];
}

export const JournalSidebar: React.FC<JournalSidebarProps> = ({ entries }) => {
  return (
    <div className="flex flex-col h-full w-full pt-6 pb-6 px-4">
       <div className="mb-6 flex items-center gap-2 text-slate-400 px-2">
          <History size={14} />
          <span className="text-xs font-bold uppercase tracking-widest font-sans">History</span>
       </div>
       
       <div className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-hide">
          {entries.length > 0 ? (
              entries.map(entry => (
                 <div key={entry.id} className="group flex flex-col gap-1 p-3 rounded-xl hover:bg-white/60 bg-white/20 hover:shadow-sm border border-transparent hover:border-white/50 transition-all cursor-pointer">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{entry.date}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${entry.status === 'Synced' ? 'bg-emerald-400' : 'bg-amber-400'} opacity-50`}></span>
                    </div>
                    <h4 className="text-sm font-serif font-medium text-slate-700 group-hover:text-rose-900 transition-colors">{entry.title}</h4>
                    <p className="text-[10px] text-slate-500 truncate font-mono">{entry.preview}</p>
                 </div>
              ))
          ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-2 opacity-60">
                  <PlusCircle size={24} strokeWidth={1} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">New Session</span>
              </div>
          )}
       </div>
       
       <div className="mt-4 pt-4 border-t border-slate-200/50">
           <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-white shadow-lg cursor-pointer transform hover:scale-[1.02] transition-transform">
               <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg">🍪</div>
               <div className="flex flex-col">
                   <span className="text-xs font-bold">Cookie Clause</span>
                   <span className="text-[9px] text-slate-400 font-mono">Santas Tech Assistant</span>
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
      <div className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full shadow-lg shadow-slate-200/20">
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
                          px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                          ${isActive 
                              ? 'bg-white text-rose-600 shadow-md transform scale-105 ring-1 ring-black/5' 
                              : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}
                      `}
                  >
                      {isActive && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
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
            <div className="flex items-center p-2 gap-2 border-b border-slate-200/50 bg-white/40 backdrop-blur-md">
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="p-2 -ml-1 mr-1 text-slate-400 hover:text-rose-600 rounded-lg md:hidden"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'data' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:bg-white/50'}`}
                >
                    <DataIcon size={14} />
                    Data
                </button>
                <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'tasks' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400 hover:bg-white/50'}`}
                >
                    <ListChecks size={14} />
                    Tasks
                    {requirements.some(r => !r.completed) && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-[9px] text-rose-600">{requirements.filter(r => !r.completed).length}</span>}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {activeTab === 'data' ? (
                    <div className="h-full">
                        {tableData ? (
                            <div className="animate-in slide-in-from-right-4 duration-500">
                                <DataTableWidget data={tableData} onUpdate={onUpdateTable} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                <Database size={48} strokeWidth={1} />
                                <div className="text-center">
                                    <p className="text-xs font-bold uppercase tracking-widest">No Active Data</p>
                                    <p className="text-[10px] font-mono mt-1 max-w-[150px]">Start speaking to generate a table from the conversation.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2 animate-in slide-in-from-right-4 duration-500">
                         <div className="mb-4 px-2">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Required Fields</h3>
                            <p className="text-[10px] text-slate-400">Information needed to complete this record.</p>
                         </div>
                         
                         {requirements.map((req, i) => (
                             <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${req.completed ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-white shadow-sm'}`}>
                                 <div className="flex items-center gap-3">
                                     <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${req.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>
                                        <Check size={12} />
                                     </div>
                                     <span className={`text-xs font-medium ${req.completed ? 'text-emerald-700 line-through' : 'text-slate-600'}`}>{req.label}</span>
                                 </div>
                             </div>
                         ))}
                    </div>
                )}
            </div>
        </div>
    );
};