import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { Suspense, lazy } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  Download, RotateCcw, ChevronLeft, Play, Pause, SkipForward,
  SkipBack, Thermometer, Gauge, Zap, Clock, Maximize2,
  Layers, Eye, Crosshair, AlertTriangle, CheckCircle2,
  FileText, BarChart3, Activity, Box,
} from 'lucide-react';
import {
  getTaskMeta,
  getAnalysisStats,
  generateTimeSeries,
  generateTempDistribution,
  getThermalResistanceData,
  generateTemperatureField,
  generateParticles3D,
  getHotSpots,
  getSimulationParameters,
  getMaterialProperties,
  getBenchmarkData,
  getTempColor,
} from '@/lib/mockAnalysisData';

/* ============================================================
   3D Scene — Lazy-loaded to avoid bundling Three.js upfront
   ============================================================ */
const ParticleScene3D = lazy(() => import('@/components/ParticleScene3D'));

/* ============================================================
   Animated Counter — uses useMotionValue + useSpring
   ============================================================ */
function AnimatedCounter({
  value,
  decimals = 1,
  suffix = '',
  color = 'var(--text-primary)',
  duration = 1.5,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  color?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { stiffness: 50, damping: 20 });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsub = springVal.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = `${v.toFixed(decimals)}${suffix}`;
      }
    });
    return unsub;
  }, [springVal, decimals, suffix]);

  return (
    <span
      ref={ref}
      className="font-display text-[28px] font-semibold tracking-tight"
      style={{ color, fontVariantNumeric: 'tabular-nums' }}
    >
      0{suffix}
    </span>
  );
}

/* ============================================================
   Card Container — with hover lift
   ============================================================ */
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={`rounded-lg border p-5 transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={{
        background: 'var(--bg-base)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
      whileHover={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(78,205,196,0.06)',
        borderColor: 'var(--border-active)',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   Custom Recharts Tooltip
   ============================================================ */
function CustomChartTooltip({
  active, payload, label, unit = '°C',
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-active)',
      }}
    >
      <p className="mb-1 font-medium" style={{ color: 'var(--text-primary)' }}>
        t = {label}s
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color }}
          />
          <span style={{ color: 'var(--text-body)' }}>{entry.name}:</span>
          <span className="font-display font-semibold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Temperature Cloud Map — Canvas 2D
   ============================================================ */
function TemperatureCloudMap({ size = 50 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredTemp, setHoveredTemp] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const fieldRef = useRef<number[][]>(generateTemperatureField(size));
  const [layer, setLayer] = useState<'surface' | 'cross' | 'full'>('surface');

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const field = fieldRef.current;
    const cellW = displayW / size;
    const cellH = displayH / size;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const temp = field[y][x];
        ctx.fillStyle = getTempColor(temp);
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Chip outline
    const margin = size * 0.1;
    ctx.strokeStyle = 'rgba(230, 237, 245, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(margin * cellW, margin * cellH, (size - 2 * margin) * cellW, (size - 2 * margin) * cellH);
    ctx.setLineDash([]);

    // Hotspots
    const hotspots = [
      { x: size * 0.5, y: size * 0.42, label: 'Tmax' },
      { x: size * 0.35, y: size * 0.35, label: 'H1' },
      { x: size * 0.65, y: size * 0.55, label: 'H2' },
    ];
    hotspots.forEach((h) => {
      const px = h.x * cellW;
      const py = h.y * cellH;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 107, 107, 0.8)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px "Space Grotesk", sans-serif';
      ctx.fillText(h.label, px + 8, py - 6);
    });

    // Cross-section line
    if (layer === 'cross') {
      const crossY = size * 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, crossY * cellH);
      ctx.lineTo(displayW, crossY * cellH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [size, layer]);

  useEffect(() => {
    draw();
    const timer = setTimeout(draw, 100);
    return () => clearTimeout(timer);
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const field = fieldRef.current;
      const cellW = rect.width / size;
      const cellH = rect.height / size;
      const col = Math.floor(x / cellW);
      const row = Math.floor(y / cellH);
      if (row >= 0 && row < size && col >= 0 && col < size) {
        setHoveredTemp(field[row][col]);
        setHoverPos({ x: e.clientX + 12, y: e.clientY - 30 });
      }
    },
    [size],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredTemp(null);
    setHoverPos(null);
  }, []);

  return (
    <div className="space-y-3">
      {/* Layer toggle */}
      <div className="flex items-center gap-2">
        {([
          { key: 'surface', label: '芯片表面', icon: Layers },
          { key: 'cross', label: '截面', icon: Crosshair },
          { key: 'full', label: '全视场', icon: Eye },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setLayer(key)}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200"
            style={{
              background: layer === key ? 'var(--bg-raised)' : 'transparent',
              color: layer === key ? 'var(--accent-flow)' : 'var(--text-muted)',
              border: `1px solid ${layer === key ? 'var(--border-active)' : 'var(--border-subtle)'}`,
            }}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full rounded-md cursor-crosshair"
          style={{ height: 320, imageRendering: 'auto' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {hoveredTemp !== null && hoverPos && (
          <div
            className="pointer-events-none fixed z-50 rounded-md px-2 py-1 text-xs"
            style={{
              left: hoverPos.x,
              top: hoverPos.y,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-active)',
              color: getTempColor(hoveredTemp),
            }}
          >
            {hoveredTemp.toFixed(1)}°C
          </div>
        )}
      </div>

      {/* Gradient legend */}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>25°C</span>
        <div
          className="h-3 flex-1 rounded-sm"
          style={{
            background: `linear-gradient(to right, ${getTempColor(25)}, ${getTempColor(45)}, ${getTempColor(65)}, ${getTempColor(85)}, ${getTempColor(95)})`,
          }}
        />
        <span>95°C</span>
      </div>
    </div>
  );
}

/* ============================================================
   3D Viewer Wrapper (Suspense boundary for lazy R3F component)
   ============================================================ */
function Viewer3D({
  time,
  isPlaying,
  onTogglePlay,
  onStep,
}: {
  time: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: (delta: number) => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border"
      style={{
        background: 'var(--bg-abyss)',
        borderColor: 'var(--border-subtle)',
        height: '100%',
        minHeight: 420,
      }}
    >
      <Suspense
        fallback={
          <div className="flex h-full min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--accent-flow)', borderTopColor: 'transparent' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                加载 3D 场景...
              </span>
            </div>
          </div>
        }
      >
        <ParticleScene3D time={time} />
      </Suspense>

      {/* Playback controls overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2"
        style={{
          background: 'rgba(10, 28, 48, 0.85)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => onStep(-1)}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors"
          style={{ color: 'var(--text-body)' }}
          title="后退一帧"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onTogglePlay}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors"
          style={{
            background: 'var(--accent-flow)',
            color: '#030810',
          }}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => onStep(1)}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors"
          style={{ color: 'var(--text-body)' }}
          title="前进一帧"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
          t = {time.toFixed(1)}s / 60s
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Export Report Modal
   ============================================================ */
function ExportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'png'>('pdf');
  const [options, setOptions] = useState({
    tempCurve: true,
    tempHistogram: true,
    thermalResistance: true,
    cloudMap: true,
    screenshot3d: true,
    paramSummary: true,
  });

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-[480px] rounded-xl border p-6"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-h3 font-display" style={{ color: 'var(--text-primary)' }}>
              导出仿真报告
            </h3>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>

          {/* Format */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-body)' }}>
              导出格式
            </label>
            <div className="flex gap-2">
              {([
                { key: 'pdf', label: 'PDF 报告' },
                { key: 'csv', label: 'CSV 数据' },
                { key: 'png', label: 'PNG 图表' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className="flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all duration-200"
                  style={{
                    background: format === key ? 'var(--bg-raised)' : 'transparent',
                    color: format === key ? 'var(--accent-flow)' : 'var(--text-muted)',
                    border: `1px solid ${format === key ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="mb-6 space-y-2">
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-body)' }}>
              包含内容
            </label>
            {([
              { key: 'tempCurve', label: '温度-时间曲线' },
              { key: 'tempHistogram', label: '温度分布直方图' },
              { key: 'thermalResistance', label: '热阻分析' },
              { key: 'cloudMap', label: '截面温度云图' },
              { key: 'screenshot3d', label: '3D 粒子截图' },
              { key: 'paramSummary', label: '仿真参数摘要' },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key as keyof typeof options]}
                  onChange={() => toggleOption(key as keyof typeof options)}
                  className="h-3.5 w-3.5 rounded border accent-[var(--accent-flow)]"
                  style={{ accentColor: 'var(--accent-flow)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-body)' }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-body)',
              }}
            >
              取消
            </button>
            <button
              className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: 'var(--accent-flow)',
                color: '#030810',
              }}
              onClick={onClose}
            >
              导出
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   Main Analysis Page
   ============================================================ */
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const task = useMemo(() => getTaskMeta(), []);
  const stats = useMemo(() => getAnalysisStats(), []);
  const timeSeries = useMemo(() => generateTimeSeries(), []);
  const tempDist = useMemo(() => generateTempDistribution(), []);
  const thermalRes = useMemo(() => getThermalResistanceData(), []);
  const simParams = useMemo(() => getSimulationParameters(), []);
  const matProps = useMemo(() => getMaterialProperties(), []);
  const benchmarks = useMemo(() => getBenchmarkData(), []);
  const hotSpots = useMemo(() => getHotSpots(), []);
  const particles3D = useMemo(() => generateParticles3D(4000), []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [time3d, setTime3d] = useState(0);
  const [showExport, setShowExport] = useState(false);
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [timeRange, setTimeRange] = useState<'all' | 'first5' | 'last5'>('all');

  // 3D playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTime3d((prev) => {
        if (prev >= 60) return 0;
        return prev + 0.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const filteredTimeSeries = useMemo(() => {
    if (timeRange === 'first5') return timeSeries.filter((d) => d.time <= 5);
    if (timeRange === 'last5') return timeSeries.filter((d) => d.time >= 55);
    return timeSeries;
  }, [timeSeries, timeRange]);

  const totalRth = useMemo(
    () => thermalRes.reduce((sum, r) => sum + r.value, 0),
    [thermalRes],
  );

  const statusConfig = {
    completed: { color: '#4ECDC4', bg: 'rgba(78, 205, 196, 0.12)', label: '已完成' },
    failed: { color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.12)', label: '失败' },
    running: { color: '#FFD93D', bg: 'rgba(255, 217, 61, 0.12)', label: '运行中' },
  };
  const status = statusConfig[task.status];

  return (
    <div className="min-h-[100dvh] pt-14">
      {/* ─── Section 1: Page Header ─── */}
      <section
        className="border-b"
        style={{
          background: 'var(--bg-deep)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mx-auto max-w-[1440px] px-6 pt-8 pb-6">
          {/* Breadcrumb */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5 }}
            className="mb-3 flex items-center gap-2 text-sm"
          >
            <Link
              to="/tasks"
              className="transition-colors hover:underline"
              style={{ color: 'var(--accent-flow)' }}
            >
              任务管理
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-body)' }}>
              任务 #{id}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--text-body)' }}>结果分析</span>
          </motion.div>

          {/* Title Row */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <h1
                className="font-display text-h2 mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {task.name}
              </h1>
              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                {task.createdAt} · {task.chipPower}W · {task.coolingMethod}
              </p>
              <p className="text-sm max-w-2xl leading-relaxed" style={{ color: 'var(--text-body)' }}>
                {task.description}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: status.color }}
                />
                <span style={{ color: status.color }}>{status.label}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowExport(true)}
                className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Download className="h-3.5 w-3.5" />
                导出报告
              </button>
              <Link
                to="/workspace"
                className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                重新运行
              </Link>
              <button
                onClick={() => navigate('/tasks')}
                className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                返回任务
              </button>
            </div>
          </motion.div>

          {/* ─── KPI Cards Row ─── */}
          <motion.div
            className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {[
              {
                label: '最高温度',
                value: stats.maxTemp,
                suffix: '°C',
                icon: Thermometer,
                color: stats.maxTemp >= 100 ? '#FF6B6B' : stats.maxTemp >= 80 ? '#FFD93D' : '#A8E6CF',
                sub: '安全阈值 85°C',
              },
              {
                label: '平均温度',
                value: stats.avgTemp,
                suffix: '°C',
                icon: Activity,
                color: 'var(--text-primary)',
                sub: '芯片表面均值',
              },
              {
                label: '热阻 Rth',
                value: stats.thermalResistance,
                suffix: ' K/W',
                icon: Gauge,
                color: 'var(--text-primary)',
                sub: '总计热阻',
              },
              {
                label: '温升 ΔT',
                value: stats.tempRise,
                suffix: '°C',
                icon: Zap,
                color: 'var(--text-primary)',
                sub: '高于环境温度',
              },
              {
                label: '计算时间',
                valueStr: task.duration,
                icon: Clock,
                color: 'var(--text-muted)',
                sub: '仿真耗时',
              },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  visible: {
                    opacity: 1, y: 0, scale: 1,
                    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
                  },
                }}
                className="rounded-lg border p-4"
                style={{
                  background: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <card.icon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {card.label}
                  </span>
                </div>
                {'valueStr' in card ? (
                  <span
                    className="font-display text-[28px] font-semibold tracking-tight"
                    style={{ color: card.color as string }}
                  >
                    {card.valueStr}
                  </span>
                ) : (
                  <AnimatedCounter
                    value={card.value as number}
                    suffix={card.suffix}
                    color={card.color as string}
                  />
                )}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {card.sub}
                </p>
                {/* Mini gradient bar */}
                <div
                  className="mt-3 h-1 w-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, var(--accent-stable), var(--accent-flow), var(--accent-particle), var(--accent-energy), var(--accent-thermal))`,
                    opacity: 0.6,
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 2: Main Content (2-column) ─── */}
      <section className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ─── Left Column: Charts (60%) ─── */}
          <div className="flex-1 space-y-6 lg:max-w-[60%]">

            {/* ─── Temperature Trend Chart ─── */}
            <Card>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-h3" style={{ color: 'var(--text-primary)' }}>
                    温度变化曲线
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    芯片及散热器温度随时间变化
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {([
                    { key: 'all', label: '全部' },
                    { key: 'first5', label: '前5s' },
                    { key: 'last5', label: '后5s' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setTimeRange(key)}
                      className="rounded px-2 py-1 text-xs font-medium transition-all"
                      style={{
                        background: timeRange === key ? 'var(--bg-raised)' : 'transparent',
                        color: timeRange === key ? 'var(--accent-flow)' : 'var(--text-muted)',
                        border: `1px solid ${timeRange === key ? 'var(--border-active)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="mx-1 h-4 w-px" style={{ background: 'var(--border-subtle)' }} />
                  {([
                    { key: 'area' as const, icon: BarChart3 },
                    { key: 'line' as const, icon: Activity },
                  ]).map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setChartType(key)}
                      className="flex h-6 w-6 items-center justify-center rounded transition-all"
                      style={{
                        background: chartType === key ? 'var(--bg-raised)' : 'transparent',
                        color: chartType === key ? 'var(--accent-flow)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'area' ? (
                  <AreaChart data={filteredTimeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#45B7D1" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#45B7D1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(78,205,196,0.08)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Space Grotesk' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border-subtle)' }}
                      label={{ value: '时间 (s)', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 120]}
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Space Grotesk' }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: '温度 (°C)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }}
                    />
                    <ReferenceLine
                      y={85}
                      stroke="#FF6B6B"
                      strokeDasharray="6 3"
                      strokeOpacity={0.5}
                      label={{ value: 'TJ,max', position: 'right', fill: '#FF6B6B', fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="maxTemp"
                      name="芯片最高温度"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      fill="url(#gradMax)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgTemp"
                      name="芯片平均温度"
                      stroke="#45B7D1"
                      strokeWidth={2}
                      fill="url(#gradAvg)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="heatsinkTemp"
                      name="散热器表面温度"
                      stroke="#4ECDC4"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      fill="none"
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="outletTemp"
                      name="流体出口温度"
                      stroke="#A8E6CF"
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      fill="none"
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 0 }}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={filteredTimeSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(78,205,196,0.08)" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Space Grotesk' }}
                      tickLine={false}
                      axisLine={{ stroke: 'var(--border-subtle)' }}
                      label={{ value: '时间 (s)', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <YAxis
                      domain={[0, 120]}
                      tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Space Grotesk' }}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: '温度 (°C)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                    <ReferenceLine
                      y={85}
                      stroke="#FF6B6B"
                      strokeDasharray="6 3"
                      strokeOpacity={0.5}
                      label={{ value: 'TJ,max', position: 'right', fill: '#FF6B6B', fontSize: 11 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="maxTemp"
                      name="芯片最高温度"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgTemp"
                      name="芯片平均温度"
                      stroke="#45B7D1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="heatsinkTemp"
                      name="散热器表面温度"
                      stroke="#4ECDC4"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 0 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="outletTemp"
                      name="流体出口温度"
                      stroke="#A8E6CF"
                      strokeWidth={2}
                      strokeDasharray="2 2"
                      dot={false}
                      activeDot={{ r: 3, strokeWidth: 0 }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </Card>

            {/* ─── Temperature Distribution Histogram ─── */}
            <Card>
              <div className="mb-4">
                <h3 className="font-display text-h3" style={{ color: 'var(--text-primary)' }}>
                  温度分布直方图
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  芯片表面粒子温度频率分布
                </p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={tempDist} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(78,205,196,0.08)" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Space Grotesk' }}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border-subtle)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'Space Grotesk' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as typeof tempDist[0];
                      const total = tempDist.reduce((s, b) => s + b.count, 0);
                      const pct = ((data.count / total) * 100).toFixed(1);
                      return (
                        <div
                          className="rounded-md border px-3 py-2 text-xs"
                          style={{
                            background: 'var(--bg-surface)',
                            borderColor: 'var(--border-active)',
                          }}
                        >
                          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {data.range}
                          </p>
                          <p style={{ color: 'var(--text-body)' }}>
                            粒子数: {data.count} ({pct}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" name="粒子数" radius={[4, 4, 0, 0]}>
                    {tempDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Stats overlay */}
              <div className="mt-3 flex items-center gap-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>
                  均值: <strong className="font-display" style={{ color: 'var(--text-primary)' }}>65.2°C</strong>
                </span>
                <span>
                  中位数: <strong className="font-display" style={{ color: 'var(--text-primary)' }}>63.8°C</strong>
                </span>
                <span>
                  标准差: <strong className="font-display" style={{ color: 'var(--text-primary)' }}>8.4°C</strong>
                </span>
                <span>
                  总粒子: <strong className="font-display" style={{ color: 'var(--text-primary)' }}>1,800</strong>
                </span>
              </div>
            </Card>

            {/* ─── Thermal Resistance Breakdown ─── */}
            <Card>
              <h3 className="font-display text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
                热阻分析
              </h3>
              <div className="flex flex-col gap-6 sm:flex-row">
                {/* Horizontal bar chart */}
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      data={thermalRes}
                      layout="vertical"
                      margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
                      barCategoryGap="20%"
                    >
                      <XAxis
                        type="number"
                        domain={[0, 0.5]}
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-subtle)' }}
                        tickFormatter={(v: number) => `${v.toFixed(2)}`}
                      />
                      <YAxis
                        type="category"
                        dataKey="nameZh"
                        tick={{ fill: 'var(--text-body)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={90}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as typeof thermalRes[0];
                          return (
                            <div
                              className="rounded-md border px-3 py-2 text-xs"
                              style={{
                                background: 'var(--bg-surface)',
                                borderColor: 'var(--border-active)',
                              }}
                            >
                              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                {d.nameZh} ({d.name})
                              </p>
                              <p style={{ color: 'var(--text-body)' }}>
                                当前: <span style={{ color: d.color }}>{d.value.toFixed(2)} K/W</span>
                              </p>
                              <p style={{ color: 'var(--text-muted)' }}>
                                典型值: {d.benchmark.toFixed(2)} K/W
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {thermalRes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <p
                    className="mt-2 text-right font-display text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {thermalRes.map((r) => r.value.toFixed(2)).join(' + ')} ={' '}
                    <span style={{ color: 'var(--accent-flow)' }}>{totalRth.toFixed(2)} K/W</span>
                  </p>
                </div>

                {/* Benchmark table */}
                <div className="sm:w-[220px]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th className="pb-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                          冷却方式
                        </th>
                        <th className="pb-2 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                          典型热阻
                        </th>
                        <th className="pb-2 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                          当前
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarks.map((b) => (
                        <tr
                          key={b.method}
                          className="transition-colors"
                          style={{
                            background: b.current ? 'var(--bg-surface)' : 'transparent',
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                        >
                          <td className="py-2" style={{ color: 'var(--text-body)' }}>
                            {b.method}
                          </td>
                          <td className="py-2 text-right" style={{ color: 'var(--text-muted)' }}>
                            {b.range}
                          </td>
                          <td
                            className="py-2 text-right font-display font-semibold"
                            style={{
                              color: b.pass ? 'var(--accent-particle)' : 'var(--text-muted)',
                            }}
                          >
                            {b.current ? `${totalRth.toFixed(2)} ✓` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* ─── Cross-section Temperature Cloud Map ─── */}
            <Card>
              <div className="mb-4">
                <h3 className="font-display text-h3" style={{ color: 'var(--text-primary)' }}>
                  截面温度分布
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  芯片表面二维温度云图，点击可查看精确温度
                </p>
              </div>
              <TemperatureCloudMap size={50} />
            </Card>

            {/* ─── Parameter Summary ─── */}
            <Card>
              <h3 className="font-display text-h3 mb-4" style={{ color: 'var(--text-primary)' }}>
                仿真参数摘要
              </h3>
              <div className="space-y-5">
                {simParams.map((group) => (
                  <div key={group.category}>
                    <h4
                      className="mb-2 text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--accent-flow)' }}
                    >
                      {group.category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {group.params.map((p) => (
                        <div
                          key={p.name}
                          className="rounded-md px-3 py-2"
                          style={{ background: 'var(--bg-surface)' }}
                        >
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {p.name}
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{
                              color: p.warning ? 'var(--accent-thermal)' : 'var(--text-primary)',
                            }}
                          >
                            {p.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Material properties table */}
              <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <h4
                  className="mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--accent-flow)' }}
                >
                  材料属性 (硅)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <th className="pb-2 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                          属性
                        </th>
                        <th className="pb-2 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                          值
                        </th>
                        <th className="pb-2 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                          推荐值
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {matProps.map((m) => (
                        <tr
                          key={m.name}
                          style={{ borderBottom: '1px solid var(--border-subtle)' }}
                        >
                          <td className="py-2" style={{ color: 'var(--text-body)' }}>
                            {m.name}
                          </td>
                          <td className="py-2 text-right font-display" style={{ color: 'var(--text-primary)' }}>
                            {m.value < 1
                              ? m.value.toExponential(1)
                              : m.value.toLocaleString()}{' '}
                            {m.unit}
                          </td>
                          <td
                            className="py-2 text-right font-display"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {m.recommended < 1
                              ? m.recommended.toExponential(1)
                              : m.recommended.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warnings */}
              {stats.maxTemp > stats.safeThreshold && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-md p-3"
                  style={{
                    background: 'rgba(255, 107, 107, 0.08)',
                    border: '1px solid var(--border-thermal)',
                  }}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent-thermal)' }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-thermal)' }}>
                      温度超过安全阈值
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-body)' }}>
                      最高温度 {stats.maxTemp.toFixed(1)}°C 超过了建议的安全阈值 {stats.safeThreshold}°C。
                      建议改善散热条件（增加气流、使用更大散热器或改用液冷方案）。
                    </p>
                  </div>
                </div>
              )}
              {stats.maxTemp <= stats.safeThreshold && (
                <div
                  className="mt-4 flex items-start gap-2 rounded-md p-3"
                  style={{
                    background: 'rgba(168, 230, 207, 0.08)',
                    border: '1px solid rgba(168, 230, 207, 0.2)',
                  }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent-particle)' }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--accent-particle)' }}>
                      温度在安全范围内
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-body)' }}>
                      最高温度 {stats.maxTemp.toFixed(1)}°C 低于安全阈值 {stats.safeThreshold}°C，散热方案满足要求。
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ─── Right Column: 3D Viewer (40%) ─── */}
          <div className="lg:w-[40%] lg:min-w-[420px]">
            <div className="lg:sticky lg:top-[72px]">
              {/* 3D Playback */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-h3" style={{ color: 'var(--text-primary)' }}>
                    3D 粒子回放
                  </h3>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    Frame: {Math.floor((time3d / 60) * 600)} / 600
                  </span>
                </div>

                {/* 3D Canvas fallback (simplified when R3F not available) */}
                <div
                  className="relative overflow-hidden rounded-lg border"
                  style={{
                    background: 'var(--bg-abyss)',
                    borderColor: 'var(--border-subtle)',
                    height: 480,
                  }}
                >
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                            style={{ borderColor: 'var(--accent-flow)', borderTopColor: 'transparent' }}
                          />
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            加载 3D 场景...
                          </span>
                        </div>
                      </div>
                    }
                  >
                    <ParticleScene3D time={time3d} />
                  </Suspense>

                  {/* Playback controls */}
                  <div
                    className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2.5"
                    style={{
                      background: 'rgba(10, 28, 48, 0.9)',
                      backdropFilter: 'blur(8px)',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <button
                      onClick={() => setTime3d((t) => Math.max(0, t - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/5"
                      style={{ color: 'var(--text-body)' }}
                      title="后退"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      className="flex h-7 w-7 items-center justify-center rounded transition-colors"
                      style={{ background: 'var(--accent-flow)', color: '#030810' }}
                      title={isPlaying ? '暂停' : '播放'}
                    >
                      {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setTime3d((t) => Math.min(60, t + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/5"
                      style={{ color: 'var(--text-body)' }}
                      title="前进"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </button>

                    {/* Time slider */}
                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={0.5}
                      value={time3d}
                      onChange={(e) => setTime3d(parseFloat(e.target.value))}
                      className="mx-2 flex-1 accent-[var(--accent-flow)]"
                      style={{ accentColor: 'var(--accent-flow)' }}
                    />
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {time3d.toFixed(1)}s
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Hotspot summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-4 rounded-lg border p-4"
                style={{
                  background: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  温度极值点
                </h4>
                <div className="space-y-2">
                  {hotSpots.map((spot) => (
                    <div
                      key={spot.label}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{ background: 'var(--bg-surface)' }}
                    >
                      <div className="flex items-center gap-2">
                        <Thermometer
                          className="h-3.5 w-3.5"
                          style={{ color: spot.temperature > 75 ? 'var(--accent-thermal)' : 'var(--accent-stable)' }}
                        />
                        <span className="text-xs" style={{ color: 'var(--text-body)' }}>
                          {spot.label}
                        </span>
                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          ({spot.x.toFixed(1)}, {spot.y.toFixed(1)}, {spot.z.toFixed(1)})
                        </span>
                      </div>
                      <span
                        className="font-display text-sm font-semibold"
                        style={{ color: getTempColor(spot.temperature) }}
                      >
                        {spot.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Temperature Scale Legend ─── */}
      <section
        className="border-t"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--bg-deep)',
        }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Gradient bar */}
            <div className="flex flex-1 items-center gap-3">
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                25°C
              </span>
              <div
                className="h-5 flex-1 rounded-md"
                style={{
                  background:
                    'linear-gradient(to right, #1E5F8A, #45B7D1, #4ECDC4, #A8E6CF, #FFD93D, #FF9F43, #FF6B6B)',
                }}
              />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                125°C
              </span>
            </div>
            {/* Legend items */}
            <div className="flex flex-wrap items-center gap-4">
              {([
                { color: '#FF6B6B', label: '芯片最高温' },
                { color: '#45B7D1', label: '芯片平均温' },
                { color: '#4ECDC4', label: '散热器表面' },
                { color: '#A8E6CF', label: '流体出口' },
              ]).map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: item.color }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Export Modal ─── */}
      <AnimatePresence>
        {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      </AnimatePresence>
    </div>
  );
}
