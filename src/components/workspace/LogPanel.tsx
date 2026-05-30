import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import type { LogEntry } from './useSimulationStore';

interface LogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: LogEntry[];
  onClear: () => void;
}

type LogFilter = 'ALL' | 'INFO' | 'WARN' | 'ERROR';

export default function LogPanel({ isOpen, onToggle, logs, onClear }: LogPanelProps) {
  const [filter, setFilter] = useState<LogFilter>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.level === filter || (filter === 'ERROR' && log.level === 'SUCCESS');
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen, filter]);

  const filters: { value: LogFilter; label: string }[] = [
    { value: 'ALL', label: '全部' },
    { value: 'INFO', label: '信息' },
    { value: 'WARN', label: '警告' },
    { value: 'ERROR', label: '错误' },
  ];

  return (
    <div className="relative" style={{ height: isOpen ? 160 : 28 }}>
      {/* Toggle button */}
      <div className="absolute -top-5 left-1/2 z-20 -translate-x-1/2">
        <button
          onClick={onToggle}
          className="flex h-5 items-center justify-center px-3"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderBottom: 'none',
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          }}
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronUp className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 160, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="flex h-full flex-col overflow-hidden"
            style={{
              background: 'var(--bg-abyss)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-1.5 shrink-0"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-1">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className="px-2.5 py-0.5 text-xs transition-all duration-200"
                    style={{
                      color: filter === f.value ? 'var(--accent-flow)' : 'var(--text-muted)',
                      background: filter === f.value ? 'var(--bg-surface)' : 'transparent',
                      borderRadius: 9999,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={onClear}
                className="flex h-6 w-6 items-center justify-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="清空日志"
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-thermal)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Log content */}
            <div
              ref={scrollRef}
              className="scrollbar-thin flex-1 overflow-y-auto px-4 py-2 font-mono"
              style={{ fontSize: 13, lineHeight: 1.6 }}
            >
              {filteredLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>暂无日志输出...</p>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="whitespace-pre-wrap break-all">
                    <span style={{ color: 'var(--text-muted)' }}>
                      [{formatTimestamp(log.timestamp)}]
                    </span>
                    {' '}
                    <span style={{ color: levelColor(log.level), fontWeight: 600 }}>
                      [{log.level}]
                    </span>
                    {' '}
                    <span style={{ color: levelTextColor(log.level) }}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function levelColor(level: LogEntry['level']): string {
  switch (level) {
    case 'INFO': return 'var(--text-body)';
    case 'WARN': return 'var(--accent-energy)';
    case 'ERROR': return 'var(--accent-thermal)';
    case 'SUCCESS': return 'var(--accent-particle)';
    case 'DEBUG': return 'var(--text-muted)';
  }
}

function levelTextColor(level: LogEntry['level']): string {
  switch (level) {
    case 'INFO': return 'var(--text-body)';
    case 'WARN': return 'var(--accent-energy)';
    case 'ERROR': return 'var(--accent-thermal)';
    case 'SUCCESS': return 'var(--accent-particle)';
    case 'DEBUG': return 'var(--text-muted)';
  }
}
