// CarbonPulse AI – Offline Calculation Engine
// Used as a fallback when the Python backend is unavailable.

"use strict";

// ---------------------------------------------------------------------------
// Emission-factor constants (mirror of app.py constants)
// ---------------------------------------------------------------------------
const GRID_FACTORS = { coal: 0.82, mixed: 0.45, renewable: 0.05 };
const VEHICLE_FACTORS = { petrol: 0.21, diesel: 0.17, cng: 0.11, electric: 0.05, none: 0.0 };
const DIET_BASE = { vegan: 1500, vegetarian: 1700, average: 2500, heavy: 3300 };
const FOOD_WASTE_DELTA = { often: 300, sometimes: 0, never: -200 };
const BENCHMARKS = { global: 4800, india: 1900, paris: 2300 };

// ---------------------------------------------------------------------------
// Pure calculation helpers (no DOM access – easy to unit-test)
// ---------------------------------------------------------------------------

/**
 * Compute annual carbon emissions from lifestyle inputs.
 * All inputs are plain numbers / strings – no DOM dependency.
 * @returns {{ energy, transport, food, lifestyle, total }} breakdown in kg CO₂e
 */
function computeEmissions({
  elecKwh = 150,
  gridType = "coal",
  gasKg = 14.2,
  householdSize = 1,
  vehicleType = "petrol",
  kmPerWeek = 100,
  flightsShort = 2,
  flightsLong = 0,
  dietType = "average",
  foodWaste = "sometimes",
  fastFashion = 12,
  electronics = 1,
}) {
  const size = Math.max(1, householdSize);

  const elecFactor = GRID_FACTORS[gridType] ?? GRID_FACTORS.coal;
  const elecEmissions = (elecKwh * 12 * elecFactor) / size;
  const gasEmissions = (gasKg * 12 * 2.98) / size;
  const energy = elecEmissions + gasEmissions;

  const vehicleFactor = VEHICLE_FACTORS[vehicleType] ?? 0;
  const drivingEmissions = kmPerWeek * 52 * vehicleFactor;
  const flightEmissions = flightsShort * 255 + flightsLong * 1620;
  const transport = drivingEmissions + flightEmissions;

  const foodBase = DIET_BASE[dietType] ?? DIET_BASE.average;
  const food = foodBase + (FOOD_WASTE_DELTA[foodWaste] ?? 0);

  const fashion = (fastFashion / 12) * 400;
  const tech = electronics * 300;
  const lifestyle = fashion + tech;

  const total = Math.round(energy + transport + food + lifestyle);

  return { energy, transport, food, lifestyle, total };
}

/**
 * Build a human-readable comparison string against a benchmark.
 * @param {number} value
 * @param {number} benchmark
 * @returns {string}
 */
function buildComparison(value, benchmark) {
  if (benchmark === 0) return "no benchmark available";
  const diff = Math.round((Math.abs(value - benchmark) / benchmark) * 100);
  if (value > benchmark) return `above by ${diff}%`;
  if (value < benchmark) return `below by ${diff}%`;
  return "equal";
}

/**
 * Determine score label and emoji from total emissions.
 * @param {number} total kg CO₂e/yr
 * @returns {{ label: string, emoji: string }}
 */
function scoreLabel(total) {
  if (total < 2000)       return { label: "Eco Champion",    emoji: "🟢" };
  if (total <= 4000)      return { label: "Aware Citizen",   emoji: "🟡" };
  if (total <= 7000)      return { label: "Average Footprint", emoji: "🟠" };
  return                         { label: "High Impact",     emoji: "🔴" };
}

/**
 * Build the full response payload (mirrors Python backend output).
 * @param {object} inputs Raw user inputs
 * @param {string[]} warnings Validation warnings
 * @returns {object} responseData matching backend schema
 */
function buildResponseData(inputs, warnings) {
  const { energy, transport, food, lifestyle, total } = computeEmissions(inputs);

  const pct = (part) => (total ? Math.round((part / total) * 100) : 0);

  const breakdown = {
    energy:    { kg: Math.round(energy),    percent: pct(energy),    icon: "⚡" },
    transport: { kg: Math.round(transport), percent: pct(transport), icon: "🚗" },
    food:      { kg: Math.round(food),      percent: pct(food),      icon: "🥗" },
    lifestyle: { kg: Math.round(lifestyle), percent: pct(lifestyle), icon: "🛍️" },
  };

  const { label, emoji } = scoreLabel(total);

  const comparisons = {
    vs_global_avg:   buildComparison(total, BENCHMARKS.global),
    vs_india_avg:    buildComparison(total, BENCHMARKS.india),
    vs_paris_target: buildComparison(total, BENCHMARKS.paris),
  };

  // Top-2 categories by emissions → personalised action plan
  const cats = [
    { name: "energy",    kg: energy },
    { name: "transport", kg: transport },
    { name: "food",      kg: food },
    { name: "lifestyle", kg: lifestyle },
  ].sort((a, b) => b.kg - a.kg);

  const action_plan = [
    { tip: `Switch your primary ${cats[0].name} habits to low-carbon alternatives.`,         co2_saved_kg: Math.round(cats[0].kg * 0.15), difficulty: "Medium", category: cats[0].name },
    { tip: `Reduce the highest-impact activities in your ${cats[0].name} category.`,          co2_saved_kg: Math.round(cats[0].kg * 0.10), difficulty: "Hard",   category: cats[0].name },
    { tip: `Optimise your ${cats[1].name} footprint with mindful everyday choices.`,          co2_saved_kg: Math.round(cats[1].kg * 0.15), difficulty: "Medium", category: cats[1].name },
    { tip: `Find easy substitutes in ${cats[1].name} to gradually lower your impact.`,        co2_saved_kg: Math.round(cats[1].kg * 0.10), difficulty: "Easy",   category: cats[1].name },
    { tip: "Quick Win: Unplug chargers and appliances when not in use to eliminate phantom power drain.", co2_saved_kg: 50,  difficulty: "Easy", category: "Energy" },
    { tip: "Long Term: Transition to a fully renewable energy plan or consider solar installation.",      co2_saved_kg: 800, difficulty: "Hard", category: "Energy" },
  ];

  const equivalencies = [
    `${Math.round(total / 22).toLocaleString()} mature trees needed to absorb this in a year`,
    `Equivalent to driving ${Math.round(total / 0.21).toLocaleString()} km in an average petrol car`,
    `${(total / (BENCHMARKS.india / 12)).toFixed(1)} months of average Indian household emissions`,
  ];

  return {
    score: { total_kg_co2e: total, label, emoji },
    breakdown,
    comparisons,
    action_plan,
    equivalencies,
    motivational_message:
      "You've taken the important first step of measuring your footprint! Small, consistent changes will help reduce your impact.",
    data_warnings: warnings,
  };
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

/** Safely read a value from a form element; return defaultVal if missing. */
function safeGet(id, defaultVal) {
  const el = document.getElementById(id);
  return el && el.value !== "" ? el.value : defaultVal;
}

/** Collect all form inputs and return a validated inputs object + warnings array. */
function collectInputs() {
  const warnings = [];

  const elecKwh     = parseFloat(safeGet("elec-kwh",       "150"))  || 150;
  const gridType    = safeGet("grid-type",    "coal");
  const gasKg       = parseFloat(safeGet("gas-kg",         "14.2")) || 14.2;
  const householdSize = Math.max(1, parseInt(safeGet("household-size", "1"), 10) || 1);
  const vehicleType = safeGet("vehicle-type", "petrol");
  const kmPerWeek   = parseFloat(safeGet("km-week",        "100"))  || 100;
  const flightsShort = parseInt(safeGet("flights-short",   "2"), 10) || 0;
  const flightsLong  = parseInt(safeGet("flights-long",    "0"), 10) || 0;
  const dietType    = safeGet("diet-type",    "average");
  const foodWaste   = safeGet("food-waste",   "sometimes");
  const fastFashion = parseInt(safeGet("fast-fashion",     "12"), 10) || 0;
  const electronics = parseInt(safeGet("electronics",      "1"),  10) || 0;

  if (!document.getElementById("elec-kwh")) {
    warnings.push("Form inputs not found. Using default profile assumptions for calculation.");
  }
  if (elecKwh > 2000 * householdSize) warnings.push("Unusually high electricity consumption flagged.");
  if (kmPerWeek > 2000)               warnings.push("Unusually high weekly driving distance flagged.");

  return {
    inputs: { elecKwh, gridType, gasKg, householdSize, vehicleType, kmPerWeek, flightsShort, flightsLong, dietType, foodWaste, fastFashion, electronics },
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Main entry point (called by index.html button)
// ---------------------------------------------------------------------------

function analyzeFootprint() {
  const btnText    = document.querySelector(".btn-text");
  const btnLoading = document.querySelector(".btn-loading");
  const overlay    = document.getElementById("loading-overlay");
  const resultsSection = document.getElementById("results-section");

  // Show loading state
  if (btnText)    btnText.style.display    = "none";
  if (btnLoading) btnLoading.style.display = "inline-block";
  if (overlay)    overlay.style.display    = "flex";
  if (resultsSection) resultsSection.style.display = "none";

  // Simulate async "AI analysis" delay for UX
  setTimeout(() => {
    const { inputs, warnings } = collectInputs();
    const responseData = buildResponseData(inputs, warnings);

    // Log JSON to console (required by prompt)
    console.log("CarbonPulse AI JSON Output:", JSON.stringify(responseData, null, 2));

    // Restore UI
    if (overlay)    overlay.style.display    = "none";
    if (btnText)    btnText.style.display    = "inline-block";
    if (btnLoading) btnLoading.style.display = "none";
    if (resultsSection) resultsSection.style.display = "block";

    // Display warnings
    const warningsContainer = document.getElementById("warnings-container");
    const warningsList      = document.getElementById("warnings-list");
    if (warningsContainer && warningsList) {
      if (warnings.length > 0) {
        warningsList.innerHTML = warnings.map((w) => `<li>${w}</li>`).join("");
        warningsContainer.style.display = "block";
      } else {
        warningsContainer.style.display = "none";
      }
    }
  }, 1500);
}
