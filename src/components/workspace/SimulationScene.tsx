import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Text,
  Box,
} from '@react-three/drei';
import type { ParticleData } from './useSimulationStore';
import type { SimulationParams } from '@/types';
import * as THREE from 'three';

// Color scale component (left side of the 3D view)
function ColorLegend() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 20;
    canvas.height = 200;
    const grad = ctx.createLinearGradient(0, 200, 0, 0);
    grad.addColorStop(0.0, 'rgb(0,0,170)');
    grad.addColorStop(0.2, 'rgb(0,102,255)');
    grad.addColorStop(0.4, 'rgb(0,255,0)');
    grad.addColorStop(0.6, 'rgb(255,255,0)');
    grad.addColorStop(0.8, 'rgb(255,170,0)');
    grad.addColorStop(1.0, 'rgb(255,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 20, 200);
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2"
      style={{ opacity: 0.8 }}
    >
      <canvas
        ref={canvasRef}
        width={20}
        height={200}
        style={{ width: 20, height: 200, borderRadius: 4 }}
      />
      <div className="absolute left-6 top-0 flex h-full flex-col justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>125C</span>
        <span>100C</span>
        <span>75C</span>
        <span>50C</span>
        <span>25C</span>
      </div>
    </div>
  );
}

// --- Chip Wireframe ---
function ChipGeometry({ params }: { params: SimulationParams }) {
  const { width, height, thickness, power, material } = params.chip;
  const w = width / 10;
  const h = height / 10;
  const t = thickness / 10;

  return (
    <group>
      {/* Wireframe box */}
      <Box args={[w, t, h]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#45B7D1" wireframe transparent opacity={0.6} />
      </Box>
      {/* Semi-transparent fill */}
      <Box args={[w, t, h]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#45B7D1" transparent opacity={0.05} />
      </Box>
      {/* Power label */}
      <Text
        position={[0, t / 2 + 0.3, 0]}
        fontSize={0.4}
        color="#FF6B6B"
        anchorX="center"
        anchorY="bottom"
      >
        {`${power}W`}
      </Text>
      {/* Material label */}
      <Text
        position={[0, -t / 2 - 0.1, 0]}
        fontSize={0.2}
        color="#8BA3BF"
        anchorX="center"
        anchorY="top"
      >
        {material}
      </Text>
    </group>
  );
}

// --- Heat Sink ---
function HeatSinkGeometry({ params }: { params: SimulationParams }) {
  const { heatSink, chip } = params;
  if (!heatSink.enabled) return null;

  const chipW = chip.width / 10;
  const chipH = chip.height / 10;
  const chipT = chip.thickness / 10;
  const finH = (heatSink.finHeight || 40) / 10;
  const finCount = heatSink.finCount || 8;
  const finThickness = 0.1;
  const baseT = (heatSink.baseThickness || 5) / 10;

  const baseY = chipT / 2 + baseT / 2 + 0.05;

  return (
    <group>
      {/* Base plate */}
      <Box args={[chipW + 0.5, baseT, chipH + 0.5]} position={[0, baseY, 0]}>
        <meshBasicMaterial color="#4ECDC4" wireframe transparent opacity={0.5} />
      </Box>
      {/* Fins */}
      {Array.from({ length: finCount }).map((_, i) => {
        const x = -chipW / 2 + (chipW / (finCount - 1)) * i;
        return (
          <Box
            key={i}
            args={[finThickness, finH, chipH + 0.3]}
            position={[x, baseY + baseT / 2 + finH / 2, 0]}
          >
            <meshBasicMaterial color="#4ECDC4" wireframe transparent opacity={0.4} />
          </Box>
        );
      })}
    </group>
  );
}

// --- Particle Cloud ---
function ParticleCloud({ particles }: { particles: ParticleData[] }) {
  const pointsRef = useRef<Points>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = particles.length || 1;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    if (particles.length === 0) {
      return { positions: pos, colors: col, sizes: siz };
    }

    const scale = 0.1;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      pos[i * 3] = p.x * scale;
      pos[i * 3 + 1] = p.y * scale;
      pos[i * 3 + 2] = p.z * scale;

      const [r, g, b] = p.color;
      col[i * 3] = r / 255;
      col[i * 3 + 1] = g / 255;
      col[i * 3 + 2] = b / 255;

      const sizeFactor = Math.min(1, Math.max(0.3, (p.temperature - 25) / 100));
      siz[i] = 0.05 + sizeFactor * 0.07;
    }

    return { positions: pos, colors: col, sizes: siz };
  }, [particles]);

  useFrame(() => {
    if (pointsRef.current && particles.length > 0) {
      pointsRef.current.rotation.y += 0.0005;
    }
  });

  if (particles.length === 0) return null;

  return (
    <group>
      <points
        ref={pointsRef}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (typeof e.index === 'number') {
            setHoveredIdx(e.index);
          }
        }}
        onPointerOut={() => setHoveredIdx(null)}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            args={[sizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Hover tooltip */}
      {hoveredIdx !== null && particles[hoveredIdx] && (
        <Text
          position={[
            particles[hoveredIdx].x * 0.1 + 0.5,
            particles[hoveredIdx].y * 0.1 + 0.5,
            particles[hoveredIdx].z * 0.1,
          ]}
          fontSize={0.15}
          color="#E6EDF5"
          anchorX="left"
          anchorY="middle"
        >
          {`T: ${particles[hoveredIdx].temperature.toFixed(1)}C`}
        </Text>
      )}
    </group>
  );
}

// --- Floating Data Labels ---
function DataLabels({ stats, params }: { stats: { maxTemp: number; avgTemp: number }; params: SimulationParams }) {
  const chipT = params.chip.thickness / 10;
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      <Text
        position={[0, chipT / 2 + 1, 0]}
        fontSize={0.25}
        color="#E6EDF5"
        anchorX="center"
        anchorY="bottom"
      >
        {`芯片核心: ${stats.maxTemp.toFixed(1)}C`}
      </Text>
      {params.heatSink.enabled && (
        <Text
          position={[0, chipT / 2 + (params.heatSink.finHeight || 40) / 10 + 1.5, 0]}
          fontSize={0.2}
          color="#8BA3BF"
          anchorX="center"
          anchorY="bottom"
        >
          {`散热器表面: ${(stats.avgTemp * 0.85).toFixed(1)}C`}
        </Text>
      )}
    </group>
  );
}

// --- Scene Content ---
function SceneContent({
  particles,
  params,
  stats,
}: {
  particles: ParticleData[];
  params: SimulationParams;
  stats: { maxTemp: number; avgTemp: number };
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <ChipGeometry params={params} />
      <HeatSinkGeometry params={params} />
      <ParticleCloud particles={particles} />
      <DataLabels stats={stats} params={params} />

      <Grid
        position={[0, -2, 0]}
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="rgba(78, 205, 196, 0.08)"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="rgba(78, 205, 196, 0.15)"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />

      <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
        <GizmoViewport
          axisColors={['#FF6B6B', '#A8E6CF', '#45B7D1']}
          labelColor="#E6EDF5"
        />
      </GizmoHelper>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minDistance={2}
        maxDistance={50}
      />
    </>
  );
}

// ==================== Main SimulationScene ====================

interface SimulationSceneProps {
  particles: ParticleData[];
  params: SimulationParams;
  stats: { maxTemp: number; avgTemp: number };
  viewMode: 'temperature' | 'flow' | 'particle';
  onViewModeChange: (mode: 'temperature' | 'flow' | 'particle') => void;
  currentTime: number;
  totalTime: number;
  simState: string;
}

export default function SimulationScene({
  particles,
  params,
  stats,
  viewMode,
  onViewModeChange,
  currentTime,
  totalTime,
  simState,
}: SimulationSceneProps) {
  const viewModes: { value: typeof viewMode; label: string }[] = [
    { value: 'temperature', label: '3D 粒子' },
    { value: 'flow', label: '温度云图' },
    { value: 'particle', label: '流线图' },
  ];

  return (
    <div className="relative h-full w-full" style={{ background: 'var(--bg-abyss)' }}>
      {/* 3D Canvas */}
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas
          camera={{ position: [8, 6, 8], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#030810');
          }}
        >
          <SceneContent particles={particles} params={params} stats={stats} />
        </Canvas>
      </div>

      {/* Color Legend */}
      <ColorLegend />

      {/* View mode tabs */}
      <div
        className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {viewModes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onViewModeChange(mode.value)}
            className="px-3 py-1.5 text-xs transition-all duration-200"
            style={{
              color: viewMode === mode.value ? 'var(--accent-flow)' : 'var(--text-body)',
              background: viewMode === mode.value ? 'var(--bg-raised)' : 'transparent',
              borderBottom: viewMode === mode.value ? '2px solid var(--accent-flow)' : '2px solid transparent',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* View controls toolbar */}
      <div
        className="absolute right-4 top-4 z-10 flex flex-col gap-1"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}
      >
        <SceneToolbarButton
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>}
          title="重置视角"
          onClick={() => {
            window.location.reload();
          }}
        />
        <SceneToolbarButton
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>}
          title="全屏"
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
        />
        <SceneToolbarButton
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4m-9-9h4m14 0h-4m-2.5-6.5l-2.8 2.8m9.6 9.6l-2.8-2.8m0-9.6l2.8 2.8m-9.6 9.6l2.8-2.8"/></svg>}
          title="截图"
          onClick={() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const link = document.createElement('a');
              link.download = `simulation-${Date.now()}.png`;
              link.href = canvas.toDataURL();
              link.click();
            }
          }}
        />
      </div>

      {/* Time slider (only when simulation has data) */}
      {(simState === 'running' || simState === 'paused' || simState === 'completed') && (
        <div
          className="absolute bottom-4 left-1/2 z-10 flex w-4/5 max-w-2xl -translate-x-1/2 items-center gap-3 px-4 py-2"
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span className="text-xs font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
            {currentTime.toFixed(3)}s / {totalTime.toFixed(3)}s
          </span>
          <input
            type="range"
            min={0}
            max={totalTime}
            step={0.001}
            value={currentTime}
            readOnly
            className="w-full"
            style={{ accentColor: 'var(--accent-flow)' }}
          />
        </div>
      )}

      {/* Empty state overlay */}
      {particles.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-flow)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4m-9-9h4m14 0h-4m-2.5-6.5l-2.8 2.8m9.6 9.6l-2.8-2.8m0-9.6l2.8 2.8m-9.6 9.6l2.8-2.8"/>
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-body)' }}>点击「启动仿真」开始计算</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>芯片粒子温度场将在此显示</p>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Toolbar button ---
function SceneToolbarButton({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-8 w-8 items-center justify-center transition-all duration-200"
      style={{
        color: 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.background = 'var(--bg-raised)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
    </button>
  );
}
