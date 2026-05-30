// ============================================================
// SPHinXsys Simulation Engine — JavaScript Implementation
// ============================================================

import type { Material, MaterialType, SimulationParams, ParsedParams, ChipType, CoolingMethod } from '@/types';

// ============================================================
// Material Database
// ============================================================

export const MATERIAL_DB: Record<MaterialType, Material> = {
  Si: {
    id: 'Si',
    name: 'Silicon',
    nameZh: '硅',
    density: 2330,
    thermalConductivity: 149,
    specificHeat: 700,
    thermalExpansion: 2.6e-6,
    meltingPoint: 1687,
  },
  Cu: {
    id: 'Cu',
    name: 'Copper',
    nameZh: '铜',
    density: 8960,
    thermalConductivity: 401,
    specificHeat: 385,
    thermalExpansion: 16.5e-6,
    meltingPoint: 1358,
  },
  Al: {
    id: 'Al',
    name: 'Aluminum',
    nameZh: '铝',
    density: 2700,
    thermalConductivity: 237,
    specificHeat: 900,
    thermalExpansion: 23.1e-6,
    meltingPoint: 933,
  },
  Ag: {
    id: 'Ag',
    name: 'Silver',
    nameZh: '银',
    density: 10500,
    thermalConductivity: 429,
    specificHeat: 235,
    thermalExpansion: 18.9e-6,
    meltingPoint: 1235,
  },
  SiC: {
    id: 'SiC',
    name: 'Silicon Carbide',
    nameZh: '碳化硅',
    density: 3210,
    thermalConductivity: 490,
    specificHeat: 750,
    thermalExpansion: 4.0e-6,
    meltingPoint: 3100,
  },
  GaN: {
    id: 'GaN',
    name: 'Gallium Nitride',
    nameZh: '氮化镓',
    density: 6150,
    thermalConductivity: 130,
    specificHeat: 490,
    thermalExpansion: 3.2e-6,
    meltingPoint: 1970,
  },
  TIM: {
    id: 'TIM',
    name: 'Thermal Interface',
    nameZh: '导热界面材料',
    density: 2500,
    thermalConductivity: 8,
    specificHeat: 1500,
    thermalExpansion: 50e-6,
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    nameZh: '自定义',
    density: 1000,
    thermalConductivity: 100,
    specificHeat: 500,
    thermalExpansion: 10e-6,
  },
};

export function getMaterial(type: MaterialType): Material {
  return MATERIAL_DB[type] || MATERIAL_DB.custom;
}

// ============================================================
// Resolution presets
// ============================================================

export const RESOLUTION_PRESETS = {
  low: { particleCount: 5000, smoothingLength: 0.5e-3, label: '低', labelEn: 'Low' },
  medium: { particleCount: 50000, smoothingLength: 0.25e-3, label: '中', labelEn: 'Medium' },
  high: { particleCount: 500000, smoothingLength: 0.1e-3, label: '高', labelEn: 'High' },
  ultra: { particleCount: 10000000, smoothingLength: 0.05e-3, label: '超高', labelEn: 'Ultra' },
};

// ============================================================
// Default Simulation Parameters
// ============================================================

export function getDefaultParams(): SimulationParams {
  return {
    chip: {
      type: 'cpu',
      width: 40,
      height: 40,
      thickness: 2,
      power: 100,
      material: 'Si',
    },
    heatSink: {
      enabled: true,
      type: 'fin',
      material: 'Al',
      finCount: 8,
      finHeight: 40,
      finThickness: 2,
      baseThickness: 5,
    },
    cooling: {
      method: 'air',
      ambientTemperature: 25,
      flowRate: 2,
    },
    sph: {
      resolution: 'medium',
      particleCount: 50000,
      smoothingLength: 0.25e-3,
      timeStep: 1e-6,
      totalTime: 1e-3,
      outputInterval: 1e-5,
    },
    physics: {
      fields: ['fluid', 'solid', 'heat'],
      gravity: 9.81,
      surfaceTension: false,
      phaseChange: false,
    },
  };
}

// ============================================================
// Simplified SPH Heat Transfer Engine
// ============================================================

interface SPHParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  temperature: number;
  density: number;
  pressure: number;
  mass: number;
  isBoundary: boolean;
}

interface SPHConfig {
  smoothingLength: number;
  particleCount: number;
  timeStep: number;
  kernelType: 'cubic' | 'wendland';
}

/**
 * Cubic spline kernel — standard SPH smoothing kernel
 */
export function cubicSplineKernel(q: number): number {
  const sigma = 8.0 / Math.PI;
  if (q >= 0 && q < 0.5) {
    return sigma * (6 * q * q * q - 6 * q * q + 1);
  } else if (q >= 0.5 && q < 1.0) {
    return sigma * 2 * (1 - q) * (1 - q) * (1 - q);
  }
  return 0;
}

/**
 * Kernel gradient (simplified 1D)
 */
export function cubicSplineKernelGradient(q: number): number {
  const sigma = 48.0 / Math.PI;
  if (q >= 0 && q < 0.5) {
    return sigma * q * (3 * q - 2);
  } else if (q >= 0.5 && q < 1.0) {
    return -sigma * (1 - q) * (1 - q);
  }
  return 0;
}

/**
 * Initialize particles in a regular grid within the chip volume
 */
export function initializeChipParticles(
  width: number,
  height: number,
  thickness: number,
  power: number,
  material: Material,
  particleCount: number
): SPHParticle[] {
  const particles: SPHParticle[] = [];
  const nx = Math.round(Math.pow(particleCount * width / height / thickness, 1 / 3));
  const ny = Math.round(nx * height / width);
  const nz = Math.round(nx * thickness / width);

  const dx = width / nx;
  const dy = height / ny;
  const dz = thickness / nz;
  const volume = dx * dy * dz;
  const mass = material.density * volume * 1e-9; // Convert mm^3 to m^3

  // Power density per particle (W/particle)
  const totalParticles = nx * ny * nz;
  const powerPerParticle = power / totalParticles;
  // Initial temperature: ~ambient + power-based estimate
  const baseTemp = 25 + powerPerParticle * 0.5;

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      for (let k = 0; k < nz; k++) {
        // Add slight jitter to avoid perfect grid
        const jitter = 0.1;
        const x = (i + 0.5) * dx + (Math.random() - 0.5) * dx * jitter;
        const y = (j + 0.5) * dy + (Math.random() - 0.5) * dy * jitter;
        const z = (k + 0.5) * dz + (Math.random() - 0.5) * dz * jitter;

        // Temperature gradient: center is hotter
        const cx = width / 2;
        const cy = height / 2;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const tempFactor = 1 - 0.3 * (dist / maxDist);

        particles.push({
          x,
          y,
          z,
          vx: 0,
          vy: 0,
          vz: 0,
          temperature: baseTemp * tempFactor,
          density: material.density,
          pressure: 0,
          mass,
          isBoundary: false,
        });
      }
    }
  }

  return particles;
}

/**
 * Compute temperature field using simplified SPH heat conduction
 */
export function computeTemperatureField(
  particles: SPHParticle[],
  material: Material,
  config: SPHConfig,
  dt: number
): SPHParticle[] {
  const h = config.smoothingLength;
  const alpha = material.thermalConductivity / (material.density * material.specificHeat);

  return particles.map((pi, i) => {
    if (pi.isBoundary) return pi;

    let laplacianT = 0;

    for (let j = 0; j < particles.length; j++) {
      if (i === j) continue;
      const pj = particles[j];

      const dx = pi.x - pj.x;
      const dy = pi.y - pj.y;
      const dz = pi.z - pj.z;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (r >= h || r < 1e-12) continue;

      const q = r / h;
      const gradW = cubicSplineKernelGradient(q);

      // Laplacian of temperature (simplified)
      const dT = pj.temperature - pi.temperature;
      laplacianT += (pj.mass / pj.density) * dT * gradW / (r * h);
    }

    const newTemp = pi.temperature + alpha * laplacianT * dt;

    return {
      ...pi,
      temperature: Math.max(25, newTemp), // Clamp to ambient
    };
  });
}

/**
 * Estimate steady-state max temperature using simplified analytical model
 * Uses finite-volume style thermal resistance network
 */
export function estimateMaxTemperature(params: SimulationParams): number {
  const { chip, heatSink, cooling } = params;
  const chipMat = getMaterial(chip.material);

  // Junction-to-case thermal resistance (simplified)
  const junctionArea = (chip.width * chip.height) * 1e-6; // mm^2 -> m^2
  const junctionThickness = chip.thickness * 1e-3; // mm -> m
  const rJunction = junctionThickness / (chipMat.thermalConductivity * junctionArea);

  // Case-to-ambient (simplified estimate)
  let rCaseToAmbient = 0;

  if (heatSink.enabled) {
    const hsMat = getMaterial(heatSink.material);
    // Heat sink thermal resistance approximation
    const finEfficiency = 0.7;
    const hsSurface = junctionArea + (heatSink.finCount || 0) *
      2 * (heatSink.finHeight || 0) * (heatSink.finThickness || 1) * 1e-6 * finEfficiency;

    const hConv = cooling.method === 'air' ? 50 :
                  cooling.method === 'water' ? 5000 :
                  cooling.method === 'phase_change' ? 10000 :
                  cooling.method === 'immersion' ? 3000 : 200;

    rCaseToAmbient = 1 / (hConv * hsSurface) + (heatSink.baseThickness || 5) * 1e-3 / (hsMat.thermalConductivity * junctionArea);
  } else {
    // Natural convection
    const hNat = 10;
    rCaseToAmbient = 1 / (hNat * junctionArea);
  }

  const totalR = rJunction + rCaseToAmbient;
  return cooling.ambientTemperature + chip.power * totalR;
}

/**
 * Estimate thermal resistance (K/W)
 */
export function estimateThermalResistance(params: SimulationParams): number {
  const tMax = estimateMaxTemperature(params);
  return (tMax - params.cooling.ambientTemperature) / params.chip.power;
}

// ============================================================
// Natural Language Parsing (Simplified)
// ============================================================

const CHIP_TYPE_KEYWORDS: Record<string, ChipType> = {
  'cpu': 'cpu', '处理器': 'cpu', '中央处理器': 'cpu',
  'gpu': 'gpu', '显卡': 'gpu', '图形处理器': 'gpu',
  '功率器件': 'power_device', '功率': 'power_device', 'power': 'power_device',
  'memory': 'memory', '内存': 'memory', 'dram': 'memory',
};

const MATERIAL_KEYWORDS: Record<string, MaterialType> = {
  '硅': 'Si', 'silicon': 'Si',
  '铜': 'Cu', 'copper': 'Cu',
  '铝': 'Al', 'aluminum': 'Al', 'aluminium': 'Al',
  '银': 'Ag', 'silver': 'Ag',
  '碳化硅': 'SiC', 'sic': 'SiC',
  '氮化镓': 'GaN', 'gan': 'GaN',
};

const COOLING_KEYWORDS: Record<string, CoolingMethod> = {
  '风冷': 'air', 'air': 'air', '风扇': 'air',
  '水冷': 'water', 'water': 'water', '液冷': 'water',
  '相变': 'phase_change', 'phase': 'phase_change', '热管': 'phase_change',
  '浸没': 'immersion', 'immersion': 'immersion',
  '液金': 'liquid_metal', 'liquid metal': 'liquid_metal',
};

/**
 * Parse natural language input to extract simulation parameters
 */
export function parseNaturalLanguage(input: string): ParsedParams {
  const lower = input.toLowerCase();
  const result: ParsedParams = {
    confidence: 0,
    missingParams: [],
  };

  let matchCount = 0;
  let totalChecks = 0;

  // Chip type
  totalChecks++;
  for (const [keyword, type] of Object.entries(CHIP_TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      result.chipType = type;
      matchCount++;
      break;
    }
  }

  // Power extraction (regex: number followed by W or W)
  totalChecks++;
  const powerMatch = lower.match(/(\d+(?:\.\d+)?)\s*[w瓦]/);
  if (powerMatch) {
    result.power = parseFloat(powerMatch[1]);
    matchCount++;
  }

  // Material
  totalChecks++;
  for (const [keyword, mat] of Object.entries(MATERIAL_KEYWORDS)) {
    if (lower.includes(keyword)) {
      result.material = mat;
      matchCount++;
      break;
    }
  }

  // Cooling method
  totalChecks++;
  for (const [keyword, method] of Object.entries(COOLING_KEYWORDS)) {
    if (lower.includes(keyword)) {
      result.coolingMethod = method;
      matchCount++;
      break;
    }
  }

  // Heat sink material (e.g., "铝散热器")
  totalChecks++;
  const hsMatch = lower.match(/(铝|铜|银)[\s]*散热/);
  if (hsMatch) {
    result.heatSinkMaterial = MATERIAL_KEYWORDS[hsMatch[1]];
    matchCount++;
  }

  result.confidence = totalChecks > 0 ? matchCount / totalChecks : 0;

  // Determine missing params
  if (!result.chipType) result.missingParams.push('chipType');
  if (!result.power) result.missingParams.push('power');
  if (!result.material) result.missingParams.push('material');
  if (!result.coolingMethod) result.missingParams.push('coolingMethod');

  return result;
}

// ============================================================
// Parameter Validation
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSimulationParams(params: SimulationParams): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  // Chip geometry
  if (params.chip.width <= 0 || params.chip.width > 1000) {
    result.errors.push('芯片宽度必须在 0.1-1000 mm 之间');
  }
  if (params.chip.height <= 0 || params.chip.height > 1000) {
    result.errors.push('芯片高度必须在 0.1-1000 mm 之间');
  }
  if (params.chip.thickness <= 0 || params.chip.thickness > 100) {
    result.errors.push('芯片厚度必须在 0.1-100 mm 之间');
  }
  if (params.chip.power <= 0 || params.chip.power > 10000) {
    result.errors.push('功耗必须在 0.1-10000 W 之间');
  }

  // SPH parameters
  if (params.sph.timeStep <= 0 || params.sph.timeStep > 1) {
    result.errors.push('时间步长必须在 1e-9-1 s 之间');
  }
  if (params.sph.totalTime <= 0 || params.sph.totalTime > 100) {
    result.errors.push('总仿真时间必须大于 0');
  }
  if (params.sph.particleCount <= 0) {
    result.errors.push('粒子数必须大于 0');
  }

  // Temperature
  if (params.cooling.ambientTemperature < -273 || params.cooling.ambientTemperature > 200) {
    result.errors.push('环境温度必须在 -273-200 C 之间');
  }

  // Warnings
  if (params.chip.power > 500) {
    result.warnings.push('高功耗芯片（>500W），建议提高仿真分辨率');
  }
  if (params.sph.particleCount > 1000000 && params.sph.timeStep < 1e-8) {
    result.warnings.push('高粒子数 + 小时间步长组合，仿真可能耗时较长');
  }
  const estimatedT = estimateMaxTemperature(params);
  if (estimatedT > 125) {
    result.warnings.push(`预估最高温度 ${estimatedT.toFixed(1)}C 超过典型硅芯片结温限制（125C），建议改进散热方案`);
  }

  result.valid = result.errors.length === 0;
  return result;
}

// ============================================================
// Temperature Color Mapping
// ============================================================

/**
 * Map temperature value to color (deep blue → blue → green → yellow → orange → red)
 */
export function temperatureToColor(
  temp: number,
  minTemp: number = 25,
  maxTemp: number = 125
): [number, number, number] {
  const t = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));

  // 6-stop gradient
  const stops: [number, [number, number, number]][] = [
    [0.0, [0, 0, 170]],     // deep blue
    [0.2, [0, 102, 255]],   // blue
    [0.4, [0, 255, 0]],     // green
    [0.6, [255, 255, 0]],   // yellow
    [0.8, [255, 170, 0]],   // orange
    [1.0, [255, 0, 0]],     // red
  ];

  // Find segment
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i][0] && t <= stops[i + 1][0]) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const segT = upper[0] === lower[0] ? 0 : (t - lower[0]) / (upper[0] - lower[0]);
  const r = Math.round(lower[1][0] + segT * (upper[1][0] - lower[1][0]));
  const g = Math.round(lower[1][1] + segT * (upper[1][1] - lower[1][1]));
  const b = Math.round(lower[1][2] + segT * (upper[1][2] - lower[1][2]));

  return [r, g, b];
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number, unit: 'C' | 'K' = 'C'): string {
  return `${temp.toFixed(1)} ${unit}`;
}

// ============================================================
// Scene Templates
// ============================================================

export function getSceneTemplates() {
  return [
    {
      id: 'cpu-air-cooling',
      name: 'CPU 风冷散热',
      description: '桌面级处理器在塔式散热器下的自然对流与强制对流仿真',
      tags: ['风冷', '铝散热片'],
      defaultParams: {
        ...getDefaultParams(),
        chip: { type: 'cpu' as ChipType, width: 40, height: 40, thickness: 2, power: 100, material: 'Si' },
        heatSink: { enabled: true, type: 'fin' as const, material: 'Al', finCount: 8, finHeight: 40, finThickness: 2, baseThickness: 5 },
        cooling: { method: 'air' as CoolingMethod, ambientTemperature: 25, flowRate: 2 },
      },
      nlPrompts: ['模拟一个 100W CPU 在铝散热器下的风冷散热'],
    },
    {
      id: 'gpu-water-cooling',
      name: 'GPU 水冷散热',
      description: '显卡核心在水冷头微通道中的流体-固体耦合传热分析',
      tags: ['水冷', '微通道'],
      defaultParams: {
        ...getDefaultParams(),
        chip: { type: 'gpu' as ChipType, width: 60, height: 40, thickness: 1.5, power: 350, material: 'Si' },
        heatSink: { enabled: true, type: 'micro_channel' as const, material: 'Cu', finCount: 20, finHeight: 2, finThickness: 0.5, baseThickness: 3 },
        cooling: { method: 'water' as CoolingMethod, ambientTemperature: 25, flowRate: 1.5 },
      },
      nlPrompts: ['模拟一个 350W GPU 在水冷头微通道中的散热'],
    },
    {
      id: 'power-phase-change',
      name: '功率器件相变散热',
      description: '功率模块通过热管/均热板的相变换热过程仿真',
      tags: ['相变', '热管'],
      defaultParams: {
        ...getDefaultParams(),
        chip: { type: 'power_device' as ChipType, width: 20, height: 20, thickness: 3, power: 200, material: 'SiC' },
        heatSink: { enabled: true, type: 'vapor_chamber' as const, material: 'Cu', finCount: 6, finHeight: 30, finThickness: 2, baseThickness: 4 },
        cooling: { method: 'phase_change' as CoolingMethod, ambientTemperature: 25, flowRate: 0 },
      },
      nlPrompts: ['模拟功率模块通过热管的相变换热过程'],
    },
    {
      id: 'datacenter-immersion',
      name: '数据中心浸没冷却',
      description: '服务器集群在绝缘冷却液中的浸没式散热方案评估',
      tags: ['浸没', '液冷'],
      defaultParams: {
        ...getDefaultParams(),
        chip: { type: 'cpu' as ChipType, width: 50, height: 50, thickness: 2, power: 250, material: 'Si' },
        heatSink: { enabled: false, type: 'none' as const, material: 'Al' },
        cooling: { method: 'immersion' as CoolingMethod, ambientTemperature: 40, flowRate: 0.5, coolantMaterial: 'Fluorinert' },
      },
      nlPrompts: ['模拟服务器集群在绝缘冷却液中的浸没式散热'],
    },
  ];
}

export type SceneTemplateData = ReturnType<typeof getSceneTemplates>[number];
