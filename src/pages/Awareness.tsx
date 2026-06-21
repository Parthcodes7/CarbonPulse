import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Real climate data (IPCC AR6 / IEA 2023) ─────────────────────────
const GLOBAL_STATS = [
  { icon: '🌡️', value: '+1.2°C', label: 'Global temperature rise since 1900', source: 'IPCC AR6, 2021', color: '#ef4444' },
  { icon: '💨', value: '421 ppm', label: 'Atmospheric CO₂ — highest in 3 million years', source: 'NOAA, 2023', color: '#f59e0b' },
  { icon: '🌊', value: '3.6 mm/yr', label: 'Sea level rise rate — doubling every decade', source: 'NASA, 2023', color: '#0ea5e9' },
  { icon: '🔥', value: '54.0 Gt', label: 'Global CO₂ emissions in 2023', source: 'IEA, 2023', color: '#ef4444' },
  { icon: '🧊', value: '13% /decade', label: 'Arctic sea ice area declining', source: 'NSIDC, 2023', color: '#06b6d4' },
  { icon: '🌿', value: '1M+ species', label: 'At risk of extinction from climate change', source: 'IPBES, 2019', color: '#10b981' },
];

const COUNTRY_COMPARISON = [
  { country: '🇺🇸 USA',         kg: 14_900, color: '#ef4444' },
  { country: '🇦🇺 Australia',   kg: 14_400, color: '#f97316' },
  { country: '🇷🇺 Russia',      kg:  9_900, color: '#f59e0b' },
  { country: '🌍 Global Avg',   kg:  4_800, color: '#a78bfa' },
  { country: '🇨🇳 China',       kg:  7_500, color: '#f59e0b' },
  { country: '🇧🇷 Brazil',      kg:  2_500, color: '#34d399' },
  { country: '🇮🇳 India',       kg:  1_900, color: '#10b981' },
  { country: '🎯 Paris Target', kg:  2_300, color: '#06b6d4' },
];

const ACTIONS = [
  { action: 'Switch to renewable energy',   saving: '2,400 kg/yr', emoji: '☀️', difficulty: 'Medium' },
  { action: 'Go car-free or EV',            saving: '2,000 kg/yr', emoji: '🚲', difficulty: 'Medium' },
  { action: 'Reduce meat to once a week',   saving: '600 kg/yr',   emoji: '🥦', difficulty: 'Easy' },
  { action: 'Take 1 fewer long-haul flight',saving: '1,620 kg/trip',emoji: '✈️', difficulty: 'Hard' },
  { action: 'Buy second-hand clothing',     saving: '300 kg/yr',   emoji: '👕', difficulty: 'Easy' },
  { action: 'Work from home 2 days/week',   saving: '400 kg/yr',   emoji: '🏠', difficulty: 'Easy' },
];

interface AwarenessProps { onBack: () => void; }

export default function Awareness({ onBack }: AwarenessProps) {
  const [pledges, setPledges]     = useState<string[]>([]);
  const [pledgeInput, setPledgeInput] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate stat cards on scroll
    gsap.utils.toArray<HTMLElement>('.awareness-card').forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 0.6, delay: i * 0.1,
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        }
      );
    });

    gsap.fromTo(heroRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }
    );

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  const submitPledge = () => {
    const trimmed = pledgeInput.trim();
    if (!trimmed || trimmed.length < 5 || trimmed.length > 120) return;
    // Sanitize: only allow printable text characters
    const safe = trimmed.replace(/[<>&"']/g, '');
    if (safe) {
      setPledges(prev => [safe, ...prev.slice(0, 11)]);
      setPledgeInput('');
    }
  };

  const maxKg = Math.max(...COUNTRY_COMPARISON.map(c => c.kg));

  return (
    <main className="min-h-screen bg-background text-white overflow-y-auto pb-24" aria-label="Climate awareness page">

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative py-24 px-4 text-center overflow-hidden" aria-label="Hero">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-950/30 via-background to-background pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            Climate Science · IPCC / IEA Data
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            The Numbers <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Don't Lie</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
            Understanding the scale of the climate crisis is the first step toward meaningful action.
            Below is a snapshot of where humanity stands today.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-20">

        {/* ── GLOBAL STAT CARDS ── */}
        <section aria-label="Key climate statistics">
          <h2 className="text-2xl font-bold mb-8 border-b border-white/10 pb-3">Key Global Indicators</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {GLOBAL_STATS.map((stat, i) => (
              <article
                key={i}
                className="awareness-card opacity-0 glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-colors"
                aria-label={`${stat.value} — ${stat.label}`}
              >
                <div className="text-4xl mb-3" role="img" aria-label={stat.icon}>{stat.icon}</div>
                <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <p className="text-gray-300 text-sm mb-2 leading-snug">{stat.label}</p>
                <p className="text-gray-600 text-xs">Source: {stat.source}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── COUNTRY COMPARISON BAR CHART ── */}
        <section aria-label="Per-capita emissions by country">
          <h2 className="text-2xl font-bold mb-2 border-b border-white/10 pb-3">Per-Capita Emissions by Country</h2>
          <p className="text-gray-500 text-sm mb-8">Annual kg CO₂e per person. The Paris Agreement calls for ≤2,300 kg by 2030.</p>
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            {COUNTRY_COMPARISON.sort((a, b) => b.kg - a.kg).map((item, i) => (
              <div key={i} className="awareness-card opacity-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300 font-medium">{item.country}</span>
                  <span className="font-bold" style={{ color: item.color }}>{item.kg.toLocaleString()} kg</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${(item.kg / maxKg) * 100}%`, backgroundColor: item.color }}
                    role="progressbar"
                    aria-valuenow={item.kg}
                    aria-valuemax={maxKg}
                    aria-label={`${item.country}: ${item.kg.toLocaleString()} kg CO₂e`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HIGH-IMPACT ACTIONS ── */}
        <section aria-label="High impact climate actions">
          <h2 className="text-2xl font-bold mb-2 border-b border-white/10 pb-3">Highest-Impact Actions</h2>
          <p className="text-gray-500 text-sm mb-8">Science-backed reductions ranked by CO₂ saved per year. Source: Project Drawdown 2023.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {ACTIONS.map((a, i) => {
              const diffColor = a.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-400/10' : a.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10' : 'text-red-400 bg-red-400/10';
              return (
                <article key={i} className="awareness-card opacity-0 glass-panel p-5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform" role="img">{a.emoji}</div>
                  <h3 className="font-bold text-white mb-2 text-sm leading-snug">{a.action}</h3>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-emerald-400 font-black text-lg">−{a.saving}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${diffColor}`}>{a.difficulty}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── PLEDGE WALL ── */}
        <section aria-label="Community pledge wall">
          <h2 className="text-2xl font-bold mb-2 border-b border-white/10 pb-3">🌱 Community Pledge Wall</h2>
          <p className="text-gray-500 text-sm mb-6">What will YOU commit to? Add your pledge below.</p>

          <div className="flex gap-3 mb-8">
            <input
              type="text"
              value={pledgeInput}
              onChange={e => setPledgeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPledge()}
              placeholder="I pledge to... (e.g. cycle to work twice a week)"
              maxLength={120}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              aria-label="Enter your climate pledge"
            />
            <button
              onClick={submitPledge}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Submit your pledge"
            >
              Pledge
            </button>
          </div>

          {pledges.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-label="Submitted pledges">
              {pledges.map((p, i) => (
                <li key={i} className="awareness-card opacity-0 glass-panel p-4 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                  <span className="text-xl" role="img" aria-label="leaf">🌿</span>
                  <p className="text-gray-200 text-sm leading-snug">{p}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-gray-700 border border-dashed border-white/10 rounded-2xl">
              Be the first to make a pledge! 🌍
            </div>
          )}
        </section>

        {/* ── BACK TO START ── */}
        <div className="flex justify-center pt-8">
          <button
            onClick={onBack}
            className="px-10 py-4 rounded-full border border-white/20 text-gray-300 hover:bg-white/5 transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Return to the CarbonPulse home page"
          >
            ← Back to CarbonPulse
          </button>
        </div>

      </div>
    </main>
  );
}
