import React from 'react';
import { InventoryItem, AgentAction } from '../types';
import { Camera, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// --- Camera Widget ---
export const CameraWidget: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden aspect-video relative flex flex-col items-center justify-center text-slate-300 shadow-xl border border-slate-700 my-2">
      <div className="absolute top-4 right-4 animate-pulse">
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      </div>
      <Camera size={48} className="mb-2 opacity-50" />
      <p className="text-sm font-medium">Camera Active</p>
      <div className="absolute inset-0 border-2 border-dashed border-white/20 m-8 rounded-lg pointer-events-none"></div>
      <div className="absolute bottom-4 bg-slate-800/80 px-4 py-1 rounded-full text-xs backdrop-blur-sm">
        Scanning for Barcodes...
      </div>
    </div>
  );
};

// --- Inventory List Widget ---
const StatusBadge: React.FC<{ status: InventoryItem['status'] }> = ({ status }) => {
  const styles = {
    'In Stock': 'bg-emerald-100 text-emerald-700',
    'Low Stock': 'bg-amber-100 text-amber-700',
    'Out of Stock': 'bg-rose-100 text-rose-700',
  };

  const Icon = {
    'In Stock': CheckCircle,
    'Low Stock': AlertTriangle,
    'Out of Stock': XCircle,
  }[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      <Icon size={12} />
      {status}
    </span>
  );
};

export const InventoryListWidget: React.FC<{ items: InventoryItem[] }> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-center text-sm">
        No items found matching your criteria.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm my-2">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Results</span>
        <span className="text-xs text-slate-400">{items.length} found</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Package size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500 font-mono">SKU: {item.sku} • Loc: {item.location}</p>
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={item.status} />
              <p className="text-xs text-slate-500 mt-1">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Action Container ---
export const ActionContainer: React.FC<{ action: AgentAction, data?: any }> = ({ action, data }) => {
  switch (action.type) {
    case 'OPEN_CAMERA':
      return <CameraWidget />;
    case 'GENERATE_ITEM_LIST':
      return <InventoryListWidget items={data || []} />;
    default:
      return null;
  }
};