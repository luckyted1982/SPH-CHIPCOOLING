import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Thermometer, TrendingUp, Activity, Clock, BarChart3, Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import type { TimeSeriesPoint } from './useSimulationStore';
import type { LogEntry } from './useSimulationStore';

interface DataMonitorProps {
  isOpen: boolean;
  onToggle: () => void;
  stats: {
    maxTemp: number;
    avgTemp: number;
    thermalResistance: number;
    heatFlux: number;
  };
  progress: number;
  elapsedTime: number;
  timeSeries: TimeSeriesPoint[];
  logs: LogEntry[];
  simState: string;
}

function StatCard({ label, value, unit, color, icon: Icon }: {
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      className="p-3"
      style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3" style={{ color }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight" style={{ color, fontFamily: 'Space Grotesk, sans-serif' }}>
          {value}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );
}

export default function DataMonitor({
  isOpen,
  onToggle,
  stats,
  progress,
  elapsedTime,
  timeSeries,
  logs,
  simState,
}: DataMonitorProps) {
  const maxTempColor = stats.maxTemp > 100 ? 'var(--accent-thermal)' : stats.maxTemp > 80 ? 'var(--accent-energy)' : 'var(--accent-particle)';

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Mini chart data - derive from timeSeries or use default
  const chartData = useMemo(() => {
    if (timeSeries.length > 0) return timeSeries;
    // Default empty data
    return Array.from({ length: 20 }, (_, i) => ({
      time: i * 0.5,
      maxTemp: 25,
      avgTemp: 25,
    }));
  }, [timeSeries]);

  // Recent logs (last 5)
  const recentLogs = logs.slice(-5);

  return (
    <>
      {/* Toggle trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onClick={onToggle}
            className="absolute right-0 top-1/2 z-30 flex -translate-y-1/2 items-center"
            style={{
              background: 'var(--bg-base)',
              border: '1px solid var(--border-subtle)',
              borderRight: 'none',
              borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
              width: 24,
              height: 80,
            }}
          >
            <div className="flex flex-col items-center" style={{ writingMode: 'vertical-rl', color: 'var(--accent-flow)', fontSize: 11, letterSpacing: '0.1em' }}>
              <ChevronRight className="h-3 w-3 mb-1" />
              数据
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 280, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="h-full flex flex-col"
            style={{
              width: 280,
              background: 'var(--bg-base)',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" style={{ color: 'var(--accent-flow)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>数据监控</span>
              </div>
              <button
                onClick={onToggle}
                className="flex h-6 w-6 items-center justify-center text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {/* Stat cards grid */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="最高温度"
                  value={stats.maxTemp.toFixed(1)}
                  unit="C"
                  color={maxTempColor}
                  icon={Thermometer}
                />
                <StatCard
                  label="平均温度"
                  value={stats.avgTemp.toFixed(1)}
                  unit="C"
                  color={stats.avgTemp > 80 ? 'var(--accent-energy)' : 'var(--accent-stable)'}
                  icon={Activity}
                />
                <StatCard
                  label="热阻"
                  value={stats.thermalResistance.toFixed(2)}
                  unit="K/W"
                  color="var(--text-primary)"
                  icon={TrendingUp}
                />
                <StatCard
                  label="热通量"
                  value={(stats.heatFlux / 1000).toFixed(1)}
                  unit="kW/m"
                  color="var(--text-primary)"
                  icon={Zap}
                />
              </div>

              {/* Progress */}
              <div
                className="p-3"
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>仿真进度</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-flow)' }}>{Math.round(progress)}%</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden"
                  style={{ background: 'var(--bg-raised)', borderRadius: 9999 }}
                >
                  <motion.div
                    className="h-full"
                    style={{ background: 'var(--accent-flow)', borderRadius: 9999 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {formatElapsed(elapsedTime)}
                  </span>
                  <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                    {simState === 'running' ? '运行中' : simState === 'completed' ? '已完成' : simState === 'paused' ? '已暂停' : '空闲'}
                  </span>
                </div>
              </div>

              {/* Mini temperature chart */}
              <div
                className="p-3"
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>温度趋势</span>
                </div>
                <div style={{ height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <YAxis domain={[20, 150]} tick={{ fontSize: 10, fill: '#4A6382' }} width={30} axisLine={false} tickLine={false} />
                      <Line
                        type="monotone"
                        dataKey="maxTemp"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgTemp"
                        stroke="#45B7D1"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-3 rounded" style={{ background: '#FF6B6B' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>最高</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-3 rounded" style={{ background: '#45B7D1' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>平均</span>
                  </div>
                </div>
              </div>

              {/* Recent logs */}
              <div
                className="p-3"
                style={{
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>最近日志</span>
                </div>
                <div className="space-y-1" style={{ maxHeight: 160, overflowY: 'auto' }}>
                  {recentLogs.length === 0 ? (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>暂无日志</p>
                  ) : (
                    recentLogs.map((log) => (
                      <div key={log.id} className="text-xs font-mono leading-relaxed" style={{ color: logColor(log.level) }}>
                        [{formatTime(log.timestamp)}] {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function logColor(level: LogEntry['level']): string {
  switch (level) {
    case 'INFO': return 'var(--text-body)';
    case 'WARN': return 'var(--accent-energy)';
    case 'ERROR': return 'var(--accent-thermal)';
    case 'SUCCESS': return 'var(--accent-particle)';
    case 'DEBUG': return 'var(--text-muted)';
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}
