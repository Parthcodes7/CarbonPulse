"""
CarbonPulse AI – Flask Backend
Calculates and analyses a user's annual personal carbon footprint.

Public symbols (also used by test_app.py):
  _safe_float, _safe_int, _comparison_string, computeEmissions_py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Emission-factor constants (kg CO₂e per unit)
# ---------------------------------------------------------------------------
GRID_FACTORS = {
    "coal": 0.82,
    "mixed": 0.45,
    "renewable": 0.05,
}

VEHICLE_FACTORS = {
    "petrol": 0.21,
    "diesel": 0.17,
    "cng": 0.11,
    "electric": 0.05,
    "none": 0.0,
}

DIET_BASE = {
    "vegan": 1500,
    "vegetarian": 1700,
    "average": 2500,
    "heavy": 3300,
}

FOOD_WASTE_DELTA = {
    "often": 300,
    "sometimes": 0,
    "never": -200,
}

# Benchmark values (kg CO₂e / yr)
GLOBAL_AVG = 4800
INDIA_AVG = 1900
PARIS_TARGET = 2300

# Warning thresholds
MAX_KWH_PER_PERSON = 2000
MAX_KM_WEEK = 2000
MAX_HOUSEHOLD = 10

# Action-tip database
TIPS_DB = {
    "energy": [
        {"tip": "Switch to a renewable energy plan with your grid provider to slash base emissions.", "diff": "Hard", "pct": 0.40},
        {"tip": "Replace all old bulbs with energy-efficient LEDs.", "diff": "Easy", "pct": 0.05},
        {"tip": "Invest in an induction cooktop to reduce LPG dependence.", "diff": "Medium", "pct": 0.15},
    ],
    "transport": [
        {"tip": "Carpool or use public transit twice a week to significantly cut per-passenger fuel burn.", "diff": "Medium", "pct": 0.20},
        {"tip": "Avoid short-haul flights by opting for trains on trips under 500 km.", "diff": "Hard", "pct": 0.30},
        {"tip": "Ensure your vehicle's tyre pressure is optimal to improve fuel efficiency.", "diff": "Easy", "pct": 0.05},
    ],
    "food": [
        {"tip": "Adopt a 'Meatless Monday' routine to lower agricultural methane emissions.", "diff": "Medium", "pct": 0.15},
        {"tip": "Source your groceries from local farmers' markets to reduce transport emissions.", "diff": "Hard", "pct": 0.10},
        {"tip": "Plan meals carefully to eliminate food waste decomposing in landfills.", "diff": "Easy", "pct": 0.05},
    ],
    "lifestyle": [
        {"tip": "Buy second-hand or sustainable clothing instead of fast-fashion brands.", "diff": "Medium", "pct": 0.20},
        {"tip": "Repair electronic devices instead of buying new ones to reduce e-waste.", "diff": "Hard", "pct": 0.30},
        {"tip": "Always recycle packaging to prevent landfill accumulation.", "diff": "Easy", "pct": 0.05},
    ],
}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _safe_float(value, default: float) -> float:
    """Coerce *value* to float, falling back to *default* on failure."""
    try:
        result = float(value)
        return result if result >= 0 else default
    except (TypeError, ValueError):
        return default


def _safe_int(value, default: int) -> int:
    """Coerce *value* to int, falling back to *default* on failure."""
    try:
        result = int(value)
        return result if result >= 0 else default
    except (TypeError, ValueError):
        return default


def _comparison_string(value: float, benchmark: float) -> str:
    """Return a human-readable comparison string (e.g. 'above by 12%')."""
    if benchmark == 0:
        return "no benchmark available"
    diff = round((abs(value - benchmark) / benchmark) * 100)
    if value > benchmark:
        return f"above by {diff}%"
    if value < benchmark:
        return f"below by {diff}%"
    return "equal"


def _build_tips(category: str, category_kg: float, breakdown: dict) -> list:
    """Return the first two action tips for *category*, enriched with savings."""
    return [
        {
            "tip": t["tip"],
            "co2_saved_kg": round(breakdown[category]["kg"] * t["pct"]),
            "difficulty": t["diff"],
            "category": category.capitalize(),
        }
        for t in TIPS_DB[category][:2]
    ]


# ---------------------------------------------------------------------------
# Testable computation wrapper
# ---------------------------------------------------------------------------

def computeEmissions_py(
    elec_kwh: float = 150.0,
    grid_type: str = "coal",
    gas_kg: float = 14.2,
    household_size: int = 1,
    vehicle_type: str = "petrol",
    km_week: float = 100.0,
    flights_short: int = 2,
    flights_long: int = 0,
    diet_type: str = "average",
    food_waste: str = "sometimes",
    fast_fashion: int = 12,
    electronics: int = 1,
) -> dict:
    """Pure-function wrapper around the emission logic – no HTTP context needed."""
    size = max(1, household_size)
    elec_factor    = GRID_FACTORS.get(grid_type, GRID_FACTORS["coal"])
    elec_emissions = (elec_kwh * 12 * elec_factor) / size
    gas_emissions  = (gas_kg * 12 * 2.98) / size
    energy         = elec_emissions + gas_emissions

    vehicle_factor  = VEHICLE_FACTORS.get(vehicle_type, VEHICLE_FACTORS["petrol"])
    driving         = km_week * 52 * vehicle_factor
    flights         = flights_short * 255 + flights_long * 1620
    transport       = driving + flights

    food            = DIET_BASE.get(diet_type, DIET_BASE["average"]) + FOOD_WASTE_DELTA.get(food_waste, 0)

    fashion         = (fast_fashion / 12) * 400
    tech            = electronics * 300
    lifestyle       = fashion + tech

    total = round(energy + transport + food + lifestyle)
    return {"energy": energy, "transport": transport, "food": food, "lifestyle": lifestyle, "total": total}


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Accept lifestyle data, compute carbon emissions, and return a rich JSON report."""
    data = request.get_json(silent=True) or {}

    # -- Parse & validate inputs -----------------------------------------
    warnings: list[str] = []

    elec_kwh = _safe_float(data.get("elec_kwh"), 150.0)
    grid_type = data.get("grid_type", "coal")
    gas_kg = _safe_float(data.get("gas_kg"), 14.2)
    household_size = max(1, _safe_int(data.get("household_size"), 1))

    vehicle_type = data.get("vehicle_type", "petrol")
    km_week = _safe_float(data.get("km_week"), 100.0)
    flights_short = _safe_int(data.get("flights_short"), 2)
    flights_long = _safe_int(data.get("flights_long"), 0)

    diet_type = data.get("diet_type", "average")
    food_waste = data.get("food_waste", "sometimes")
    fast_fashion = _safe_int(data.get("fast_fashion"), 12)
    electronics = _safe_int(data.get("electronics"), 1)

    # Validation warnings
    if elec_kwh > MAX_KWH_PER_PERSON * household_size:
        warnings.append("Unusually high electricity consumption flagged for review.")
    if km_week > MAX_KM_WEEK:
        warnings.append("Unusually high weekly driving distance flagged.")
    if household_size > MAX_HOUSEHOLD:
        warnings.append("Large household size detected; per-capita emissions may scale unusually.")
    if grid_type not in GRID_FACTORS:
        warnings.append(f"Unknown grid type '{grid_type}'; defaulting to 'coal'.")
        grid_type = "coal"
    if vehicle_type not in VEHICLE_FACTORS:
        warnings.append(f"Unknown vehicle type '{vehicle_type}'; defaulting to 'petrol'.")
        vehicle_type = "petrol"

    # -- Calculate emissions (annual kg CO₂e) ----------------------------
    elec_factor = GRID_FACTORS[grid_type]
    elec_emissions = (elec_kwh * 12 * elec_factor) / household_size
    gas_emissions = (gas_kg * 12 * 2.98) / household_size
    energy_total = elec_emissions + gas_emissions

    vehicle_factor = VEHICLE_FACTORS[vehicle_type]
    driving_emissions = km_week * 52 * vehicle_factor
    flight_emissions = (flights_short * 255) + (flights_long * 1620)
    transport_total = driving_emissions + flight_emissions

    food_total = DIET_BASE.get(diet_type, DIET_BASE["average"])
    food_total += FOOD_WASTE_DELTA.get(food_waste, 0)

    fashion_emissions = (fast_fashion / 12) * 400
    tech_emissions = electronics * 300
    lifestyle_total = fashion_emissions + tech_emissions

    total_emissions = round(energy_total + transport_total + food_total + lifestyle_total)

    # -- Breakdown --------------------------------------------------------
    def _pct(part: float) -> int:
        return round((part / total_emissions) * 100) if total_emissions else 0

    breakdown = {
        "energy":    {"kg": round(energy_total),    "percent": _pct(energy_total),    "icon": "⚡"},
        "transport": {"kg": round(transport_total),  "percent": _pct(transport_total), "icon": "🚗"},
        "food":      {"kg": round(food_total),       "percent": _pct(food_total),      "icon": "🥗"},
        "lifestyle": {"kg": round(lifestyle_total),  "percent": _pct(lifestyle_total), "icon": "🛍️"},
    }

    # -- Score label ------------------------------------------------------
    if total_emissions < 2000:
        label, emoji = "Eco Champion", "🟢"
    elif total_emissions <= 4000:
        label, emoji = "Aware Citizen", "🟡"
    elif total_emissions <= 7000:
        label, emoji = "Average Footprint", "🟠"
    else:
        label, emoji = "High Impact", "🔴"

    # -- Comparisons ------------------------------------------------------
    comparisons = {
        "vs_global_avg":  _comparison_string(total_emissions, GLOBAL_AVG),
        "vs_india_avg":   _comparison_string(total_emissions, INDIA_AVG),
        "vs_paris_target": _comparison_string(total_emissions, PARIS_TARGET),
    }

    # -- Action plan (top 2 categories by emissions) ----------------------
    sorted_cats = sorted(
        [("energy", energy_total), ("transport", transport_total),
         ("food", food_total), ("lifestyle", lifestyle_total)],
        key=lambda x: x[1],
        reverse=True,
    )
    top1, top2 = sorted_cats[0][0], sorted_cats[1][0]

    action_plan = _build_tips(top1, energy_total, breakdown) + _build_tips(top2, energy_total, breakdown)
    action_plan += [
        {"tip": "Unplug chargers and appliances at the wall to eliminate phantom electricity drain.", "co2_saved_kg": 50,  "difficulty": "Easy", "category": "Energy"},
        {"tip": "Start a compost bin at home to turn organic waste into soil instead of methane.",   "co2_saved_kg": 120, "difficulty": "Hard", "category": "Food"},
    ]

    # -- Equivalencies ----------------------------------------------------
    equivalencies = [
        f"{round(total_emissions / 22):,} mature trees needed to absorb this in a year.",
        f"Equivalent to driving {round(total_emissions / 0.21):,} km in a petrol car.",
        f"{(total_emissions / (INDIA_AVG / 12)):.1f} months of an average Indian's emissions.",
        f"Enough energy to fully charge {round(total_emissions * 120):,} smartphones.",
    ]

    # -- Response ---------------------------------------------------------
    return jsonify({
        "score": {"total_kg_co2e": total_emissions, "label": label, "emoji": emoji},
        "breakdown": breakdown,
        "comparisons": comparisons,
        "action_plan": action_plan,
        "equivalencies": equivalencies,
        "motivational_message": (
            f"You've taken the vital first step! While your footprint is currently classified as "
            f"'{label}', small consistent changes will make a massive positive impact."
        ),
        "data_warnings": warnings,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
