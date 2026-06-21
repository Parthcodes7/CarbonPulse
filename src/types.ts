// ─────────────────────────────────────────────────────────────
// GreenPrint – Shared TypeScript Types
// ─────────────────────────────────────────────────────────────

export type GridType = 'coal' | 'mixed' | 'renewable';
export type HeatingType = 'none' | 'electric' | 'gas' | 'oil';
export type VehicleType = 'petrol' | 'diesel' | 'cng' | 'electric' | 'none';
export type DietType = 'vegan' | 'vegetarian' | 'average' | 'heavy';
export type DairyFreq = 'rarely' | 'moderate' | 'daily';
export type LocalFood = 'mostly_local' | 'mixed' | 'mostly_imported';
export type WasteFreq = 'never' | 'sometimes' | 'often';
export type RecyclingHabit = 'always' | 'sometimes' | 'rarely';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ScoreLabel = 'Eco Champion' | 'Aware Citizen' | 'Average Footprint' | 'High Impact';

export interface CalculatorFormData {
  // Home
  elec_kwh: number;
  grid_type: GridType;
  gas_kg: number;
  household_size: number;
  heating_type: HeatingType;
  // Transport
  vehicle_type: VehicleType;
  km_week: number;
  public_transport_hrs: number;
  flights_short: number;
  flights_long: number;
  // Food
  diet_type: DietType;
  dairy_freq: DairyFreq;
  local_food: LocalFood;
  food_waste: WasteFreq;
  // Lifestyle
  fast_fashion: number;
  electronics: number;
  packages_month: number;
  recycling: RecyclingHabit;
}

export interface CategoryBreakdown {
  kg: number;
  percent: number;
}

export interface Comparison {
  val: number;   // % above/below benchmark
  bench: number; // benchmark in kg
}

export interface ActionTip {
  action: string;
  co2_saved: number;
  difficulty: Difficulty;
  category: string;
}

export interface FootprintResult {
  total_kg: number;
  label: ScoreLabel;
  emoji: string;
  breakdown: {
    energy: CategoryBreakdown;
    transport: CategoryBreakdown;
    food: CategoryBreakdown;
    lifestyle: CategoryBreakdown;
  };
  comparisons: {
    vs_global: Comparison;
    vs_india: Comparison;
    vs_paris: Comparison;
  };
  tips: ActionTip[];
  message: string;
}

export const DEFAULT_FORM_DATA: CalculatorFormData = {
  elec_kwh: 150,
  grid_type: 'coal',
  gas_kg: 14.2,
  household_size: 1,
  heating_type: 'none',
  vehicle_type: 'petrol',
  km_week: 100,
  public_transport_hrs: 2,
  flights_short: 2,
  flights_long: 0,
  diet_type: 'average',
  dairy_freq: 'moderate',
  local_food: 'mixed',
  food_waste: 'sometimes',
  fast_fashion: 12,
  electronics: 1,
  packages_month: 2,
  recycling: 'sometimes',
};
