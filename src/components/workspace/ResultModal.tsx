import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Layers, RotateCcw, Save } from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    maxTemp: number;
    avgTemp: number;
    thermalResistance: number;
  };
  elapsedTime: number;
  onNewSimulation: () => void;
}

export default function ResultModal({ isOpen, onClose, stats, elapsedTime, onNewSimulation }: ResultModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 520,
              maxWidth: '90vw',
              background: 'var(--bg-base)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-active)',
              boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="relative flex flex-col items-center pt-8 pb-4">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-surface)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="h-4 w-4" />
              </button>
              <CheckCircle className="h-10 w-10 mb-3" style={{ color: 'var(--accent-particle)' }} />
              <h3 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>仿真完成</h3>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4">
              <div
                className="flex flex-col items-center p-4"
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}
              >
                <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>最高温度</span>
                <span className="text-2xl font-semibold" style={{ color: 'var(--accent-thermal)', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.maxTemp.toFixed(1)}C
                </span>
              </div>
              <div
                className="flex flex-col items-center p-4"
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}
              >
                <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>平均温度</span>
                <span className="text-2xl font-semibold" style={{ color: 'var(--accent-stable)', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.avgTemp.toFixed(1)}C
                </span>
              </div>
              <div
                className="flex flex-col items-center p-4"
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}
              >
                <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>热阻</span>
                <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {stats.thermalResistance.toFixed(2)} K/W
                </span>
              </div>
              <div
                className="flex flex-col items-center p-4"
                style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}
              >
                <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>计算时间</span>
                <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {formatTime(elapsedTime)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-6 pb-6">
              <a
                href="#/analysis/latest"
                className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: 'var(--accent-flow)',
                  color: 'var(--bg-abyss)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Layers className="h-4 w-4" />
                查看详细结果
              </a>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Save to localStorage as a task
                    const tasks = JSON.parse(localStorage.getItem('sphinxsys_tasks') || '[]');
                    tasks.push({
                      id: `task-${Date.now()}`,
                      name: `仿真任务 ${tasks.length + 1}`,
                      status: 'completed',
                      createdAt: new Date().toISOString(),
                      stats,
                    });
                    localStorage.setItem('sphinxsys_tasks', JSON.stringify(tasks));
                    onClose();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 py-2 text-sm transition-all duration-200"
                  style={{
                    border: '1px solid var(--border-active)',
                    color: 'var(--text-body)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <Save className="h-4 w-4" />
                  保存到任务列表
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNewSimulation();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 py-2 text-sm transition-all duration-200"
                  style={{
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  新仿真
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
