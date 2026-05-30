import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, RotateCcw, Play, Square, FolderOpen,
  Cpu, Thermometer, Wind, Droplets, Flame, Zap, Layers, Settings,
} from 'lucide-react';
import type { SimulationParams, MaterialType, CoolingMethod, Resolution } from '@/types';
import { RESOLUTION_PRESETS } from '@/lib/simulation';
import NLInputPanel from './NLInputPanel';
import type { SimulationState } from './useSimulationStore';
import type { ParsedParams } from '@/types';

// --- Collapsible Section ---
function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />}
          <Icon className="h-4 w-4" style={{ color: 'var(--accent-flow)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Slider + Number Input ---
function SliderField({ label, value, min, max, step, unit, onChange, disabled }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs" style={{ color: 'var(--text-body)' }}>{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-16 px-1.5 py-0.5 text-right text-xs outline-none"
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
          />
          <span className="text-xs w-8" style={{ color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-slider"
        style={{
          accentColor: 'var(--accent-flow)',
        }}
      />
    </div>
  );
}

// --- Number Input ---
function NumberField({ label, value, onChange, unit, readOnly, disabled }: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  unit: string;
  readOnly?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs" style={{ color: 'var(--text-body)' }}>{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          readOnly={readOnly}
          disabled={disabled || readOnly}
          onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
          className="w-16 px-1.5 py-0.5 text-right text-xs outline-none"
          style={{
            background: readOnly ? 'var(--bg-base)' : 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            border: `1px solid ${readOnly ? 'transparent' : 'var(--border-subtle)'}`,
            opacity: readOnly ? 0.6 : 1,
          }}
        />
        <span className="text-xs w-10" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );
}

// --- Select ---
function SelectField<T extends string>({ label, value, options, onChange, disabled }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs" style={{ color: 'var(--text-body)' }}>{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-2 py-1 text-xs outline-none cursor-pointer"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// --- Cooling Method Selector ---
function CoolingSelector({ value, onChange, disabled }: {
  value: CoolingMethod;
  onChange: (v: CoolingMethod) => void;
  disabled?: boolean;
}) {
  const methods: { value: CoolingMethod; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[] = [
    { value: 'air', label: '风冷', icon: Wind },
    { value: 'water', label: '水冷', icon: Droplets },
    { value: 'phase_change', label: '相变', icon: Flame },
    { value: 'liquid_metal', label: '液金冷却', icon: Zap },
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs" style={{ color: 'var(--text-body)' }}>冷却方式</label>
      <div className="grid grid-cols-2 gap-2">
        {methods.map((m) => {
          const Icon = m.icon;
          const selected = value === m.value;
          return (
            <button
              key={m.value}
              onClick={() => onChange(m.value)}
              disabled={disabled}
              className="flex flex-col items-center gap-1 py-2 transition-all duration-200 disabled:opacity-50"
              style={{
                background: selected ? 'rgba(78, 205, 196, 0.1)' : 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${selected ? 'var(--accent-flow)' : 'var(--border-subtle)'}`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color: selected ? 'var(--accent-flow)' : 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: selected ? 'var(--accent-flow)' : 'var(--text-body)' }}>{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Material options ---
const MATERIAL_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'Si', label: '硅(Si)' },
  { value: 'GaN', label: '氮化镓(GaN)' },
  { value: 'SiC', label: '碳化硅(SiC)' },
  { value: 'Cu', label: '铜(Cu)' },
  { value: 'Al', label: '铝(Al)' },
  { value: 'Ag', label: '银(Ag)' },
];

const RESOLUTION_OPTIONS: { value: Resolution; label: string }[] = [
  { value: 'low', label: '低 (5千)' },
  { value: 'medium', label: '中 (5万)' },
  { value: 'high', label: '高 (50万)' },
  { value: 'ultra', label: '超高 (1000万)' },
];

const HEAT_SINK_MAT_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'Al', label: '铝(Al)' },
  { value: 'Cu', label: '铜(Cu)' },
  { value: 'Ag', label: '银(Ag)' },
];

// ==================== Main ParameterPanel ====================

interface ParameterPanelProps {
  params: SimulationParams;
  simState: SimulationState;
  nlInput: string;
  setNlInput: (v: string) => void;
  parsedResult: ParsedParams | null;
  isParsing: boolean;
  materialConductivity: number;
  onParse: () => void;
  onApplyTemplate: (text: string) => void;
  onChipParam: <K extends keyof SimulationParams['chip']>(key: K, value: SimulationParams['chip'][K]) => void;
  onCoolingParam: <K extends keyof SimulationParams['cooling']>(key: K, value: SimulationParams['cooling'][K]) => void;
  onSphParam: <K extends keyof SimulationParams['sph']>(key: K, value: SimulationParams['sph'][K]) => void;
  onHeatSinkParam: <K extends keyof SimulationParams['heatSink']>(key: K, value: SimulationParams['heatSink'][K]) => void;
  onReset: () => void;
  onStart: () => void;
  onStop: () => void;
}

export default function ParameterPanel({
  params,
  simState,
  nlInput,
  setNlInput,
  parsedResult,
  isParsing,
  materialConductivity,
  onParse,
  onApplyTemplate,
  onChipParam,
  onCoolingParam,
  onSphParam,
  onHeatSinkParam,
  onReset,
  onStart,
  onStop,
}: ParameterPanelProps) {
  const isRunning = simState === 'running';
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    if (showResetConfirm) {
      onReset();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const isCompleted = simState === 'completed';

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Scrollable content */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        {/* NL Input */}
        <NLInputPanel
          nlInput={nlInput}
          setNlInput={setNlInput}
          parsedResult={parsedResult}
          isParsing={isParsing}
          onParse={onParse}
          onApplyTemplate={onApplyTemplate}
        />

        <div className="my-3" style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Parameter Sections */}
        <Section title="芯片参数" icon={Cpu} defaultOpen>
          <SliderField
            label="芯片功耗"
            value={params.chip.power}
            min={1}
            max={1000}
            step={1}
            unit="W"
            onChange={(v) => onChipParam('power', v)}
            disabled={isRunning}
          />
          <NumberField
            label="芯片尺寸 X"
            value={params.chip.width}
            onChange={(v) => onChipParam('width', v)}
            unit="mm"
            disabled={isRunning}
          />
          <NumberField
            label="芯片尺寸 Y"
            value={params.chip.height}
            onChange={(v) => onChipParam('height', v)}
            unit="mm"
            disabled={isRunning}
          />
          <NumberField
            label="芯片尺寸 Z"
            value={params.chip.thickness}
            onChange={(v) => onChipParam('thickness', v)}
            unit="mm"
            disabled={isRunning}
          />
          <SelectField
            label="芯片材料"
            value={params.chip.material}
            options={MATERIAL_OPTIONS}
            onChange={(v) => onChipParam('material', v)}
            disabled={isRunning}
          />
          <NumberField
            label="导热系数"
            value={materialConductivity}
            unit="W/(m·K)"
            readOnly
          />
        </Section>

        <Section title="冷却参数" icon={Thermometer}>
          <CoolingSelector
            value={params.cooling.method}
            onChange={(v) => onCoolingParam('method', v)}
            disabled={isRunning}
          />
          <SelectField
            label="散热器材料"
            value={params.heatSink.material}
            options={HEAT_SINK_MAT_OPTIONS}
            onChange={(v) => onHeatSinkParam('material', v)}
            disabled={isRunning}
          />
          <SliderField
            label="散热器高度"
            value={params.heatSink.finHeight || 40}
            min={10}
            max={100}
            step={1}
            unit="mm"
            onChange={(v) => onHeatSinkParam('finHeight', v)}
            disabled={isRunning}
          />
          <SliderField
            label="鳍片数量"
            value={params.heatSink.finCount || 8}
            min={4}
            max={48}
            step={1}
            unit="片"
            onChange={(v) => onHeatSinkParam('finCount', v)}
            disabled={isRunning}
          />
          <SliderField
            label="环境温度"
            value={params.cooling.ambientTemperature}
            min={-40}
            max={100}
            step={1}
            unit="C"
            onChange={(v) => onCoolingParam('ambientTemperature', v)}
            disabled={isRunning}
          />
          <SliderField
            label="流体流速"
            value={params.cooling.flowRate || 0}
            min={0}
            max={10}
            step={0.1}
            unit="m/s"
            onChange={(v) => onCoolingParam('flowRate', v)}
            disabled={isRunning}
          />
        </Section>

        <Section title="仿真参数" icon={Settings}>
          <SelectField
            label="SPH粒子分辨率"
            value={params.sph.resolution}
            options={RESOLUTION_OPTIONS}
            onChange={(v) => {
              onSphParam('resolution', v);
              const preset = RESOLUTION_PRESETS[v];
              onSphParam('particleCount', preset.particleCount);
              onSphParam('smoothingLength', preset.smoothingLength);
            }}
            disabled={isRunning}
          />
          <SliderField
            label="仿真时长"
            value={params.sph.totalTime}
            min={0.001}
            max={10}
            step={0.001}
            unit="s"
            onChange={(v) => onSphParam('totalTime', v)}
            disabled={isRunning}
          />
          <NumberField
            label="时间步长"
            value={params.sph.timeStep}
            onChange={(v) => onSphParam('timeStep', v)}
            unit="s"
            disabled={isRunning}
          />
          <SelectField
            label="输出帧率"
            value={String(Math.round(1 / params.sph.outputInterval))}
            options={[
              { value: '10', label: '10 fps' },
              { value: '30', label: '30 fps' },
              { value: '60', label: '60 fps' },
            ]}
            onChange={(v) => onSphParam('outputInterval', 1 / parseInt(v))}
            disabled={isRunning}
          />
        </Section>
      </div>

      {/* Bottom action buttons */}
      <div
        className="shrink-0 space-y-2 px-4 py-3"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-base)',
        }}
      >
        {/* Load template */}
        <a
          href="#/templates"
          className="flex w-full items-center justify-center gap-2 py-2 text-sm transition-all duration-200"
          style={{
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-active)',
            color: 'var(--text-body)',
          }}
        >
          <FolderOpen className="h-4 w-4" />
          加载模板
        </a>

        {/* Reset */}
        <AnimatePresence mode="wait">
          {showResetConfirm ? (
            <motion.button
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium transition-all duration-200"
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--accent-thermal)',
                color: 'var(--accent-thermal)',
                background: 'rgba(255, 107, 107, 0.05)',
              }}
            >
              <RotateCcw className="h-4 w-4" />
              确认重置
            </motion.button>
          ) : (
            <motion.button
              key="reset"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 py-2 text-sm transition-all duration-200"
              style={{
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-body)',
              }}
            >
              <RotateCcw className="h-4 w-4" />
              重置参数
            </motion.button>
          )}
        </AnimatePresence>

        {/* Start/Stop */}
        {isCompleted ? (
          <a
            href="#/analysis/latest"
            className="flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-particle)',
              color: 'var(--bg-abyss)',
            }}
          >
            <Layers className="h-4 w-4" />
            查看结果
          </a>
        ) : (
          <button
            onClick={isRunning ? onStop : onStart}
            className="flex w-full items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              borderRadius: 'var(--radius-sm)',
              background: isRunning ? 'var(--accent-thermal)' : 'var(--accent-flow)',
              color: 'var(--bg-abyss)',
            }}
          >
            {isRunning ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? '停止仿真' : '启动仿真'}
          </button>
        )}
      </div>
    </div>
  );
}
