import { Chemical, ChemicalType, ReactionResult, Language, ExperimentPreset } from './types';
import { TRANSLATIONS } from './translations';

// Base definitions without text
const BASE_CHEMICALS: Omit<Chemical, 'name' | 'description'>[] = [
    { id: 'h2o', formula: 'H₂O', type: ChemicalType.LIQUID, color: 'rgba(200, 230, 255, 0.4)', ph: 7 },
    { id: 'hcl', formula: 'HCl', type: ChemicalType.LIQUID, color: 'rgba(255, 255, 200, 0.4)', ph: 1 },
    { id: 'naoh', formula: 'NaOH', type: ChemicalType.LIQUID, color: 'rgba(255, 255, 255, 0.4)', ph: 13 },
    { id: 'agno3', formula: 'AgNO₃', type: ChemicalType.LIQUID, color: 'rgba(255, 255, 255, 0.4)', ph: 6 },
    { id: 'h2o2', formula: 'H₂O₂', type: ChemicalType.LIQUID, color: 'rgba(240, 240, 255, 0.5)', ph: 6 },
    { id: 'na', formula: 'Na', type: ChemicalType.SOLID, color: '#e2e8f0', reactivity: 9 },
    { id: 'k', formula: 'K', type: ChemicalType.SOLID, color: '#cbd5e1', reactivity: 10 },
    { id: 'nacl', formula: 'NaCl', type: ChemicalType.POWDER, color: '#f8fafc', ph: 7 },
    { id: 'cuso4', formula: 'CuSO₄', type: ChemicalType.POWDER, color: '#3b82f6', ph: 6 },
    { id: 'fe', formula: 'Fe', type: ChemicalType.POWDER, color: '#475569', reactivity: 4 },
    { id: 'kmno4', formula: 'KMnO₄', type: ChemicalType.POWDER, color: '#6b21a8' }, // Purple
    { id: 'mno2', formula: 'MnO₂', type: ChemicalType.POWDER, color: '#1e293b' }, // Black
    { id: 'phen', formula: 'C₂₀H₁₄O₄', type: ChemicalType.INDICATOR, color: 'rgba(255, 255, 255, 0)', ph: 7 },
    { id: 'uni', formula: 'Mixture', type: ChemicalType.INDICATOR, color: '#f59e0b', ph: 7 },
];

export const getChemicals = (lang: Language): Chemical[] => {
    const t = TRANSLATIONS[lang].chemicals;
    return BASE_CHEMICALS.map(c => {
        // @ts-ignore - dynamic lookup
        const txt = t[c.id];
        return {
            ...c,
            name: txt ? txt.name : c.id,
            description: txt ? txt.desc : ''
        };
    });
};

export const getPresets = (lang: Language): ExperimentPreset[] => {
    const t = TRANSLATIONS[lang].presets;
    return [
        { id: 'sodium_water', name: t.sodium_water.name, description: t.sodium_water.desc, chemicals: ['h2o', 'na'] },
        { id: 'chlor_alkali', name: t.chlor_alkali.name, description: t.chlor_alkali.desc, chemicals: ['h2o', 'nacl', 'phen'], requiresElectrolysis: true },
        { id: 'agcl_precip', name: t.agcl_precip.name, description: t.agcl_precip.desc, chemicals: ['h2o', 'nacl', 'agno3'] },
        { id: 'neutralization', name: t.neutralization.name, description: t.neutralization.desc, chemicals: ['h2o', 'phen', 'naoh', 'hcl'] },
        { id: 'oxygen_heat', name: t.oxygen_heat.name, description: t.oxygen_heat.desc, chemicals: ['kmno4'], requiresHeat: true },
        { id: 'oxygen_catalyst', name: t.oxygen_catalyst.name, description: t.oxygen_catalyst.desc, chemicals: ['h2o2', 'mno2'] },
        { id: 'displacement', name: t.displacement.name, description: t.displacement.desc, chemicals: ['h2o', 'cuso4', 'fe'] },
        { id: 'electrolysis', name: t.electrolysis.name, description: t.electrolysis.desc, chemicals: ['h2o'], requiresElectrolysis: true },
    ];
};

// Simple Reaction Engine
export const checkReaction = (currentContents: Chemical[], isHeating: boolean, isElectrolyzing: boolean, lang: Language): ReactionResult | null => {
    const t = TRANSLATIONS[lang].reactions;
    const allIds = currentContents.map(c => c.id);
    const has = (id: string) => allIds.includes(id);
    const count = (id: string) => allIds.filter(x => x === id).length;

    // 0. Electrolysis
    if (isElectrolyzing && has('h2o')) {
        // Chlor-Alkali (Brine electrolysis)
        if (has('nacl')) {
            return {
                message: t.chlor_alkali,
                equation: "2NaCl + 2H₂O → 2NaOH + H₂↑ + Cl₂↑",
                gasProduced: true,
                gasType: 'h2', // Collect H2
                resultColor: has('phen') ? '#ec4899' : '#fef08a', // Pink if phen (NaOH), else yellowish (Cl2)
                temperatureChange: 'WARM'
            }
        }
        // Pure Water
        return {
            message: t.electrolysis,
            equation: "2H₂O (l) → 2H₂ (g) + O₂ (g)",
            gasProduced: true,
            temperatureChange: 'NONE'
        }
    }

    // 1. Sodium + Water
    if (has('na') && has('h2o')) {
        return {
            message: t.na_h2o,
            equation: "2Na + 2H₂O → 2NaOH + H₂↑",
            temperatureChange: 'EXPLOSIVE',
            gasProduced: true,
            gasType: 'h2',
            resultColor: 'rgba(255, 100, 0, 0.5)',
            triggerShake: true,
            resetOnExplosion: true
        };
    }
    
    // 2. Potassium + Water
    if (has('k') && has('h2o')) {
        return {
            message: t.k_h2o,
            equation: "2K + 2H₂O → 2KOH + H₂↑",
            temperatureChange: 'EXPLOSIVE',
            gasProduced: true,
            gasType: 'h2',
            resultColor: 'rgba(200, 50, 255, 0.6)', 
            triggerShake: true,
            resetOnExplosion: true
        };
    }

    // 3. Oxygen: KMnO4 + Heat
    if (has('kmno4') && isHeating) {
        return {
            message: t.kmno4_heat,
            equation: "2KMnO₄ + △ → K₂MnO₄ + MnO₂ + O₂↑",
            temperatureChange: 'HOT',
            gasProduced: true,
            gasType: 'o2', // Collect O2
            resultColor: '#064e3b', // Dark green (Manganate)
        };
    }

    // 4. Oxygen: H2O2 + MnO2 (Catalyst)
    if (has('h2o2') && has('mno2')) {
        return {
            message: t.h2o2_mno2,
            equation: "2H₂O₂ + MnO₂ → 2H₂O + O₂↑ + MnO₂",
            temperatureChange: 'WARM',
            gasProduced: true,
            gasType: 'o2', // Collect O2
            resultColor: '#334155', // Dark grey slurry
        };
    }

    // 5. Silver Nitrate + NaCl (Precipitate)
    if (has('agno3') && has('nacl')) {
         return {
            message: t.agcl_precip,
            equation: "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
            precipitate: true,
            resultColor: 'rgba(255, 255, 255, 0.9)', // White milky
            temperatureChange: 'NONE'
         }
    }

    // 6. Acid + Base + Phenolphthalein
    if (has('phen')) {
        let acidCount = count('hcl');
        // NaOH or Electrolyzed Brine (which creates NaOH) makes it base
        // If we electrolyzed brine, let's assume one unit of NaOH created
        let baseCount = count('naoh'); 
        
        // Simulating NaOH creation from brine electrolysis logic in App state is hard here without passing state history, 
        // but if we are currently electrolyzing brine, we are basic.
        if (isElectrolyzing && has('nacl') && has('h2o')) {
            baseCount += 10; // Massive base source
        }

        if (baseCount > acidCount) {
             return {
                message: t.phen_base,
                equation: "NaOH ⇌ Na⁺ + OH⁻",
                resultColor: '#ec4899', // Pink
                temperatureChange: 'NONE'
            };
        }
        if (acidCount >= baseCount) {
             return {
                message: t.phen_acid,
                equation: baseCount > 0 ? "HCl + NaOH → NaCl + H₂O" : undefined,
                resultColor: 'rgba(255, 255, 255, 0.2)', // Clear
                temperatureChange: acidCount > 0 && baseCount > 0 ? 'WARM' : 'NONE'
            };
        }
    }

    // 7. Neutralization pure
    if (has('hcl') && has('naoh') && !has('phen') && !has('uni')) {
        return {
            message: t.neutralization,
            equation: "HCl + NaOH → NaCl + H₂O",
            temperatureChange: 'HOT',
            gasProduced: true, 
            resultColor: 'rgba(240, 240, 240, 0.5)',
        };
    }

    // 8. Universal Indicator
    if (has('uni')) {
         let acidCount = count('hcl');
         let baseCount = count('naoh');
         
         if (acidCount > baseCount) return { message: t.uni_acid, resultColor: '#ef4444' };
         if (baseCount > acidCount) return { message: t.uni_base, resultColor: '#a855f7' };
         if (acidCount === baseCount && acidCount > 0) return { message: t.uni_neutral, equation: "H⁺ + OH⁻ → H₂O", resultColor: '#22c55e', temperatureChange: 'WARM' };
         if (has('h2o')) return { message: t.uni_water, resultColor: '#22c55e' };
    }

    // 9. Displacement Fe + CuSO4
    if (has('cuso4') && has('fe') && has('h2o')) {
        return {
            message: t.fe_cuso4,
            equation: "Fe + CuSO₄ → FeSO₄ + Cu↓",
            resultColor: '#84cc16', // Greenish
            precipitate: true,
            temperatureChange: 'WARM'
        };
    }

    // 10. Dissolving
    if (has('cuso4') && has('h2o') && !has('fe')) {
        return {
            message: t.cuso4_water,
            equation: "CuSO₄ (s) → Cu²⁺ (aq) + SO₄²⁻ (aq)",
            resultColor: '#3b82f6',
            temperatureChange: 'NONE'
        };
    }

    // 11. Dissolving NaCl
    if (has('nacl') && has('h2o') && !has('agno3') && !isElectrolyzing) {
        return {
            message: `${t.added} NaCl.`,
            resultColor: 'rgba(255,255,255,0.3)',
            temperatureChange: 'NONE'
        };
    }
    
    if (has('kmno4') && has('h2o') && !isHeating) {
         return {
            message: `${t.added} KMnO₄.`,
            resultColor: '#a855f7', // Purple solution
            temperatureChange: 'NONE'
        };
    }

    // Default Mix
    const last = currentContents[currentContents.length - 1];
    if (last && last.type === ChemicalType.LIQUID && currentContents.length > 1) {
        return {
            message: `${t.added} ${last.name}.`,
            resultColor: undefined, 
            temperatureChange: 'NONE'
        };
    }

    return null;
};