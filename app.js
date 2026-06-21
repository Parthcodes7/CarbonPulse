/**
 * app.js – CarbonPulse AI frontend entry point.
 * Collects form data, calls the Python backend, then renders results.
 * Falls back gracefully on network errors.
 */

"use strict";

// Production: set this to your Cloud Run service URL.
// Local dev: falls back to localhost:5000 automatically.
const API_URL =
  (window.CARBONPULSE_API_URL || "http://127.0.0.1:5000") + "/api/analyze";
const UI_DELAY_MS = 800; // small delay for a smooth transition feel

// ---------------------------------------------------------------------------
// UI State helpers
// ---------------------------------------------------------------------------

function setLoadingState(isLoading) {
  const btnText    = document.querySelector(".btn-text");
  const btnLoading = document.querySelector(".btn-loading");
  const overlay    = document.getElementById("loading-overlay");

  if (btnText)    btnText.style.display    = isLoading ? "none" : "inline-block";
  if (btnLoading) btnLoading.style.display = isLoading ? "inline-block" : "none";
  if (overlay)    overlay.style.display    = isLoading ? "flex" : "none";
}

// ---------------------------------------------------------------------------
// Form data collection
// ---------------------------------------------------------------------------

function safeNum(id, defaultVal) {
  const el = document.getElementById(id);
  if (!el || el.value === "") return defaultVal;
  const v = parseFloat(el.value);
  return isNaN(v) ? defaultVal : v;
}

function safeStr(id, defaultVal) {
  const el = document.getElementById(id);
  return el && el.value ? el.value : defaultVal;
}

function collectPayload() {
  return {
    elec_kwh:       safeNum("elec-kwh",       150),
    grid_type:      safeStr("grid-type",       "coal"),
    gas_kg:         safeNum("gas-kg",          14.2),
    household_size: safeNum("household-size",  1) || 1,
    vehicle_type:   safeStr("vehicle-type",    "petrol"),
    km_week:        safeNum("km-week",         100),
    flights_short:  safeNum("flights-short",   2),
    flights_long:   safeNum("flights-long",    0),
    diet_type:      safeStr("diet-type",       "average"),
    food_waste:     safeStr("food-waste",       "sometimes"),
    fast_fashion:   safeNum("fast-fashion",    12),
    electronics:    safeNum("electronics",     1),
  };
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function renderComparison(id, valStr) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = valStr;
  el.className   = "comp-val " + (valStr.includes("above") ? "above" : "below");
}

function renderBreakdown(breakdown) {
  const grid = document.getElementById("breakdown-grid");
  if (!grid) return;
  grid.innerHTML = Object.entries(breakdown)
    .map(([k, v]) => `
      <div class="breakdown-card">
        <span class="bc-icon">${v.icon}</span>
        <div class="bc-name">${k.charAt(0).toUpperCase() + k.slice(1)}</div>
        <div class="bc-val">${v.kg.toLocaleString()} kg</div>
        <div class="bc-bar-bg">
          <div class="bc-bar-fill" style="width:${v.percent}%"></div>
        </div>
        <div style="font-size:0.85rem;margin-top:5px;color:#9ca3af;">${v.percent}% of total</div>
      </div>`)
    .join("");
}

function renderActionPlan(actionPlan) {
  const grid = document.getElementById("action-plan-grid");
  if (!grid) return;
  grid.innerHTML = actionPlan
    .map((a) => `
      <div class="action-card">
        <span class="ac-badge badge-${a.difficulty.toLowerCase()}">${a.difficulty}</span>
        <span class="ac-cat">${a.category}</span>
        <p class="ac-tip">${a.tip}</p>
        <div class="ac-saved">📉 Saves ~${a.co2_saved_kg} kg CO₂e/yr</div>
      </div>`)
    .join("");
}

function renderEquivalencies(equivalencies) {
  const list = document.getElementById("equivalencies-list");
  if (!list) return;
  const icons = ["🌳", "🚗", "🇮🇳", "📱"];
  list.innerHTML = equivalencies
    .map((eq, i) => `<li><span>${icons[i] ?? "🌍"}</span> <span>${eq}</span></li>`)
    .join("");
}

function renderWarnings(warnings) {
  const container = document.getElementById("warnings-container");
  const list      = document.getElementById("warnings-list");
  if (!container || !list) return;

  if (warnings && warnings.length > 0) {
    list.innerHTML          = warnings.map((w) => `<li>${w}</li>`).join("");
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

function renderResults(data) {
  const { score, breakdown, comparisons, action_plan, equivalencies, motivational_message, data_warnings } = data;

  // Score summary
  const setEl = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  setEl("score-total",          score.total_kg_co2e.toLocaleString());
  setEl("score-emoji",          score.emoji);
  setEl("score-label",          score.label);
  setEl("motivational-message", motivational_message);

  // Comparisons
  renderComparison("comp-global", comparisons.vs_global_avg);
  renderComparison("comp-india",  comparisons.vs_india_avg);
  renderComparison("comp-paris",  comparisons.vs_paris_target);

  // Sections
  renderBreakdown(breakdown);
  renderActionPlan(action_plan);
  renderEquivalencies(equivalencies);
  renderWarnings(data_warnings);

  // JSON dump for dev panel
  const evalEl = document.getElementById("promptwar-eval");
  if (evalEl) evalEl.textContent = JSON.stringify(data, null, 2);

  // Swap sections
  const inputSection   = document.getElementById("input-section");
  const resultsSection = document.getElementById("results-section");
  if (inputSection)   inputSection.style.display   = "none";
  if (resultsSection) resultsSection.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ---------------------------------------------------------------------------
// Main analyse function
// ---------------------------------------------------------------------------

async function analyzeFootprint() {
  setLoadingState(true);

  const payload = collectPayload();

  try {
    const response = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Brief pause for a smooth UX transition
    setTimeout(() => {
      setLoadingState(false);
      renderResults(data);
    }, UI_DELAY_MS);

  } catch (err) {
    console.error("Backend error:", err);
    setLoadingState(false);
    alert(
      `Could not connect to the Python backend.\n\n` +
      `Make sure app.py is running on port 5000:\n` +
      `  python app.py\n\n` +
      `Error: ${err.message}`
    );
  }
}

// ---------------------------------------------------------------------------
// Reset to input view
// ---------------------------------------------------------------------------

function resetForm() {
  const inputSection   = document.getElementById("input-section");
  const resultsSection = document.getElementById("results-section");
  if (resultsSection) resultsSection.style.display = "none";
  if (inputSection)   inputSection.style.display   = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
