import React, { useEffect, useState, useRef } from 'react';
import { BeakerState, Language, ChemicalType } from '../types';
import { TRANSLATIONS } from '../translations';

interface BeakerProps {
    state: BeakerState;
    onClear: () => void;
    onToggleHeat: () => void;
    onToggleElectrolysis: () => void;
    onTestGas: (type: 'h2' | 'o2' | 'cl2') => void;
    lang: Language;
}

const Beaker: React.FC<BeakerProps> = ({ state, onClear, onToggleHeat, onToggleElectrolysis, onTestGas, lang }) => {
    const [liquidHeight, setLiquidHeight] = useState(0);
    const [lastAddedAnim, setLastAddedAnim] = useState<{type: ChemicalType, id: number} | null>(null);
    const [testAnim, setTestAnim] = useState<'h2' | 'o2' | 'cl2' | null>(null);
    const prevContentsLen = useRef(state.contents.length);
    const t = TRANSLATIONS[lang];

    // Animate fill level
    useEffect(() => {
        setLiquidHeight(state.volume);
    }, [state.volume]);

    // Detect new addition for animation
    useEffect(() => {
        if (state.contents.length > prevContentsLen.current) {
            const last = state.contents[state.contents.length - 1];
            setLastAddedAnim({ type: last.type, id: Date.now() });
            
            // Clear animation class after it runs
            const timer = setTimeout(() => setLastAddedAnim(null), 1000);
            return () => clearTimeout(timer);
        }
        prevContentsLen.current = state.contents.length;
    }, [state.contents]);

    const handleTest = (type: 'h2' | 'o2' | 'cl2') => {
        setTestAnim(type);
        onTestGas(type);
        setTimeout(() => setTestAnim(null), 2000); // Allow animation to finish
    };

    return (
        <div className={`relative flex flex-col items-center justify-center transition-transform ${state.explosion ? 'animate-shake' : ''}`}>
            
            {/* Gas Collection Tubes */}
            <div className="absolute -top-32 flex justify-center gap-4 px-2 z-10 pointer-events-none w-full">
                
                {/* Hydrogen Tube (Left/Cathode) */}
                <div className={`flex flex-col items-center transition-opacity duration-500 ${state.collectedGas.h2 > 0 || testAnim === 'h2' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-14 h-28 border-2 border-white/30 rounded-t-full bg-glass backdrop-blur-sm relative overflow-hidden">
                        <div 
                            className="absolute bottom-0 w-full bg-blue-100/20 transition-all duration-300"
                            style={{ height: `${state.collectedGas.h2}%` }}
                        ></div>
                        <div className="absolute bottom-2 w-full text-center text-[10px] text-blue-200 font-mono">H₂</div>
                    </div>
                    {/* H2 Test Interaction */}
                    <div className="mt-2 pointer-events-auto min-h-[30px] flex items-center justify-center">
                        {state.collectedGas.h2 > 10 && !testAnim && (
                            <button 
                                onClick={() => handleTest('h2')}
                                className="px-2 py-1 bg-red-600/80 hover:bg-red-500 text-white text-[10px] rounded-full shadow-lg border border-red-400 animate-pulse whitespace-nowrap"
                            >
                                🔥 {t.testH2}
                            </button>
                        )}
                    </div>
                    {/* H2 Test Animation (Pop!) */}
                    {testAnim === 'h2' && (
                        <div className="absolute -top-10 left-0 right-0 h-20 z-50 flex items-center justify-center">
                            <div className="w-20 h-20 bg-orange-400 rounded-full animate-ping opacity-75 absolute"></div>
                            <div className="text-white font-bold whitespace-nowrap animate-bounce relative z-10">Pah!</div>
                        </div>
                    )}
                </div>

                {/* Oxygen Tube (Right/Anode) - Hide if Cl2 is dominant or collected instead */}
                {state.collectedGas.o2 > 0 || testAnim === 'o2' ? (
                <div className={`flex flex-col items-center transition-opacity duration-500 ${state.collectedGas.o2 > 0 || testAnim === 'o2' ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="w-14 h-28 border-2 border-white/30 rounded-t-full bg-glass backdrop-blur-sm relative overflow-hidden">
                         <div 
                            className="absolute bottom-0 w-full bg-white/10 transition-all duration-300"
                            style={{ height: `${state.collectedGas.o2}%` }}
                        ></div>
                        <div className="absolute bottom-2 w-full text-center text-[10px] text-white font-mono">O₂</div>
                    </div>
                    <div className="mt-2 pointer-events-auto min-h-[30px] flex items-center justify-center">
                        {state.collectedGas.o2 > 10 && !testAnim && (
                             <button 
                                onClick={() => handleTest('o2')}
                                className="px-2 py-1 bg-yellow-600/80 hover:bg-yellow-500 text-white text-[10px] rounded-full shadow-lg border border-yellow-400 animate-pulse whitespace-nowrap"
                            >
                                ✨ {t.testO2}
                            </button>
                        )}
                    </div>
                    {testAnim === 'o2' && (
                        <div className="absolute -top-10 left-0 right-0 h-20 z-50 flex items-center justify-center">
                             <div className="w-20 h-20 bg-white rounded-full animate-ping opacity-90 absolute shadow-[0_0_50px_white]"></div>
                             <div className="w-6 h-6 bg-yellow-200 rounded-full blur-sm absolute -translate-y-4 animate-pulse"></div>
                        </div>
                    )}
                </div>
                ) : null }

                 {/* Chlorine Tube (Replaces Oxygen spot or sits next to it) */}
                 {(state.collectedGas.cl2 > 0 || testAnim === 'cl2') && (
                    <div className={`flex flex-col items-center transition-opacity duration-500 ${state.collectedGas.cl2 > 0 || testAnim === 'cl2' ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="w-14 h-28 border-2 border-white/30 rounded-t-full bg-glass backdrop-blur-sm relative overflow-hidden">
                            <div 
                                className="absolute bottom-0 w-full bg-yellow-400/30 transition-all duration-300"
                                style={{ height: `${state.collectedGas.cl2}%` }}
                            ></div>
                            <div className="absolute bottom-2 w-full text-center text-[10px] text-yellow-200 font-mono">Cl₂</div>
                        </div>
                        <div className="mt-2 pointer-events-auto min-h-[30px] flex items-center justify-center">
                            {state.collectedGas.cl2 > 10 && !testAnim && (
                                <button 
                                    onClick={() => handleTest('cl2')}
                                    className="px-2 py-1 bg-green-600/80 hover:bg-green-500 text-white text-[10px] rounded-full shadow-lg border border-green-400 animate-pulse whitespace-nowrap"
                                >
                                    🧪 {t.testCl2}
                                </button>
                            )}
                        </div>
                        {testAnim === 'cl2' && (
                            <div className="absolute -top-10 left-0 right-0 h-20 z-50 flex items-center justify-center">
                                <div className="w-20 h-20 bg-green-400 rounded-full animate-ping opacity-50 absolute"></div>
                                <div className="text-white font-bold whitespace-nowrap relative z-10 text-xs text-center">Bleached!<br/>(Disinfected)</div>
                            </div>
                        )}
                    </div>
                 )}
            </div>

            {/* Beaker Body */}
            <div className="relative w-48 h-64 md:w-64 md:h-80 border-4 border-white/30 rounded-b-3xl rounded-t-lg backdrop-blur-sm bg-glass border-t-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] z-0">
                
                {/* Measurement Lines */}
                <div className="absolute top-10 right-0 w-8 h-0.5 bg-white/20"></div>
                <div className="absolute top-20 right-0 w-6 h-0.5 bg-white/20"></div>
                <div className="absolute top-30 right-0 w-8 h-0.5 bg-white/20"></div>
                <div className="absolute top-40 right-0 w-6 h-0.5 bg-white/20"></div>
                <div className="absolute top-50 right-0 w-8 h-0.5 bg-white/20"></div>

                {/* Electrodes (When Electrolyzing) */}
                {state.isElectrolyzing && (
                    <div className="absolute inset-0 flex justify-center gap-12 pt-4 pointer-events-none z-10">
                         {/* Cathode (- -> H2) */}
                        <div className="w-2 h-full bg-slate-800 relative">
                             <div className="absolute bottom-0 w-full h-1/2 bg-black"></div>
                             {/* Bubbles H2 */}
                             <div className="absolute bottom-0 left-0 w-full h-3/4 overflow-hidden">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="absolute left-1/2 w-1 h-1 bg-white/70 rounded-full animate-bubble-rise" style={{ animationDelay: `${i * 0.2}s`, animationDuration: '0.8s' }}></div>
                                ))}
                             </div>
                             <div className="absolute -bottom-4 text-[10px] text-white">-</div>
                        </div>
                        {/* Anode (+ -> O2 or Cl2) */}
                        <div className="w-2 h-full bg-slate-800 relative">
                            <div className="absolute bottom-0 w-full h-1/2 bg-red-900"></div>
                            {/* Bubbles O2/Cl2 */}
                            <div className="absolute bottom-0 left-0 w-full h-3/4 overflow-hidden">
                                {[...Array(5)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`absolute left-1/2 w-1 h-1 rounded-full animate-bubble-rise ${state.contents.some(c=>c.id==='nacl') ? 'bg-yellow-200/80' : 'bg-white/70'}`}
                                        style={{ animationDelay: `${i * 0.4}s`, animationDuration: '1.2s' }}>
                                    </div>
                                ))}
                             </div>
                             <div className="absolute -bottom-4 text-[10px] text-white">+</div>
                        </div>
                    </div>
                )}

                {/* Drop Animations */}
                {lastAddedAnim && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                        {lastAddedAnim.type === ChemicalType.LIQUID && (
                            <div className="w-4 h-full bg-blue-400/50 rounded-b-full animate-[bubble-rise_0.5s_reverse_ease-in]" style={{ height: '200px' }}></div>
                        )}
                        {(lastAddedAnim.type === ChemicalType.SOLID || lastAddedAnim.type === ChemicalType.POWDER) && (
                            <div className="w-6 h-6 bg-slate-200 rounded-full animate-[bubble-rise_0.6s_reverse_ease-in]"></div>
                        )}
                    </div>
                )}

                {/* The Liquid/Contents */}
                <div 
                    className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out w-full"
                    style={{ 
                        height: `${liquidHeight}%`,
                        backgroundColor: state.color,
                        boxShadow: `0 0 20px ${state.color} inset`
                    }}
                >
                    {/* Bubbles */}
                    {(state.bubbles || state.isReacting || (state.isHeating && liquidHeight > 0)) && (
                        <div className="absolute inset-0 overflow-hidden">
                            {[...Array(state.isHeating ? 15 : 8)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute bg-white/30 rounded-full animate-bubble-rise"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        width: `${Math.random() * 10 + 5}px`,
                                        height: `${Math.random() * 10 + 5}px`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${Math.random() * (state.isHeating ? 1 : 2) + 0.5}s`
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Precipitate / Solids */}
                    {state.precipitate && (
                        <div className="absolute bottom-0 w-full h-8 bg-black/40 blur-md transition-opacity duration-1000"></div>
                    )}

                    {/* Liquid Surface */}
                    <div className="absolute top-0 w-full h-2 bg-white/20"></div>
                </div>

                {/* Explosion Overlay */}
                {state.explosion && (
                    <div className="absolute inset-0 bg-orange-500/80 animate-explode z-50 flex items-center justify-center">
                        <div className="text-white font-bold text-2xl">{t.boom}</div>
                    </div>
                )}
            </div>

            {/* Alcohol Lamp / Heat Source */}
            <div className="mt-2 flex flex-col items-center h-24 justify-end">
                 {state.isHeating ? (
                    <div className="relative">
                        {/* Flame */}
                        <div className="w-8 h-12 bg-orange-500 rounded-full blur-[4px] absolute -top-10 left-1/2 -translate-x-1/2 animate-pulse opacity-80"></div>
                        <div className="w-4 h-8 bg-yellow-300 rounded-full blur-[2px] absolute -top-8 left-1/2 -translate-x-1/2 animate-pulse"></div>
                        <div className="w-16 h-2 bg-slate-600 rounded-full"></div> {/* Wick holder */}
                        <div className="w-20 h-10 bg-glass border border-white/20 rounded-b-xl backdrop-blur-sm"></div> {/* Body */}
                    </div>
                 ) : (
                    <div className="opacity-30 grayscale transform scale-90">
                         <div className="w-16 h-2 bg-slate-600 rounded-full"></div>
                        <div className="w-20 h-10 bg-glass border border-white/20 rounded-b-xl"></div>
                    </div>
                 )}
            </div>

            {/* Controls */}
            <div className="absolute -bottom-16 flex gap-4">
                 <button 
                    onClick={onToggleHeat}
                    disabled={state.isElectrolyzing}
                    className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 border disabled:opacity-30 ${state.isHeating ? 'bg-orange-500/80 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
                >
                    <span>{state.isHeating ? '🔥' : '🕯️'}</span>
                    {t.heat}
                </button>

                <button 
                    onClick={onToggleElectrolysis}
                    disabled={state.isHeating}
                    className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 border disabled:opacity-30 ${state.isElectrolyzing ? 'bg-blue-500/80 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-600'}`}
                >
                    <span>⚡</span>
                    {t.electrodes}
                </button>

                {state.contents.length > 0 && (
                    <button 
                        onClick={onClear}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-red-200 rounded-full transition-all flex items-center gap-2 backdrop-blur-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        {t.cleanBeaker}
                    </button>
                )}
            </div>
        </div>
    );
};

export default Beaker;