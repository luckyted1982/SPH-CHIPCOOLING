// ============================================================
// Mock Analysis Data — CPU Air Cooling Simulation Results
// ============================================================

export interface TimeSeriesPoint {
  time: number;          // seconds
  maxTemp: number;       // °C
  avgTemp: number;       // °C
  minTemp: number;       // °C
  heatsinkTemp: number;  // °C
  outletTemp: number;    // °C
}

export interface TempDistributionBin {
  range: string;
  min: number;
  max: number;
  count: number;
  color: string;
}

export interface ThermalResistanceComponent {
  name: string;
  nameZh: string;
  value: number;      // K/W
  benchmark: number;  // typical K/W
  color: string;
}

export interface MaterialProperty {
  name: string;
  value: number;
  unit: string;
  recommended: number;
}

export interface SimulationParameter {
  category: string;
  params: {
    name: string;
    value: string;
    recommended?: string;
    warning?: boolean;
  }[];
}

// ─── Time Series Data (0-60s, temperature rising then stabilizing) ───
export function generateTimeSeries(): TimeSeriesPoint[] {
  const data: TimeSeriesPoint[] = [];
  const steps = 120;
  const totalTime = 60;
  const dt = totalTime / steps;

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    // Exponential approach to steady-state with some noise
    const tau = 15; // time constant
    const factor = 1 - Math.exp(-t / tau);
    const noise = () => (Math.random() - 0.5) * 1.5;

    // Core temps rise and stabilize
    const maxTempSteady = 78.5;
    const avgTempSteady = 65.2;
    const minTempSteady = 52.0;
    const heatsinkSteady = 48.5;
    const outletSteady = 42.0;

    data.push({
      time: Math.round(t * 10) / 10,
      maxTemp: Math.round((25 + (maxTempSteady - 25) * factor + noise()) * 10) / 10,
      avgTemp: Math.round((25 + (avgTempSteady - 25) * factor + noise() * 0.7) * 10) / 10,
      minTemp: Math.round((25 + (minTempSteady - 25) * factor + noise() * 0.5) * 10) / 10,
      heatsinkTemp: Math.round((25 + (heatsinkSteady - 25) * factor + noise() * 0.6) * 10) / 10,
      outletTemp: Math.round((25 + (outletSteady - 25) * factor + noise() * 0.4) * 10) / 10,
    });
  }
  return data;
}

// ─── Temperature Distribution Histogram ───
export function generateTempDistribution(): TempDistributionBin[] {
  return [
    { range: '20-30°C', min: 20, max: 30, count: 12, color: '#1E5F8A' },
    { range: '30-40°C', min: 30, max: 40, count: 48, color: '#45B7D1' },
    { range: '40-50°C', min: 40, max: 50, count: 142, color: '#4ECDC4' },
    { range: '50-60°C', min: 50, max: 60, count: 385, color: '#6BD9A5' },
    { range: '60-70°C', min: 60, max: 70, count: 612, color: '#A8E6CF' },
    { range: '70-80°C', min: 70, max: 80, count: 438, color: '#FFD93D' },
    { range: '80-90°C', min: 80, max: 90, count: 128, color: '#FF9F43' },
    { range: '90°C+', min: 90, max: 100, count: 35, color: '#FF6B6B' },
  ];
}

// ─── Thermal Resistance Breakdown ───
export function getThermalResistanceData(): ThermalResistanceComponent[] {
  return [
    {
      name: 'Rjc',
      nameZh: '结-壳热阻',
      value: 0.15,
      benchmark: 0.2,
      color: '#45B7D1',
    },
    {
      name: 'Rcs',
      nameZh: '壳-散热器热阻',
      value: 0.08,
      benchmark: 0.1,
      color: '#4ECDC4',
    },
    {
      name: 'Rsa',
      nameZh: '散热器-环境热阻',
      value: 0.19,
      benchmark: 0.5,
      color: '#A8E6CF',
    },
  ];
}

// ─── Generate 2D temperature field (50×50) ───
export function generateTemperatureField(size: number = 50): number[][] {
  const field: number[][] = [];
  const cx = size * 0.5;
  const cy = size * 0.42; // slightly above center (heat source offset)

  for (let y = 0; y < size; y++) {
    const row: number[] = [];
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = size * 0.7;

      // Base temp + Gaussian heat source + noise
      const normalizedDist = dist / maxDist;
      const baseTemp = 25 + (78 - 25) * Math.exp(-normalizedDist * normalizedDist * 2.5);
      const noise = (Math.random() - 0.5) * 4;
      row.push(Math.max(25, Math.min(95, baseTemp + noise)));
    }
    field.push(row);
  }
  return field;
}

// ─── Generate 3D particle positions with temperatures ───
export interface Particle3D {
  x: number;
  y: number;
  z: number;
  temperature: number;
  size: number;
}

export function generateParticles3D(count: number = 3000): Particle3D[] {
  const particles: Particle3D[] = [];
  const chipW = 2.0;
  const chipH = 2.0;
  const chipD = 0.3;

  for (let i = 0; i < count; i++) {
    // Random position within chip volume + heatsink
    const isHeatsink = Math.random() > 0.6;
    let x: number, y: number, z: number, temp: number;

    if (isHeatsink) {
      // Heatsink region (above chip)
      x = (Math.random() - 0.5) * chipW * 1.5;
      y = (Math.random() - 0.5) * chipH * 1.5;
      z = chipD * 0.5 + Math.random() * 0.8;
      const distFromCenter = Math.sqrt(x * x + y * y) / (chipW * 0.75);
      temp = 35 + 15 * (1 - distFromCenter) + (Math.random() - 0.5) * 8;
    } else {
      // Chip body
      x = (Math.random() - 0.5) * chipW;
      y = (Math.random() - 0.5) * chipH;
      z = (Math.random() - 0.5) * chipD;
      const distFromCenter = Math.sqrt(x * x + y * y) / (chipW * 0.5);
      temp = 55 + 25 * Math.exp(-distFromCenter * distFromCenter * 3) + (Math.random() - 0.5) * 10;
    }

    particles.push({
      x, y, z,
      temperature: Math.max(25, Math.min(90, temp)),
      size: 0.02 + (temp / 100) * 0.03,
    });
  }
  return particles;
}

// ─── Hotspots ───
export interface HotSpotData {
  x: number;
  y: number;
  z: number;
  temperature: number;
  label: string;
}

export function getHotSpots(): HotSpotData[] {
  return [
    { x: 0.3, y: 0.2, z: 0.0, temperature: 78.5, label: 'Tmax' },
    { x: -0.5, y: -0.4, z: 0.1, temperature: 72.3, label: 'Hot Zone B' },
    { x: 0.6, y: -0.3, z: -0.05, temperature: 69.8, label: 'Hot Zone C' },
  ];
}

// ─── Simulation Parameters Summary ───
export function getSimulationParameters(): SimulationParameter[] {
  return [
    {
      category: '芯片参数',
      params: [
        { name: '芯片类型', value: 'CPU' },
        { name: '尺寸', value: '40 × 40 × 2 mm' },
        { name: '功耗', value: '100 W' },
        { name: '材料', value: '硅 (Si)' },
        { name: '导热系数', value: '149 W/(m·K)', recommended: '100-200' },
      ],
    },
    {
      category: '散热器参数',
      params: [
        { name: '类型', value: '鳍片式 (Fin)' },
        { name: '材料', value: '铝 (Al)' },
        { name: '鳍片数量', value: '8' },
        { name: '鳍片高度', value: '40 mm' },
        { name: '基底厚度', value: '5 mm' },
      ],
    },
    {
      category: '冷却参数',
      params: [
        { name: '冷却方式', value: '风冷 (Air)' },
        { name: '环境温度', value: '25 °C' },
        { name: '气流速度', value: '2.0 m/s' },
      ],
    },
    {
      category: 'SPH 仿真参数',
      params: [
        { name: '粒子分辨率', value: '中等 (Medium)' },
        { name: '粒子总数', value: '50,000' },
        { name: '光滑长度', value: '0.25 mm' },
        { name: '时间步长', value: '1 μs' },
        { name: '总仿真时间', value: '60 s' },
      ],
    },
  ];
}

// ─── Material Properties Table ───
export function getMaterialProperties(): MaterialProperty[] {
  return [
    { name: '密度', value: 2330, unit: 'kg/m³', recommended: 2330 },
    { name: '导热系数', value: 149, unit: 'W/(m·K)', recommended: 150 },
    { name: '比热容', value: 700, unit: 'J/(kg·K)', recommended: 700 },
    { name: '热膨胀系数', value: 2.6e-6, unit: '1/K', recommended: 2.6e-6 },
    { name: '熔点', value: 1687, unit: 'K', recommended: 1687 },
  ];
}

// ─── Task metadata ───
export interface TaskMeta {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'failed' | 'running';
  createdAt: string;
  completedAt: string;
  duration: string;
  chipPower: number;
  coolingMethod: string;
}

export function getTaskMeta(): TaskMeta {
  return {
    id: 'SIM-2026-0115-001',
    name: 'CPU 铝散热器风冷散热分析',
    description: '100W 桌面级处理器在塔式铝散热器下的稳态热分析，采用 SPH 方法模拟芯片-散热器-空气三相耦合传热',
    status: 'completed',
    createdAt: '2026-01-15 14:32',
    completedAt: '2026-01-15 14:36',
    duration: '00:03:45',
    chipPower: 100,
    coolingMethod: '风冷',
  };
}

// ─── Statistics ───
export interface AnalysisStats {
  maxTemp: number;
  avgTemp: number;
  thermalResistance: number;
  tempRise: number;
  heatDissipation: number;
  safeThreshold: number;
}

export function getAnalysisStats(): AnalysisStats {
  return {
    maxTemp: 78.5,
    avgTemp: 65.2,
    thermalResistance: 0.42,
    tempRise: 43.3,
    heatDissipation: 100,
    safeThreshold: 85,
  };
}

// ─── Temperature color utility ───
export function getTempColor(temp: number, min = 25, max = 95): string {
  const t = Math.max(0, Math.min(1, (temp - min) / (max - min)));
  if (t < 0.25) {
    // Blue to cyan
    const s = t / 0.25;
    return `rgb(${Math.round(30 + 30 * s)}, ${Math.round(95 + 100 * s)}, ${Math.round(138 + 100 * (1 - s))})`;
  } else if (t < 0.5) {
    // Cyan to green
    const s = (t - 0.25) / 0.25;
    return `rgb(${Math.round(60 + 70 * s)}, ${Math.round(195 - 30 * s)}, ${Math.round(138 - 80 * s)})`;
  } else if (t < 0.75) {
    // Green to yellow
    const s = (t - 0.5) / 0.25;
    return `rgb(${Math.round(130 + 125 * s)}, ${Math.round(165 + 75 * s)}, ${Math.round(58 - 40 * s)})`;
  } else {
    // Yellow to red
    const s = (t - 0.75) / 0.25;
    return `rgb(${Math.round(255)}, ${Math.round(240 - 185 * s)}, ${Math.round(18 - 18 * s)})`;
  }
}

// ─── Reference thermal resistance benchmarks ───
export interface BenchmarkEntry {
  method: string;
  range: string;
  current: boolean;
  pass: boolean;
}

export function getBenchmarkData(): BenchmarkEntry[] {
  return [
    { method: '风冷', range: '0.3–1.0 K/W', current: true, pass: true },
    { method: '水冷', range: '0.05–0.3 K/W', current: false, pass: false },
    { method: '相变', range: '0.1–0.5 K/W', current: false, pass: false },
    { method: '液金', range: '0.02–0.1 K/W', current: false, pass: false },
  ];
}
