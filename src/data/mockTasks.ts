import type { SimulationTask, CoolingMethod, ChipType, MaterialType } from '@/types';

type SceneDisplay = { label: string; chipLabel: string; coolingIcon: string };

export const SCENE_MAP: Record<string, SceneDisplay> = {
  'cpu_air': { label: 'CPU风冷', chipLabel: 'CPU', coolingIcon: 'fan' },
  'cpu_water': { label: 'CPU水冷', chipLabel: 'CPU', coolingIcon: 'droplets' },
  'gpu_water': { label: 'GPU水冷', chipLabel: 'GPU', coolingIcon: 'droplets' },
  'power_air': { label: '功率器件散热', chipLabel: '功率器件', coolingIcon: 'flame' },
  'immersion': { label: '浸没式冷却', chipLabel: 'CPU', coolingIcon: 'container' },
  'jet': { label: '射流冷却', chipLabel: 'GPU', coolingIcon: 'zap' },
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'completed': { label: '已完成', color: 'var(--accent-stable)' },
  'running': { label: '运行中', color: 'var(--accent-particle)' },
  'queued': { label: '排队中', color: 'var(--text-muted)' },
  'failed': { label: '失败', color: 'var(--accent-thermal)' },
  'idle': { label: '空闲', color: 'var(--text-muted)' },
  'paused': { label: '已暂停', color: 'var(--accent-energy)' },
};

export const COOLING_LABELS: Record<CoolingMethod, string> = {
  'air': '风冷',
  'water': '水冷',
  'phase_change': '相变冷却',
  'immersion': '浸没式',
  'liquid_metal': '液金',
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  'Si': '硅',
  'Cu': '铜',
  'Al': '铝',
  'Ag': '银',
  'SiC': '碳化硅',
  'GaN': '氮化镓',
  'TIM': '界面材料',
  'custom': '自定义',
};

const now = new Date();
const minsAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const mockTasks: SimulationTask[] = [
  {
    id: 'TASK-20241201-001',
    name: 'i9-14900K 风冷散热基准测试',
    description: 'Intel Core i9-14900K 在标准塔式风冷条件下的散热性能基准仿真',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 30, height: 30, thickness: 0.5, power: 150, material: 'Si' },
      heatSink: { enabled: true, type: 'fin', material: 'Al', finCount: 60, finHeight: 45, finThickness: 0.4, baseThickness: 5 },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 25, flowRate: 2.5 },
      sph: { resolution: 'medium', particleCount: 128000, smoothingLength: 0.0002, timeStep: 1e-6, totalTime: 10, outputInterval: 0.1 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8, surfaceTension: false },
    },
    createdAt: daysAgo(6),
    startedAt: daysAgo(6),
    completedAt: minsAgo(8560),
    progress: 100,
    results: {
      maxTemperature: 82.4,
      avgTemperature: 58.6,
      thermalResistance: 0.38,
      heatFluxMax: 1.2e6,
      temperatureMap: { width: 100, height: 100, depth: 20, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 25, avgTemp: 25, residual: 1 },
        { time: 2, maxTemp: 78, avgTemp: 52, residual: 0.15 },
        { time: 5, maxTemp: 82, avgTemp: 57, residual: 0.04 },
        { time: 10, maxTemp: 82.4, avgTemp: 58.6, residual: 0.01 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/001/result.vtk', size: 45.2e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-002',
    name: 'RTX 4090 360水冷方案评估',
    description: 'NVIDIA RTX 4090 搭配360mm一体式水冷的散热仿真分析',
    status: 'completed',
    params: {
      chip: { type: 'gpu' as ChipType, width: 60.9, height: 40.2, thickness: 0.3, power: 300, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Cu', finCount: 120, finHeight: 10, finThickness: 0.2, baseThickness: 3 },
      cooling: { method: 'water' as CoolingMethod, ambientTemperature: 22, flowRate: 1.2 },
      sph: { resolution: 'high', particleCount: 256000, smoothingLength: 0.00015, timeStep: 5e-7, totalTime: 8, outputInterval: 0.05 },
      physics: { fields: ['heat', 'fluid'], gravity: 0, surfaceTension: false },
    },
    createdAt: daysAgo(5),
    startedAt: daysAgo(5),
    completedAt: minsAgo(7120),
    progress: 100,
    results: {
      maxTemperature: 68.2,
      avgTemperature: 52.1,
      thermalResistance: 0.15,
      heatFluxMax: 2.5e6,
      temperatureMap: { width: 200, height: 150, depth: 10, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 22, avgTemp: 22, residual: 1 },
        { time: 1, maxTemp: 60, avgTemp: 44, residual: 0.2 },
        { time: 4, maxTemp: 66, avgTemp: 50, residual: 0.05 },
        { time: 8, maxTemp: 68.2, avgTemp: 52.1, residual: 0.008 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/002/result.vtk', size: 78.4e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-003',
    name: 'SiC MOSFET 功率器件强制风冷',
    description: '碳化硅MOSFET功率模块在强制对流风冷条件下的散热性能评估',
    status: 'running',
    params: {
      chip: { type: 'power_device' as ChipType, width: 10, height: 10, thickness: 0.35, power: 200, material: 'SiC' },
      heatSink: { enabled: true, type: 'fin', material: 'Cu', finCount: 40, finHeight: 25, finThickness: 0.5, baseThickness: 3 },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 35, flowRate: 4.0 },
      sph: { resolution: 'medium', particleCount: 96000, smoothingLength: 0.00025, timeStep: 1e-6, totalTime: 10, outputInterval: 0.1 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8, surfaceTension: false },
    },
    createdAt: minsAgo(180),
    startedAt: minsAgo(175),
    progress: 62,
    results: {
      maxTemperature: 91.5,
      avgTemperature: 74.3,
      thermalResistance: 0.28,
      heatFluxMax: 3.2e6,
      temperatureMap: { width: 50, height: 50, depth: 15, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 35, avgTemp: 35, residual: 1 },
        { time: 2, maxTemp: 82, avgTemp: 66, residual: 0.18 },
        { time: 5, maxTemp: 89, avgTemp: 72, residual: 0.06 },
        { time: 6.2, maxTemp: 91.5, avgTemp: 74.3, residual: 0.04 },
      ],
      outputFiles: [],
    },
  },
  {
    id: 'TASK-20241201-004',
    name: '浸没式冷却服务器节点验证',
    description: '单路服务器节点在全氟化液浸没冷却条件下的散热仿真',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 32, height: 32, thickness: 0.5, power: 180, material: 'Si' },
      heatSink: { enabled: false, type: 'none', material: 'Cu' },
      cooling: { method: 'immersion' as CoolingMethod, ambientTemperature: 50, flowRate: 0.3, coolantMaterial: '全氟化液 FC-72' },
      sph: { resolution: 'high', particleCount: 320000, smoothingLength: 0.00018, timeStep: 5e-7, totalTime: 12, outputInterval: 0.1 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8, surfaceTension: true },
    },
    createdAt: daysAgo(4),
    startedAt: daysAgo(4),
    completedAt: minsAgo(5680),
    progress: 100,
    results: {
      maxTemperature: 55.8,
      avgTemperature: 48.2,
      thermalResistance: 0.03,
      heatFluxMax: 8.5e5,
      temperatureMap: { width: 120, height: 120, depth: 50, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 50, avgTemp: 50, residual: 1 },
        { time: 3, maxTemp: 54, avgTemp: 47, residual: 0.08 },
        { time: 8, maxTemp: 55.5, avgTemp: 48, residual: 0.02 },
        { time: 12, maxTemp: 55.8, avgTemp: 48.2, residual: 0.005 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/004/result.vtk', size: 92.1e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-005',
    name: 'GaN HEMT 射流冲击冷却仿真',
    description: '氮化镓高电子迁移率晶体管微射流冲击冷却方案的散热分析',
    status: 'failed',
    params: {
      chip: { type: 'power_device' as ChipType, width: 5, height: 5, thickness: 0.1, power: 250, material: 'GaN' },
      heatSink: { enabled: false, type: 'none', material: 'Cu' },
      cooling: { method: 'water' as CoolingMethod, ambientTemperature: 20, flowRate: 8.0 },
      sph: { resolution: 'ultra', particleCount: 512000, smoothingLength: 0.0001, timeStep: 2e-7, totalTime: 5, outputInterval: 0.05 },
      physics: { fields: ['heat', 'fluid'], gravity: 0, surfaceTension: true },
    },
    createdAt: daysAgo(3),
    startedAt: daysAgo(3),
    progress: 78,
    error: '时间步长过小导致计算不收敛，建议增大 smoothing length 或降低粒子分辨率',
    results: {
      maxTemperature: 156.3,
      avgTemperature: 112.5,
      thermalResistance: 0.55,
      heatFluxMax: 1.8e7,
      temperatureMap: { width: 30, height: 30, depth: 5, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 20, avgTemp: 20, residual: 1 },
        { time: 1, maxTemp: 98, avgTemp: 72, residual: 0.25 },
        { time: 2, maxTemp: 142, avgTemp: 98, residual: 0.45 },
        { time: 3.9, maxTemp: 156.3, avgTemp: 112.5, residual: 0.62 },
      ],
      outputFiles: [],
    },
  },
  {
    id: 'TASK-20241201-006',
    name: 'AMD EPYC 9654 液金直触散热',
    description: 'AMD EPYC 9654 96核处理器液态金属直触散热方案仿真',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 72, height: 57, thickness: 0.78, power: 240, material: 'Si' },
      heatSink: { enabled: true, type: 'vapor_chamber', material: 'Cu', finCount: 80, finHeight: 35, finThickness: 0.3, baseThickness: 4 },
      cooling: { method: 'liquid_metal' as CoolingMethod, ambientTemperature: 25, flowRate: 0.5 },
      sph: { resolution: 'medium', particleCount: 180000, smoothingLength: 0.00022, timeStep: 8e-7, totalTime: 10, outputInterval: 0.1 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8, surfaceTension: true },
    },
    createdAt: daysAgo(3),
    startedAt: daysAgo(3),
    completedAt: minsAgo(4240),
    progress: 100,
    results: {
      maxTemperature: 72.6,
      avgTemperature: 61.4,
      thermalResistance: 0.20,
      heatFluxMax: 1.5e6,
      temperatureMap: { width: 180, height: 140, depth: 25, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 25, avgTemp: 25, residual: 1 },
        { time: 2, maxTemp: 66, avgTemp: 54, residual: 0.12 },
        { time: 6, maxTemp: 71, avgTemp: 60, residual: 0.03 },
        { time: 10, maxTemp: 72.6, avgTemp: 61.4, residual: 0.006 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/006/result.vtk', size: 64.8e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-007',
    name: '铜基微通道水冷散热器优化',
    description: '铜制微通道散热器不同通道宽度下的水冷散热性能对比',
    status: 'queued',
    params: {
      chip: { type: 'cpu' as ChipType, width: 20, height: 20, thickness: 0.5, power: 120, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Cu', finCount: 50, finHeight: 8, finThickness: 0.3, baseThickness: 2 },
      cooling: { method: 'water' as CoolingMethod, ambientTemperature: 22, flowRate: 1.5 },
      sph: { resolution: 'high', particleCount: 210000, smoothingLength: 0.00016, timeStep: 5e-7, totalTime: 8, outputInterval: 0.08 },
      physics: { fields: ['heat', 'fluid'], gravity: 0, surfaceTension: false },
    },
    createdAt: minsAgo(30),
    progress: 0,
  },
  {
    id: 'TASK-20241201-008',
    name: 'HBM3 内存堆叠散热分析',
    description: '高带宽内存HBM3 8层堆叠结构的3D散热仿真',
    status: 'completed',
    params: {
      chip: { type: 'memory' as ChipType, width: 11, height: 11, thickness: 0.77, power: 12, material: 'Si' },
      heatSink: { enabled: true, type: 'fin', material: 'Cu', finCount: 20, finHeight: 15, finThickness: 0.2, baseThickness: 1 },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 45, flowRate: 1.5 },
      sph: { resolution: 'medium', particleCount: 72000, smoothingLength: 0.0003, timeStep: 1e-6, totalTime: 6, outputInterval: 0.1 },
      physics: { fields: ['heat'], gravity: 9.8 },
    },
    createdAt: daysAgo(2),
    startedAt: daysAgo(2),
    completedAt: minsAgo(2800),
    progress: 100,
    results: {
      maxTemperature: 78.3,
      avgTemperature: 66.5,
      thermalResistance: 2.78,
      heatFluxMax: 4.2e5,
      temperatureMap: { width: 40, height: 40, depth: 30, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 45, avgTemp: 45, residual: 1 },
        { time: 2, maxTemp: 74, avgTemp: 62, residual: 0.1 },
        { time: 4, maxTemp: 77, avgTemp: 65, residual: 0.03 },
        { time: 6, maxTemp: 78.3, avgTemp: 66.5, residual: 0.008 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/008/result.vtk', size: 38.2e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-009',
    name: '数据中心浸没冷却 POD 级仿真',
    description: '42U机架浸没冷却POD级别的整体流场与温度场耦合仿真',
    status: 'running',
    params: {
      chip: { type: 'cpu' as ChipType, width: 40, height: 40, thickness: 0.5, power: 500, material: 'Si' },
      heatSink: { enabled: false, type: 'none', material: 'Cu' },
      cooling: { method: 'immersion' as CoolingMethod, ambientTemperature: 55, flowRate: 0.1, coolantMaterial: '矿物油' },
      sph: { resolution: 'low', particleCount: 480000, smoothingLength: 0.0004, timeStep: 2e-6, totalTime: 15, outputInterval: 0.2 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8, surfaceTension: true },
    },
    createdAt: minsAgo(420),
    startedAt: minsAgo(410),
    progress: 35,
    results: {
      maxTemperature: 72.1,
      avgTemperature: 58.9,
      thermalResistance: 0.034,
      heatFluxMax: 3.8e5,
      temperatureMap: { width: 600, height: 1000, depth: 1000, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 55, avgTemp: 55, residual: 1 },
        { time: 3, maxTemp: 66, avgTemp: 54, residual: 0.2 },
        { time: 5.25, maxTemp: 72.1, avgTemp: 58.9, residual: 0.12 },
      ],
      outputFiles: [],
    },
  },
  {
    id: 'TASK-20241201-010',
    name: '相变材料蓄热散热器瞬态分析',
    description: '石蜡基相变材料(PCM)蓄热散热器在间歇负载下的瞬态热响应',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 25, height: 25, thickness: 0.5, power: 100, material: 'Si' },
      heatSink: { enabled: true, type: 'fin', material: 'Al', finCount: 30, finHeight: 20, finThickness: 0.5, baseThickness: 4 },
      cooling: { method: 'phase_change' as CoolingMethod, ambientTemperature: 28, flowRate: 1.0 },
      sph: { resolution: 'medium', particleCount: 144000, smoothingLength: 0.00024, timeStep: 8e-7, totalTime: 20, outputInterval: 0.2 },
      physics: { fields: ['heat'], gravity: 9.8, phaseChange: true },
    },
    createdAt: daysAgo(2),
    startedAt: daysAgo(2),
    completedAt: minsAgo(1360),
    progress: 100,
    results: {
      maxTemperature: 68.5,
      avgTemperature: 54.2,
      thermalResistance: 0.40,
      heatFluxMax: 8.8e5,
      temperatureMap: { width: 80, height: 80, depth: 30, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 28, avgTemp: 28, residual: 1 },
        { time: 5, maxTemp: 64, avgTemp: 48, residual: 0.18 },
        { time: 12, maxTemp: 67, avgTemp: 53, residual: 0.06 },
        { time: 20, maxTemp: 68.5, avgTemp: 54.2, residual: 0.015 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/010/result.vtk', size: 55.6e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-011',
    name: '铝基散热器自然对流仿真',
    description: '无风扇铝制散热器纯自然对流条件下的CPU散热性能',
    status: 'queued',
    params: {
      chip: { type: 'cpu' as ChipType, width: 28, height: 28, thickness: 0.5, power: 65, material: 'Si' },
      heatSink: { enabled: true, type: 'fin', material: 'Al', finCount: 25, finHeight: 50, finThickness: 1.5, baseThickness: 5 },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 30, flowRate: 0.5 },
      sph: { resolution: 'low', particleCount: 64000, smoothingLength: 0.00035, timeStep: 2e-6, totalTime: 12, outputInterval: 0.2 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8 },
    },
    createdAt: minsAgo(15),
    progress: 0,
  },
  {
    id: 'TASK-20241201-012',
    name: 'GPU射流阵列微通道冷却',
    description: 'AI加速卡GPU的射流冲击+微通道混合冷却方案仿真',
    status: 'running',
    params: {
      chip: { type: 'gpu' as ChipType, width: 81.3, height: 33.5, thickness: 0.77, power: 275, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Cu', finCount: 200, finHeight: 5, finThickness: 0.15, baseThickness: 2 },
      cooling: { method: 'water' as CoolingMethod, ambientTemperature: 20, flowRate: 3.0 },
      sph: { resolution: 'high', particleCount: 300000, smoothingLength: 0.00014, timeStep: 4e-7, totalTime: 8, outputInterval: 0.08 },
      physics: { fields: ['heat', 'fluid'], gravity: 0, surfaceTension: false },
    },
    createdAt: minsAgo(300),
    startedAt: minsAgo(295),
    progress: 88,
    results: {
      maxTemperature: 59.4,
      avgTemperature: 46.8,
      thermalResistance: 0.14,
      heatFluxMax: 2.8e6,
      temperatureMap: { width: 250, height: 100, depth: 10, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 20, avgTemp: 20, residual: 1 },
        { time: 2, maxTemp: 50, avgTemp: 40, residual: 0.12 },
        { time: 5, maxTemp: 57, avgTemp: 45, residual: 0.04 },
        { time: 7.04, maxTemp: 59.4, avgTemp: 46.8, residual: 0.015 },
      ],
      outputFiles: [],
    },
  },
  {
    id: 'TASK-20241201-013',
    name: '银烧结热界面材料导热测试',
    description: '银烧结纳米多孔热界面材料(TIM)的等效导热系数仿真标定',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 15, height: 15, thickness: 0.05, power: 50, material: 'Ag' },
      heatSink: { enabled: true, type: 'none', material: 'Cu' },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 25, flowRate: 1.0 },
      sph: { resolution: 'ultra', particleCount: 400000, smoothingLength: 0.00008, timeStep: 2e-7, totalTime: 3, outputInterval: 0.05 },
      physics: { fields: ['heat'], gravity: 9.8 },
    },
    createdAt: daysAgo(1),
    startedAt: daysAgo(1),
    completedAt: minsAgo(120),
    progress: 100,
    results: {
      maxTemperature: 48.7,
      avgTemperature: 41.3,
      thermalResistance: 0.47,
      heatFluxMax: 5.5e5,
      temperatureMap: { width: 30, height: 30, depth: 2, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 25, avgTemp: 25, residual: 1 },
        { time: 1, maxTemp: 45, avgTemp: 38, residual: 0.15 },
        { time: 2, maxTemp: 48, avgTemp: 41, residual: 0.04 },
        { time: 3, maxTemp: 48.7, avgTemp: 41.3, residual: 0.01 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/013/result.vtk', size: 48.3e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-014',
    name: '碳化硅功率模块液冷基板设计',
    description: '电动汽车SiC功率模块直接液冷基板的流道优化仿真',
    status: 'failed',
    params: {
      chip: { type: 'power_device' as ChipType, width: 20, height: 15, thickness: 0.35, power: 280, material: 'SiC' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Al', finCount: 60, finHeight: 12, finThickness: 0.4, baseThickness: 5 },
      cooling: { method: 'water' as CoolingMethod, ambientTemperature: 45, flowRate: 2.0 },
      sph: { resolution: 'high', particleCount: 240000, smoothingLength: 0.00017, timeStep: 5e-7, totalTime: 6, outputInterval: 0.1 },
      physics: { fields: ['heat', 'fluid'], gravity: 0, surfaceTension: false },
    },
    createdAt: daysAgo(1),
    startedAt: daysAgo(1),
    progress: 45,
    error: '粒子数超出GPU显存限制，建议使用较低分辨率或在CPU模式下运行',
    results: {
      maxTemperature: 105.2,
      avgTemperature: 88.6,
      thermalResistance: 0.22,
      heatFluxMax: 4.2e6,
      temperatureMap: { width: 80, height: 60, depth: 20, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 45, avgTemp: 45, residual: 1 },
        { time: 1.5, maxTemp: 88, avgTemp: 72, residual: 0.2 },
        { time: 2.7, maxTemp: 105.2, avgTemp: 88.6, residual: 0.35 },
      ],
      outputFiles: [],
    },
  },
  {
    id: 'TASK-20241201-015',
    name: '3D芯片堆叠微流道冷却',
    description: '三层堆叠逻辑芯片嵌入式微流道冷却的共设计仿真',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 20, height: 20, thickness: 0.15, power: 180, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Si', finCount: 100, finHeight: 3, finThickness: 0.1, baseThickness: 0.5 },
      cooling: { method: 'water' as CoolingMethod, ambientTemperature: 22, flowRate: 0.8 },
      sph: { resolution: 'ultra', particleCount: 450000, smoothingLength: 0.0001, timeStep: 3e-7, totalTime: 6, outputInterval: 0.06 },
      physics: { fields: ['heat', 'fluid'], gravity: 0, surfaceTension: false },
    },
    createdAt: hoursAgo(12),
    startedAt: hoursAgo(12),
    completedAt: minsAgo(60),
    progress: 100,
    results: {
      maxTemperature: 76.3,
      avgTemperature: 62.8,
      thermalResistance: 0.30,
      heatFluxMax: 1.2e6,
      temperatureMap: { width: 60, height: 60, depth: 45, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 22, avgTemp: 22, residual: 1 },
        { time: 1.5, maxTemp: 70, avgTemp: 56, residual: 0.18 },
        { time: 4, maxTemp: 75, avgTemp: 61, residual: 0.05 },
        { time: 6, maxTemp: 76.3, avgTemp: 62.8, residual: 0.01 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/015/result.vtk', size: 82.5e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-016',
    name: '散热器鳍片高度参数化扫描',
    description: 'CPU散热器不同鳍片高度(20-60mm)的参数化批量仿真扫描',
    status: 'completed',
    params: {
      chip: { type: 'cpu' as ChipType, width: 30, height: 30, thickness: 0.5, power: 125, material: 'Si' },
      heatSink: { enabled: true, type: 'fin', material: 'Al', finCount: 50, finHeight: 40, finThickness: 0.4, baseThickness: 4 },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 25, flowRate: 3.0 },
      sph: { resolution: 'medium', particleCount: 120000, smoothingLength: 0.00028, timeStep: 1e-6, totalTime: 8, outputInterval: 0.1 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8 },
    },
    createdAt: hoursAgo(8),
    startedAt: hoursAgo(8),
    completedAt: minsAgo(45),
    progress: 100,
    results: {
      maxTemperature: 71.8,
      avgTemperature: 55.4,
      thermalResistance: 0.37,
      heatFluxMax: 1.1e6,
      temperatureMap: { width: 100, height: 100, depth: 45, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 25, avgTemp: 25, residual: 1 },
        { time: 2, maxTemp: 66, avgTemp: 50, residual: 0.16 },
        { time: 5, maxTemp: 70, avgTemp: 54, residual: 0.04 },
        { time: 8, maxTemp: 71.8, avgTemp: 55.4, residual: 0.008 },
      ],
      outputFiles: [{ name: 'result.vtk', path: '/out/016/result.vtk', size: 42.8e6, type: 'vtk' }],
    },
  },
  {
    id: 'TASK-20241201-017',
    name: 'AI训练卡液氮过冷散热方案',
    description: '800W级AI训练加速卡液氮过冷(-196C)散热极限测试仿真',
    status: 'queued',
    params: {
      chip: { type: 'gpu' as ChipType, width: 80, height: 60, thickness: 0.77, power: 800, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Cu', finCount: 300, finHeight: 8, finThickness: 0.1, baseThickness: 3 },
      cooling: { method: 'immersion' as CoolingMethod, ambientTemperature: -196, flowRate: 0.2 },
      sph: { resolution: 'high', particleCount: 500000, smoothingLength: 0.00012, timeStep: 2e-7, totalTime: 5, outputInterval: 0.05 },
      physics: { fields: ['heat', 'fluid'], gravity: 9.8, surfaceTension: true, phaseChange: true },
    },
    createdAt: minsAgo(5),
    progress: 0,
  },
  {
    id: 'TASK-20241201-018',
    name: '手机SoC超薄均热板仿真',
    description: '5G手机SoC石墨+VC均热板复合散热方案薄型化设计',
    status: 'running',
    params: {
      chip: { type: 'cpu' as ChipType, width: 12, height: 12, thickness: 0.1, power: 8, material: 'Si' },
      heatSink: { enabled: true, type: 'vapor_chamber', material: 'Cu', finCount: 0, finHeight: 0, finThickness: 0, baseThickness: 0.3 },
      cooling: { method: 'air' as CoolingMethod, ambientTemperature: 35, flowRate: 0.2 },
      sph: { resolution: 'medium', particleCount: 86000, smoothingLength: 0.0003, timeStep: 8e-7, totalTime: 5, outputInterval: 0.1 },
      physics: { fields: ['heat'], gravity: 9.8 },
    },
    createdAt: minsAgo(90),
    startedAt: minsAgo(85),
    progress: 55,
    results: {
      maxTemperature: 62.8,
      avgTemperature: 51.3,
      thermalResistance: 3.48,
      heatFluxMax: 2.5e5,
      temperatureMap: { width: 30, height: 30, depth: 5, data: new Float32Array(), unit: 'C', timestamp: 0 },
      convergenceHistory: [
        { time: 0, maxTemp: 35, avgTemp: 35, residual: 1 },
        { time: 1, maxTemp: 54, avgTemp: 44, residual: 0.2 },
        { time: 2.75, maxTemp: 62.8, avgTemp: 51.3, residual: 0.08 },
      ],
      outputFiles: [],
    },
  },
];

export function getSceneKey(task: SimulationTask): string {
  const chip = task.params.chip.type;
  const cooling = task.params.cooling.method;
  if (chip === 'power_device') return cooling === 'air' ? 'power_air' : 'power_device';
  if (cooling === 'immersion') return 'immersion';
  if (cooling === 'water' && chip === 'gpu') return 'gpu_water';
  if (cooling === 'water' && chip === 'cpu') return 'cpu_water';
  if (task.name.includes('射流') || task.params.cooling.method === ('jet' as CoolingMethod)) return 'jet';
  if (chip === 'cpu' && cooling === 'air') return 'cpu_air';
  return 'cpu_air';
}

export function getSceneLabel(task: SimulationTask): string {
  const key = getSceneKey(task);
  return SCENE_MAP[key]?.label ?? '自定义';
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.round(seconds % 60)}秒`;
  return `${Math.floor(seconds / 3600)}时${Math.round((seconds % 3600) / 60)}分`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getTaskDuration(task: SimulationTask): number {
  if (task.completedAt && task.startedAt) {
    return Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 1000);
  }
  if (task.startedAt) {
    return Math.round((Date.now() - new Date(task.startedAt).getTime()) / 1000);
  }
  return 0;
}

export function getDurationLabel(task: SimulationTask): string {
  const dur = getTaskDuration(task);
  if (dur === 0) return '-';
  return formatDuration(dur);
}
