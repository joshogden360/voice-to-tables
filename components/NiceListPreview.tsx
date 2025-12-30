import React from 'react';
import { Check, Star, AlertCircle, Info } from 'lucide-react';

interface Contact {
    id: string;
    name: string;
    type: 'Family' | 'Friend' | 'Work';
    addressStatus: 'Verified' | 'Missing' | 'Incomplete';
    address?: string;
}

const MOCK_CONTACTS: Contact[] = [
    { id: '1', name: 'Santa & Mrs. Claus', type: 'Family', addressStatus: 'Verified', address: '1 Polar Way, North Pole, AK' },
    { id: '2', name: 'Buddy the Elf', type: 'Family', addressStatus: 'Missing' },
    { id: '3', name: 'Frosty', type: 'Family', addressStatus: 'Verified', address: '42 Snowman Ave, Minneapolis, MN' },
];

export const NiceListPreview: React.FC = () => {
    return (
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h2 className="text-sm font-bold text-slate-900">Nice List Preview</h2>
                </div>
                <span className="text-[9px] bg-santa-500 text-white px-2 py-0.5 rounded-full font-bold">7 contacts</span>
            </div>

            <div className="flex gap-2 mb-4">
                <button className="flex-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-50 transition-colors">Family</button>
                <button className="flex-1 bg-slate-100 border border-transparent text-slate-400 text-[10px] font-bold py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Friends</button>
            </div>

            <div className="space-y-3">
                {MOCK_CONTACTS.map(contact => (
                    <div key={contact.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{contact.name}</h3>
                                <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-slate-50 text-[9px] font-medium text-slate-500 border border-slate-100">{contact.type}</div>
                            </div>
                            {contact.addressStatus === 'Missing' ? (
                                <span className="text-[9px] font-bold bg-santa-600 text-white px-2 py-0.5 rounded-full">Inner Circle</span>
                            ) : (
                                contact.name === 'Mom & Dad' ? <span className="text-[9px] font-bold bg-santa-600 text-white px-2 py-0.5 rounded-full">Inner Circle</span> : <span className="text-[9px] font-bold bg-green-700 text-white px-2 py-0.5 rounded-full">Close</span>
                            )}
                        </div>

                        <div className="space-y-2 mt-3">
                            <div className="flex items-start gap-2">
                                <Users size={12} className="text-slate-400 mt-0.5" />
                                <span className="text-[10px] text-slate-500">{contact.name.split(' & ').join(', ')}</span>
                            </div>
                            <div className="flex items-start gap-2 justify-between">
                                <div className="flex items-start gap-2">
                                    <MapPinIcon className="text-slate-400 mt-0.5 w-3 h-3" />
                                    {contact.addressStatus === 'Verified' ? (
                                        <span className="text-[10px] text-slate-500 w-32 leading-snug">{contact.address}</span>
                                    ) : (
                                        <span className="text-[10px] text-slate-400 italic">Address unknown</span>
                                    )}
                                </div>
                                {contact.addressStatus === 'Verified' ? (
                                    <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                                        <Check size={9} className="text-green-600" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 group-hover:bg-amber-100">
                                        <Info size={9} className="text-amber-500" strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Users = ({ size, className }: { size: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const MapPinIcon = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
