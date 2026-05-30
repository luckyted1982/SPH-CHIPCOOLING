// Templates.tsx — Simulation Template Library Page
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Cpu,
  Fan,
  Droplets,
  Zap,
  Waves,
  Thermometer,
  ArrowUpDown,
  Sparkles,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Beaker,
  Wind,
  Layers,
  Play,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimulationParams, ChipType, CoolingMethod } from '@/types';
import ThermalCanvas from '@/components/ThermalCanvas';

// ============================================================
// Types
// ============================================================
interface Template {
  id: string;
  name: string;
  description: string;
  chipType: ChipType;
  coolingMethod: CoolingMethod;
  tags: string[];
  badge?: 'hot' | 'recommended' | 'new';
  params: SimulationParams;
  maxTemp: number;
  minTemp: number;
  difficulty: 1 | 2 | 3;
  createdAt: string;
  popularity: number;
  patternType: 'cpu_air' | 'cpu_water' | 'gpu_water' | 'power' | 'immersion' | 'phone' | 'sic' | 'h100';
  detailDescription: string;
  similarTemplates: string[];
}

type FilterTab = 'all' | 'cpu' | 'gpu' | 'power' | 'immersion' | 'jet';
type SortOption = 'popular' | 'newest' | 'name';

// ============================================================
// Template Data
// ============================================================
const TEMPLATES: Template[] = [
  {
    id: 'cpu-tower-air',
    name: 'CPU 风冷散热',
    description: '桌面级高端处理器，双塔散热器，双风扇。适用于 Intel/AMD 桌面 CPU 的常规风冷散热方案仿真。',
    chipType: 'cpu',
    coolingMethod: 'air',
    tags: ['CPU散热', '风冷', '双塔'],
    badge: 'hot',
    patternType: 'cpu_air',
    maxTemp: 95,
    minTemp: 35,
    difficulty: 1,
    popularity: 98,
    createdAt: '2024-01-15',
    detailDescription: '模拟桌面级 CPU 配合双塔散热器的完整散热过程。热源位于芯片中央，热量通过硅基板传导至散热器底座，经铝制鳍片通过对流和辐射散发到环境空气中。包含风扇强制对流效应仿真。',
    similarTemplates: ['cpu-water', 'phone-graphite', 'heat-pipe'],
    params: {
      chip: { type: 'cpu', width: 40, height: 40, thickness: 2, power: 125, material: 'Si' },
      heatSink: { enabled: true, type: 'fin', material: 'Al', finCount: 16, finHeight: 50, finThickness: 2, baseThickness: 5 },
      cooling: { method: 'air', ambientTemperature: 25, flowRate: 2.5 },
      sph: { resolution: 'medium', particleCount: 500000, smoothingLength: 0.1e-3, timeStep: 1e-6, totalTime: 10, outputInterval: 0.1 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 9.81, surfaceTension: false, phaseChange: false },
    },
  },
  {
    id: 'cpu-water',
    name: 'CPU 水冷散热',
    description: '高端桌面 CPU 搭配 240mm 一体式水冷散热器。适用于高功耗处理器的液冷散热方案。',
    chipType: 'cpu',
    coolingMethod: 'water',
    tags: ['CPU散热', '水冷', '240mm'],
    badge: 'hot',
    patternType: 'cpu_water',
    maxTemp: 72,
    minTemp: 30,
    difficulty: 2,
    popularity: 95,
    createdAt: '2024-02-20',
    detailDescription: '模拟高端桌面 CPU 配合一体式水冷散热器的完整散热过程。水流经铜制冷头吸热后，通过水泵循环至铝制冷排，由风扇将热量散发到空气中。包含微通道内流动和换热仿真。',
    similarTemplates: ['gpu-water', 'sic-liquid', 'h100-coldplate'],
    params: {
      chip: { type: 'cpu', width: 40, height: 40, thickness: 2, power: 150, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Cu', finCount: 20, finHeight: 8, finThickness: 0.5, baseThickness: 3 },
      cooling: { method: 'water', ambientTemperature: 25, flowRate: 1.2, coolantMaterial: 'water' },
      sph: { resolution: 'high', particleCount: 2000000, smoothingLength: 0.05e-3, timeStep: 5e-7, totalTime: 10, outputInterval: 0.05 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 9.81, surfaceTension: false, phaseChange: false },
    },
  },
  {
    id: 'gpu-water',
    name: 'GPU 水冷散热',
    description: '高端显卡核心直触微通道水冷方案。适用于 NVIDIA RTX 4090 等旗舰 GPU 的定制化水冷散热。',
    chipType: 'gpu',
    coolingMethod: 'water',
    tags: ['GPU散热', '水冷', '微通道'],
    badge: 'recommended',
    patternType: 'gpu_water',
    maxTemp: 68,
    minTemp: 32,
    difficulty: 3,
    popularity: 88,
    createdAt: '2024-03-10',
    detailDescription: '模拟高端 GPU 配合核心直触微通道水冷头的散热过程。GPU 核心面积较大，热源分布不均匀，微通道水冷头直接贴合核心表面，通过高流速冷却液带走大量热量。',
    similarTemplates: ['cpu-water', 'h100-coldplate', 'cpu-tower-air'],
    params: {
      chip: { type: 'gpu', width: 60, height: 40, thickness: 1.5, power: 200, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Cu', finCount: 30, finHeight: 6, finThickness: 0.3, baseThickness: 2 },
      cooling: { method: 'water', ambientTemperature: 25, flowRate: 1.5, coolantMaterial: 'water' },
      sph: { resolution: 'high', particleCount: 3000000, smoothingLength: 0.04e-3, timeStep: 5e-7, totalTime: 10, outputInterval: 0.05 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 9.81, surfaceTension: false, phaseChange: false },
    },
  },
  {
    id: 'power-mosfet',
    name: '功率器件散热',
    description: 'TO-247 封装功率 MOSFET 配合热管和均热板的相变散热方案。适用于电力电子功率器件。',
    chipType: 'power_device',
    coolingMethod: 'phase_change',
    tags: ['功率器件', '相变', '热管'],
    patternType: 'power',
    maxTemp: 110,
    minTemp: 40,
    difficulty: 2,
    popularity: 72,
    createdAt: '2024-01-28',
    detailDescription: '模拟功率 MOSFET 器件配合热管和均热板的散热过程。利用工作流体的相变潜热快速传递热量，热管将热量从热源快速传导至远端散热鳍片，实现高效散热。',
    similarTemplates: ['sic-liquid', 'cpu-tower-air', 'immersion-dc'],
    params: {
      chip: { type: 'power_device', width: 15, height: 20, thickness: 0.5, power: 80, material: 'Si' },
      heatSink: { enabled: true, type: 'vapor_chamber', material: 'Cu', finCount: 10, finHeight: 30, finThickness: 1.5, baseThickness: 4 },
      cooling: { method: 'phase_change', ambientTemperature: 40, flowRate: 1.0 },
      sph: { resolution: 'medium', particleCount: 500000, smoothingLength: 0.1e-3, timeStep: 1e-6, totalTime: 10, outputInterval: 0.1 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 9.81, surfaceTension: false, phaseChange: true },
    },
  },
  {
    id: 'immersion-dc',
    name: '浸没式冷却',
    description: '数据中心服务器机架浸没于绝缘冷却液中的全浸没散热方案。适用于高密度计算集群。',
    chipType: 'cpu',
    coolingMethod: 'immersion',
    tags: ['数据中心', '浸没', '绝缘液冷'],
    badge: 'new',
    patternType: 'immersion',
    maxTemp: 55,
    minTemp: 25,
    difficulty: 3,
    popularity: 65,
    createdAt: '2024-05-18',
    detailDescription: '模拟数据中心服务器完全浸没于绝缘冷却液中的散热过程。多个服务器节点并排部署，冷却液直接与芯片和元器件接触，通过自然对流或泵驱动循环带走热量。适用于超高密度计算环境。',
    similarTemplates: ['h100-coldplate', 'cpu-water', 'power-mosfet'],
    params: {
      chip: { type: 'cpu', width: 40, height: 40, thickness: 2, power: 250, material: 'Si' },
      heatSink: { enabled: false, type: 'none', material: 'Cu' },
      cooling: { method: 'immersion', ambientTemperature: 25, flowRate: 0.5, coolantMaterial: 'dielectric' },
      sph: { resolution: 'high', particleCount: 5000000, smoothingLength: 0.05e-3, timeStep: 5e-7, totalTime: 10, outputInterval: 0.05 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 9.81, surfaceTension: true, phaseChange: false },
    },
  },
  {
    id: 'jet-impingement',
    name: '射流冲击冷却',
    description: '高速冷却液射流垂直冲击芯片热表面的高效散热方案。适用于局部高热流密度场景。',
    chipType: 'cpu',
    coolingMethod: 'water',
    tags: ['射流冷却', '水冷', '高热流'],
    patternType: 'phone',
    maxTemp: 60,
    minTemp: 25,
    difficulty: 3,
    popularity: 55,
    createdAt: '2024-04-05',
    detailDescription: '模拟高速冷却液射流垂直冲击发热芯片表面的散热过程。射流在冲击区形成强烈的局部换热，有效降低热点温度。适用于局部热流密度极高的先进封装和 3D 堆叠芯片场景。',
    similarTemplates: ['cpu-water', 'micro-channel', 'gpu-water'],
    params: {
      chip: { type: 'cpu', width: 20, height: 20, thickness: 1, power: 300, material: 'Si' },
      heatSink: { enabled: false, type: 'none', material: 'Cu' },
      cooling: { method: 'water', ambientTemperature: 20, flowRate: 5.0, coolantMaterial: 'water' },
      sph: { resolution: 'high', particleCount: 2000000, smoothingLength: 0.05e-3, timeStep: 2e-7, totalTime: 5, outputInterval: 0.02 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 0, surfaceTension: true, phaseChange: false },
    },
  },
  {
    id: 'heat-pipe',
    name: '热管散热',
    description: '烧结式铜粉芯热管配合铝制鳍片的被动散热方案。无需风扇，静音高效。',
    chipType: 'cpu',
    coolingMethod: 'air',
    tags: ['热管', '被动散热', '静音'],
    patternType: 'sic',
    maxTemp: 85,
    minTemp: 35,
    difficulty: 2,
    popularity: 60,
    createdAt: '2024-03-22',
    detailDescription: '模拟烧结式铜粉芯热管的散热过程。热管内部工作流体在蒸发端吸热蒸发，蒸汽流向冷凝端散热凝结，液体通过毛细芯回流至蒸发端，形成自驱动热循环。无需外部动力，静音高效。',
    similarTemplates: ['cpu-tower-air', 'power-mosfet', 'phone-graphite'],
    params: {
      chip: { type: 'cpu', width: 35, height: 35, thickness: 2, power: 65, material: 'Si' },
      heatSink: { enabled: true, type: 'vapor_chamber', material: 'Cu', finCount: 20, finHeight: 45, finThickness: 1.2, baseThickness: 3 },
      cooling: { method: 'air', ambientTemperature: 30, flowRate: 1.0 },
      sph: { resolution: 'medium', particleCount: 800000, smoothingLength: 0.08e-3, timeStep: 8e-7, totalTime: 10, outputInterval: 0.08 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 9.81, surfaceTension: true, phaseChange: true },
    },
  },
  {
    id: 'micro-channel',
    name: '微通道液冷',
    description: '芯片内部集成微通道的直接液冷方案。冷却液直接流经芯片内部微通道，极致换热效率。',
    chipType: 'cpu',
    coolingMethod: 'water',
    tags: ['微通道', '直接液冷', '先进封装'],
    patternType: 'h100',
    maxTemp: 55,
    minTemp: 28,
    difficulty: 3,
    popularity: 78,
    createdAt: '2024-04-28',
    detailDescription: '模拟芯片内部集成微流道的直接液冷方案。冷却液直接流经蚀刻在硅基板内部的微通道网络，与热源仅隔薄层硅材料，热阻极低。适用于先进封装和高性能计算芯片的极致散热需求。',
    similarTemplates: ['cpu-water', 'jet-impingement', 'gpu-water'],
    params: {
      chip: { type: 'cpu', width: 30, height: 30, thickness: 0.8, power: 400, material: 'Si' },
      heatSink: { enabled: true, type: 'micro_channel', material: 'Si', finCount: 50, finHeight: 0.3, finThickness: 0.1, baseThickness: 0.2 },
      cooling: { method: 'water', ambientTemperature: 20, flowRate: 2.0, coolantMaterial: 'water' },
      sph: { resolution: 'ultra', particleCount: 8000000, smoothingLength: 0.02e-3, timeStep: 1e-7, totalTime: 5, outputInterval: 0.02 },
      physics: { fields: ['fluid', 'solid', 'heat'], gravity: 0, surfaceTension: false, phaseChange: false },
    },
  },
];

// ============================================================
// Filter tab config
// ============================================================
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'cpu', label: 'CPU散热' },
  { key: 'gpu', label: 'GPU散热' },
  { key: 'power', label: '功率器件' },
  { key: 'immersion', label: '浸没冷却' },
  { key: 'jet', label: '射流冷却' },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'popular', label: '热门' },
  { key: 'newest', label: '最新' },
  { key: 'name', label: '名称' },
];

// ============================================================
// Chip type badge color mapping
// ============================================================
const CHIP_TYPE_CONFIG: Record<ChipType, { icon: typeof Cpu; label: string; color: string }> = {
  cpu: { icon: Cpu, label: 'CPU', color: '#4ECDC4' },
  gpu: { icon: Zap, label: 'GPU', color: '#FFD93D' },
  power_device: { icon: Zap, label: '功率器件', color: '#FF6B6B' },
  memory: { icon: Layers, label: '内存', color: '#A8E6CF' },
  custom: { icon: Cpu, label: '自定义', color: '#8BA3BF' },
};

const COOLING_ICON_MAP: Record<CoolingMethod, typeof Fan> = {
  air: Wind,
  water: Droplets,
  phase_change: Thermometer,
  immersion: Waves,
  liquid_metal: Beaker,
};

const COOLING_LABEL_MAP: Record<CoolingMethod, string> = {
  air: '风冷',
  water: '水冷',
  phase_change: '相变',
  immersion: '浸没',
  liquid_metal: '液金',
};

const DIFFICULTY_LABELS = ['', '入门', '进阶', '专家'];

// ============================================================
// Badge component
// ============================================================
function Badge({ type }: { type: 'hot' | 'recommended' | 'new' }) {
  const config = {
    hot: { bg: 'rgba(255, 107, 107, 0.15)', color: '#FF6B6B', icon: Flame, text: '热门' },
    recommended: { bg: 'rgba(78, 205, 196, 0.15)', color: '#4ECDC4', icon: Sparkles, text: '推荐' },
    new: { bg: 'rgba(168, 230, 207, 0.15)', color: '#A8E6CF', icon: Clock, text: '新' },
  };
  const c = config[type];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      <Icon className="h-3 w-3" />
      {c.text}
    </span>
  );
}

// ============================================================
// Difficulty indicator
// ============================================================
function DifficultyIndicator({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3] as const).map((i) => (
        <div
          key={i}
          className="h-1.5 w-4 rounded-full"
          style={{
            background: i <= level ? 'var(--accent-flow)' : 'var(--bg-surface)',
            opacity: i <= level ? 1 : 0.4,
          }}
        />
      ))}
      <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {DIFFICULTY_LABELS[level]}
      </span>
    </div>
  );
}

// ============================================================
// Temperature bar
// ============================================================
function TemperatureBar({ min, max }: { min: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg-surface)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #4ECDC4, #A8E6CF, #FFD93D, #FF6B6B)',
          }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {min}°C - {max}°C
      </span>
    </div>
  );
}

// ============================================================
// spring transition preset for card interactions

// ============================================================
// Main Page Component
// ============================================================
export default function Templates() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [expandedParamGroup, setExpandedParamGroup] = useState<string | null>('chip');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!isSortOpen) return;
    const handler = () => setIsSortOpen(false);
    setTimeout(() => document.addEventListener('click', handler, { once: true }), 0);
  }, [isSortOpen]);

  // Filter + sort templates
  const filteredTemplates = useMemo(() => {
    let result = [...TEMPLATES];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'cpu':
          result = result.filter((t) => t.chipType === 'cpu' && t.coolingMethod !== 'immersion');
          break;
        case 'gpu':
          result = result.filter((t) => t.chipType === 'gpu');
          break;
        case 'power':
          result = result.filter((t) => t.chipType === 'power_device' || t.id === 'sic-liquid');
          break;
        case 'immersion':
          result = result.filter((t) => t.coolingMethod === 'immersion');
          break;
        case 'jet':
          result = result.filter((t) => t.id === 'jet-impingement' || t.coolingMethod === 'water');
          break;
      }
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
        break;
    }

    return result;
  }, [activeFilter, sortBy, searchQuery]);

  const handleUseTemplate = useCallback(
    (template: Template) => {
      const params = encodeURIComponent(JSON.stringify(template.params));
      navigate(`/workspace?template=${template.id}&params=${params}`);
    },
    [navigate]
  );

  const handlePreviewParams = useCallback((group: string) => {
    setExpandedParamGroup((prev) => (prev === group ? null : group));
  }, []);

  // Active filter chips
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string }[] = [];
    if (activeFilter !== 'all') {
      const tab = FILTER_TABS.find((t) => t.key === activeFilter);
      if (tab) filters.push({ key: 'category', label: tab.label });
    }
    if (searchQuery.trim()) {
      filters.push({ key: 'search', label: `搜索: ${searchQuery}` });
    }
    return filters;
  }, [activeFilter, searchQuery]);

  const clearFilters = useCallback(() => {
    setActiveFilter('all');
    setSearchQuery('');
  }, []);

  const similarTemplatesList = useMemo(() => {
    if (!selectedTemplate) return [];
    return TEMPLATES.filter((t) => selectedTemplate.similarTemplates.includes(t.id));
  }, [selectedTemplate]);

  return (
    <div className="relative min-h-[100dvh]" style={{ background: 'var(--bg-deep)' }}>
      {/* ====== Page Header ====== */}
      <section className="relative pt-14">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 lg:px-6">
          {/* Title */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h1
              className="font-display text-3xl font-medium tracking-tight sm:text-4xl"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              仿真模板库
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-body)' }}>
              选择预设场景，一键启动专业级芯片散热仿真。所有模板参数均可自定义调整。
            </p>
          </motion.div>

          {/* Search + Sort Row */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Search */}
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="搜索模板名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full border bg-transparent pl-9 pr-4 text-sm outline-none transition-all duration-200 focus:border-opacity-40"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-base)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSortOpen(!isSortOpen);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-200"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-body)',
                  background: 'var(--bg-base)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-active)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <ArrowUpDown className="h-4 w-4" />
                {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-20 w-32 overflow-hidden rounded-lg border shadow-xl"
                    style={{
                      background: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setSortBy(option.key);
                          setIsSortOpen(false);
                        }}
                        className="flex w-full items-center px-3 py-2 text-sm transition-colors duration-150"
                        style={{
                          color: sortBy === option.key ? 'var(--accent-flow)' : 'var(--text-body)',
                          background: sortBy === option.key ? 'var(--bg-surface)' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (sortBy !== option.key) {
                            e.currentTarget.style.background = 'var(--bg-surface)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (sortBy !== option.key) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {sortBy === option.key && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                    isActive ? 'text-[var(--bg-abyss)]' : ''
                  )}
                  style={{
                    background: isActive ? 'var(--accent-flow)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--bg-abyss)' : 'var(--text-body)',
                    border: isActive ? 'none' : '1px solid var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-active)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {tab.label}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-body)', border: '1px solid var(--border-active)' }}
                >
                  {f.label}
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs transition-colors duration-150 hover:underline"
                style={{ color: 'var(--accent-flow)' }}
              >
                清除全部
              </button>
              <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                共 {filteredTemplates.length} 个模板
              </span>
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== Template Card Grid ====== */}
      <section className="mx-auto max-w-7xl px-4 pb-12 lg:px-6">
        <motion.div
          layout
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}
        >
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template, index) => {
              const ChipIcon = CHIP_TYPE_CONFIG[template.chipType].icon;
              const CoolingIcon = COOLING_ICON_MAP[template.coolingMethod];
              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ y: 30, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 30, opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.08,
                    ease: [0.33, 1, 0.68, 1] as [number, number, number, number],
                    layout: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
                    y: { type: 'spring', stiffness: 400, damping: 25 },
                  }}
                  whileHover={{
                    y: -6,
                  }}
                  onClick={() => setSelectedTemplate(template)}
                  className="group cursor-pointer overflow-hidden rounded-lg border transition-shadow duration-300"
                  style={{
                    background: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                    e.currentTarget.style.boxShadow =
                      '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 16px rgba(78, 205, 196, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Preview Area */}
                  <div className="relative h-[180px] w-full overflow-hidden">
                    <ThermalCanvas
                      patternType={template.patternType}
                      width={360}
                      height={180}
                      seed={template.id.length * 17 + 42}
                      className="h-full w-full object-cover"
                      style={{ width: '100%', height: '100%' }}
                    />
                    {/* Overlay: chip type pill */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: 'rgba(3, 8, 16, 0.75)', backdropFilter: 'blur(4px)', color: CHIP_TYPE_CONFIG[template.chipType].color }}>
                      <ChipIcon className="h-3 w-3" />
                      {CHIP_TYPE_CONFIG[template.chipType].label}
                    </div>
                    {/* Overlay: cooling icon */}
                    <div
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: 'rgba(3, 8, 16, 0.75)', backdropFilter: 'blur(4px)' }}
                    >
                      <CoolingIcon className="h-3.5 w-3.5" style={{ color: 'var(--accent-stable)' }} />
                    </div>
                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: 'rgba(3, 8, 16, 0.4)' }}
                    >
                      <span className="rounded-full px-4 py-1.5 text-sm font-medium" style={{ background: 'rgba(78, 205, 196, 0.9)', color: 'var(--bg-abyss)' }}>
                        点击查看详情
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                    {template.badge && <Badge type={template.badge} />}
                    {template.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-xs"
                        style={{
                          background: 'var(--bg-surface)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h3 className="truncate px-4 pt-2 text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    {template.name}
                  </h3>

                  {/* Description */}
                  <p className="line-clamp-2 px-4 pt-1 text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                    {template.description}
                  </p>

                  {/* Parameters */}
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                        {template.params.chip.power}W
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        功耗
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                        {COOLING_LABEL_MAP[template.coolingMethod]}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        冷却方式
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>
                        {template.maxTemp}°C
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        预估最高温
                      </div>
                    </div>
                  </div>

                  {/* Temperature bar */}
                  <div className="px-4 pb-3">
                    <TemperatureBar min={template.minTemp} max={template.maxTemp} />
                  </div>

                  {/* Difficulty + Actions */}
                  <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
                    <DifficultyIndicator level={template.difficulty} />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-200"
                        style={{
                          borderColor: 'var(--border-active)',
                          color: 'var(--text-body)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-surface)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-body)';
                        }}
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseTemplate(template);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-medium transition-all duration-200"
                        style={{
                          background: 'var(--accent-flow)',
                          color: 'var(--bg-abyss)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Play className="h-3.5 w-3.5" />
                        使用模板
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {filteredTemplates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20"
          >
            <Search className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
            <p className="mt-4 text-lg" style={{ color: 'var(--text-body)' }}>
              未找到匹配的模板
            </p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm transition-colors duration-150 hover:underline"
              style={{ color: 'var(--accent-flow)' }}
            >
              清除筛选条件
            </button>
          </motion.div>
        )}
      </section>

      {/* ====== Custom Template CTA ====== */}
      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex flex-col items-center rounded-xl border border-dashed p-8 text-center sm:p-12"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border-active)',
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: 'rgba(78, 205, 196, 0.1)' }}
          >
            <PlusCircle className="h-6 w-6" style={{ color: 'var(--accent-flow)' }} />
          </div>
          <h3 className="mt-4 text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
            创建自定义模板
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
            在仿真工作台中配置好参数后，可以保存为个人模板，方便下次快速复用。
          </p>
          <button
            onClick={() => navigate('/workspace')}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border px-6 text-sm font-medium transition-all duration-200"
            style={{
              borderColor: 'var(--border-active)',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--accent-flow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-active)';
            }}
          >
            前往工作台
          </button>
        </motion.div>
      </section>

      {/* ====== Template Detail Modal ====== */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[85vh] w-full max-w-[600px] overflow-hidden rounded-xl border"
              style={{
                background: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div>
                  <h2 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
                    {selectedTemplate.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    {selectedTemplate.badge && <Badge type={selectedTemplate.badge} />}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {COOLING_LABEL_MAP[selectedTemplate.coolingMethod]} · {selectedTemplate.params.chip.power}W
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body (scrollable) */}
              <div className="scrollbar-thin overflow-y-auto p-6" style={{ maxHeight: 'calc(85vh - 160px)' }}>
                {/* Large Preview */}
                <div className="relative overflow-hidden rounded-lg">
                  <ThermalCanvas
                    patternType={selectedTemplate.patternType}
                    width={560}
                    height={200}
                    animate={true}
                    seed={selectedTemplate.id.length * 17 + 42}
                    className="w-full"
                    style={{ width: '100%', height: '200px' }}
                  />
                  {/* Color scale */}
                  <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(3, 8, 16, 0.6)' }}>
                    <span className="text-xs font-mono" style={{ color: '#4ECDC4' }}>25°C</span>
                    <div className="h-1 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #4ECDC4, #A8E6CF, #FFD93D, #FF6B6B)' }} />
                    <span className="text-xs font-mono" style={{ color: '#FF6B6B' }}>110°C</span>
                  </div>
                </div>

                {/* Full Description */}
                <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                  {selectedTemplate.detailDescription}
                </p>

                {/* Parameter Groups */}
                <div className="mt-6 space-y-3">
                  {/* Chip Params */}
                  <ParamGroup
                    title="芯片参数"
                    icon={<Cpu className="h-4 w-4" />}
                    isOpen={expandedParamGroup === 'chip'}
                    onToggle={() => handlePreviewParams('chip')}
                    params={[
                      { label: '芯片功耗', value: `${selectedTemplate.params.chip.power} W` },
                      { label: '芯片尺寸', value: `${selectedTemplate.params.chip.width} × ${selectedTemplate.params.chip.height} × ${selectedTemplate.params.chip.thickness} mm` },
                      { label: '芯片材料', value: selectedTemplate.params.chip.material === 'Si' ? '硅 (Si)' : selectedTemplate.params.chip.material },
                      { label: '导热系数', value: '148 W/(m·K)' },
                      { label: '热源分布', value: '均匀分布' },
                    ]}
                  />
                  {/* Cooling Params */}
                  <ParamGroup
                    title="冷却参数"
                    icon={<Droplets className="h-4 w-4" />}
                    isOpen={expandedParamGroup === 'cooling'}
                    onToggle={() => handlePreviewParams('cooling')}
                    params={[
                      { label: '冷却方式', value: COOLING_LABEL_MAP[selectedTemplate.coolingMethod] },
                      ...(selectedTemplate.params.heatSink.enabled
                        ? [
                            { label: '散热器材料', value: selectedTemplate.params.heatSink.material === 'Al' ? '铝 (Al)' : selectedTemplate.params.heatSink.material === 'Cu' ? '铜 (Cu)' : selectedTemplate.params.heatSink.material },
                            ...(selectedTemplate.params.heatSink.baseThickness
                              ? [{ label: '散热器高度', value: `${selectedTemplate.params.heatSink.baseThickness} mm` }]
                              : []),
                            ...(selectedTemplate.params.heatSink.finCount
                              ? [{ label: '鳍片数量', value: `${selectedTemplate.params.heatSink.finCount} 片` }]
                              : []),
                          ]
                        : []),
                      { label: '环境温度', value: `${selectedTemplate.params.cooling.ambientTemperature} °C` },
                      ...(selectedTemplate.params.cooling.flowRate
                        ? [{ label: '流体流速', value: `${selectedTemplate.params.cooling.flowRate} m/s` }]
                        : []),
                    ]}
                  />
                  {/* Simulation Params */}
                  <ParamGroup
                    title="仿真参数"
                    icon={<Layers className="h-4 w-4" />}
                    isOpen={expandedParamGroup === 'sim'}
                    onToggle={() => handlePreviewParams('sim')}
                    params={[
                      { label: '粒子分辨率', value: `${selectedTemplate.params.sph.resolution} (${formatParticleCount(selectedTemplate.params.sph.particleCount)})` },
                      { label: '仿真时长', value: `${selectedTemplate.params.sph.totalTime} s` },
                      { label: '时间步长', value: `${selectedTemplate.params.sph.timeStep} s` },
                      { label: '平滑长度', value: `${selectedTemplate.params.sph.smoothingLength} m` },
                    ]}
                  />
                </div>

                {/* Key Metrics */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <MetricCard label="预估最高温" value={`${selectedTemplate.maxTemp}°C`} color="#FF6B6B" />
                  <MetricCard label="预估最低温" value={`${selectedTemplate.minTemp}°C`} color="#4ECDC4" />
                  <MetricCard label="仿真难度" value={DIFFICULTY_LABELS[selectedTemplate.difficulty]} color="#FFD93D" />
                </div>

                {/* Similar Templates */}
                {similarTemplatesList.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      相似模板
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {similarTemplatesList.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTemplate(t);
                            setExpandedParamGroup('chip');
                          }}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-body)',
                            background: 'var(--bg-surface)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-flow)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.color = 'var(--text-body)';
                          }}
                        >
                          {(() => {
                            const SIcon = CHIP_TYPE_CONFIG[t.chipType].icon;
                            return <SIcon className="h-3.5 w-3.5" style={{ color: CHIP_TYPE_CONFIG[t.chipType].color }} />;
                          })()}
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 border-t px-6 py-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: 'var(--accent-flow)',
                    color: 'var(--bg-abyss)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Play className="h-4 w-4" />
                  使用此模板启动仿真
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-medium transition-all duration-200"
                  style={{
                    borderColor: 'var(--border-active)',
                    color: 'var(--text-body)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-body)';
                  }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Param Group (collapsible)
// ============================================================
function ParamGroup({
  title,
  icon,
  isOpen,
  onToggle,
  params,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  params: { label: string; value: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors duration-150"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent-flow)' }}>{icon}</span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {params.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {p.label}
                  </span>
                  <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Metric Card
// ============================================================
function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center rounded-lg border p-3 text-center"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
    >
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="mt-1 text-lg font-semibold font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function formatParticleCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0)}万`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}万`;
  return n.toLocaleString();
}
