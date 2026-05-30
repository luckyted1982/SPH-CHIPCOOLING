// ThermalCanvas.tsx — Procedural temperature distribution preview using Canvas 2D
import { memo, useRef, useEffect, useCallback } from 'react';

export interface ThermalPattern {
  type: 'cpu_air' | 'cpu_water' | 'gpu_water' | 'power' | 'immersion' | 'phone' | 'sic' | 'h100';
  baseTemp: number;
  maxTemp: number;
  hotspotX: number;
  hotspotY: number;
  hotspotRadius: number;
  spreadX: number;
  spreadY: number;
  spotCount: number;
  asymmetry: number;
}

const PATTERNS: Record<ThermalPattern['type'], Omit<ThermalPattern, 'type'>> = {
  cpu_air: {
    baseTemp: 35, maxTemp: 95, hotspotX: 0.5, hotspotY: 0.42,
    hotspotRadius: 0.18, spreadX: 0.7, spreadY: 0.75, spotCount: 3, asymmetry: 0.2,
  },
  cpu_water: {
    baseTemp: 30, maxTemp: 72, hotspotX: 0.5, hotspotY: 0.4,
    hotspotRadius: 0.15, spreadX: 0.6, spreadY: 0.65, spotCount: 2, asymmetry: 0.1,
  },
  gpu_water: {
    baseTemp: 32, maxTemp: 68, hotspotX: 0.5, hotspotY: 0.45,
    hotspotRadius: 0.22, spreadX: 0.85, spreadY: 0.7, spotCount: 4, asymmetry: 0.35,
  },
  power: {
    baseTemp: 40, maxTemp: 110, hotspotX: 0.5, hotspotY: 0.5,
    hotspotRadius: 0.12, spreadX: 0.5, spreadY: 0.5, spotCount: 1, asymmetry: 0,
  },
  immersion: {
    baseTemp: 25, maxTemp: 55, hotspotX: 0.25, hotspotY: 0.5,
    hotspotRadius: 0.14, spreadX: 0.9, spreadY: 0.85, spotCount: 6, asymmetry: 0.5,
  },
  phone: {
    baseTemp: 30, maxTemp: 78, hotspotX: 0.5, hotspotY: 0.35,
    hotspotRadius: 0.16, spreadX: 0.5, spreadY: 0.6, spotCount: 2, asymmetry: 0.15,
  },
  sic: {
    baseTemp: 38, maxTemp: 105, hotspotX: 0.5, hotspotY: 0.48,
    hotspotRadius: 0.2, spreadX: 0.65, spreadY: 0.55, spotCount: 3, asymmetry: 0.25,
  },
  h100: {
    baseTemp: 28, maxTemp: 65, hotspotX: 0.5, hotspotY: 0.5,
    hotspotRadius: 0.25, spreadX: 0.9, spreadY: 0.85, spotCount: 5, asymmetry: 0.3,
  },
};

// Temperature to color mapping (blue -> cyan -> green -> yellow -> orange -> red)
function tempToColor(t: number, tMin: number, tMax: number): [number, number, number] {
  const f = Math.max(0, Math.min(1, (t - tMin) / (tMax - tMin)));
  const stops: [number, number, number, number][] = [
    [0.0, 0x03, 0x08, 0x10],   // bg-abyss (cold)
    [0.15, 0x0A, 0x1C, 0x30],  // bg-surface
    [0.3,  0x11, 0x4E, 0x5E],  // dark teal
    [0.45, 0x27, 0x87, 0xA1],  // teal (accent-stable dark)
    [0.55, 0x4E, 0xCD, 0xC4],  // accent-flow
    [0.65, 0xA8, 0xE6, 0xCF],  // accent-particle
    [0.75, 0xFF, 0xD9, 0x3D],  // accent-energy
    [0.85, 0xFF, 0x8C, 0x42],  // orange
    [0.93, 0xFF, 0x6B, 0x6B],  // accent-thermal
    [1.0,  0xCC, 0x22, 0x22],  // deep red
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (f >= stops[i][0] && f <= stops[i + 1][0]) {
      const localF = (f - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      const r = Math.round(stops[i][1] + (stops[i + 1][1] - stops[i][1]) * localF);
      const g = Math.round(stops[i][2] + (stops[i + 1][2] - stops[i][2]) * localF);
      const b = Math.round(stops[i][3] + (stops[i + 1][3] - stops[i][3]) * localF);
      return [r, g, b];
    }
  }
  return [stops[stops.length - 1][1], stops[stops.length - 1][2], stops[stops.length - 1][3]];
}

function fbmNoise(x: number, y: number, seed: number): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 5; i++) {
    const nx = Math.sin(x * freq * 3.7 + seed + i * 7.1) * Math.cos(y * freq * 2.3 + seed * 1.3 + i * 5.3);
    const ny = Math.sin(y * freq * 3.1 + seed * 2.7 + i * 3.7) * Math.cos(x * freq * 2.9 + seed * 0.7 + i * 6.1);
    val += amp * (0.5 + 0.5 * Math.sin(nx * 6.28 + ny * 6.28));
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

function generateThermalField(
  w: number,
  h: number,
  pattern: Omit<ThermalPattern, 'type'>,
  seed: number,
  time: number
): ImageData {
  const imageData = new ImageData(w, h);
  const { baseTemp, maxTemp, hotspotX, hotspotY, hotspotRadius, spreadX, spreadY, spotCount, asymmetry } = pattern;

  const hotspots = Array.from({ length: spotCount }, (_, i) => ({
    x: hotspotX + (i === 0 ? 0 : (Math.sin(seed * 3.7 + i * 2.1) * 0.5 * asymmetry)),
    y: hotspotY + (i === 0 ? 0 : (Math.cos(seed * 2.3 + i * 1.7) * 0.3)),
    intensity: i === 0 ? 1.0 : 0.4 + 0.3 * Math.sin(seed + i),
  }));

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const nx = px / w;
      const ny = py / h;

      let temp = baseTemp;

      // Hot spot contributions
      for (const hs of hotspots) {
        const dx = (nx - hs.x) / (hotspotRadius * spreadX);
        const dy = (ny - hs.y) / (hotspotRadius * spreadY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.exp(-dist * dist * 2.5);
        temp += (maxTemp - baseTemp) * falloff * hs.intensity;
      }

      // Noise variation (organic texture)
      const noise = fbmNoise(nx * 4, ny * 4, seed + py * 0.01);
      temp += noise * 6 - 3;

      // Heat shimmer animation
      const shimmer = Math.sin(time * 2 + nx * 8 + ny * 6 + seed) * 1.5;
      temp += shimmer;

      // Cooler edges
      const edgeDist = Math.min(nx, ny, 1 - nx, 1 - ny) * 4;
      if (edgeDist < 1) temp *= (0.85 + 0.15 * edgeDist);

      const [r, g, b] = tempToColor(temp, 15, 120);
      const idx = (py * w + px) * 4;
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }

  return imageData;
}

interface ThermalCanvasProps {
  patternType: ThermalPattern['type'];
  width?: number;
  height?: number;
  animate?: boolean;
  seed?: number;
  className?: string;
  style?: React.CSSProperties;
}

const ThermalCanvas = memo(function ThermalCanvas({
  patternType,
  width = 360,
  height = 180,
  animate = false,
  seed = 42,
  className,
  style,
}: ThermalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  const pattern = PATTERNS[patternType];

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const imageData = generateThermalField(width, height, pattern, seed, time);
      ctx.putImageData(imageData, 0, 0);

      // Draw chip outline overlay
      ctx.strokeStyle = 'rgba(78, 205, 196, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(width * 0.15, height * 0.2, width * 0.7, height * 0.6);

      // Draw cooler outline based on type
      if (patternType === 'cpu_air') {
        // Fin array above chip
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.1)';
        const finX = width * 0.1;
        const finY = height * 0.05;
        const finW = width * 0.8;
        const finH = height * 0.15;
        ctx.strokeRect(finX, finY, finW, finH);
        for (let i = 1; i < 8; i++) {
          const x = finX + (finW * i) / 8;
          ctx.beginPath();
          ctx.moveTo(x, finY);
          ctx.lineTo(x, finY + finH);
          ctx.stroke();
        }
      } else if (patternType.includes('water')) {
        // Water block outline
        ctx.strokeStyle = 'rgba(69, 183, 209, 0.12)';
        ctx.strokeRect(width * 0.2, height * 0.1, width * 0.6, height * 0.3);
      } else if (patternType === 'immersion') {
        // Multiple chips
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.1)';
        for (let i = 0; i < 4; i++) {
          ctx.strokeRect(width * (0.08 + i * 0.24), height * 0.25, width * 0.18, height * 0.5);
        }
      }

      // Temperature color bar at bottom
      const barH = 4;
      const barY = height - barH;
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      const stops: [number, [number, number, number]][] = [
        [0, [0x03, 0x08, 0x10]],
        [0.15, [0x27, 0x87, 0xA1]],
        [0.4, [0x4E, 0xCD, 0xC4]],
        [0.6, [0xA8, 0xE6, 0xCF]],
        [0.8, [0xFF, 0xD9, 0x3D]],
        [1, [0xFF, 0x6B, 0x6B]],
      ];
      for (const [pos, [r, g, b]] of stops) {
        grad.addColorStop(pos as number, `rgb(${r},${g},${b})`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, barY, width, barH);
    },
    [width, height, pattern, patternType, seed]
  );

  useEffect(() => {
    draw(0);
  }, [draw]);

  useEffect(() => {
    if (!animate) return;
    let running = true;

    function loop() {
      if (!running) return;
      timeRef.current += 0.016;
      draw(timeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: `${width}px`, height: `${height}px`, ...style }}
    />
  );
});

export default ThermalCanvas;
