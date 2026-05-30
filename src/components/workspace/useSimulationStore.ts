import { useState, useCallback, useRef } from 'react';
import type { SimulationParams, ParsedParams } from '@/types';
import {
  getDefaultParams,
  getMaterial,
  MATERIAL_DB,
  parseNaturalLanguage,
  validateSimulationParams,
  estimateMaxTemperature,
  estimateThermalResistance,
  initializeChipParticles,
  computeTemperatureField,
  temperatureToColor,
} from '@/lib/simulation';

export type SimulationState = 'idle' | 'configuring' | 'running' | 'paused' | 'completed' | 'error';

export interface LogEntry {
  id: number;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  message: string;
}

export interface TimeSeriesPoint {
  time: number;
  maxTemp: number;
  avgTemp: number;
}

export interface ParticleData {
  x: number;
  y: number;
  z: number;
  temperature: number;
  color: [number, number, number];
}

let logIdCounter = 0;

export function useSimulationStore() {
  // --- Core state ---
  const [params, setParams] = useState<SimulationParams>(getDefaultParams());
  const [simState, setSimState] = useState<SimulationState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // --- NL Input ---
  const [nlInput, setNlInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedParams | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // --- Logs ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);

  // --- Time series ---
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);

  // --- Statistics ---
  const [stats, setStats] = useState({
    maxTemp: 25,
    avgTemp: 25,
    thermalResistance: 0,
    heatFlux: 0,
  });

  // --- Particle data for 3D ---
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const particlesRef = useRef<ParticleData[]>([]);

  // --- Simulation loop refs ---
  const simFrameRef = useRef<number>(0);
  const simStartTimeRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const sphParticlesRef = useRef<ReturnType<typeof initializeChipParticles>>([]);

  // --- View mode ---
  const [viewMode, setViewMode] = useState<'temperature' | 'flow' | 'particle'>('temperature');

  // --- Panel states ---
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [logPanelOpen, setLogPanelOpen] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);

  // --- Log helper ---
  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: ++logIdCounter,
      timestamp: Date.now(),
      level,
      message,
    };
    logsRef.current = [...logsRef.current.slice(-999), entry];
    setLogs(logsRef.current);
  }, []);

  // --- NL Parsing ---
  const handleParse = useCallback(() => {
    if (!nlInput.trim()) return;
    setIsParsing(true);
    addLog('INFO', `正在解析自然语言描述: "${nlInput}"`);

    setTimeout(() => {
      const result = parseNaturalLanguage(nlInput);
      setParsedResult(result);
      setIsParsing(false);

      if (result.confidence > 0) {
        addLog('SUCCESS', `解析完成，置信度: ${(result.confidence * 100).toFixed(0)}%`);
        // Auto-fill parameters
        setParams((prev) => {
          const next = { ...prev };
          if (result.chipType) next.chip = { ...next.chip, type: result.chipType };
          if (result.power) next.chip = { ...next.chip, power: result.power };
          if (result.material) next.chip = { ...next.chip, material: result.material };
          if (result.coolingMethod) next.cooling = { ...next.cooling, method: result.coolingMethod };
          if (result.heatSinkMaterial) next.heatSink = { ...next.heatSink, material: result.heatSinkMaterial };
          return next;
        });
        addLog('INFO', '参数已自动填充');
      } else {
        addLog('WARN', '未能从描述中提取有效参数');
      }
    }, 800);
  }, [nlInput, addLog]);

  // --- Quick template ---
  const applyTemplate = useCallback((text: string) => {
    setNlInput(text);
    setParsedResult(null);
  }, []);

  // --- Parameter setters ---
  const setChipParam = useCallback(<K extends keyof SimulationParams['chip']>(key: K, value: SimulationParams['chip'][K]) => {
    setParams((prev) => ({ ...prev, chip: { ...prev.chip, [key]: value } }));
  }, []);

  const setCoolingParam = useCallback(<K extends keyof SimulationParams['cooling']>(key: K, value: SimulationParams['cooling'][K]) => {
    setParams((prev) => ({ ...prev, cooling: { ...prev.cooling, [key]: value } }));
  }, []);

  const setSphParam = useCallback(<K extends keyof SimulationParams['sph']>(key: K, value: SimulationParams['sph'][K]) => {
    setParams((prev) => ({ ...prev, sph: { ...prev.sph, [key]: value } }));
  }, []);

  const setHeatSinkParam = useCallback(<K extends keyof SimulationParams['heatSink']>(key: K, value: SimulationParams['heatSink'][K]) => {
    setParams((prev) => ({ ...prev, heatSink: { ...prev.heatSink, [key]: value } }));
  }, []);

  // --- Reset ---
  const resetParams = useCallback(() => {
    setParams(getDefaultParams());
    setParsedResult(null);
    setNlInput('');
    setProgress(0);
    setCurrentTime(0);
    setTimeSeries([]);
    setParticles([]);
    particlesRef.current = [];
    setStats({ maxTemp: 25, avgTemp: 25, thermalResistance: 0, heatFlux: 0 });
    setShowResultModal(false);
    addLog('INFO', '参数已重置为默认值');
  }, [addLog]);

  // --- Initialize particles ---
  const initParticles = useCallback(() => {
    const mat = getMaterial(params.chip.material);
    const count = Math.min(params.sph.particleCount, 2000); // Cap for performance
    const rawParticles = initializeChipParticles(
      params.chip.width,
      params.chip.height,
      params.chip.thickness,
      params.chip.power,
      mat,
      count
    );
    sphParticlesRef.current = rawParticles;

    const displayParticles: ParticleData[] = rawParticles.map((p) => ({
      x: p.x - params.chip.width / 2,
      y: p.y - params.chip.height / 2,
      z: p.z - params.chip.thickness / 2,
      temperature: p.temperature,
      color: temperatureToColor(p.temperature),
    }));

    particlesRef.current = displayParticles;
    setParticles(displayParticles);
  }, [params.chip.material, params.chip.width, params.chip.height, params.chip.thickness, params.chip.power, params.sph.particleCount]);

  // --- Start simulation ---
  const startSimulation = useCallback(() => {
    const validation = validateSimulationParams(params);
    if (!validation.valid) {
      validation.errors.forEach((err) => addLog('ERROR', err));
      setSimState('error');
      return;
    }
    validation.warnings.forEach((warn) => addLog('WARN', warn));

    setSimState('running');
    setProgress(0);
    setCurrentTime(0);
    setTimeSeries([]);
    setShowResultModal(false);
    isRunningRef.current = true;
    simStartTimeRef.current = Date.now();

    addLog('INFO', '=== 仿真启动 ===');
    addLog('INFO', `芯片: ${params.chip.type.toUpperCase()}, ${params.chip.power}W, ${MATERIAL_DB[params.chip.material]?.nameZh || params.chip.material}`);
    addLog('INFO', `冷却方式: ${params.cooling.method}`);
    addLog('INFO', `粒子数: ${params.sph.particleCount.toLocaleString()}`);
    addLog('INFO', `预估最高温度: ${estimateMaxTemperature(params).toFixed(1)}C`);

    initParticles();

    const totalSteps = 100;
    let step = 0;

    const runStep = () => {
      if (!isRunningRef.current) return;

      step++;
      const progressPct = (step / totalSteps) * 100;
      const simTime = (step / totalSteps) * params.sph.totalTime;

      setProgress(progressPct);
      setCurrentTime(simTime);
      setElapsedTime((Date.now() - simStartTimeRef.current) / 1000);

      // Compute temperature evolution
      const mat = getMaterial(params.chip.material);
      const sphConfig = {
        smoothingLength: params.sph.smoothingLength,
        particleCount: Math.min(params.sph.particleCount, 2000),
        timeStep: params.sph.timeStep,
        kernelType: 'cubic' as const,
      };

      sphParticlesRef.current = computeTemperatureField(
        sphParticlesRef.current,
        mat,
        sphConfig,
        params.sph.timeStep * 100
      );

      // Update particle display
      const displayParticles: ParticleData[] = sphParticlesRef.current.map((p) => ({
        x: p.x - params.chip.width / 2,
        y: p.y - params.chip.height / 2,
        z: p.z - params.chip.thickness / 2,
        temperature: p.temperature,
        color: temperatureToColor(p.temperature),
      }));

      particlesRef.current = displayParticles;
      setParticles(displayParticles);

      // Statistics
      const temps = sphParticlesRef.current.map((p) => p.temperature);
      const maxTemp = Math.max(...temps);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const thermalR = estimateThermalResistance(params);
      const heatFlux = params.chip.power / ((params.chip.width * params.chip.height) * 1e-6);

      setStats({ maxTemp, avgTemp, thermalResistance: thermalR, heatFlux });

      // Time series
      setTimeSeries((prev) => {
        const next = [...prev, { time: simTime, maxTemp, avgTemp }];
        if (next.length > 200) next.shift();
        return next;
      });

      // Periodic logs
      if (step % 10 === 0) {
        addLog('INFO', `计算进度: ${progressPct.toFixed(0)}% | 最高温度: ${maxTemp.toFixed(1)}C | 平均温度: ${avgTemp.toFixed(1)}C`);
      }

      if (step >= totalSteps) {
        setSimState('completed');
        isRunningRef.current = false;
        addLog('SUCCESS', '=== 仿真完成 ===');
        addLog('SUCCESS', `最高温度: ${maxTemp.toFixed(1)}C`);
        addLog('SUCCESS', `平均温度: ${avgTemp.toFixed(1)}C`);
        addLog('SUCCESS', `热阻: ${thermalR.toFixed(3)} K/W`);
        setShowResultModal(true);
        return;
      }

      simFrameRef.current = requestAnimationFrame(runStep);
    };

    simFrameRef.current = requestAnimationFrame(runStep);
  }, [params, addLog, initParticles]);

  // --- Stop simulation ---
  const stopSimulation = useCallback(() => {
    isRunningRef.current = false;
    cancelAnimationFrame(simFrameRef.current);
    if (simState === 'running') {
      setSimState('paused');
      addLog('WARN', '仿真已暂停');
    }
  }, [simState, addLog]);

  // --- Cleanup ---
  const cleanup = useCallback(() => {
    isRunningRef.current = false;
    cancelAnimationFrame(simFrameRef.current);
  }, []);

  // --- Derived values ---
  const materialConductivity = getMaterial(params.chip.material).thermalConductivity;

  return {
    // State
    params,
    simState,
    progress,
    currentTime,
    elapsedTime,
    nlInput,
    setNlInput,
    parsedResult,
    isParsing,
    logs,
    timeSeries,
    stats,
    particles,
    viewMode,
    setViewMode,
    leftPanelOpen,
    setLeftPanelOpen,
    rightPanelOpen,
    setRightPanelOpen,
    logPanelOpen,
    setLogPanelOpen,
    showResultModal,
    setShowResultModal,
    materialConductivity,

    // Actions
    handleParse,
    applyTemplate,
    setChipParam,
    setCoolingParam,
    setSphParam,
    setHeatSinkParam,
    resetParams,
    startSimulation,
    stopSimulation,
    addLog,
    cleanup,
  };
}
