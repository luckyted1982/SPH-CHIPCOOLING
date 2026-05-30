import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { generateParticles3D, getHotSpots, getTempColor } from '@/lib/mockAnalysisData';

/* ============================================================
   Temperature Color Helper (returns Three.Color)
   ============================================================ */
function tempToThreeColor(temp: number): THREE.Color {
  const hex = getTempColor(temp);
  return new THREE.Color(hex);
}

/* ============================================================
   Chip Wireframe Geometry
   ============================================================ */
function ChipWireframe() {
  const chipW = 2;
  const chipH = 2;
  const chipD = 0.3;

  const edges = useMemo(() => {
    const hw = chipW / 2;
    const hh = chipH / 2;
    const hd = chipD / 2;
    const points: [number, number, number][][] = [
      // Bottom face
      [[-hw, -hh, -hd], [hw, -hh, -hd]],
      [[hw, -hh, -hd], [hw, hh, -hd]],
      [[hw, hh, -hd], [-hw, hh, -hd]],
      [[-hw, hh, -hd], [-hw, -hh, -hd]],
      // Top face
      [[-hw, -hh, hd], [hw, -hh, hd]],
      [[hw, -hh, hd], [hw, hh, hd]],
      [[hw, hh, hd], [-hw, hh, hd]],
      [[-hw, hh, hd], [-hw, -hh, hd]],
      // Vertical edges
      [[-hw, -hh, -hd], [-hw, -hh, hd]],
      [[hw, -hh, -hd], [hw, -hh, hd]],
      [[hw, hh, -hd], [hw, hh, hd]],
      [[-hw, hh, -hd], [-hw, hh, hd]],
    ];
    return points;
  }, []);

  return (
    <group>
      {edges.map((edge, i) => (
        <Line
          key={i}
          points={edge}
          color="rgba(78, 205, 196, 0.3)"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
    </group>
  );
}

/* ============================================================
   Particle Points Cloud
   ============================================================ */
function ParticleCloud({ time }: { time: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleData = useMemo(() => generateParticles3D(4000), []);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleData.length * 3);
    const col = new Float32Array(particleData.length * 3);
    const sz = new Float32Array(particleData.length);

    // Time-based temperature modulation
    const timeFactor = Math.min(1, time / 15);

    particleData.forEach((p, i) => {
      const i3 = i * 3;
      // Add slight wobble based on time
      const wobble = Math.sin(time * 0.3 + i * 0.01) * 0.02 * timeFactor;
      pos[i3] = p.x + wobble;
      pos[i3 + 1] = p.y + wobble * 0.7;
      pos[i3 + 2] = p.z;

      // Vary temperature with time
      const tempVariation = Math.sin(time * 0.2 + i * 0.05) * 3 * timeFactor;
      const effectiveTemp = Math.max(25, Math.min(95, p.temperature + tempVariation));
      const c = tempToThreeColor(effectiveTemp);
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;

      sz[i] = p.size * (1 + 0.3 * timeFactor);
    });

    return { positions: pos, colors: col, sizes: sz };
  }, [particleData, time]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ============================================================
   Hotspot Markers
   ============================================================ */
function HotspotMarkers({ time }: { time: number }) {
  const hotspots = useMemo(() => getHotSpots(), []);
  const timeFactor = Math.min(1, time / 15);

  return (
    <group>
      {hotspots.map((spot, i) => {
        const tempVariation = Math.sin(time * 0.2 + i * 0.5) * 2 * timeFactor;
        const effectiveTemp = Math.max(25, Math.min(95, spot.temperature + tempVariation));
        const color = tempToThreeColor(effectiveTemp);

        return (
          <group key={spot.label} position={[spot.x, spot.y, spot.z + 0.2]}>
            {/* Vertical line */}
            <Line
              points={[
                [0, 0, 0],
                [0, 0, 0.5],
              ]}
              color={color}
              lineWidth={1}
              transparent
              opacity={0.7}
            />
            {/* Dot */}
            <mesh position={[0, 0, 0.5]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {/* Label */}
            <Text
              position={[0.1, 0, 0.55]}
              fontSize={0.12}
              color={color.getStyle()}
              anchorX="left"
              anchorY="middle"
              font={undefined}
            >
              {spot.label}: {effectiveTemp.toFixed(1)}°C
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/* ============================================================
   Temperature Scale Bar (3D)
   ============================================================ */
function TemperatureScale() {
  const temps = [25, 40, 55, 70, 85, 100, 125];
  return (
    <group position={[-1.6, -0.8, 0]}>
      {temps.map((t, i) => {
        const y = i * 0.15;
        return (
          <group key={t} position={[0, y, 0]}>
            <mesh>
              <boxGeometry args={[0.08, 0.12, 0.02]} />
              <meshBasicMaterial color={tempToThreeColor(t)} />
            </mesh>
            <Text
              position={[0.15, 0, 0]}
              fontSize={0.08}
              color="rgba(139, 163, 191, 0.8)"
              anchorX="left"
              anchorY="middle"
              font={undefined}
            >
              {t}°C
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/* ============================================================
   Scene Content
   ============================================================ */
function Scene({ time }: { time: number }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <pointLight position={[0, 0, 3]} intensity={0.3} color="#4ECDC4" />

      {/* Camera controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={false}
        minDistance={2}
        maxDistance={8}
      />

      {/* Chip wireframe */}
      <ChipWireframe />

      {/* Particle cloud */}
      <ParticleCloud time={time} />

      {/* Hotspot markers */}
      <HotspotMarkers time={time} />

      {/* Temperature scale */}
      <TemperatureScale />

      {/* Subtle grid */}
      <gridHelper
        args={[4, 20, 'rgba(78, 205, 196, 0.06)', 'rgba(78, 205, 196, 0.03)']}
        position={[0, -1, 0]}
      />
    </>
  );
}

/* ============================================================
   Exported 3D Canvas Wrapper
   ============================================================ */
export default function ParticleScene3D({ time }: { time: number }) {
  return (
    <Canvas
      camera={{ position: [2.5, 2, 3], fov: 50 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Scene time={time} />
    </Canvas>
  );
}
