import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSimulationStore } from '@/components/workspace/useSimulationStore';
import ParameterPanel from '@/components/workspace/ParameterPanel';
import SimulationScene from '@/components/workspace/SimulationScene';
import DataMonitor from '@/components/workspace/DataMonitor';
import LogPanel from '@/components/workspace/LogPanel';
import ResultModal from '@/components/workspace/ResultModal';

export default function Workspace() {
  const store = useSimulationStore();

  // Cleanup simulation loop on unmount
  useEffect(() => {
    return () => {
      store.cleanup();
    };
  }, [store.cleanup]);

  // Inject keyframe styles for status dot
  useEffect(() => {
    const styleId = 'workspace-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `;
      document.head.appendChild(style);
    }
    return () => {
      const existing = document.getElementById(styleId);
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  return (
    <div className="flex h-[calc(100dvh-56px)] overflow-hidden" style={{ background: 'var(--bg-abyss)' }}>
      {/* ==================== LEFT PANEL: Parameter Panel ==================== */}
      <motion.div
        initial={{ x: -320, opacity: 0 }}
        animate={{
          x: store.leftPanelOpen ? 0 : -320,
          opacity: store.leftPanelOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="relative shrink-0 overflow-hidden"
        style={{
          width: 320,
          borderRight: '1px solid var(--border-subtle)',
          zIndex: 20,
        }}
      >
        <div className="h-full" style={{ background: 'var(--bg-base)' }}>
          <ParameterPanel
            params={store.params}
            simState={store.simState}
            nlInput={store.nlInput}
            setNlInput={store.setNlInput}
            parsedResult={store.parsedResult}
            isParsing={store.isParsing}
            materialConductivity={store.materialConductivity}
            onParse={store.handleParse}
            onApplyTemplate={store.applyTemplate}
            onChipParam={store.setChipParam}
            onCoolingParam={store.setCoolingParam}
            onSphParam={store.setSphParam}
            onHeatSinkParam={store.setHeatSinkParam}
            onReset={store.resetParams}
            onStart={store.startSimulation}
            onStop={store.stopSimulation}
          />
        </div>
      </motion.div>

      {/* Left panel toggle button */}
      <div
        className="absolute left-0 top-1/2 z-30 -translate-y-1/2"
        style={{ marginLeft: store.leftPanelOpen ? 320 : 0, transition: 'margin-left 0.3s ease' }}
      >
        <button
          onClick={() => store.setLeftPanelOpen(!store.leftPanelOpen)}
          className="flex h-10 w-5 items-center justify-center"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderLeft: 'none',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          }}
        >
          {store.leftPanelOpen ? (
            <ChevronLeft className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronRight className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
          )}
        </button>
      </div>

      {/* ==================== CENTER: 3D Visualization ==================== */}
      <div className="relative flex flex-1 flex-col min-w-0">
        {/* 3D Viewport */}
        <div className="relative flex-1 overflow-hidden">
          <SimulationScene
            particles={store.particles}
            params={store.params}
            stats={{ maxTemp: store.stats.maxTemp, avgTemp: store.stats.avgTemp }}
            viewMode={store.viewMode}
            onViewModeChange={store.setViewMode}
            currentTime={store.currentTime}
            totalTime={store.params.sph.totalTime}
            simState={store.simState}
          />

          {/* Simulation Status Badge */}
          <div
            className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full px-3 py-1"
            style={{
              background: 'rgba(3, 8, 16, 0.85)',
              backdropFilter: 'blur(4px)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <StatusDot state={store.simState} />
            <span className="text-xs" style={{ color: 'var(--text-body)' }}>
              {store.simState === 'idle' && '空闲'}
              {store.simState === 'configuring' && '配置中'}
              {store.simState === 'running' && '仿真运行中'}
              {store.simState === 'paused' && '已暂停'}
              {store.simState === 'completed' && '仿真完成'}
              {store.simState === 'error' && '运行错误'}
            </span>
          </div>
        </div>

        {/* ==================== BOTTOM: Log Panel ==================== */}
        <LogPanel
          isOpen={store.logPanelOpen}
          onToggle={() => store.setLogPanelOpen(!store.logPanelOpen)}
          logs={store.logs}
          onClear={() => {
            store.addLog('INFO', '日志已清空');
          }}
        />
      </div>

      {/* ==================== RIGHT PANEL: Data Monitor ==================== */}
      <div className="relative shrink-0" style={{ width: store.rightPanelOpen ? 280 : 0, transition: 'width 0.3s ease' }}>
        <DataMonitor
          isOpen={store.rightPanelOpen}
          onToggle={() => store.setRightPanelOpen(!store.rightPanelOpen)}
          stats={store.stats}
          progress={store.progress}
          elapsedTime={store.elapsedTime}
          timeSeries={store.timeSeries}
          logs={store.logs}
          simState={store.simState}
        />
      </div>

      {/* ==================== RESULT MODAL ==================== */}
      <ResultModal
        isOpen={store.showResultModal}
        onClose={() => store.setShowResultModal(false)}
        stats={{
          maxTemp: store.stats.maxTemp,
          avgTemp: store.stats.avgTemp,
          thermalResistance: store.stats.thermalResistance,
        }}
        elapsedTime={store.elapsedTime}
        onNewSimulation={store.resetParams}
      />
    </div>
  );
}

// --- Status Dot Component ---
function StatusDot({ state }: { state: string }) {
  const getColor = () => {
    switch (state) {
      case 'idle': return 'var(--text-muted)';
      case 'configuring': return 'var(--accent-stable)';
      case 'running': return 'var(--accent-particle)';
      case 'completed': return 'var(--accent-particle)';
      case 'error': return 'var(--accent-thermal)';
      default: return 'var(--text-muted)';
    }
  };

  const isRunning = state === 'running';
  const isError = state === 'error';

  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{
        background: getColor(),
        boxShadow: isRunning
          ? `0 0 8px ${getColor()}`
          : isError
          ? `0 0 8px ${getColor()}`
          : 'none',
        animation: isRunning
          ? 'pulse-dot 2s infinite'
          : isError
          ? 'blink-dot 0.5s infinite'
          : 'none',
      }}
    />
  );
}
