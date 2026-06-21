import { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PresentationControls, Float, Text } from '@react-three/drei';
import gsap from 'gsap';
import EarthGlobe from '../components/three/EarthGlobe';

interface IntroPageProps {
  onStart: () => void;
}

export default function IntroPage({ onStart }: IntroPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [co2, setCo2] = useState(421);
  const [tempRise, setTempRise] = useState(1.2);
  const [ice, setIce] = useState(13);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.to(containerRef.current, { opacity: 1, duration: 1.2, ease: 'power2.out' })
      .fromTo('#hero-badge',    { opacity: 0, y: -30, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }, 1.5)
      .fromTo('#hero-title',   { opacity: 0, y: 50 },               { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 2.0)
      .fromTo('#hero-subtitle',{ opacity: 0, y: 30 },               { opacity: 1, y: 0, duration: 0.8 }, 2.6)
      .fromTo('#stat-row',     { opacity: 0, y: 40 },               { opacity: 1, y: 0, duration: 0.8 }, 3.2)
      .fromTo('#cta-section',  { opacity: 0, scale: 0.9 },          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, 4.0);

    // Live ticker animations
    const co2Obj = { val: 0 };
    gsap.to(co2Obj, {
      val: 421, duration: 3, delay: 3.2, ease: 'power2.out',
      onUpdate: () => setCo2(Math.round(co2Obj.val))
    });

    const tempObj = { val: 0 };
    gsap.to(tempObj, {
      val: 1.2, duration: 3, delay: 3.4, ease: 'power2.out',
      onUpdate: () => setTempRise(parseFloat(tempObj.val.toFixed(1)))
    });

    const iceObj = { val: 0 };
    gsap.to(iceObj, {
      val: 13, duration: 3, delay: 3.6, ease: 'power2.out',
      onUpdate: () => setIce(Math.round(iceObj.val))
    });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-[#020810] opacity-0 overflow-hidden">

      {/* ── FULL SCREEN 3D CANVAS ── */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 1, 9], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'radial-gradient(ellipse at center, #0a1628 0%, #020810 100%)' }}
        >
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 3, 5]} intensity={2} color="#ffffff" />
          <pointLight position={[-5, -3, -5]} intensity={0.3} color="#0ea5e9" />
          <pointLight position={[4, 4, 4]} intensity={0.5} color="#10b981" />

          <PresentationControls
            global={false}
            cursor={true}
            speed={1.2}
            polar={[-Math.PI / 5, Math.PI / 5]}
            azimuth={[-Math.PI / 4, Math.PI / 4]}
          >
            <EarthGlobe />
          </PresentationControls>

          {/* 3D floating title */}
          <Suspense fallback={null}>
            <Float speed={1.5} floatIntensity={0.4} rotationIntensity={0.05}>
              <Text
                position={[0, 3.8, 0]}
                fontSize={0.75}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.15}
                font="https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
              >
                GreenPrint
              </Text>
            </Float>
          </Suspense>
        </Canvas>
      </div>

      {/* ── GRADIENT OVERLAYS ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020810] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020810]/60 via-transparent to-transparent pointer-events-none" />

      {/* ── TOP BADGE ── */}
      <div id="hero-badge" className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            CarbonSense AI — Live
          </span>
        </div>
      </div>

      {/* ── HERO TEXT ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingTop: '60px' }}>
        <div id="hero-title" className="opacity-0 text-center mb-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none">
            <span className="text-white">Your Planet.</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Your Footprint.
            </span>
          </h1>
        </div>

        <div id="hero-subtitle" className="opacity-0 text-center max-w-xl px-4">
          <p className="text-gray-400 text-lg md:text-xl font-light leading-relaxed">
            The world is changing. Track your personal carbon impact 
            and discover <span className="text-emerald-400 font-semibold">actionable ways to help</span>.
          </p>
        </div>
      </div>

      {/* ── LIVE STATS ROW ── */}
      <div id="stat-row" className="absolute bottom-36 left-0 right-0 opacity-0 flex justify-center px-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">

          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <div className="text-2xl">💨</div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">CO₂ Level</div>
              <div className="text-xl font-black text-red-400">{co2} <span className="text-xs font-normal text-gray-500">ppm</span></div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <div className="text-2xl">🌡️</div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Temp Rise</div>
              <div className="text-xl font-black text-amber-400">+{tempRise}°<span className="text-xs font-normal text-gray-500">C since 1900</span></div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <div className="text-2xl">🧊</div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Ice Loss</div>
              <div className="text-xl font-black text-cyan-400">{ice}% <span className="text-xs font-normal text-gray-500">Arctic decline</span></div>
            </div>
          </div>

        </div>
      </div>

      {/* ── CTA BUTTON ── */}
      <div id="cta-section" className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-3 opacity-0">
        <button
          onClick={onStart}
          className="group relative px-10 py-4 rounded-full font-bold text-lg overflow-hidden pointer-events-auto"
          style={{
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            boxShadow: '0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2)',
          }}
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 rounded-full" />
          <span className="relative flex items-center gap-3 text-white">
            <span>🌍</span>
            Calculate Your Carbon Footprint
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
        <p className="text-gray-600 text-xs pointer-events-none">Drag the Earth · Explore the scene</p>
      </div>

      {/* ── Legend ── */}
      <div className="absolute top-8 right-6 text-xs space-y-2 text-right hidden md:block pointer-events-none">
        <div className="flex items-center justify-end gap-2 text-gray-500">
          <span>CO₂ Molecules</span>
          <div className="w-3 h-3 rounded-full bg-red-400" />
        </div>
        <div className="flex items-center justify-end gap-2 text-gray-500">
          <span>Living Nature</span>
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex items-center justify-end gap-2 text-gray-500">
          <span>Emission Rings</span>
          <div className="w-3 h-3 rounded-full bg-amber-400" />
        </div>
      </div>

    </div>
  );
}
