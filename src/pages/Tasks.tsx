import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Play,
  Trash2,
  Eye,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertTriangle,
  X,
  Inbox,
  FileDown,
  BarChart3,
  Fan,
  Droplets,
  Zap,
  Layers,
} from 'lucide-react';
import type { SimulationTask } from '@/types';
import {
  mockTasks,
  getSceneLabel,
  STATUS_LABELS,
  COOLING_LABELS,
  MATERIAL_LABELS,
  formatDate,
  getSceneKey,
} from '@/data/mockTasks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// ── Variants ───────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

const drawerVariants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ── Scene badge colors ─────────────────────────────────────

const SCENE_COLORS: Record<string, { bg: string; text: string }> = {
  'cpu_air': { bg: 'rgba(69, 183, 209, 0.15)', text: '#45B7D1' },
  'cpu_water': { bg: 'rgba(78, 205, 196, 0.15)', text: '#4ECDC4' },
  'gpu_water': { bg: 'rgba(168, 230, 207, 0.15)', text: '#A8E6CF' },
  'power_air': { bg: 'rgba(255, 217, 61, 0.15)', text: '#FFD93D' },
  'immersion': { bg: 'rgba(255, 107, 107, 0.15)', text: '#FF6B6B' },
  'jet': { bg: 'rgba(78, 205, 196, 0.2)', text: '#4ECDC4' },
};

const COMPARE_COLORS = ['#4ECDC4', '#FF6B6B', '#FFD93D'];

// ── Status pulse animation component ───────────────────────

function StatusIndicator({ status }: { status: string }) {
  const config = STATUS_LABELS[status] ?? STATUS_LABELS['idle'];
  const isRunning = status === 'running';

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span
          className="inline-flex h-2 w-2 rounded-full"
          style={{ background: config.color }}
        />
        {isRunning && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: config.color }}
          />
        )}
      </span>
      <span className="text-xs font-medium" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const isRunning = status === 'running';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: 'var(--bg-surface)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: isRunning
              ? 'linear-gradient(90deg, var(--accent-flow), var(--accent-particle))'
              : 'var(--accent-stable)',
          }}
        />
      </div>
      <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
        {progress}%
      </span>
    </div>
  );
}

// ── Copy button ────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded p-0.5 opacity-0 transition-all duration-200 hover:opacity-100 group-hover:opacity-100"
      style={{ color: 'var(--text-muted)' }}
      title="复制"
    >
      {copied ? (
        <Check className="h-3 w-3" style={{ color: 'var(--accent-particle)' }} />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

// ── Temp color ─────────────────────────────────────────────

function TempDisplay({ temp }: { temp: number }) {
  let color = 'var(--accent-particle)';
  if (temp >= 100) color = 'var(--accent-thermal)';
  else if (temp >= 80) color = 'var(--accent-energy)';

  return (
    <span className="font-mono text-sm tabular-nums font-semibold" style={{ color }}>
      {temp.toFixed(1)}°C
    </span>
  );
}

// ── Cooling icon ───────────────────────────────────────────

function CoolingIcon({ method }: { method: string }) {
  const props = { className: 'h-3.5 w-3.5', style: { color: 'var(--text-muted)' } };
  switch (method) {
    case 'air': return <Fan {...props} />;
    case 'water': return <Droplets {...props} />;
    case 'phase_change': return <Layers {...props} />;
    case 'immersion': return <Layers {...props} />;
    case 'liquid_metal': return <Zap {...props} />;
    default: return <Fan {...props} />;
  }
}

// ── Main Tasks Page ────────────────────────────────────────

export default function Tasks() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [tasks, setTasks] = useState<SimulationTask[]>(mockTasks);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sceneFilter, setSceneFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<SimulationTask | null>(null);
  const [isBatchDelete, setIsBatchDelete] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Filtering & Sorting ────────────────────────────────

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }

    // Scene filter
    if (sceneFilter !== 'all') {
      list = list.filter((t) => {
        const key = getSceneKey(t);
        return key === sceneFilter;
      });
    }

    // Sort
    list.sort((a, b) => {
      let av: string | number;
      let bv: string | number;

      switch (sort.key) {
        case 'name':
          av = a.name;
          bv = b.name;
          break;
        case 'scene':
          av = getSceneLabel(a);
          bv = getSceneLabel(b);
          break;
        case 'power':
          av = a.params.chip.power;
          bv = b.params.chip.power;
          break;
        case 'cooling':
          av = a.params.cooling.method;
          bv = b.params.cooling.method;
          break;
        case 'maxTemp':
          av = a.results?.maxTemperature ?? 0;
          bv = b.results?.maxTemperature ?? 0;
          break;
        case 'status':
          av = a.status;
          bv = b.status;
          break;
        case 'createdAt':
        default:
          av = a.createdAt;
          bv = b.createdAt;
          break;
      }

      if (typeof av === 'string') {
        return sort.direction === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sort.direction === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return list;
  }, [tasks, search, statusFilter, sceneFilter, sort]);

  // ── Pagination ─────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sceneFilter, pageSize]);

  // ── Stats ──────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tasks.length;
    const running = tasks.filter((t) => t.status === 'running').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    return { total, running, completed, failed };
  }, [tasks]);

  // ── Selection ──────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const pageIds = new Set(currentTasks.map((t) => t.id));
    const allSelected = [...pageIds].every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [currentTasks, selectedIds]);

  const allPageSelected = currentTasks.length > 0 && currentTasks.every((t) => selectedIds.has(t.id));

  // ── Delete ─────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    if (!deleteTarget && !isBatchDelete) return;

    if (isBatchDelete) {
      setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      const count = selectedIds.size;
      setSelectedIds(new Set());
      toast.success(`已删除 ${count} 个任务`);
    } else if (deleteTarget) {
      setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      toast.success(`任务「${deleteTarget.name}」已删除`);
    }
    setDeleteTarget(null);
    setIsBatchDelete(false);
  }, [deleteTarget, isBatchDelete, selectedIds]);

  const openDelete = useCallback((task: SimulationTask) => {
    setDeleteTarget(task);
    setIsBatchDelete(false);
  }, []);

  const openBatchDelete = useCallback(() => {
    setDeleteTarget(null);
    setIsBatchDelete(true);
  }, []);

  // ── Compare ────────────────────────────────────────────

  const compareTasks = useMemo(() => {
    return tasks.filter((t) => selectedIds.has(t.id) && t.status === 'completed');
  }, [tasks, selectedIds]);

  const canCompare = compareTasks.length >= 2 && compareTasks.length <= 3;

  const openCompare = useCallback(() => {
    if (canCompare) setCompareOpen(true);
  }, [canCompare]);

  // ── Rerun ──────────────────────────────────────────────

  const handleRerun = useCallback((task: SimulationTask) => {
    toast.success(`参数已加载到工作台`, { description: task.name });
    setTimeout(() => navigate('/workspace'), 800);
  }, [navigate]);

  // ── Export CSV ─────────────────────────────────────────

  const exportCSV = useCallback(() => {
    const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));
    if (selectedTasks.length === 0) return;

    const headers = ['任务ID', '任务名称', '场景类型', '芯片功耗(W)', '材料', '冷却方式', '最高温度(C)', '状态', '创建时间', '持续时间(秒)'];
    const rows = selectedTasks.map((t) => [
      t.id,
      t.name,
      getSceneLabel(t),
      t.params.chip.power,
      MATERIAL_LABELS[t.params.chip.material],
      COOLING_LABELS[t.params.cooling.method],
      t.results?.maxTemperature ?? '-',
      STATUS_LABELS[t.status]?.label ?? t.status,
      formatDate(t.createdAt),
      t.startedAt ? Math.round((Date.now() - new Date(t.startedAt).getTime()) / 1000) : '-',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '\\"')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `仿真任务导出_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${selectedTasks.length} 个任务`);
  }, [tasks, selectedIds]);

  // ── Sort toggle ────────────────────────────────────────

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // ── Scene filter options ───────────────────────────────

  const sceneOptions = [
    { value: 'all', label: '全部场景' },
    { value: 'cpu_air', label: 'CPU风冷' },
    { value: 'cpu_water', label: 'CPU水冷' },
    { value: 'gpu_water', label: 'GPU水冷' },
    { value: 'power_air', label: '功率器件散热' },
    { value: 'immersion', label: '浸没式冷却' },
    { value: 'jet', label: '射流冷却' },
  ];

  // ── Chart data ─────────────────────────────────────────

  const compareChartData = useMemo(() => {
    if (!compareOpen || compareTasks.length === 0) return [];

    const maxPoints = Math.max(
      ...compareTasks.map((t) => t.results?.convergenceHistory?.length ?? 0)
    );
    const data: Array<Record<string, number | string>> = [];

    for (let i = 0; i < maxPoints; i++) {
      const point: Record<string, number | string> = {};
      compareTasks.forEach((task, idx) => {
        const hist = task.results?.convergenceHistory;
        if (hist && hist[i]) {
          point[`time_${idx}`] = hist[i].time;
          point[`temp_${idx}`] = hist[i].maxTemp;
        }
      });
      if (Object.keys(point).length > 0) {
        data.push(point);
      }
    }
    return data;
  }, [compareOpen, compareTasks]);

  // ── Render ─────────────────────────────────────────────

  return (
    <motion.div
      className="min-h-[100dvh] pt-14"
      style={{ background: 'var(--bg-deep)' }}
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* ═══════ Page Header ═══════ */}
      <div
        className="border-b"
        style={{
          background: 'var(--bg-deep)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:px-6">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h1
              className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              仿真任务管理
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-body)' }}>
              管理和查看你的所有芯片散热仿真记录
            </p>
          </motion.div>

          {/* Stats cards */}
          <motion.div
            className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {[
              { label: '全部任务', value: stats.total, color: 'var(--text-primary)' },
              { label: '运行中', value: stats.running, color: 'var(--accent-particle)' },
              { label: '已完成', value: stats.completed, color: 'var(--accent-stable)' },
              { label: '失败', value: stats.failed, color: 'var(--accent-thermal)' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border px-4 py-3"
                style={{
                  background: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </p>
                <p
                  className="mt-1 font-display text-2xl font-semibold tabular-nums"
                  style={{ color: s.color }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Toolbar */}
          <motion.div
            className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            {/* Search + Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="搜索任务名称、芯片型号…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-[240px] rounded-md border pl-8 pr-3 text-sm outline-none transition-colors md:w-[280px]"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border px-2.5 text-sm outline-none"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="all">全部状态</option>
                <option value="running">运行中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
                <option value="queued">排队中</option>
                <option value="idle">空闲</option>
              </select>

              <select
                value={sceneFilter}
                onChange={(e) => setSceneFilter(e.target.value)}
                className="h-9 rounded-md border px-2.5 text-sm outline-none"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {sceneOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/workspace')}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition-all duration-200 hover:brightness-110"
                style={{
                  background: 'var(--accent-flow)',
                  color: '#030810',
                }}
              >
                <Plus className="h-4 w-4" />
                新建仿真
              </button>
              <button
                onClick={openCompare}
                disabled={!canCompare}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  borderColor: 'var(--border-active)',
                  color: canCompare ? 'var(--accent-flow)' : 'var(--text-muted)',
                }}
              >
                <BarChart3 className="h-4 w-4" />
                对比选中
              </button>
              <button
                onClick={openBatchDelete}
                disabled={selectedIds.size === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  borderColor: 'var(--accent-thermal)',
                  color: selectedIds.size > 0 ? 'var(--accent-thermal)' : 'var(--text-muted)',
                }}
              >
                <Trash2 className="h-4 w-4" />
                批量删除
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════ Batch Action Bar ═══════ */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sticky top-14 z-30 border-b"
            style={{
              background: 'rgba(78, 205, 196, 0.06)',
              borderColor: 'var(--border-active)',
            }}
          >
            <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2.5 lg:px-6">
              <span className="text-sm font-medium" style={{ color: 'var(--accent-flow)' }}>
                已选择 {selectedIds.size} 个任务
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-xs font-medium transition-colors"
                  style={{ borderColor: 'var(--border-active)', color: 'var(--text-body)' }}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  导出CSV
                </button>
                <button
                  onClick={openCompare}
                  disabled={!canCompare}
                  className="inline-flex h-7 items-center gap-1.5 rounded border px-2.5 text-xs font-medium transition-colors disabled:opacity-40"
                  style={{ borderColor: 'var(--border-active)', color: canCompare ? 'var(--accent-flow)' : 'var(--text-muted)' }}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  对比
                </button>
                <button
                  onClick={openBatchDelete}
                  className="inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors"
                  style={{ background: 'var(--accent-thermal)', color: '#fff' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-1 inline-flex h-7 items-center justify-center rounded p-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Task Table ═══════ */}
      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6">
        {currentTasks.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Inbox className="h-12 w-12" style={{ color: 'var(--text-muted)' }} />
            <h3 className="mt-4 text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
              暂无仿真任务
            </h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              点击「新建仿真」开始你的第一次芯片散热分析
            </p>
            <button
              onClick={() => navigate('/workspace')}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition-all duration-200 hover:brightness-110"
              style={{ background: 'var(--accent-flow)', color: '#030810' }}
            >
              <Play className="h-4 w-4" />
              新建仿真
            </button>
          </motion.div>
        ) : (
          <>
            {/* Table */}
            <div
              className="overflow-hidden rounded-lg border"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {/* Table Header */}
                  <thead>
                    <tr style={{ background: 'var(--bg-base)', height: 44 }}>
                      <th className="w-10 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 cursor-pointer rounded"
                        />
                      </th>
                      <SortHeader label="任务名称" sortKey="name" sort={sort} onSort={toggleSort} className="min-w-[200px] text-left" />
                      <SortHeader label="场景" sortKey="scene" sort={sort} onSort={toggleSort} className="w-[120px]" />
                      <SortHeader label="功耗" sortKey="power" sort={sort} onSort={toggleSort} className="w-[90px]" />
                      <SortHeader label="冷却" sortKey="cooling" sort={sort} onSort={toggleSort} className="w-[100px]" />
                      <SortHeader label="最高温度" sortKey="maxTemp" sort={sort} onSort={toggleSort} className="w-[100px]" />
                      <SortHeader label="状态" sortKey="status" sort={sort} onSort={toggleSort} className="w-[110px]" />
                      <SortHeader label="创建时间" sortKey="createdAt" sort={sort} onSort={toggleSort} className="w-[140px]" />
                      <th className="w-[130px] px-2 text-right" style={{ color: 'var(--text-body)', fontSize: 13, fontWeight: 500 }}>
                        操作
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {currentTasks.map((task, idx) => {
                        const sceneKey = getSceneKey(task);
                        const sceneColors = SCENE_COLORS[sceneKey] ?? SCENE_COLORS['cpu_air'];
                        const isSelected = selectedIds.has(task.id);

                        return (
                          <motion.tr
                            key={task.id}
                            custom={idx}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={rowVariants}
                            className="group relative transition-colors duration-200"
                            style={{
                              background: isSelected
                                ? 'rgba(78, 205, 196, 0.06)'
                                : idx % 2 === 0
                                  ? 'var(--bg-deep)'
                                  : 'var(--bg-base)',
                              height: 56,
                              borderBottom: '1px solid var(--border-subtle)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'var(--bg-surface)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background =
                                  idx % 2 === 0 ? 'var(--bg-deep)' : 'var(--bg-base)';
                              }
                            }}
                          >
                            {/* Hover indicator */}
                            <div
                              className="absolute left-0 top-0 h-full w-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                              style={{ background: 'var(--accent-flow)' }}
                            />

                            {/* Checkbox */}
                            <td className="px-2 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(task.id)}
                                className="h-3.5 w-3.5 cursor-pointer rounded"
                              />
                            </td>

                            {/* Task Name */}
                            <td className="px-2">
                              <div className="flex max-w-[260px] flex-col">
                                <div className="flex items-center gap-1">
                                  <span
                                    className="truncate text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                    title={task.name}
                                  >
                                    {task.name}
                                  </span>
                                  <CopyButton text={task.id} />
                                </div>
                                <span
                                  className="truncate text-xs"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  {task.id}
                                </span>
                              </div>
                            </td>

                            {/* Scene */}
                            <td className="px-2">
                              <span
                                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  background: sceneColors.bg,
                                  color: sceneColors.text,
                                }}
                              >
                                {getSceneLabel(task)}
                              </span>
                            </td>

                            {/* Power */}
                            <td className="px-2">
                              <span className="font-mono text-sm tabular-nums" style={{ color: 'var(--text-primary)' }}>
                                {task.params.chip.power}W
                              </span>
                            </td>

                            {/* Cooling */}
                            <td className="px-2">
                              <div className="flex items-center gap-1">
                                <CoolingIcon method={task.params.cooling.method} />
                                <span className="text-xs" style={{ color: 'var(--text-body)' }}>
                                  {COOLING_LABELS[task.params.cooling.method]}
                                </span>
                              </div>
                            </td>

                            {/* Max Temp */}
                            <td className="px-2">
                              {task.results ? (
                                <TempDisplay temp={task.results.maxTemperature} />
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-2">
                              <div className="flex flex-col gap-1">
                                <StatusIndicator status={task.status} />
                                {task.status === 'running' && (
                                  <ProgressBar progress={task.progress} status={task.status} />
                                )}
                              </div>
                            </td>

                            {/* Created */}
                            <td className="px-2">
                              <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                {formatDate(task.createdAt)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-2">
                              <div className="flex items-center justify-end gap-0.5">
                                <button
                                  className="rounded p-1.5 transition-colors duration-200"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--accent-flow)';
                                    e.currentTarget.style.background = 'var(--bg-raised)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                  title="查看详情"
                                  onClick={() => navigate(`/analysis/${task.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  className="rounded p-1.5 transition-colors duration-200"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--accent-flow)';
                                    e.currentTarget.style.background = 'var(--bg-raised)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                  title="重新运行"
                                  onClick={() => handleRerun(task)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                                <button
                                  className="rounded p-1.5 transition-colors duration-200"
                                  style={{ color: 'var(--text-muted)' }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--accent-thermal)';
                                    e.currentTarget.style.background = 'var(--bg-raised)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.background = 'transparent';
                                  }}
                                  title="删除"
                                  onClick={() => openDelete(task)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>
                  第 {currentPage} / {totalPages} 页，共 {filteredTasks.length} 条
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-7 rounded border px-1.5 text-xs outline-none"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value={10}>10条/页</option>
                  <option value={25}>25条/页</option>
                  <option value={50}>50条/页</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <PageBtn onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </PageBtn>
                <PageBtn onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </PageBtn>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <PageBtn
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      active={page === currentPage}
                    >
                      {page}
                    </PageBtn>
                  );
                })}
                <PageBtn onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </PageBtn>
                <PageBtn onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </PageBtn>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════ Delete Confirmation Modal ═══════ */}
      <AnimatePresence>
        {(deleteTarget || isBatchDelete) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0, 0, 0, 0.6)' }}
              onClick={() => {
                setDeleteTarget(null);
                setIsBatchDelete(false);
              }}
            />
            <motion.div
              className="relative z-10 w-full max-w-[400px] rounded-xl border p-6"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{
                background: 'var(--bg-base)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col items-center text-center">
                <AlertTriangle
                  className="h-10 w-10"
                  style={{ color: 'var(--accent-energy)' }}
                />
                <h3
                  className="mt-4 text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  确认删除
                </h3>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-body)' }}>
                  {isBatchDelete ? (
                    <>确定要删除选中的 <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.size}</strong> 个任务吗？此操作不可撤销。</>
                  ) : deleteTarget ? (
                    <>确定要删除「<strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.name}</strong>」吗？此操作不可撤销。</>
                  ) : null}
                </p>
                <div className="mt-6 flex w-full gap-3">
                  <button
                    onClick={() => {
                      setDeleteTarget(null);
                      setIsBatchDelete(false);
                    }}
                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors duration-200"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:brightness-110"
                    style={{
                      background: 'var(--accent-thermal)',
                      color: '#fff',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Compare Drawer (Bottom) ═══════ */}
      <AnimatePresence>
        {compareOpen && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t"
            style={{
              height: '60vh',
              background: 'var(--bg-base)',
              borderColor: 'var(--border-active)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
            }}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div
                className="h-1 w-10 rounded-full"
                style={{ background: 'var(--bg-surface)' }}
              />
            </div>

            {/* Drawer Header */}
            <div
              className="flex items-center justify-between border-b px-6 pb-3"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                任务对比（{compareTasks.length}）
              </h3>
              <button
                onClick={() => setCompareOpen(false)}
                className="rounded p-1.5 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div
              className="scrollbar-thin flex h-[calc(60vh-60px)] gap-6 overflow-y-auto p-6"
            >
              {/* Parameter Comparison Table */}
              <div className="flex-1">
                <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  参数对比
                </h4>
                <div
                  className="overflow-hidden rounded-lg border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--text-body)' }}>参数</th>
                        {compareTasks.map((task, idx) => (
                          <th
                            key={task.id}
                            className="px-3 py-2 text-left font-medium"
                            style={{ color: COMPARE_COLORS[idx] }}
                          >
                            {task.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: '芯片功耗', get: (t: SimulationTask) => `${t.params.chip.power}W` },
                        { label: '芯片尺寸', get: (t: SimulationTask) => `${t.params.chip.width}×${t.params.chip.height}mm` },
                        { label: '材料', get: (t: SimulationTask) => MATERIAL_LABELS[t.params.chip.material] },
                        { label: '冷却方式', get: (t: SimulationTask) => COOLING_LABELS[t.params.cooling.method] },
                        { label: '环境温度', get: (t: SimulationTask) => `${t.params.cooling.ambientTemperature}°C` },
                        { label: '粒子数', get: (t: SimulationTask) => t.params.sph.particleCount.toLocaleString() },
                        { label: '分辨率', get: (t: SimulationTask) => t.params.sph.resolution },
                        { label: '最高温度', get: (t: SimulationTask) => t.results ? `${t.results.maxTemperature.toFixed(1)}°C` : '-' },
                        { label: '平均温度', get: (t: SimulationTask) => t.results ? `${t.results.avgTemperature.toFixed(1)}°C` : '-' },
                        { label: '热阻', get: (t: SimulationTask) => t.results ? `${t.results.thermalResistance.toFixed(3)} K/W` : '-' },
                      ].map((row, ridx) => {
                        const values = compareTasks.map(row.get);
                        const allSame = values.every((v) => v === values[0]);
                        return (
                          <tr
                            key={row.label}
                            style={{
                              background: ridx % 2 === 0 ? 'var(--bg-deep)' : 'var(--bg-base)',
                              borderBottom: '1px solid var(--border-subtle)',
                            }}
                          >
                            <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-body)' }}>
                              {row.label}
                            </td>
                            {values.map((val, cidx) => (
                              <td
                                key={cidx}
                                className="px-3 py-2 font-mono"
                                style={{
                                  color: allSame ? 'var(--text-primary)' : 'var(--accent-energy)',
                                  background: allSame ? 'transparent' : 'rgba(255, 217, 61, 0.06)',
                                }}
                              >
                                {val}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chart */}
              <div className="flex-1">
                <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  温度曲线对比
                </h4>
                <div
                  className="rounded-lg border p-4"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: 'var(--bg-deep)',
                    height: 300,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compareChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(78,205,196,0.1)" />
                      <XAxis
                        dataKey="time_0"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        stroke="var(--border-subtle)"
                        label={{ value: '时间 (s)', position: 'insideBottom', fill: 'var(--text-muted)', fontSize: 11, offset: -2 }}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        stroke="var(--border-subtle)"
                        label={{ value: '温度 (°C)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border-active)',
                          borderRadius: 8,
                          fontSize: 12,
                          color: 'var(--text-primary)',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: 'var(--text-body)' }}
                      />
                      {compareTasks.map((task, idx) => (
                        <Line
                          key={task.id}
                          type="monotone"
                          dataKey={`temp_${idx}`}
                          name={task.name}
                          stroke={COMPARE_COLORS[idx]}
                          strokeWidth={2}
                          dot={false}
                          opacity={0.85}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 3D Preview Placeholder */}
              <div className="w-[300px] shrink-0">
                <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  3D 预览对比
                </h4>
                <div className="space-y-3">
                  {compareTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="rounded-lg border p-4"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        background: 'var(--bg-deep)',
                        height: 140,
                      }}
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-2">
                        <div
                          className="flex h-16 w-16 items-center justify-center rounded-lg"
                          style={{ background: 'var(--bg-surface)' }}
                        >
                          <Atom3DIcon color={COMPARE_COLORS[idx]} />
                        </div>
                        <p className="text-center text-xs" style={{ color: 'var(--text-body)' }}>
                          {task.name}
                        </p>
                        {task.results && (
                          <p className="text-xs font-mono font-semibold" style={{ color: COMPARE_COLORS[idx] }}>
                            最高 {task.results.maxTemperature.toFixed(1)}°C
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  sort: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}) {
  const isActive = sort.key === sortKey;

  return (
    <th
      className={`cursor-pointer px-2 text-left select-none transition-colors duration-200 hover:text-[var(--text-primary)] ${className ?? ''}`}
      style={{
        color: isActive ? 'var(--accent-flow)' : 'var(--text-body)',
        fontSize: 13,
        fontWeight: 500,
      }}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-0.5">
        {label}
        {isActive && (
          sort.direction === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        )}
      </div>
    </th>
  );
}

function PageBtn({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded border text-xs font-medium transition-all duration-200 disabled:cursor-not-allowed"
      style={{
        background: active ? 'var(--accent-flow)' : 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        color: active ? '#030810' : disabled ? 'var(--text-muted)' : 'var(--text-body)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Atom3DIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <ellipse cx="16" cy="16" rx="12" ry="4" stroke={color} strokeWidth="1" opacity="0.4" transform="rotate(30 16 16)" />
      <ellipse cx="16" cy="16" rx="12" ry="4" stroke={color} strokeWidth="1" opacity="0.4" transform="rotate(-30 16 16)" />
      <circle cx="16" cy="16" r="3" fill={color} opacity="0.6" />
      <circle cx="10" cy="10" r="1.5" fill={color} opacity="0.8" />
      <circle cx="22" cy="20" r="1.5" fill={color} opacity="0.8" />
    </svg>
  );
}
