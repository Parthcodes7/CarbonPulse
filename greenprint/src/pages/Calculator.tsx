import { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Home, Car, Utensils, ShoppingBag, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import type {
  CalculatorFormData,
} from '../types';
import { DEFAULT_FORM_DATA } from '../types';
import { calculateCategoryEmissions, validateFormData } from '../lib/calculationEngine';

const STEPS = [
  { id: 1, title: 'Home Energy', icon: <Home className="w-5 h-5" aria-hidden="true" /> },
  { id: 2, title: 'Transport',   icon: <Car className="w-5 h-5" aria-hidden="true" /> },
  { id: 3, title: 'Food & Diet', icon: <Utensils className="w-5 h-5" aria-hidden="true" /> },
  { id: 4, title: 'Lifestyle',   icon: <ShoppingBag className="w-5 h-5" aria-hidden="true" /> },
];
const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444'];

interface CalculatorProps {
  onComplete: (data: CalculatorFormData) => void;
}

export default function Calculator({ onComplete }: CalculatorProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CalculatorFormData>(DEFAULT_FORM_DATA);

  const handleChange = useCallback(<K extends keyof CalculatorFormData>(
    field: K,
    value: CalculatorFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const breakdown = useMemo(() => {
    const { energy, transport, food, lifestyle } = calculateCategoryEmissions(formData);
    return [
      { name: 'Energy',    value: Math.round(energy) },
      { name: 'Transport', value: Math.round(transport) },
      { name: 'Food',      value: Math.round(food) },
      { name: 'Lifestyle', value: Math.round(lifestyle) },
    ];
  }, [formData]);

  const totalEmissions = useMemo(
    () => breakdown.reduce((acc, curr) => acc + curr.value, 0),
    [breakdown]
  );

  const scoreColor =
    totalEmissions < 2000 ? '#10b981' :
    totalEmissions < 4000 ? '#f59e0b' : '#ef4444';

  const scoreLabel =
    totalEmissions < 2000 ? '🟢 Excellent' :
    totalEmissions < 4000 ? '🟡 Moderate'  :
    totalEmissions < 7000 ? '🟠 High'      : '🔴 Critical';

  const handleSubmit = useCallback(() => {
    const errors = validateFormData(formData);
    if (errors.length > 0) {
      alert(`Please fix: ${errors[0].message}`);
      return;
    }
    onComplete(formData);
  }, [formData, onComplete]);

  return (
    <main
      className="min-h-screen bg-background text-white pt-12 pb-24 px-4 flex justify-center"
      aria-label="Carbon Footprint Calculator"
    >
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Form column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Progress stepper */}
          <nav aria-label="Calculator steps" className="glass-panel p-4 rounded-2xl flex justify-between items-center relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-1 bg-accent transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
              role="progressbar"
              aria-valuenow={step}
              aria-valuemin={1}
              aria-valuemax={4}
              aria-label={`Step ${step} of 4`}
            />
            {STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                aria-current={step === s.id ? 'step' : undefined}
                aria-label={`Step ${s.id}: ${s.title}${step > s.id ? ' (completed)' : ''}`}
                className={`flex items-center gap-2 transition-colors ${
                  step === s.id ? 'text-accent font-bold' :
                  step > s.id  ? 'text-teal cursor-pointer' : 'text-gray-500 cursor-default'
                }`}
              >
                <div className={`p-2 rounded-full ${step === s.id ? 'bg-accent/20' : ''}`}>
                  {step > s.id ? <CheckCircle className="w-5 h-5" aria-hidden="true" /> : s.icon}
                </div>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </nav>

          {/* Step content */}
          <section className="glass-panel p-8 rounded-3xl min-h-[500px] flex flex-col" aria-label={STEPS[step - 1].title}>
            <h2 className="text-2xl font-bold mb-8 text-white border-b border-white/10 pb-4">
              {STEPS[step - 1].title}
            </h2>
            <div className="flex-1">

              {/* STEP 1 */}
              {step === 1 && (
                <fieldset className="space-y-6 border-0 p-0 m-0">
                  <legend className="sr-only">Home Energy Usage</legend>

                  <div>
                    <label htmlFor="elec_kwh" className="block text-gray-400 mb-2">
                      Monthly Electricity Usage: <strong className="text-accent">{formData.elec_kwh} kWh</strong>
                    </label>
                    <input
                      id="elec_kwh"
                      type="range" min="0" max="1000"
                      value={formData.elec_kwh}
                      onChange={e => handleChange('elec_kwh', Number(e.target.value))}
                      className="w-full accent-accent"
                      aria-describedby="elec_kwh_hint"
                    />
                    <p id="elec_kwh_hint" className="text-xs text-gray-600 mt-1">Typical Indian household: 80–250 kWh/month</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="grid_type" className="block text-gray-400 mb-2">Grid Energy Source</label>
                      <select
                        id="grid_type"
                        value={formData.grid_type}
                        onChange={e => handleChange('grid_type', e.target.value as CalculatorFormData['grid_type'])}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        <option value="coal">Standard Grid (Coal Heavy)</option>
                        <option value="mixed">Mixed Grid</option>
                        <option value="renewable">100% Renewable / Solar</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="heating_type" className="block text-gray-400 mb-2">Home Heating</label>
                      <select
                        id="heating_type"
                        value={formData.heating_type}
                        onChange={e => handleChange('heating_type', e.target.value as CalculatorFormData['heating_type'])}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        <option value="none">None / Mild Climate</option>
                        <option value="electric">Electric Heater</option>
                        <option value="gas">Natural Gas</option>
                        <option value="oil">Heating Oil</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="gas_kg" className="block text-gray-400 mb-2">LPG Cylinders / Month</label>
                      <input
                        id="gas_kg"
                        type="number" min="0" step="0.5"
                        value={parseFloat((formData.gas_kg / 14.2).toFixed(1))}
                        onChange={e => handleChange('gas_kg', Number(e.target.value) * 14.2)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        aria-label="LPG cylinders per month (1 cylinder = 14.2 kg)"
                      />
                    </div>
                    <div>
                      <label htmlFor="household_size" className="block text-gray-400 mb-2">Household Size</label>
                      <input
                        id="household_size"
                        type="number" min="1" max="20"
                        value={formData.household_size}
                        onChange={e => handleChange('household_size', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        aria-label="Number of people in household"
                      />
                    </div>
                  </div>
                </fieldset>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <fieldset className="space-y-6 border-0 p-0 m-0">
                  <legend className="sr-only">Transportation Habits</legend>

                  <div>
                    <p id="vehicle-label" className="text-gray-400 mb-2">Primary Vehicle</p>
                    <div role="group" aria-labelledby="vehicle-label" className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['petrol','diesel','cng','electric','none'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => handleChange('vehicle_type', type)}
                          aria-pressed={formData.vehicle_type === type}
                          className={`p-2 rounded-lg border text-sm capitalize transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                            formData.vehicle_type === type
                              ? 'bg-accent/20 border-accent text-accent'
                              : 'border-white/10 text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="km_week" className="block text-gray-400 mb-2">
                      Km Driven / Week: <strong className="text-accent">{formData.km_week} km</strong>
                    </label>
                    <input
                      id="km_week"
                      type="range" min="0" max="1000"
                      value={formData.km_week}
                      onChange={e => handleChange('km_week', Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <label htmlFor="public_transport_hrs" className="block text-gray-400 mb-2">
                      Public Transport / Week: <strong className="text-accent">{formData.public_transport_hrs} hrs</strong>
                    </label>
                    <input
                      id="public_transport_hrs"
                      type="range" min="0" max="40"
                      value={formData.public_transport_hrs}
                      onChange={e => handleChange('public_transport_hrs', Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="flights_short" className="block text-gray-400 mb-2">Short Flights / yr (&lt;3 hrs)</label>
                      <input
                        id="flights_short"
                        type="number" min="0" max="100"
                        value={formData.flights_short}
                        onChange={e => handleChange('flights_short', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label htmlFor="flights_long" className="block text-gray-400 mb-2">Long Flights / yr (&gt;3 hrs)</label>
                      <input
                        id="flights_long"
                        type="number" min="0" max="100"
                        value={formData.flights_long}
                        onChange={e => handleChange('flights_long', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </fieldset>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <fieldset className="space-y-6 border-0 p-0 m-0">
                  <legend className="sr-only">Food and Diet</legend>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="diet_type" className="block text-gray-400 mb-2">Diet Type</label>
                      <select
                        id="diet_type"
                        value={formData.diet_type}
                        onChange={e => handleChange('diet_type', e.target.value as CalculatorFormData['diet_type'])}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        <option value="vegan">Vegan</option>
                        <option value="vegetarian">Vegetarian</option>
                        <option value="average">Average Meat-Eater</option>
                        <option value="heavy">Heavy Meat-Eater</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="dairy_freq" className="block text-gray-400 mb-2">Dairy Consumption</label>
                      <select
                        id="dairy_freq"
                        value={formData.dairy_freq}
                        onChange={e => handleChange('dairy_freq', e.target.value as CalculatorFormData['dairy_freq'])}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                        disabled={formData.diet_type === 'vegan'}
                        aria-disabled={formData.diet_type === 'vegan'}
                      >
                        <option value="rarely">Rarely / None</option>
                        <option value="moderate">Moderate</option>
                        <option value="daily">Daily (Cheese/Milk heavy)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="local_food" className="block text-gray-400 mb-2">Food Source</label>
                      <select
                        id="local_food"
                        value={formData.local_food}
                        onChange={e => handleChange('local_food', e.target.value as CalculatorFormData['local_food'])}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        <option value="mostly_local">Mostly Local / Seasonal</option>
                        <option value="mixed">Mixed Supermarket</option>
                        <option value="mostly_imported">Mostly Imported / Exotic</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="food_waste" className="block text-gray-400 mb-2">Food Waste Frequency</label>
                      <select
                        id="food_waste"
                        value={formData.food_waste}
                        onChange={e => handleChange('food_waste', e.target.value as CalculatorFormData['food_waste'])}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        <option value="never">Never (Compost everything)</option>
                        <option value="sometimes">Sometimes</option>
                        <option value="often">Often throw away food</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <fieldset className="space-y-6 border-0 p-0 m-0">
                  <legend className="sr-only">Lifestyle and Consumption</legend>

                  <div>
                    <label htmlFor="fast_fashion" className="block text-gray-400 mb-2">
                      Fast Fashion Items / yr: <strong className="text-accent">{formData.fast_fashion} items</strong>
                    </label>
                    <input
                      id="fast_fashion"
                      type="range" min="0" max="50"
                      value={formData.fast_fashion}
                      onChange={e => handleChange('fast_fashion', Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                    <p className="text-xs text-gray-600 mt-1">Each fast fashion item ≈ 33 kg CO₂e to produce</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="packages_month" className="block text-gray-400 mb-2">Online Deliveries / Month</label>
                      <input
                        id="packages_month"
                        type="number" min="0" max="200"
                        value={formData.packages_month}
                        onChange={e => handleChange('packages_month', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label htmlFor="electronics" className="block text-gray-400 mb-2">New Electronics / Year</label>
                      <input
                        id="electronics"
                        type="number" min="0" max="50"
                        value={formData.electronics}
                        onChange={e => handleChange('electronics', Number(e.target.value))}
                        className="w-full bg-black/30 border border-white/10 rounded-lg p-3 outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <p id="recycling-label" className="text-gray-400 mb-2">Recycling Habits</p>
                    <div role="group" aria-labelledby="recycling-label" className="flex gap-4 bg-black/30 p-1 rounded-lg border border-white/10">
                      {(['always','sometimes','rarely'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => handleChange('recycling', type)}
                          aria-pressed={formData.recycling === type}
                          className={`flex-1 p-2 rounded-md capitalize transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                            formData.recycling === type ? 'bg-accent text-white shadow-lg' : 'text-gray-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </fieldset>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Go to previous step"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-accent text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label={`Continue to step ${step + 1}`}
                >
                  Next <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-accent to-teal text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Generate your AI carbon footprint report"
                >
                  Generate AI Report <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </section>
        </div>

        {/* ── Live preview sidebar ── */}
        <aside className="lg:col-span-1" aria-label="Live emissions preview">
          <div className="glass-panel p-6 rounded-3xl sticky top-8 flex flex-col items-center">
            <h3 className="text-lg text-gray-400 mb-6 w-full text-left uppercase tracking-wider font-semibold">
              Live Preview
            </h3>

            <div className="w-full h-64 relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdown} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} kg CO₂e`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-live="polite">
                <span className="text-xs text-gray-400">Total</span>
                <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                  {(totalEmissions / 1000).toFixed(1)}t
                </span>
              </div>
            </div>

            <div className="w-full space-y-3">
              {breakdown.map((item, i) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} aria-hidden="true" />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-white">{item.value.toLocaleString()} <span className="text-gray-600">kg</span></span>
                </div>
              ))}

              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Annual Total</span>
                  <span className="text-xl font-black text-white">{totalEmissions.toLocaleString()} <span className="text-xs font-normal text-gray-500">kg CO₂e</span></span>
                </div>
                <div className="flex justify-between items-center mt-2 bg-black/20 p-3 rounded-lg border border-white/5">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </main>
  );
}
