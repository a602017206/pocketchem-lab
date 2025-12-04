import React, { useMemo, useState } from 'react';
import { Chemical, ChemicalType, Language, ExperimentPreset } from '../types';
import { getChemicals, getPresets } from '../constants';
import { TRANSLATIONS } from '../translations';

interface ChemicalListProps {
    onAdd: (chemical: Chemical) => void;
    onSelectPreset: (preset: ExperimentPreset) => void;
    disabled: boolean;
    lang: Language;
}

const ChemicalList: React.FC<ChemicalListProps> = ({ onAdd, onSelectPreset, disabled, lang }) => {
    const [activeTab, setActiveTab] = useState<'chemicals' | 'presets'>('chemicals');
    const t = TRANSLATIONS[lang];
    const chemicals = useMemo(() => getChemicals(lang), [lang]);
    const presets = useMemo(() => getPresets(lang), [lang]);

    // Group chemicals by type
    const grouped = useMemo(() => {
        return chemicals.reduce((acc, chem) => {
            if (!acc[chem.type]) acc[chem.type] = [];
            acc[chem.type].push(chem);
            return acc;
        }, {} as Record<ChemicalType, Chemical[]>);
    }, [chemicals]);

    return (
        <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="flex p-2 bg-slate-800 rounded-lg mb-4 gap-1 shrink-0">
                <button
                    onClick={() => setActiveTab('chemicals')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'chemicals' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    {t.chemicalsTab}
                </button>
                <button
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'presets' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                    {t.experiments}
                </button>
            </div>

            {/* Content List */}
            {/* Added extra padding-bottom (pb-32) to ensure last items are visible on mobile/small screens */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-32 md:pb-10">
                
                {activeTab === 'chemicals' && Object.keys(grouped).map((typeKey) => {
                    const type = typeKey as ChemicalType;
                    return (
                        <div key={type} className="mb-6">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">{t.chemicalTypes[type]}</h4>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-2">
                                {grouped[type].map(chem => (
                                    <button
                                        key={chem.id}
                                        onClick={() => onAdd(chem)}
                                        disabled={disabled}
                                        className="relative group p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 hover:border-blue-500/50 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-200 text-sm truncate">{chem.name}</span>
                                            <div 
                                                className="w-3 h-3 rounded-full border border-white/10" 
                                                style={{ backgroundColor: chem.color }}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-500 font-mono">{chem.formula}</div>
                                        
                                        {/* Tooltip on Desktop */}
                                        <div className="hidden md:group-hover:block absolute left-0 bottom-full mb-2 w-48 p-2 bg-black/90 text-xs text-white rounded pointer-events-none z-50 border border-slate-700">
                                            {chem.description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {activeTab === 'presets' && (
                    <div className="grid grid-cols-1 gap-3">
                        {presets.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => onSelectPreset(preset)}
                                disabled={disabled}
                                className="group p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 hover:border-purple-500/50 rounded-xl text-left transition-all disabled:opacity-50"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-purple-200 text-sm">{preset.name}</span>
                                    {preset.requiresHeat && <span className="text-[10px] bg-orange-900/50 text-orange-200 px-1.5 py-0.5 rounded border border-orange-500/30">Need Heat</span>}
                                </div>
                                <p className="text-xs text-slate-400 mb-2">{preset.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    {preset.chemicals.map(cid => (
                                        <span key={cid} className="text-[10px] px-1.5 py-0.5 bg-slate-900 rounded text-slate-500 font-mono border border-slate-800 uppercase">
                                            {cid}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChemicalList;