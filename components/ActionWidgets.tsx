import React, { useState, useEffect } from 'react';
import { TableData, AgentAction } from '../types';
import { ScanLine, Database, Download, CheckCircle2, Pencil, Check } from 'lucide-react';

// --- Scanner Widget ---
export const ScannerWidget: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center text-slate-300 shadow-2xl border border-slate-700 my-4 transform transition-all hover:scale-[1.01]">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      <ScanLine size={48} className="mb-3 text-emerald-400 animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
      <p className="text-sm font-medium z-10 text-white tracking-wide uppercase font-mono">Scanning Document...</p>
      <div className="absolute inset-x-16 inset-y-10 border-2 border-dashed border-emerald-500/30 rounded-xl pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
      </div>
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
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

  // Sync internal state with props if props change from outside
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
    if (e.key === 'Enter') {
      handleBlur();
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
        className="w-full bg-rose-50/50 border border-rose-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
      />
    );
  }

  // Formatting logic for read-only view
  const renderFormatted = () => {
    const valStr = String(value).trim();
    const lowerHeader = header.toLowerCase();

    if (lowerHeader.includes('status') || lowerHeader.includes('priority')) {
      let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      if (['high', 'critical', 'urgent'].some(k => valStr.toLowerCase().includes(k))) colorClass = 'bg-rose-50 text-rose-700 border-rose-100';
      else if (['medium', 'pending'].some(k => valStr.toLowerCase().includes(k))) colorClass = 'bg-amber-50 text-amber-700 border-amber-100';
      else if (['done', 'success', 'low'].some(k => valStr.toLowerCase().includes(k))) colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';

      return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass} cursor-pointer hover:ring-2 hover:ring-rose-100 transition-all`}>
          {valStr}
        </span>
      );
    }
    return <span className="text-slate-600 font-mono text-xs cursor-text hover:text-rose-600 transition-colors border-b border-transparent hover:border-rose-200 pb-0.5">{valStr}</span>;
  };

  return (
    <div onClick={() => setIsEditing(true)} className="min-h-[1.5rem] flex items-center">
      {renderFormatted()}
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
    
    onUpdate({
      ...data,
      rows: newRows
    });
    setIsConfirmed(false); // Reset confirmation if edited
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmed(true);
    // Here you could trigger an API call to "finalize" the data if needed.
  };

  return (
    <div 
        onClickCapture={onFocus}
        className={`w-full backdrop-blur-xl bg-white/60 rounded-2xl border transition-all duration-500 overflow-hidden shadow-lg shadow-slate-200/50 my-8 flex flex-col ring-1 ring-white/80 animate-in fade-in zoom-in-95 ${isConfirmed ? 'border-emerald-200/60 shadow-emerald-100/30' : 'border-white/60'}`}
    >
      
      {/* Header */}
      <div className="bg-white/40 px-6 py-4 border-b border-white/50 flex justify-between items-center backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border transition-colors duration-500 ${isConfirmed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50/50 text-rose-600 border-rose-100/50'}`}>
             {isConfirmed ? <CheckCircle2 size={16} /> : <Database size={16} />}
          </div>
          <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest font-sans">{data.title}</h3>
              <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5 flex items-center gap-2">
                 {isConfirmed ? 'CONFIRMED_DATA' : 'GENERATED_DATA_V1'}
                 {!isConfirmed && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>}
              </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isConfirmed && onUpdate && (
             <button 
                onClick={handleConfirm}
                className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-lg shadow-sm shadow-rose-200 hover:shadow-rose-300 transition-all"
             >
                <Check size={12} />
                Confirm
             </button>
          )}
          <button 
            onClick={downloadCSV}
            className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-600 bg-white/50 hover:bg-white px-3 py-2 rounded-lg border border-white/60 shadow-sm transition-all"
          >
            <Download size={12} className="group-hover:-translate-y-0.5 transition-transform" />
            Export
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/30 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100/50 font-sans">
            <tr>
              {data.columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {data.rows.map((row, rIdx) => (
              <tr 
                key={rIdx} 
                className="group hover:bg-rose-50/20 transition-colors duration-200 animate-in slide-in-from-bottom-2 fade-in fill-mode-forwards"
                style={{ animationDelay: `${rIdx * 100}ms` }}
              >
                {data.columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-6 py-4 whitespace-nowrap transition-colors relative">
                    <EditableCell 
                      value={row[col]} 
                      header={col}
                      onSave={(val) => handleCellUpdate(rIdx, col, val)}
                    />
                    {/* Hover Pencil Hint */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 pointer-events-none">
                        <Pencil size={10} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Overlay hint for editing */}
        {!isConfirmed && data.rows.length > 0 && (
             <div className="absolute bottom-2 right-2 pointer-events-none opacity-40">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-sans">Tap to Edit</span>
             </div>
        )}
      </div>
      
      {/* Footer / Summary */}
      {data.summary && (
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100/50 text-xs text-slate-600 flex items-start gap-3">
          <div className="mt-0.5 text-emerald-500">
             <CheckCircle2 size={14} />
          </div>
          <p className="leading-relaxed font-serif italic"><span className="font-bold font-sans not-italic text-slate-400 uppercase text-[10px] tracking-widest mr-2">Insight</span> {data.summary}</p>
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