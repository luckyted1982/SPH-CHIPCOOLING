// ============================================================
// SPHinXsys Chip Cooling Simulation — Shared Types
// ============================================================

/** Cooling method for chip thermal management */
export type CoolingMethod = 'air' | 'water' | 'phase_change' | 'immersion' | 'liquid_metal';

/** Chip/package types supported by the simulator */
export type ChipType = 'cpu' | 'gpu' | 'power_device' | 'memory' | 'custom';

/** Material types with thermal properties */
export type MaterialType = 'Si' | 'Cu' | 'Al' | 'Ag' | 'SiC' | 'GaN' | 'TIM' | 'custom';

/** Simulation task status lifecycle */
export type TaskStatus = 'idle' | 'queued' | 'running' | 'paused' | 'completed' | 'failed';

/** Physical field being simulated */
export type PhysicsField = 'fluid' | 'solid' | 'heat';

/** Particle resolution level */
export type Resolution = 'low' | 'medium' | 'high' | 'ultra';

/** Temperature unit */
export type TemperatureUnit = 'C' | 'K';

// ============================================================
// Material
// ============================================================

export interface Material {
  id: MaterialType;
  name: string;
  nameZh: string;
  density: number;           // kg/m^3
  thermalConductivity: number; // W/(m·K)
  specificHeat: number;      // J/(kg·K)
  thermalExpansion: number;  // 1/K
  meltingPoint?: number;     // K
}

// ============================================================
// Chip / Geometry
// ============================================================

export interface ChipGeometry {
  type: ChipType;
  width: number;   // mm
  height: number;  // mm
  thickness: number; // mm
  power: number;   // W
  material: MaterialType;
}

export interface HeatSink {
  enabled: boolean;
  type: 'fin' | 'vapor_chamber' | 'micro_channel' | 'none';
  material: MaterialType;
  finCount?: number;
  finHeight?: number;  // mm
  finThickness?: number; // mm
  baseThickness?: number; // mm
}

// ============================================================
// Simulation Parameters
// ============================================================

export interface SimulationParams {
  chip: ChipGeometry;
  heatSink: HeatSink;
  cooling: {
    method: CoolingMethod;
    ambientTemperature: number; // C
    flowRate?: number;          // m/s or L/min depending on method
    coolantMaterial?: string;
  };
  sph: {
    resolution: Resolution;
    particleCount: number;
    smoothingLength: number;    // m
    timeStep: number;           // s
    totalTime: number;          // s
    outputInterval: number;     // s
  };
  physics: {
    fields: PhysicsField[];
    gravity: number;            // m/s^2
    surfaceTension?: boolean;
    phaseChange?: boolean;
  };
}

// ============================================================
// Simulation Task
// ============================================================

export interface SimulationTask {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  params: SimulationParams;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;           // 0-100
  results?: SimulationResult;
  error?: string;
  naturalLanguageInput?: string;
  templateId?: string;
}

export interface SimulationResult {
  maxTemperature: number;     // C
  avgTemperature: number;     // C
  thermalResistance: number;  // K/W
  heatFluxMax: number;        // W/m^2
  temperatureMap: TemperatureField;
  particleTrajectories?: ParticleSnapshot[];
  convergenceHistory: ConvergencePoint[];
  outputFiles: OutputFile[];
}

export interface TemperatureField {
  width: number;
  height: number;
  depth: number;
  data: Float32Array;
  unit: TemperatureUnit;
  timestamp: number;
}

export interface ParticleSnapshot {
  timestamp: number;
  positions: Float32Array;
  temperatures: Float32Array;
  velocities: Float32Array;
}

export interface ConvergencePoint {
  time: number;
  maxTemp: number;
  avgTemp: number;
  residual: number;
}

export interface OutputFile {
  name: string;
  path: string;
  size: number;
  type: 'vtk' | 'csv' | 'png' | 'json' | 'log';
}

// ============================================================
// Scene Template
// ============================================================

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  defaultParams: SimulationParams;
  nlPrompts: string[];
}

// ============================================================
// Natural Language Parsing
// ============================================================

export interface NLInput {
  text: string;
  language: 'zh' | 'en';
}

export interface ParsedParams {
  chipType?: ChipType;
  power?: number;
  material?: MaterialType;
  coolingMethod?: CoolingMethod;
  heatSinkMaterial?: MaterialType;
  confidence: number;
  missingParams: string[];
}

// ============================================================
// UI / Layout
// ============================================================

export interface NavItem {
  label: string;
  labelZh: string;
  path: string;
  icon?: string;
}

export interface FeatureCard {
  icon: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
}

export interface StatItem {
  value: string;
  numericValue: number;
  label: string;
  labelZh: string;
  suffix?: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
}

// ============================================================
// Analysis
// ============================================================

export interface TemperatureProbe {
  id: string;
  name: string;
  position: [number, number, number];
  temperature: number;
  timestamp: number;
}

export interface HotSpot {
  position: [number, number, number];
  temperature: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}
