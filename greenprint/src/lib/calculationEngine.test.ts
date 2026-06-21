// ─────────────────────────────────────────────────────────────
// GreenPrint – Unit Tests for the Calculation Engine
// Run: npm test
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  calculateCategoryEmissions,
  generateFootprintResult,
  validateFormData,
} from './calculationEngine';
import type { CalculatorFormData } from '../types';
import { DEFAULT_FORM_DATA } from '../types';

const BASE: CalculatorFormData = { ...DEFAULT_FORM_DATA };

// ── Validation ────────────────────────────────────────────────
describe('validateFormData', () => {
  it('returns no errors for valid default data', () => {
    expect(validateFormData(BASE)).toHaveLength(0);
  });

  it('flags negative electricity value', () => {
    const errors = validateFormData({ ...BASE, elec_kwh: -10 });
    expect(errors.some(e => e.field === 'elec_kwh')).toBe(true);
  });

  it('flags household_size of 0', () => {
    const errors = validateFormData({ ...BASE, household_size: 0 });
    expect(errors.some(e => e.field === 'household_size')).toBe(true);
  });

  it('flags unrealistic km_week', () => {
    const errors = validateFormData({ ...BASE, km_week: 9999 });
    expect(errors.some(e => e.field === 'km_week')).toBe(true);
  });
});

// ── Emissions: Energy ─────────────────────────────────────────
describe('calculateCategoryEmissions – energy', () => {
  it('renewable grid produces lower energy emissions than coal', () => {
    const coal = calculateCategoryEmissions({ ...BASE, grid_type: 'coal' });
    const renewable = calculateCategoryEmissions({ ...BASE, grid_type: 'renewable' });
    expect(renewable.energy).toBeLessThan(coal.energy);
  });

  it('larger household divides energy emissions correctly', () => {
    const single = calculateCategoryEmissions({ ...BASE, household_size: 1 });
    const four   = calculateCategoryEmissions({ ...BASE, household_size: 4 });
    expect(four.energy).toBeLessThan(single.energy);
  });

  it('oil heating adds more than gas heating', () => {
    const gas = calculateCategoryEmissions({ ...BASE, heating_type: 'gas' });
    const oil = calculateCategoryEmissions({ ...BASE, heating_type: 'oil' });
    expect(oil.energy).toBeGreaterThan(gas.energy);
  });

  it('no heating produces lower energy than gas', () => {
    const none = calculateCategoryEmissions({ ...BASE, heating_type: 'none' });
    const gas  = calculateCategoryEmissions({ ...BASE, heating_type: 'gas' });
    expect(none.energy).toBeLessThan(gas.energy);
  });
});

// ── Emissions: Transport ──────────────────────────────────────
describe('calculateCategoryEmissions – transport', () => {
  it('electric vehicle is lower impact than petrol', () => {
    const petrol   = calculateCategoryEmissions({ ...BASE, vehicle_type: 'petrol' });
    const electric = calculateCategoryEmissions({ ...BASE, vehicle_type: 'electric' });
    expect(electric.transport).toBeLessThan(petrol.transport);
  });

  it('no vehicle and zero public transit produces zero transport emission (no flights)', () => {
    const none = calculateCategoryEmissions({ ...BASE, vehicle_type: 'none', km_week: 0, public_transport_hrs: 0, flights_short: 0, flights_long: 0 });
    expect(none.transport).toBe(0);
  });

  it('long-haul flight adds significantly more than short-haul', () => {
    const shortFlight = calculateCategoryEmissions({ ...BASE, vehicle_type: 'none', km_week: 0, flights_short: 1, flights_long: 0 });
    const longFlight  = calculateCategoryEmissions({ ...BASE, vehicle_type: 'none', km_week: 0, flights_short: 0, flights_long: 1 });
    expect(longFlight.transport).toBeGreaterThan(shortFlight.transport);
  });
});

// ── Emissions: Food ───────────────────────────────────────────
describe('calculateCategoryEmissions – food', () => {
  it('vegan diet produces lowest food emissions', () => {
    const vegan  = calculateCategoryEmissions({ ...BASE, diet_type: 'vegan' });
    const heavy  = calculateCategoryEmissions({ ...BASE, diet_type: 'heavy' });
    expect(vegan.food).toBeLessThan(heavy.food);
  });

  it('food waste increases emissions', () => {
    const noWaste   = calculateCategoryEmissions({ ...BASE, food_waste: 'never' });
    const highWaste = calculateCategoryEmissions({ ...BASE, food_waste: 'often' });
    expect(highWaste.food).toBeGreaterThan(noWaste.food);
  });

  it('local food reduces food emissions vs imported', () => {
    const local    = calculateCategoryEmissions({ ...BASE, local_food: 'mostly_local' });
    const imported = calculateCategoryEmissions({ ...BASE, local_food: 'mostly_imported' });
    expect(local.food).toBeLessThan(imported.food);
  });

  it('dairy has no effect on vegan diet', () => {
    const noDairy   = calculateCategoryEmissions({ ...BASE, diet_type: 'vegan', dairy_freq: 'rarely' });
    const withDairy = calculateCategoryEmissions({ ...BASE, diet_type: 'vegan', dairy_freq: 'daily' });
    expect(noDairy.food).toBe(withDairy.food);
  });
});

// ── Full Result Generation ─────────────────────────────────────
describe('generateFootprintResult', () => {
  it('total_kg equals sum of category breakdowns', () => {
    const result = generateFootprintResult(BASE);
    const sum =
      result.breakdown.energy.kg +
      result.breakdown.transport.kg +
      result.breakdown.food.kg +
      result.breakdown.lifestyle.kg;
    expect(result.total_kg).toBeCloseTo(sum, -1);
  });

  it('eco-champion data produces green label', () => {
    const ecoData: CalculatorFormData = {
      ...BASE,
      grid_type: 'renewable',
      vehicle_type: 'none',
      km_week: 0,
      flights_short: 0,
      flights_long: 0,
      diet_type: 'vegan',
      food_waste: 'never',
      fast_fashion: 0,
      electronics: 0,
      packages_month: 0,
      recycling: 'always',
    };
    const result = generateFootprintResult(ecoData);
    expect(result.label).toBe('Eco Champion');
  });

  it('high-impact data produces red label', () => {
    const highData: CalculatorFormData = {
      ...BASE,
      grid_type: 'coal',
      elec_kwh: 800,
      vehicle_type: 'diesel',
      km_week: 800,
      flights_short: 20,
      flights_long: 10,
      diet_type: 'heavy',
      food_waste: 'often',
      fast_fashion: 50,
      electronics: 10,
      packages_month: 40,
      recycling: 'rarely',
    };
    const result = generateFootprintResult(highData);
    expect(result.label).toBe('High Impact');
  });

  it('generates exactly 6 action tips', () => {
    const result = generateFootprintResult(BASE);
    expect(result.tips).toHaveLength(6);
  });

  it('all percentage breakdowns sum to approximately 100', () => {
    const result = generateFootprintResult(BASE);
    const sum =
      result.breakdown.energy.percent +
      result.breakdown.transport.percent +
      result.breakdown.food.percent +
      result.breakdown.lifestyle.percent;
    expect(sum).toBeGreaterThanOrEqual(98);
    expect(sum).toBeLessThanOrEqual(102);
  });

  it('total_kg is never negative', () => {
    const result = generateFootprintResult({ ...BASE, elec_kwh: 0, km_week: 0, gas_kg: 0 });
    expect(result.total_kg).toBeGreaterThanOrEqual(0);
  });
});
