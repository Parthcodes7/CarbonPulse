// ─────────────────────────────────────────────────────────────
// GreenPrint – Core Carbon Calculation Engine
// Single source of truth for all emission maths.
// Used by Calculator (live preview) and Results (final report).
// ─────────────────────────────────────────────────────────────

import type {
  CalculatorFormData,
  FootprintResult,
  ScoreLabel,
} from '../types';

// ── Emission factors (kg CO₂e per unit) ──────────────────────
const FACTORS = {
  grid: { coal: 0.82, mixed: 0.45, renewable: 0.05 },
  heating: { none: 0, electric: 200, gas: 300, oil: 500 },
  vehicle: { petrol: 0.21, diesel: 0.17, cng: 0.11, electric: 0.05, none: 0 },
  lpg_per_kg: 2.98,
  public_transport_per_hr: 0.04,
  flight_short: 255,
  flight_long: 1620,
  food_base: { vegan: 1500, vegetarian: 1700, average: 2500, heavy: 3300 },
  dairy: { daily: 300, moderate: 0, rarely: -100 },
  local_food: { mostly_local: -200, mixed: 0, mostly_imported: 300 },
  food_waste: { never: -200, sometimes: 0, often: 300 },
  fast_fashion_per_item: 400 / 12,
  electronics_per_device: 300,
  package_per_delivery: 2.5,
  recycling: { always: -200, sometimes: 0, rarely: 200 },
} as const;

// ── Benchmarks (kg CO₂e / yr) ────────────────────────────────
export const BENCHMARKS = {
  global: 4800,
  india: 1900,
  paris_target: 2300,
} as const;

// ── Validation ───────────────────────────────────────────────
export interface ValidationError {
  field: keyof CalculatorFormData;
  message: string;
}

export function validateFormData(data: CalculatorFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.elec_kwh < 0 || data.elec_kwh > 5000)
    errors.push({ field: 'elec_kwh', message: 'Electricity usage must be between 0–5000 kWh.' });

  if (data.household_size < 1 || data.household_size > 20)
    errors.push({ field: 'household_size', message: 'Household size must be between 1–20.' });

  if (data.km_week < 0 || data.km_week > 5000)
    errors.push({ field: 'km_week', message: 'Weekly km driven must be 0–5000.' });

  if (data.flights_short < 0 || data.flights_short > 100)
    errors.push({ field: 'flights_short', message: 'Short flights must be 0–100 per year.' });

  if (data.flights_long < 0 || data.flights_long > 100)
    errors.push({ field: 'flights_long', message: 'Long flights must be 0–100 per year.' });

  if (data.fast_fashion < 0 || data.fast_fashion > 365)
    errors.push({ field: 'fast_fashion', message: 'Fashion items must be 0–365 per year.' });

  if (data.electronics < 0 || data.electronics > 50)
    errors.push({ field: 'electronics', message: 'Electronics must be 0–50 per year.' });

  if (data.packages_month < 0 || data.packages_month > 200)
    errors.push({ field: 'packages_month', message: 'Monthly deliveries must be 0–200.' });

  return errors;
}

// ── Core engine ───────────────────────────────────────────────
export function calculateCategoryEmissions(data: CalculatorFormData) {
  const gridFactor = FACTORS.grid[data.grid_type];
  const heatingFactor = FACTORS.heating[data.heating_type];
  const electricHeatingAdjust =
    data.heating_type === 'electric' ? heatingFactor * gridFactor : heatingFactor;

  const energy = Math.max(
    0,
    (data.elec_kwh * 12 * gridFactor +
      data.gas_kg * 12 * FACTORS.lpg_per_kg +
      electricHeatingAdjust) /
      Math.max(1, data.household_size)
  );

  const vehicleFactor = FACTORS.vehicle[data.vehicle_type];
  const transport = Math.max(
    0,
    data.km_week * 52 * vehicleFactor +
      data.public_transport_hrs * 52 * FACTORS.public_transport_per_hr +
      data.flights_short * FACTORS.flight_short +
      data.flights_long * FACTORS.flight_long
  );

  const food = Math.max(
    0,
    FACTORS.food_base[data.diet_type] +
      (data.diet_type !== 'vegan' ? FACTORS.dairy[data.dairy_freq] : 0) +
      FACTORS.local_food[data.local_food] +
      FACTORS.food_waste[data.food_waste]
  );

  const lifestyle = Math.max(
    0,
    data.fast_fashion * FACTORS.fast_fashion_per_item +
      data.electronics * FACTORS.electronics_per_device +
      data.packages_month * 12 * FACTORS.package_per_delivery +
      FACTORS.recycling[data.recycling]
  );

  return { energy, transport, food, lifestyle };
}

// ── Full result generator ─────────────────────────────────────
export function generateFootprintResult(data: CalculatorFormData): FootprintResult {
  const { energy, transport, food, lifestyle } = calculateCategoryEmissions(data);
  const total = Math.round(energy + transport + food + lifestyle);

  let label: ScoreLabel = 'High Impact';
  let emoji = '🔴';
  if (total < 2000)      { label = 'Eco Champion';       emoji = '🟢'; }
  else if (total < 4000) { label = 'Aware Citizen';      emoji = '🟡'; }
  else if (total < 7000) { label = 'Average Footprint';  emoji = '🟠'; }

  const pct = (v: number) => Math.round((v / total) * 100);

  const tips = [
    {
      action: data.grid_type !== 'renewable'
        ? 'Switch to a renewable or solar energy provider.'
        : 'Install rooftop solar panels for full independence.',
      co2_saved: Math.round(energy * 0.4),
      difficulty: 'Hard' as const,
      category: 'Energy',
    },
    {
      action:
        data.vehicle_type === 'petrol' || data.vehicle_type === 'diesel'
          ? 'Carpool or use public transport twice a week.'
          : 'Combine errands to reduce total trips.',
      co2_saved: Math.round(transport * 0.2),
      difficulty: 'Medium' as const,
      category: 'Transport',
    },
    {
      action:
        data.diet_type === 'heavy'
          ? 'Replace one meal per day with a plant-based alternative.'
          : 'Adopt a Meatless Monday routine.',
      co2_saved: Math.round(food * 0.15),
      difficulty: 'Easy' as const,
      category: 'Food',
    },
    {
      action: 'Unplug standby appliances and switch to LED lighting.',
      co2_saved: 90,
      difficulty: 'Easy' as const,
      category: 'Energy',
    },
    {
      action: 'Buy second-hand or swap clothes instead of fast fashion.',
      co2_saved: Math.round(lifestyle * 0.25),
      difficulty: 'Easy' as const,
      category: 'Lifestyle',
    },
    {
      action: 'Compost food scraps and follow recycling guidelines.',
      co2_saved: 150,
      difficulty: 'Easy' as const,
      category: 'Food',
    },
  ];

  const delta = (bench: number) => Math.round(((total - bench) / bench) * 100);

  return {
    total_kg: total,
    label,
    emoji,
    breakdown: {
      energy:    { kg: Math.round(energy),    percent: pct(energy) },
      transport: { kg: Math.round(transport), percent: pct(transport) },
      food:      { kg: Math.round(food),      percent: pct(food) },
      lifestyle: { kg: Math.round(lifestyle), percent: pct(lifestyle) },
    },
    comparisons: {
      vs_global: { val: delta(BENCHMARKS.global),       bench: BENCHMARKS.global },
      vs_india:  { val: delta(BENCHMARKS.india),        bench: BENCHMARKS.india },
      vs_paris:  { val: delta(BENCHMARKS.paris_target), bench: BENCHMARKS.paris_target },
    },
    tips,
    message: `You are currently ${
      label === 'Eco Champion'
        ? 'an outstanding Eco Champion! Keep it up.'
        : label === 'Aware Citizen'
        ? 'an Aware Citizen. A few more changes and you can reach Eco Champion!'
        : label === 'Average Footprint'
        ? 'at an average footprint. Your biggest opportunity is in the areas highlighted below.'
        : 'in the High Impact zone. Focus on your top two categories for the biggest gains.'
    }`,
  };
}
