import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  MessageSquare,
  Cpu,
  BarChart3,
  ChevronDown,
  ArrowRight,
  Zap,
  Wind,
  Droplets,
  Server,
} from 'lucide-react';
import type { SimulationParams } from '@/types';
import { getSceneTemplates, estimateMaxTemperature } from '@/lib/simulation';

gsap.registerPlugin(ScrollTrigger);

// ============================================================
// 3D Hero Scene Components
// ============================================================

function ChipWireframe({ mousePos: _mousePos }: { mousePos: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Group>(null);
  const finsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (Math.PI * 2) / 60;
    }
    // Mouse repulsion on particles (handled in ParticleCloud)
  });

  const chipWidth = 40;
  const chipHeight = 2;
  const chipDepth = 40;

  return (
    <group ref={meshRef}>
      {/* Main chip body - wireframe */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[chipWidth, chipHeight, chipDepth]} />
        <meshBasicMaterial color="#4ECDC4" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Inner glow */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[chipWidth * 0.95, chipHeight * 1.01, chipDepth * 0.95]} />
        <meshBasicMaterial color="#FF6B6B" wireframe transparent opacity={0.1} />
      </mesh>

      {/* Heat sink fins */}
      <group ref={finsRef} position={[0, -chipHeight / 2 - 2, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh
            key={`fin-${i}`}
            position={[(i - 3.5) * 4.5, -5, 0]}
          >
            <boxGeometry args={[2, 10, 36]} />
            <meshBasicMaterial color="#45B7D1" wireframe transparent opacity={0.15} />
          </mesh>
        ))}
      </group>

      {/* Flow arrows */}
      <group position={[0, chipHeight / 2 + 3, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`flow-${i}`} position={[0, i * 2, 0]}>
            <coneGeometry args={[0.3, 1, 4]} />
            <meshBasicMaterial color="#A8E6CF" transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ParticleCloud({ mousePos }: { mousePos: React.MutableRefObject<{ x: number }> }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 3000;

  const { positions, originalPositions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const origPos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 15 + Math.random() * 40;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (Math.random() - 0.5) * 60;
      const z = r * Math.sin(phi) * Math.sin(theta);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      origPos[i * 3] = x;
      origPos[i * 3 + 1] = y;
      origPos[i * 3 + 2] = z;

      // Temperature-based coloring
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter < 20) {
        col[i * 3] = 1; col[i * 3 + 1] = 0.42; col[i * 3 + 2] = 0.42;
      } else if (distFromCenter < 35) {
        col[i * 3] = 0.27; col[i * 3 + 1] = 0.72; col[i * 3 + 2] = 0.82;
      } else {
        col[i * 3] = 0.31; col[i * 3 + 1] = 0.80; col[i * 3 + 2] = 0.77;
      }
    }

    return { positions: pos, originalPositions: origPos, colors: col };
  }, []);

  const displacement = useMemo(() => new Float32Array(count * 3).fill(0), []);

  useFrame(() => {
    if (!pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const mouseX = mousePos.current.x;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Gentle orbit
      const t = Date.now() * 0.0001;
      posArray[ix] = originalPositions[ix] + Math.sin(t + i) * 0.5;
      posArray[iz] = originalPositions[iz] + Math.cos(t + i) * 0.5;

      // Mouse repulsion
      const dx = posArray[ix] - mouseX * 50;
      const dy = posArray[iy];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 && dist > 0.1) {
        const force = (30 - dist) / 30 * 0.3;
        displacement[ix] += (dx / dist) * force;
        displacement[iy] += (dy / dist) * force;
      }

      // Decay
      displacement[ix] *= 0.95;
      displacement[iy] *= 0.95;
      displacement[iz] *= 0.95;

      posArray[ix] += displacement[ix];
      posArray[iy] += displacement[iy];
      posArray[iz] += displacement[iz];
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        transparent
        opacity={0.7}
        vertexColors
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function HeroScene() {
  const mousePos = useRef({ x: 0, y: 0 });
  useThree(); // initializes context

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <ChipWireframe mousePos={mousePos} />
      <ParticleCloud mousePos={mousePos} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={Math.PI * 0.3}
      />
    </>
  );
}

// ============================================================
// Typing Effect Component
// ============================================================

function TypingInput() {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = '模拟一个 100W CPU 在铝散热器下的风冷散热';

  useEffect(() => {
    let charIndex = 0;
    let forward = true;
    let loopCount = 0;

    const typeInterval = setInterval(() => {
      if (forward) {
        if (charIndex < fullText.length) {
          charIndex++;
          setDisplayText(fullText.slice(0, charIndex));
        } else {
          forward = false;
          setTimeout(() => {}, 800);
        }
      } else {
        if (charIndex > 0) {
          charIndex--;
          setDisplayText(fullText.slice(0, charIndex));
        } else {
          forward = true;
          loopCount++;
          if (loopCount >= 2) {
            loopCount = 0;
            clearInterval(typeInterval);
            setTimeout(() => {
              // Restart after 3s pause
              const restart = setInterval(() => {
                if (forward) {
                  if (charIndex < fullText.length) {
                    charIndex++;
                    setDisplayText(fullText.slice(0, charIndex));
                  } else {
                    forward = false;
                  }
                } else {
                  if (charIndex > 0) {
                    charIndex--;
                    setDisplayText(fullText.slice(0, charIndex));
                  } else {
                    forward = true;
                  }
                }
              }, 80);
              return () => clearInterval(restart);
            }, 3000);
          }
        }
      }
    }, 80);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, []);

  return (
    <div
      className="mx-auto flex h-12 w-full max-w-[640px] items-center gap-2 rounded-md border px-4 font-mono text-sm"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-muted)',
      }}
    >
      <span style={{ color: 'var(--accent-flow)' }}>&gt;</span>
      <span className="flex-1 truncate">
        {displayText}
        <span
          className="inline-block w-[2px] h-4 ml-0.5 align-middle"
          style={{
            background: showCursor ? 'var(--accent-flow)' : 'transparent',
          }}
        />
      </span>
    </div>
  );
}

// ============================================================
// Scene Card Temperature Preview
// ============================================================

function TempPreview({ templateIndex }: { templateIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Generate procedural thermal texture
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    const templates = getSceneTemplates();
    const tmax = estimateMaxTemperature(templates[templateIndex].defaultParams as SimulationParams);
    const tmin = 25;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const ny = y / h;

        // Distance from center
        const cx = 0.5 - nx;
        const cy = 0.5 - ny;
        const dist = Math.sqrt(cx * cx + cy * cy);

        // Temperature distribution (center = hot)
        let temp = tmax - (tmax - tmin) * (dist * 1.5);
        temp += (Math.sin(nx * 12 + ny * 8) + Math.cos(nx * 6 - ny * 14)) * 5;
        temp = Math.max(tmin, Math.min(tmax, temp));

        const t = (temp - tmin) / (tmax - tmin);

        // Color mapping
        let r: number, g: number, b: number;
        if (t < 0.2) {
          const s = t / 0.2;
          r = 0; g = Math.round(s * 102); b = Math.round(170 + s * 85);
        } else if (t < 0.4) {
          const s = (t - 0.2) / 0.2;
          r = 0; g = Math.round(102 + s * 153); b = Math.round(255 * (1 - s));
        } else if (t < 0.6) {
          const s = (t - 0.4) / 0.2;
          r = Math.round(s * 255); g = 255; b = 0;
        } else if (t < 0.8) {
          const s = (t - 0.6) / 0.2;
          r = 255; g = Math.round(255 - s * 85); b = 0;
        } else {
          const s = (t - 0.8) / 0.2;
          r = 255; g = Math.round(170 * (1 - s)); b = 0;
        }

        const idx = (y * w + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [templateIndex]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={120}
      className="w-full"
      style={{ height: '120px', borderRadius: '8px 8px 0 0' }}
    />
  );
}

// ============================================================
// Main Home Page
// ============================================================

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const templates = useMemo(() => getSceneTemplates(), []);

  useGSAP(() => {
    // Hero entrance animations
    gsap.to('.hero-title-char', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.03,
      ease: 'power3.out',
      delay: 0.5,
    });

    gsap.to('.hero-subtitle', {
      y: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
      delay: 1.2,
    });

    gsap.to('.hero-cta', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.2,
      ease: 'power2.out',
      delay: 1.6,
    });

    gsap.to('.hero-input', {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
      delay: 2.0,
    });

    gsap.to('.hero-scroll', {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
      delay: 2.5,
    });

    // Features scroll reveal
    ScrollTrigger.create({
      trigger: featuresRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to('.features-title', { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
        gsap.to('.feature-card', {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power3.out', delay: 0.2,
        });
      },
      once: true,
    });

    // Workflow scroll reveal
    ScrollTrigger.create({
      trigger: workflowRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to('.workflow-title', { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
        gsap.to('.workflow-step', {
          scale: 1, opacity: 1, duration: 0.5, stagger: 0.2, ease: 'back.out(1.5)', delay: 0.2,
        });
      },
      once: true,
    });

    // Scenes scroll reveal
    ScrollTrigger.create({
      trigger: scenesRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to('.scenes-title', { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
        gsap.to('.scene-card', {
          y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out', delay: 0.2,
        });
      },
      once: true,
    });

    // Stats counter animation
    ScrollTrigger.create({
      trigger: statsRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to('.stat-item', { y: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power3.out' });
        // Counter animation handled separately
      },
      once: true,
    });

    // CTA scroll reveal
    ScrollTrigger.create({
      trigger: ctaRef.current,
      start: 'top 85%',
      onEnter: () => {
        gsap.to('.cta-content', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      },
      once: true,
    });
  }, { scope: heroRef });

  // Stats counter
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const statsStarted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !statsStarted.current) {
          statsStarted.current = true;
          const targets = [120, 10, 1, 3];
          const durations = [2000, 2000, 1500, 1500];

          targets.forEach((target, i) => {
            const startTime = performance.now();
            const animate = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / durations[i], 1);
              const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
              setCounts((prev) => {
                const next = [...prev];
                next[i] = Math.round(eased * target);
                return next;
              });
              if (progress < 1) requestAnimationFrame(animate);
            };
            setTimeout(() => requestAnimationFrame(animate), i * 150);
          });
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const titleText = '自然语言驱动的芯片散热仿真';
  const titleChars = titleText.split('');

  const handleScrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div style={{ background: 'var(--bg-abyss)' }}>
      {/* ========== HERO ========== */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'var(--bg-abyss)' }}
      >
        {/* 3D Background */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        >
          <Canvas
            camera={{ position: [0, 30, 80], fov: 50 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <HeroScene />
          </Canvas>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-[960px] px-4 text-center">
          {/* Main Title */}
          <h1
            className="font-display mb-6"
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 300,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            {titleChars.map((char, i) => (
              <span
                key={i}
                className="hero-title-char inline-block"
                style={{ opacity: 0, transform: 'translateY(40px)' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle mx-auto mb-8 max-w-[640px]"
            style={{
              fontSize: '1.25rem',
              lineHeight: 1.6,
              color: 'var(--text-body)',
              opacity: 0,
              transform: 'translateY(20px)',
            }}
          >
            基于 SPH 光滑粒子流体动力学方法，用一句话描述需求，自动生成高精度散热仿真
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <button
              className="hero-cta inline-flex items-center gap-2 rounded-md px-8 py-3.5 text-sm font-medium transition-all duration-200"
              style={{
                background: 'var(--accent-flow)',
                color: 'var(--bg-abyss)',
                opacity: 0,
                transform: 'translateY(20px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(78, 205, 196, 0.3)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.filter = 'none';
              }}
              onClick={() => navigate('/workspace')}
            >
              开始仿真
            </button>
            <button
              className="hero-cta inline-flex items-center gap-2 rounded-md border px-8 py-3.5 text-sm font-medium transition-all duration-200"
              style={{
                background: 'transparent',
                borderColor: 'var(--border-active)',
                color: 'var(--text-primary)',
                opacity: 0,
                transform: 'translateY(20px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(78, 205, 196, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              onClick={() => handleScrollTo('demo-section')}
            >
              查看演示
            </button>
          </div>

          {/* Typing Input */}
          <div
            className="hero-input"
            style={{ opacity: 0, transform: 'translateY(20px)' }}
          >
            <TypingInput />
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: 0 }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            向下滚动探索
          </span>
          <ChevronDown className="animate-float h-4 w-4" style={{ color: 'var(--text-muted)' }} />
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section
        id="features"
        ref={featuresRef}
        className="relative py-20"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <h2
            className="features-title mb-12 text-center font-display text-h2"
            style={{
              color: 'var(--text-primary)',
              opacity: 0,
              transform: 'translateY(30px)',
            }}
          >
            核心能力
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: '自然语言驱动',
                desc: '用中文或英文描述散热场景，系统自动解析芯片型号、功耗、冷却方式，生成仿真参数配置',
              },
              {
                icon: Cpu,
                title: '全参数精细控制',
                desc: '芯片尺寸、材料导热系数、散热器几何、流体流速，每一个参数都可手动微调',
              },
              {
                icon: BarChart3,
                title: '实时可视化分析',
                desc: '2D/3D 温度云图、粒子轨迹追踪、热阻曲线，仿真过程与结果一目了然',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="feature-card group rounded-lg border p-6 transition-all duration-300"
                  style={{
                    background: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    opacity: 0,
                    transform: 'translateY(24px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-md transition-colors duration-300"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <Icon
                      className="h-8 w-8 transition-colors duration-300"
                      style={{ color: 'var(--accent-flow)' }}
                    />
                  </div>
                  <h3 className="mb-2 text-h4" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-body" style={{ color: 'var(--text-body)' }}>
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== WORKFLOW DEMO ========== */}
      <section
        id="demo-section"
        ref={workflowRef}
        className="relative py-20"
        style={{ background: 'var(--bg-abyss)' }}
      >
        <div className="mx-auto max-w-[1080px] px-4 lg:px-6">
          <h2
            className="workflow-title mb-12 text-center font-display text-h2"
            style={{
              color: 'var(--text-primary)',
              opacity: 0,
              transform: 'translateY(30px)',
            }}
          >
            三步完成散热仿真
          </h2>

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Connecting line - horizontal desktop, vertical mobile */}
            <div
              className="hidden md:block absolute top-5 left-[12%] right-[12%] h-0.5"
              style={{
                borderTop: '2px dashed var(--border-subtle)',
              }}
            />
            <div
              className="md:hidden absolute left-5 top-5 bottom-5 w-0.5"
              style={{
                borderLeft: '2px dashed var(--border-subtle)',
              }}
            />

            {[
              {
                step: '01',
                title: '描述需求',
                desc: '「100W CPU，铝散热器，风冷」——自然语言或选择模板',
              },
              {
                step: '02',
                title: '自动配置',
                desc: '系统解析参数，生成芯片几何模型与 SPH 粒子分布',
              },
              {
                step: '03',
                title: '运行仿真',
                desc: 'GPU 加速计算，实时观察温度场与粒子运动',
              },
              {
                step: '04',
                title: '分析结果',
                desc: '查看最高温度、热阻、温度分布云图，导出报告',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="workflow-step relative flex md:flex-col items-start md:items-center gap-4 md:gap-4 md:text-center z-10 flex-1"
                style={{
                  opacity: 0,
                  transform: 'scale(0.5)',
                }}
              >
                {/* Step node */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-display text-lg font-semibold transition-all duration-300"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: i === 0 ? 'var(--accent-flow)' : 'var(--border-subtle)',
                    color: i === 0 ? 'var(--accent-flow)' : 'var(--text-muted)',
                  }}
                >
                  {item.step}
                </div>

                <div className="flex-1">
                  <h4
                    className="mb-1 text-base font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-body)' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SCENES ========== */}
      <section
        id="scenes"
        ref={scenesRef}
        className="relative py-20"
        style={{ background: 'var(--bg-deep)' }}
      >
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <h2
            className="scenes-title mb-12 text-center font-display text-h2"
            style={{
              color: 'var(--text-primary)',
              opacity: 0,
              transform: 'translateY(30px)',
            }}
          >
            覆盖芯片散热全场景
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {templates.map((scene, i) => {
              const icons = [Wind, Droplets, Zap, Server];
              const Icon = icons[i] || Wind;
              return (
                <div
                  key={scene.id}
                  className="scene-card group overflow-hidden rounded-lg border transition-all duration-300"
                  style={{
                    background: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    opacity: 0,
                    transform: 'translateY(24px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Temperature preview */}
                  <TempPreview templateIndex={i} />

                  <div className="p-5">
                    {/* Tags */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {scene.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium"
                          style={{
                            background: 'var(--bg-surface)',
                            color: 'var(--accent-flow)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 text-h4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Icon className="h-4 w-4" style={{ color: 'var(--accent-flow)' }} />
                      {scene.name}
                    </h3>

                    {/* Description */}
                    <p className="text-body" style={{ color: 'var(--text-body)' }}>
                      {scene.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section
        id="stats"
        ref={statsRef}
        className="relative py-12"
        style={{ background: 'var(--bg-abyss)' }}
      >
        <div className="mx-auto max-w-[960px] px-4 lg:px-6">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { value: counts[0], suffix: '×', label: 'GPU 并行加速', display: '仿真加速比' },
              { value: counts[1], suffix: 'M+', label: '大规模 SPH 计算', display: '支持粒子数' },
              { value: counts[2], suffix: '', label: '完全开源免费', display: '开源协议' },
              { value: counts[3], suffix: ' 种', label: '流体 / 固体 / 传热', display: '覆盖物理场' },
            ].map((stat, i) => (
              <div
                key={i}
                className="stat-item flex flex-col items-center text-center"
                style={{
                  opacity: 0,
                  transform: 'translateY(20px)',
                }}
              >
                <div className="font-display text-data" style={{ color: 'var(--accent-flow)' }}>
                  {stat.value}
                  {stat.suffix}
                </div>
                <div className="mt-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {stat.display}
                </div>
                <div className="text-caption" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section
        id="cta"
        ref={ctaRef}
        className="relative py-20 overflow-hidden"
        style={{ background: 'var(--bg-deep)' }}
      >
        {/* Glow background */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: '600px',
            height: '600px',
            background: 'var(--bg-surface)',
            opacity: 0.5,
            filter: 'blur(80px)',
          }}
        />

        <div
          className="cta-content relative z-10 mx-auto max-w-[600px] px-4 text-center"
          style={{
            opacity: 0,
            transform: 'translateY(30px)',
          }}
        >
          <h2 className="mb-4 font-display text-h2" style={{ color: 'var(--text-primary)' }}>
            开始你的第一次仿真
          </h2>
          <p className="mb-8 text-body" style={{ color: 'var(--text-body)' }}>
            无需复杂的仿真软件学习曲线，用自然语言描述，即刻获得专业的芯片散热分析
          </p>

          <button
            className="mb-4 inline-flex items-center gap-2 rounded-md px-10 py-4 text-base font-medium transition-all duration-200"
            style={{
              background: 'var(--accent-flow)',
              color: 'var(--bg-abyss)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(78, 205, 196, 0.4)';
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.filter = 'none';
            }}
            onClick={() => navigate('/workspace')}
          >
            进入仿真工作台
            <ArrowRight className="h-4 w-4" />
          </button>

          <div>
            <Link
              to="/templates"
              className="text-sm transition-colors duration-200 hover:opacity-80"
              style={{ color: 'var(--accent-flow)' }}
            >
              浏览仿真模板库
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
