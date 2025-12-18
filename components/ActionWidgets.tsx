import React, { useState, useEffect } from 'react';
import { TableData, AgentAction } from '../types';
import { ScanLine, Database, Download, CheckCircle2, Pencil, Check, Plus, Trash2, ShieldCheck, FileSpreadsheet } from 'lucide-react';

// --- Scanner Widget ---
export const ScannerWidget: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-video relative flex flex-col items-center justify-center text-slate-300 shadow-2xl border border-white/10 my-8 transform transition-all group">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
      <ScanLine size={48} className="mb-4 text-emerald-400 group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]" />
      <p className="text-[11px] font-bold z-10 text-emerald-100/80 tracking-[0.3em] uppercase font-sans">Neural Processing...</p>
      
      <div className="absolute inset-x-12 inset-y-10 border border-emerald-500/20 rounded-[2rem] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_25px_rgba(52,211,153,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
      </div>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          20%, 80% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// --- Editable Cell Component ---
interface EditableCellProps {
  value: string | number;
  onSave: (newValue: string) => void;
  header: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, header }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(String(value));

  useEffect(() => {
    setCurrentValue(String(value));
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== String(value)) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
        setCurrentValue(String(value));
        setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-slate-50 border-2 border-emerald-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none shadow-lg shadow-emerald-500/10 z-20 relative"
      />
    );
  }

  const renderFormatted = () => {
    const valStr = String(value).trim() || '—';
    const lowerHeader = header.toLowerCase();

    if (lowerHeader.includes('status') || lowerHeader.includes('priority')) {
      let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      if (['high', 'critical', 'urgent', 'assigned'].some(k => valStr.toLowerCase().includes(k))) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      else if (['medium', 'pending', 'awaiting'].some(k => valStr.toLowerCase().includes(k))) colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
      else if (['done', 'success', 'low'].some(k => valStr.toLowerCase().includes(k))) colorClass = 'bg-slate-900 text-white border-slate-800';

      return (
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shadow-sm ${colorClass} transition-all`}>
          {valStr}
        </span>
      );
    }
    return <span className={`text-slate-700 font-medium text-xs ${valStr === '—' ? 'opacity-30' : ''}`}>{valStr}</span>;
  };

  return (
    <div 
        onClick={() => setIsEditing(true)} 
        className="min-h-[2.5rem] flex items-center group cursor-text w-full hover:bg-slate-50/50 px-2 -mx-2 rounded-lg transition-colors"
    >
      {renderFormatted()}
      <Pencil size={10} className="ml-auto opacity-0 group-hover:opacity-30 text-slate-400 transition-opacity" />
    </div>
  );
};

// --- Data Table Widget ---
export const DataTableWidget: React.FC<{ 
    data: TableData; 
    onUpdate?: (newData: TableData) => void;
    onFocus?: () => void;
}> = ({ data, onUpdate, onFocus }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const downloadCSV = (e: React.MouseEvent) => {
    e.stopPropagation();
    const headers = data.columns.join(',');
    const rows = data.rows.map(row => 
      data.columns.map(col => `"${row[col] || ''}"`).join(',')
    ).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${data.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCellUpdate = (rowIndex: number, col: string, newValue: string) => {
    if (!onUpdate) return;
    const newRows = [...data.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [col]: newValue };
    onUpdate({ ...data, rows: newRows });
    setIsConfirmed(false);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmed(true);
  };

  const handleAddRow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    const newRow: Record<string, string> = {};
    data.columns.forEach(col => { newRow[col] = ''; });
    onUpdate({ ...data, rows: [...data.rows, newRow] });
    setIsConfirmed(false);
  };

  const handleDeleteRow = (rowIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    onUpdate({ ...data, rows: data.rows.filter((_, i) => i !== rowIndex) });
    setIsConfirmed(false);
  };

  return (
    <div 
        onClickCapture={onFocus}
        className={`w-full bg-white rounded-[2rem] border transition-all duration-700 overflow-hidden shadow-2xl shadow-slate-200/40 my-8 flex flex-col group/table ${isConfirmed ? 'border-emerald-200 ring-[8px] ring-emerald-500/5' : 'border-slate-200/60'}`}
    >
      
      {/* Header */}
      <div className="bg-slate-50/40 px-8 py-7 border-b border-slate-100/80 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${isConfirmed ? 'bg-emerald-500 text-white border-emerald-400 rotate-3' : 'bg-white text-slate-400 border-slate-100 group-hover/table:border-emerald-200 group-hover/table:text-emerald-500'}`}>
             {isConfirmed ? <ShieldCheck size={22} /> : <FileSpreadsheet size={22} />}
          </div>
          <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.25em] font-sans leading-none">{data.title}</h3>
              <div className="flex items-center gap-2 mt-2.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400 animate-pulse'}`}></span>
                <p className="text-[9px] text-slate-400 font-bold tracking-[0.15em] uppercase">
                    {isConfirmed ? 'Verified Integrity' : 'Computational Audit'}
                </p>
              </div>
          </div>
        </div>
        <div className="flex gap-2.5">
          {!isConfirmed && onUpdate && (
             <>
               <button 
                  onClick={handleAddRow}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white hover:bg-slate-50 px-5 py-3 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95"
               >
                  <Plus size={14} strokeWidth={3} />
                  Add Entry
               </button>
               <button 
                  onClick={handleConfirm}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-emerald-600 px-5 py-3 rounded-xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 group/btn"
               >
                  <Check size={14} strokeWidth={4} className="group-hover/btn:scale-125 transition-transform" />
                  Verify Record
               </button>
             </>
          )}
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 bg-slate-100/50 hover:bg-emerald-50 px-5 py-3 rounded-xl transition-all"
          >
            <Download size={14} strokeWidth={3} />
            CSV
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/20 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] border-b border-slate-100/60 font-sans">
            <tr>
              {data.columns.map((col, idx) => (
                <th key={idx} className="px-8 py-5 whitespace-nowrap">
                  {col}
                </th>
              ))}
              {!isConfirmed && <th className="px-8 py-5 w-10"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={data.columns.length + (isConfirmed ? 0 : 1)} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <FileSpreadsheet size={48} strokeWidth={1} />
                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting system input...</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.rows.map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  className="group/row hover:bg-emerald-50/20 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${rIdx * 50}ms` }}
                >
                  {data.columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-8 py-2 whitespace-nowrap relative">
                      <EditableCell 
                        value={row[col]} 
                        header={col}
                        onSave={(val) => handleCellUpdate(rIdx, col, val)}
                      />
                    </td>
                  ))}
                  {!isConfirmed && (
                    <td className="px-8 py-2 whitespace-nowrap text-right">
                      <button 
                        onClick={(e) => handleDeleteRow(rIdx, e)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                        title="Remove Row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Summary */}
      {data.summary && (
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-4">
          <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
             <CheckCircle2 size={14} strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[9px] text-slate-400 uppercase tracking-[0.2em]">Contextual Insight</span>
            <p className="leading-relaxed font-serif italic text-slate-700 text-sm">"{data.summary}"</p>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Action Container ---
export const ActionContainer: React.FC<{ 
    action: AgentAction, 
    data?: any, 
    onUpdate?: (newData: any) => void,
    onFocus?: () => void
}> = ({ action, data, onUpdate, onFocus }) => {
  switch (action.type) {
    case 'OPEN_SCANNER':
      return <ScannerWidget />;
    case 'GENERATE_TABLE':
      return <DataTableWidget data={data} onUpdate={onUpdate} onFocus={onFocus} />;
    default:
      return null;
  }
};