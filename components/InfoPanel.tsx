import React, { useState } from 'react';
import { BeakerState, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface InfoPanelProps {
    state: BeakerState;
    lang: Language;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ state, lang }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const t = TRANSLATIONS[lang];

    return (
        <div className="bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700 backdrop-blur-md shadow-lg transition-all duration-300">
            {/* Header / Toggle */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-slate-400 hover:text-white transition-colors"
            >
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    {t.observationLog}
                    {state.isHeating && <span className="text-orange-400 animate-pulse text-[10px]">🔥 {t.heat}</span>}
                    {state.explosion && <span className="text-red-500 animate-bounce text-[10px]">⚠️ {t.boom}</span>}
                </h3>
                
                <div className="flex items-center gap-2">
                    {/* Summary Icons when collapsed */}
                    {!isExpanded && (
                         <div className="flex gap-2 text-xs">
                            <span className={state.temperature > 50 ? "text-red-400" : "text-blue-400"}>
                                {state.temperature > 20 ? "🌡️" : "❄️"}
                            </span>
                            {state.bubbles && <span>💨</span>}
                        </div>
                    )}
                    {/* Chevron */}
                    <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>
            
            {/* Collapsible Content */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                {state.contents.length === 0 ? (
                    <p className="text-slate-500 italic text-sm">{t.emptyBeaker}</p>
                ) : (
                    <div className="space-y-3">
                         <div className="flex flex-wrap gap-2">
                            {state.contents.map((chem, idx) => (
                                <span key={idx + chem.id + idx} className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 border border-slate-600 font-mono">
                                    {chem.formula}
                                </span>
                            ))}
                        </div>
                        
                        <div className="bg-slate-900/50 rounded p-2 border border-slate-700/50">
                            {state.reactionMessage && (
                                <div className={`text-sm font-medium ${state.explosion ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                                    {state.reactionMessage}
                                </div>
                            )}
                            {state.reactionEquation && (
                                <div className="mt-2 pt-2 border-t border-slate-700 border-dashed">
                                    <span className="text-[10px] text-slate-500 block mb-1 uppercase tracking-wider">{t.equation}</span>
                                    <code className="text-sm text-yellow-100 font-mono block break-words">
                                        {state.reactionEquation}
                                    </code>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-4 text-xs text-slate-400 border-t border-slate-700/50 pt-2">
                            <div className="flex items-center gap-1">
                                <span className={state.temperature > 50 ? "text-red-400" : "text-blue-400"}>
                                    {state.temperature > 20 ? (state.temperature > 80 ? `🔥 ${t.hot}` : `♨️ ${t.warm}`) : `❄️ ${t.roomTemp}`}
                                </span>
                            </div>
                            {state.bubbles && <div className="text-gray-300">💨 {t.gasReleased}</div>}
                            {state.precipitate && <div className="text-yellow-200">⬇️ {t.precipitate}</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfoPanel;