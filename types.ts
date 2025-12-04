export enum ChemicalType {
    LIQUID = 'LIQUID',
    SOLID = 'SOLID',
    POWDER = 'POWDER',
    INDICATOR = 'INDICATOR',
    GAS = 'GAS'
}

export type Language = 'zh' | 'en';

export interface Chemical {
    id: string;
    name: string;
    formula: string;
    type: ChemicalType;
    color: string; // CSS color string
    description: string;
    ph?: number; // Approximate pH
    reactivity?: number; // 0-10 scale
}

export interface ReactionResult {
    resultColor?: string;
    temperatureChange?: 'WARM' | 'HOT' | 'EXPLOSIVE' | 'NONE';
    gasProduced?: boolean;
    gasType?: 'h2' | 'o2' | 'cl2'; // New: Specific gas type for collection
    precipitate?: boolean;
    message: string;
    equation?: string; // New: Chemical equation
    newChemicals?: string[]; // IDs of created chemicals
    triggerShake?: boolean;
    resetOnExplosion?: boolean;
}

export interface BeakerState {
    contents: Chemical[];
    temperature: number; // 20 is room temp
    color: string; // Current mixed color
    volume: number; // % filled 0-100
    isReacting: boolean;
    reactionMessage: string;
    reactionEquation?: string; // New: Current equation
    bubbles: boolean;
    activeGasProduction: 'h2' | 'o2' | 'cl2' | null; // New: Which gas is currently filling tubes
    explosion: boolean;
    precipitate: boolean;
    isHeating: boolean; // Alcohol lamp state
    isElectrolyzing: boolean; // New: Electrolysis state
    collectedGas: { h2: number, o2: number, cl2: number }; // New: Volume of gas collected 0-100
}

export interface ExperimentPreset {
    id: string;
    name: string;
    description: string;
    chemicals: string[]; // IDs of chemicals to add
    requiresHeat?: boolean;
    requiresElectrolysis?: boolean; // New
}