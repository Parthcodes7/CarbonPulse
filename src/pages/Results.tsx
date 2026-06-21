import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import { ArrowDown, ArrowUp, Leaf, Car, Smartphone } from 'lucide-react';
import * as THREE from 'three';
import type { CalculatorFormData, FootprintResult } from '../types';
import { generateFootprintResult } from '../lib/calculationEngine';
import { fetchAIAnalysis } from '../lib/aiService';

// ── 3D Trophy ────────────────────────────────────────────────────────
const Trophy3D = ({ emoji }: { emoji: string }) => {
  const meshRef = React.useRef<THREE.Group>(null!);
  useFrame(() => { meshRef.current.rotation.y += 0.02; });
  return (
    <Float speed={2} floatIntensity={0.5}>
      <group ref={meshRef}>
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#10b981" wireframe />
        </mesh>
        <Suspense fallback={null}>
          <Text position={[0, 0, 0]} fontSize={1} anchorX="center" anchorY="middle">{emoji}</Text>
        </Suspense>
      </group>
    </Float>
  );
};

// ── Results Page ─────────────────────────────────────────────────────
interface ResultsProps {
  data: CalculatorFormData;
  onExplore: () => void;
}

export default function Results({ data, onExplore }: ResultsProps) {
  const [loading, setLoading]       = useState(true);
  const [result, setResult]         = useState<FootprintResult | null>(null);
  const [aiText, setAiText]         = useState<string>('');
  const [activeTips, setActiveTips] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    const footprint = generateFootprintResult(data);
    setResult(footprint);

    // Call Claude via the secure Express proxy
    fetchAIAnalysis(footprint)
      .then(res => setAiText(res.analysis))
      .catch(() => setAiText(footprint.message))
      .finally(() => setLoading(false));
  }, [data]);

  const simulatedTotal = useMemo(() => {
    if (!result) return 0;
    const savings = [...activeTips].reduce((acc, i) => acc + result.tips[i].co2_saved, 0);
    return Math.max(0, result.total_kg - savings);
  }, [result, activeTips]);

  const toggleTip = useCallback((index: number) => {
    setActiveTips(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4" role="status" aria-live="polite">
        <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl text-white font-light tracking-widest animate-pulse">CarbonSense AI Analyzing…</h2>
        <p className="text-sm text-gray-600">Calculating your footprint &amp; calling Claude AI</p>
      </div>
    );
  }

  if (!result) return null;

  const chartData = [
    { name: 'Energy',    value: result.breakdown.energy.kg,    color: '#10b981' },
    { name: 'Transport', value: result.breakdown.transport.kg, color: '#0ea5e9' },
    { name: 'Food',      value: result.breakdown.food.kg,      color: '#f59e0b' },
    { name: 'Lifestyle', value: result.breakdown.lifestyle.kg, color: '#ef4444' },
  ];

  const equivalencies = [
    { text: `${Math.round(result.total_kg / 22).toLocaleString()} mature trees needed to offset`, icon: <Leaf className="w-8 h-8 text-emerald-400" aria-hidden="true" /> },
    { text: `${Math.round(result.total_kg / 0.21).toLocaleString()} km driven in a petrol car`, icon: <Car className="w-8 h-8 text-cyan-400" aria-hidden="true" /> },
    { text: `${Math.round(result.total_kg * 120).toLocaleString()} smartphone charges`, icon: <Smartphone className="w-8 h-8 text-amber-400" aria-hidden="true" /> },
  ];

  const benchmarks = [
    { label: 'Global Average', key: 'vs_global' as const },
    { label: 'India Average',  key: 'vs_india'  as const },
    { label: 'Paris Target',   key: 'vs_paris'  as const },
  ];

  return (
    <main className="min-h-screen bg-background text-white pt-12 pb-24 px-4 overflow-y-auto" aria-label="Carbon footprint results">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HERO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="glass-panel p-8 rounded-3xl flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">CarbonSense AI</span>
            </div>
            <h1 className="text-3xl font-bold mb-3">Your Carbon Footprint</h1>

            {/* AI-generated analysis text */}
            <p className="text-gray-300 text-sm leading-relaxed mb-6 border-l-2 border-emerald-500/40 pl-4 italic">
              {aiText || result.message}
            </p>

            <div className="flex items-baseline gap-2" aria-live="polite">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {simulatedTotal.toLocaleString()}
              </span>
              <span className="text-xl text-gray-500">kg CO₂e/yr</span>
            </div>
            {activeTips.size > 0 && (
              <div className="mt-4 px-4 py-2 bg-accent/20 border border-accent text-accent rounded-full text-sm font-bold w-fit" role="status">
                Simulated Savings: −{(result.total_kg - simulatedTotal).toLocaleString()} kg!
              </div>
            )}
          </div>

          <div className="glass-panel rounded-3xl h-[300px] relative overflow-hidden flex items-center justify-center border border-accent/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wider text-accent border border-accent/50 px-3 py-1 rounded-full z-10">
              Score: {result.label}
            </div>
            <Canvas camera={{ position: [0, 0, 5] }} aria-hidden="true">
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <Suspense fallback={null}>
                <Trophy3D emoji={result.emoji} />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* BENCHMARKS + BAR CHART */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <section className="space-y-4" aria-label="Benchmark comparisons">
            <h2 className="text-xl font-bold border-b border-white/10 pb-2">Benchmarks</h2>
            {benchmarks.map(comp => {
              const b = result.comparisons[comp.key];
              const isAbove = b.val > 0;
              return (
                <div key={comp.key} className="glass-panel p-4 rounded-xl flex justify-between items-center">
                  <span className="text-gray-400 text-sm">
                    {comp.label}<br />
                    <span className="text-xs text-gray-600">Avg: {b.bench.toLocaleString()} kg</span>
                  </span>
                  <div className={`flex items-center gap-1 font-bold ${isAbove ? 'text-red-400' : 'text-accent'}`}
                    aria-label={`${Math.abs(b.val)}% ${isAbove ? 'above' : 'below'} ${comp.label}`}>
                    {isAbove ? <ArrowUp className="w-4 h-4" aria-hidden="true" /> : <ArrowDown className="w-4 h-4" aria-hidden="true" />}
                    {Math.abs(b.val)}%
                  </div>
                </div>
              );
            })}
          </section>

          <section className="md:col-span-2 glass-panel p-6 rounded-3xl h-[300px]" aria-label="Emissions breakdown chart">
            <h2 className="text-xl font-bold mb-4">Emissions Breakdown</h2>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px' }}
                  formatter={(v: any) => [`${Number(v).toLocaleString()} kg CO₂e`, '']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>

        {/* WHAT-IF SIMULATOR */}
        <section className="glass-panel p-8 rounded-3xl border border-teal/20" aria-label="What-if action simulator">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-teal">"What-If" Action Simulator</h2>
            <span className="text-sm text-gray-400">Toggle actions to see savings</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.tips.map((tip, index) => {
              const isActive = activeTips.has(index);
              const diffColor = tip.difficulty === 'Easy' ? 'bg-accent/20 text-accent' : tip.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400';
              return (
                <button
                  key={index}
                  onClick={() => toggleTip(index)}
                  aria-pressed={isActive}
                  aria-label={`${tip.action} — saves ${tip.co2_saved} kg CO₂`}
                  className={`p-4 rounded-xl text-left transition-all border focus:outline-none focus:ring-2 focus:ring-teal ${
                    isActive
                      ? 'bg-teal/20 border-teal shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : 'bg-black/20 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${diffColor}`}>{tip.difficulty}</span>
                    <span className="text-teal font-bold text-sm">−{tip.co2_saved} kg</span>
                  </div>
                  <p className="text-sm text-gray-200">{tip.action}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* EQUIVALENCIES */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Impact equivalencies">
          {equivalencies.map((eq, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-white/5 rounded-full">{eq.icon}</div>
              <p className="font-semibold text-gray-300 text-sm">{eq.text}</p>
            </div>
          ))}
        </section>

        <div className="flex justify-center mt-12">
          <button
            onClick={onExplore}
            className="px-8 py-4 bg-gradient-to-r from-accent to-teal text-white rounded-full font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Navigate to global awareness statistics"
          >
            Explore Global Awareness Stats
          </button>
        </div>

      </div>
    </main>
  );
}
