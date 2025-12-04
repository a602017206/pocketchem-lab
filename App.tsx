import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chemical, BeakerState, ChemicalType, Language, ExperimentPreset } from './types';
import { checkReaction, getChemicals } from './constants';
import { TRANSLATIONS } from './translations';
import Beaker from './components/Beaker';
import ChemicalList from './components/ChemicalList';
import InfoPanel from './components/InfoPanel';

const INITIAL_STATE: BeakerState = {
    contents: [],
    temperature: 20,
    color: 'transparent',
    volume: 0,
    isReacting: false,
    reactionMessage: '',
    reactionEquation: undefined,
    bubbles: false,
    activeGasProduction: null,
    explosion: false,
    precipitate: false,
    isHeating: false,
    isElectrolyzing: false,
    collectedGas: { h2: 0, o2: 0, cl2: 0 }
};

const App: React.FC = () => {
    const [beaker, setBeaker] = useState<BeakerState>(INITIAL_STATE);
    const [showSidebar, setShowSidebar] = useState(false);
    const [lang, setLang] = useState<Language>('zh');

    const t = TRANSLATIONS[lang];

    const toggleLang = () => {
        setLang(prev => prev === 'zh' ? 'en' : 'zh');
    };

    const handleClear = useCallback(() => {
        setBeaker(INITIAL_STATE);
    }, []);

    // Generic Gas Collection Loop
    useEffect(() => {
        let interval: number;
        
        // Loop runs if we are explicitly electrolyzing OR if there is an active gas producing reaction
        const isProducingGas = beaker.isElectrolyzing || beaker.activeGasProduction !== null;

        if (isProducingGas) {
            interval = window.setInterval(() => {
                setBeaker(prev => {
                    // Determine which gas to add
                    let addH2 = 0;
                    let addO2 = 0;
                    let addCl2 = 0;

                    // 1. Electrolysis Logic (Continuous H2 + O2 or H2 + Cl2)
                    if (prev.isElectrolyzing && prev.contents.some(c => c.id === 'h2o')) {
                         // If NaCl is present, we make H2 + Cl2
                         if (prev.contents.some(c => c.id === 'nacl')) {
                             addH2 = 2; // Cathode
                             addCl2 = 2; // Anode
                         } else {
                             addH2 = 2;
                             addO2 = 1;
                         }
                    }

                    // 2. Chemical Reaction Logic (e.g. KMnO4 heating = O2, Na + H2O = H2)
                    if (prev.activeGasProduction === 'o2') addO2 += 2;
                    if (prev.activeGasProduction === 'h2') addH2 += 3;
                    if (prev.activeGasProduction === 'cl2') addCl2 += 2;
                    
                    if (addH2 === 0 && addO2 === 0 && addCl2 === 0) return prev;

                    return {
                        ...prev,
                        collectedGas: {
                            h2: Math.min(prev.collectedGas.h2 + addH2, 100),
                            o2: Math.min(prev.collectedGas.o2 + addO2, 100),
                            cl2: Math.min(prev.collectedGas.cl2 + addCl2, 100)
                        }
                    };
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [beaker.isElectrolyzing, beaker.activeGasProduction, beaker.contents]);

    const handleTestGas = (type: 'h2' | 'o2' | 'cl2') => {
        let msg = '';
        let eq = '';

        if (type === 'h2') {
            msg = t.h2Combust;
            eq = '2H₂ + O₂ → 2H₂O';
        } else if (type === 'o2') {
            msg = t.o2Combust;
            eq = 'C + O₂ → CO₂';
        } else if (type === 'cl2') {
            msg = t.cl2Test;
            eq = 'Cl₂ + H₂O ⇌ HCl + HClO'; // Disinfectant action
        }

        setBeaker(prev => ({
            ...prev,
            reactionMessage: msg,
            reactionEquation: eq,
            // Consumes the gas immediately
            collectedGas: {
                ...prev.collectedGas,
                [type]: 0
            }
        }));
    };

    const toggleElectrolysis = useCallback(() => {
        setBeaker(prev => {
             const nextElec = !prev.isElectrolyzing;
             // Can't heat and electrify at same time in this simple sim
             const nextHeat = nextElec ? false : prev.isHeating;
             
             const reaction = checkReaction(prev.contents, nextHeat, nextElec, lang);
             
             return {
                 ...prev,
                 isElectrolyzing: nextElec,
                 isHeating: nextHeat,
                 reactionMessage: reaction ? reaction.message : prev.reactionMessage,
                 reactionEquation: reaction ? reaction.equation : undefined,
                 bubbles: reaction?.gasProduced || false,
                 activeGasProduction: reaction?.gasType || null,
                 color: reaction?.resultColor || prev.color // Update color (e.g. phenolphthalein change)
             }
        });
    }, [lang]);

    const toggleHeat = useCallback(() => {
        setBeaker(prev => {
            const nextHeating = !prev.isHeating;
            const nextElec = nextHeating ? false : prev.isElectrolyzing;
            
            // Re-run reaction check when heat status changes
            const reaction = checkReaction(prev.contents, nextHeating, nextElec, lang);
            
            let newState = { ...prev, isHeating: nextHeating, isElectrolyzing: nextElec };

            if (nextHeating) {
                // Base temp rises
                newState.temperature = Math.max(prev.temperature, 80);
            } else {
                newState.temperature = 20; // Cooling down (simplified)
                newState.activeGasProduction = null; // Stop producing if needs heat
            }

            if (reaction) {
                newState.reactionMessage = reaction.message;
                newState.reactionEquation = reaction.equation;
                if (reaction.resultColor) newState.color = reaction.resultColor;
                if (reaction.gasProduced) newState.bubbles = true;
                if (reaction.precipitate) newState.precipitate = true;
                if (reaction.gasType) newState.activeGasProduction = reaction.gasType;
                if (reaction.temperatureChange === 'EXPLOSIVE') {
                    newState.explosion = true;
                    newState.temperature = 1000;
                }
            } else if (nextHeating && prev.contents.length > 0) {
                // Just heating, no special reaction
                newState.reactionMessage = `${t.heat}...`;
            }

            return newState;
        });
    }, [lang, t.heat]);

    const addChemical = useCallback((chemical: Chemical) => {
        setBeaker(prev => {
            if (prev.explosion) return prev;

            const volumeAdd = chemical.type === ChemicalType.LIQUID ? 20 : 5;
            const newVolume = Math.min(prev.volume + volumeAdd, 95);
            const newContents = [...prev.contents, chemical];

            // Check Reaction
            const reaction = checkReaction(newContents, prev.isHeating, prev.isElectrolyzing, lang);
            
            let newColor = prev.color;
            let newTemp = prev.temperature;
            let newMessage = prev.reactionMessage;
            let newEquation = prev.reactionEquation;
            let bubbles = prev.bubbles;
            let precipitate = prev.precipitate;
            let activeGas = prev.activeGasProduction;
            let explosion = false;

            // Simple mix color logic
            if (prev.contents.length === 0) {
                newColor = chemical.color;
            } else if (!reaction?.resultColor) {
                 if (chemical.type === ChemicalType.LIQUID) {
                     newColor = chemical.color;
                 }
            }

            if (reaction) {
                newMessage = reaction.message;
                newEquation = reaction.equation;
                if (reaction.resultColor) newColor = reaction.resultColor;
                if (reaction.gasProduced) bubbles = true;
                if (reaction.precipitate) precipitate = true;
                if (reaction.gasType) activeGas = reaction.gasType;
                if (reaction.temperatureChange === 'HOT') newTemp = 80;
                if (reaction.temperatureChange === 'WARM') newTemp = 40;
                if (reaction.temperatureChange === 'EXPLOSIVE') {
                    explosion = true;
                    newTemp = 1000;
                }
            } else {
                newMessage = `${t.reactions.added} ${chemical.name}.`;
                newEquation = undefined;
            }

            return {
                contents: newContents,
                volume: newVolume,
                color: newColor,
                temperature: newTemp,
                isReacting: !!reaction,
                reactionMessage: newMessage,
                reactionEquation: newEquation,
                bubbles,
                activeGasProduction: activeGas,
                explosion,
                precipitate,
                isHeating: prev.isHeating,
                isElectrolyzing: prev.isElectrolyzing,
                collectedGas: prev.collectedGas
            };
        });
        
        if (window.innerWidth < 768) {
            setShowSidebar(false);
        }

    }, [lang, t.reactions.added]);

    const loadPreset = useCallback((preset: ExperimentPreset) => {
        // Reset first
        setBeaker(INITIAL_STATE);
        
        const allChemicals = getChemicals(lang);
        const chemicalsToAdd = preset.chemicals.map(id => allChemicals.find(c => c.id === id)).filter(Boolean) as Chemical[];

        const finalContents = chemicalsToAdd;
        const requiresHeat = preset.requiresHeat || false;
        const requiresElec = preset.requiresElectrolysis || false;
        
        // Calculate result based on all ingredients
        const reaction = checkReaction(finalContents, requiresHeat, requiresElec, lang);

        let color = chemicalsToAdd.length > 0 ? chemicalsToAdd[chemicalsToAdd.length-1].color : 'transparent';
        if (chemicalsToAdd[0]?.type === ChemicalType.LIQUID) color = chemicalsToAdd[0].color;
        
        let volume = chemicalsToAdd.reduce((acc, c) => acc + (c.type === ChemicalType.LIQUID ? 20 : 5), 0);
        volume = Math.min(volume, 95);

        let newState: BeakerState = {
            ...INITIAL_STATE,
            contents: finalContents,
            volume,
            color,
            isHeating: requiresHeat,
            isElectrolyzing: requiresElec
        };

        if (reaction) {
            newState.reactionMessage = reaction.message;
            newState.reactionEquation = reaction.equation;
            if (reaction.resultColor) newState.color = reaction.resultColor;
            if (reaction.gasProduced) newState.bubbles = true;
            if (reaction.precipitate) newState.precipitate = true;
            if (reaction.gasType) newState.activeGasProduction = reaction.gasType;
            if (reaction.temperatureChange === 'HOT' || requiresHeat) newState.temperature = 80;
            if (reaction.temperatureChange === 'EXPLOSIVE') {
                newState.explosion = true;
                newState.temperature = 1000;
            }
        }

        setBeaker(newState);
        if (window.innerWidth < 768) setShowSidebar(false);

    }, [lang]);

    return (
        <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
            
            {/* Header (Fixed on Mobile) */}
            <div className="flex-none flex items-center justify-between p-4 bg-slate-800/90 backdrop-blur border-b border-slate-700 z-40 relative md:hidden">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">PC</div>
                    <h1 className="font-bold text-lg tracking-tight text-white">{t.title}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleLang} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 border border-slate-600 font-mono">
                        {lang === 'zh' ? 'En' : '中'}
                    </button>
                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 bg-slate-700 rounded-lg text-slate-200">
                        {showSidebar ? t.close : t.addChemical}
                    </button>
                </div>
            </div>

            {/* Main Layout Area */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* Sidebar (Desktop: Static Left | Mobile: Overlay) */}
                <div className={`
                    absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-80 md:border-r md:border-slate-800 md:bg-slate-900 flex flex-col shadow-2xl md:shadow-none md:z-10
                    ${showSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    {/* Sidebar Header (Desktop) */}
                    <div className="hidden md:flex items-center justify-between p-4 border-b border-slate-800/50 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.559.367 3.559M8 4l.367 3.559M8 4L3 14h18" /></svg>
                            </div>
                            <h1 className="font-bold text-lg tracking-tight text-white">{t.title}</h1>
                        </div>
                        <button onClick={toggleLang} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700 hover:text-white font-mono">
                            {lang === 'zh' ? 'EN' : '中'}
                        </button>
                    </div>

                    {/* Mobile Sidebar Close Button (Explicit) */}
                    <div className="md:hidden flex justify-end p-4">
                        <button onClick={() => setShowSidebar(false)} className="p-2 bg-slate-800 rounded-full text-slate-400">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden px-4 pb-4">
                         <ChemicalList 
                            onAdd={addChemical} 
                            onSelectPreset={loadPreset}
                            disabled={beaker.explosion} 
                            lang={lang}
                        />
                    </div>
                </div>

                {/* Lab Area (Scrollable on Mobile) */}
                <div className="flex-1 relative flex flex-col h-full overflow-y-auto md:overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 scroll-smooth">
                    
                    {/* Background Grid */}
                    <div className="fixed inset-0 opacity-10 pointer-events-none" 
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                    </div>

                    {/* Info Panel Container */}
                    {/* On Mobile: Part of the flow, full width. On Desktop: Absolute positioned top-right */}
                    <div className="relative w-full p-4 z-20 md:absolute md:top-4 md:right-auto md:left-8 md:w-80 md:p-0">
                        <InfoPanel state={beaker} lang={lang} />
                    </div>

                    {/* Beaker Container */}
                    {/* Uses min-height to allow scrolling if content (like gas tubes) pushes it down */}
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[550px] md:min-h-0 pb-12 pt-12 md:pt-0">
                         <Beaker 
                            state={beaker} 
                            onClear={handleClear} 
                            onToggleHeat={toggleHeat} 
                            onToggleElectrolysis={toggleElectrolysis}
                            onTestGas={handleTestGas}
                            lang={lang}
                        />
                    </div>

                    {/* Footer Message (Mobile Flow / Desktop Absolute) */}
                    <div className="p-4 text-center md:absolute md:bottom-4 md:right-4 md:text-right w-full pointer-events-none">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">{t.safety}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default App;