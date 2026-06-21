import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';

// ─── Animated DNA-like helix of carbon atoms ────────────────────────
const CarbonHelix = () => {
  const groupRef = useRef<THREE.Group>(null);
  const count = 30;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
  });

  const atoms = Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 4;
    const r = 1.8;
    return {
      x: Math.cos(t) * r,
      y: (i / count) * 6 - 3,
      z: Math.sin(t) * r,
      size: 0.08 + (i % 3) * 0.04,
      color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#0ea5e9' : '#f59e0b',
    };
  });

  return (
    <group ref={groupRef}>
      {atoms.map((a, i) => (
        <mesh key={i} position={[a.x, a.y, a.z]}>
          <sphereGeometry args={[a.size, 16, 16]} />
          <meshStandardMaterial
            color={a.color}
            emissive={a.color}
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      ))}
      {/* Connecting bonds */}
      {atoms.slice(0, -1).map((a, i) => {
        const next = atoms[i + 1];
        const mid = [(a.x + next.x) / 2, (a.y + next.y) / 2, (a.z + next.z) / 2];
        const dx = next.x - a.x, dy = next.y - a.y, dz = next.z - a.z;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const dir = new THREE.Vector3(dx, dy, dz).normalize();
        const axis = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
        const angle = Math.acos(new THREE.Vector3(0, 1, 0).dot(dir));
        const quat = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        return (
          <mesh key={`bond-${i}`} position={mid as any} quaternion={quat}>
            <cylinderGeometry args={[0.012, 0.012, len, 6]} />
            <meshBasicMaterial color="#1f2937" transparent opacity={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

// ─── Background floating particles ──────────────────────────────────
const Particles = () => {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#10b981" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
};

interface SplashPageProps {
  onEnter: () => void;
}

export default function SplashPage({ onEnter }: SplashPageProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    // Cinematic exit: fade to black, then switch page
    gsap.to(overlayRef.current, {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.in',
      onComplete: onEnter,
    });
  };

  useEffect(() => {
    // Entrance sequence
    const tl = gsap.timeline();
    tl.fromTo('#splash-logo',    { opacity: 0, scale: 0.5, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)' }, 0.8)
      .fromTo('#splash-tagline', { opacity: 0, y: 15 },             { opacity: 1, y: 0, duration: 0.8 }, 1.8)
      .fromTo('#splash-divider', { scaleX: 0 },                     { scaleX: 1, duration: 0.8, ease: 'power3.out' }, 2.3)
      .fromTo('#splash-desc',    { opacity: 0, y: 10 },             { opacity: 1, y: 0, duration: 0.8 }, 2.8)
      .fromTo('#splash-btn',     { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, 3.4)
      .fromTo('#splash-skip',    { opacity: 0 },                    { opacity: 1, duration: 0.5 }, 4.0);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020810]">

      {/* ── FULL BG 3D CANVAS ── */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 7], fov: 50 }}
          gl={{ antialias: true }}
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #0a1f14 0%, #020810 70%)' }}
        >
          <ambientLight intensity={0.3} />
          <pointLight position={[3, 3, 3]} intensity={2} color="#10b981" />
          <pointLight position={[-3, -2, 2]} intensity={1.5} color="#0ea5e9" />
          <CarbonHelix />
          <Particles />
        </Canvas>
      </div>

      {/* ── VIGNETTE ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #020810 100%)' }}
      />

      {/* ── RIGHT-SIDE VERTICAL CONTENT ── */}
      <div className="absolute inset-0 flex items-center justify-center md:justify-end pr-0 md:pr-24">
        <div className="flex flex-col items-center md:items-start max-w-sm px-6 text-center md:text-left">

          {/* Logo mark */}
          <div id="splash-logo" className="opacity-0 mb-6">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_30px_rgba(16,185,129,0.7)]" />
                <div className="absolute inset-2 rounded-full bg-[#020810] flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-white">CarbonPulse</div>
                <div className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Carbon Intelligence</div>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div id="splash-tagline" className="opacity-0 mb-5">
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-white">
              Know Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Impact.
              </span>
            </h1>
          </div>

          {/* Divider */}
          <div id="splash-divider" className="w-full h-px bg-gradient-to-r from-emerald-500 to-transparent mb-5 origin-left" />

          {/* Description */}
          <p id="splash-desc" className="opacity-0 text-gray-400 text-sm leading-relaxed mb-8">
            CarbonPulse is an AI-powered carbon footprint calculator. 
            Understand your environmental impact across energy, transport, 
            food, and lifestyle — then get a personalised action plan.
          </p>

          {/* CTA Button */}
          <button
            id="splash-btn"
            onClick={handleEnter}
            className="opacity-0 group relative w-full overflow-hidden px-8 py-4 rounded-2xl font-bold text-white text-base mb-4 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
              boxShadow: '0 0 30px rgba(16,185,129,0.4), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              Enter Experience
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          {/* Stats row */}
          <div id="splash-skip" className="opacity-0 flex gap-4 text-xs text-gray-600">
            <span>🌡️ +1.2°C warming</span>
            <span>·</span>
            <span>💨 421 ppm CO₂</span>
            <span>·</span>
            <span>🌊 Sea levels rising</span>
          </div>
        </div>
      </div>

      {/* ── LEFT LABEL (desktop) ── */}
      <div className="absolute left-8 bottom-8 hidden md:flex flex-col gap-1 text-gray-700 text-xs">
        <span className="text-gray-600">Visualising CO₂ molecule structure</span>
        <span className="text-gray-800">· Carbon (C) &nbsp; · Oxygen (O) &nbsp; · Bond</span>
        <div className="flex gap-3 mt-1">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Carbon</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Oxygen</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Bond node</span>
        </div>
      </div>

      {/* ── Fade-to-black overlay (exit animation) ── */}
      <div ref={overlayRef} className="absolute inset-0 bg-black pointer-events-none opacity-0 z-50" />
    </div>
  );
}
