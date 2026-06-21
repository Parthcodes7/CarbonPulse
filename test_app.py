"""
Tests for CarbonPulse AI – app.py
Run with:  pytest test_app.py -v
"""

import pytest
import json
from app import app, computeEmissions_py, _safe_float, _safe_int, _comparison_string


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """Flask test client with testing mode enabled."""
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def post_analyze(client, payload: dict):
    """Helper: POST to /api/analyze and return the parsed JSON."""
    resp = client.post(
        "/api/analyze",
        data=json.dumps(payload),
        content_type="application/json",
    )
    return resp.status_code, resp.get_json()


# ---------------------------------------------------------------------------
# Helper-function unit tests
# ---------------------------------------------------------------------------

class TestSafeFloat:
    def test_valid_float(self):
        assert _safe_float("3.14", 0.0) == pytest.approx(3.14)

    def test_valid_int_string(self):
        assert _safe_float("42", 0.0) == pytest.approx(42.0)

    def test_none_returns_default(self):
        assert _safe_float(None, 99.9) == pytest.approx(99.9)

    def test_empty_string_returns_default(self):
        assert _safe_float("", 5.0) == pytest.approx(5.0)

    def test_non_numeric_returns_default(self):
        assert _safe_float("abc", 1.0) == pytest.approx(1.0)

    def test_negative_returns_default(self):
        assert _safe_float(-10, 2.0) == pytest.approx(2.0)


class TestSafeInt:
    def test_valid_int(self):
        assert _safe_int("7", 0) == 7

    def test_float_string_falls_back_to_default(self):
        # int("3.9") raises ValueError in Python, so the default is returned
        assert _safe_int("3.9", 0) == 0

    def test_valid_int_string(self):
        assert _safe_int("7", 0) == 7

    def test_none_returns_default(self):
        assert _safe_int(None, 5) == 5

    def test_negative_returns_default(self):
        assert _safe_int(-1, 3) == 3


class TestComparisonString:
    def test_above(self):
        result = _comparison_string(6000, 4800)
        assert "above" in result
        assert "25%" in result

    def test_below(self):
        result = _comparison_string(1900, 4800)
        assert "below" in result

    def test_equal(self):
        assert _comparison_string(4800, 4800) == "equal"

    def test_zero_benchmark(self):
        assert _comparison_string(100, 0) == "no benchmark available"


# ---------------------------------------------------------------------------
# /api/analyze integration tests
# ---------------------------------------------------------------------------

DEFAULT_PAYLOAD = {
    "elec_kwh": 150,
    "grid_type": "coal",
    "gas_kg": 14.2,
    "household_size": 1,
    "vehicle_type": "petrol",
    "km_week": 100,
    "flights_short": 2,
    "flights_long": 0,
    "diet_type": "average",
    "food_waste": "sometimes",
    "fast_fashion": 12,
    "electronics": 1,
}


class TestAnalyzeEndpoint:

    def test_status_200_with_valid_payload(self, client):
        status, data = post_analyze(client, DEFAULT_PAYLOAD)
        assert status == 200
        assert data is not None

    def test_response_has_required_keys(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        for key in ("score", "breakdown", "comparisons", "action_plan", "equivalencies",
                    "motivational_message", "data_warnings"):
            assert key in data, f"Missing key: {key}"

    def test_score_structure(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        score = data["score"]
        assert "total_kg_co2e" in score
        assert "label" in score
        assert "emoji" in score
        assert isinstance(score["total_kg_co2e"], (int, float))
        assert score["total_kg_co2e"] > 0

    def test_breakdown_four_categories(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        assert set(data["breakdown"].keys()) == {"energy", "transport", "food", "lifestyle"}

    def test_breakdown_percents_approx_100(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        total_pct = sum(v["percent"] for v in data["breakdown"].values())
        # Rounding may cause ±4 off 100
        assert 96 <= total_pct <= 104, f"Percents sum to {total_pct}"

    def test_empty_body_uses_defaults(self, client):
        status, data = post_analyze(client, {})
        assert status == 200
        assert data["score"]["total_kg_co2e"] > 0

    def test_renewable_grid_lowers_energy(self, client):
        coal_payload    = {**DEFAULT_PAYLOAD, "grid_type": "coal"}
        renew_payload   = {**DEFAULT_PAYLOAD, "grid_type": "renewable"}
        _, coal_data  = post_analyze(client, coal_payload)
        _, renew_data = post_analyze(client, renew_payload)
        assert renew_data["score"]["total_kg_co2e"] < coal_data["score"]["total_kg_co2e"]

    def test_vegan_diet_lowers_food(self, client):
        heavy_payload  = {**DEFAULT_PAYLOAD, "diet_type": "heavy"}
        vegan_payload  = {**DEFAULT_PAYLOAD, "diet_type": "vegan"}
        _, heavy_data = post_analyze(client, heavy_payload)
        _, vegan_data = post_analyze(client, vegan_payload)
        assert vegan_data["breakdown"]["food"]["kg"] < heavy_data["breakdown"]["food"]["kg"]

    def test_electric_vehicle_lowers_transport(self, client):
        petrol_payload   = {**DEFAULT_PAYLOAD, "vehicle_type": "petrol"}
        electric_payload = {**DEFAULT_PAYLOAD, "vehicle_type": "electric"}
        _, petrol_data  = post_analyze(client, petrol_payload)
        _, electric_data = post_analyze(client, electric_payload)
        assert electric_data["breakdown"]["transport"]["kg"] < petrol_data["breakdown"]["transport"]["kg"]

    def test_large_household_divides_energy(self, client):
        single    = {**DEFAULT_PAYLOAD, "household_size": 1}
        family_of_4 = {**DEFAULT_PAYLOAD, "household_size": 4}
        _, s_data = post_analyze(client, single)
        _, f_data = post_analyze(client, family_of_4)
        assert f_data["breakdown"]["energy"]["kg"] < s_data["breakdown"]["energy"]["kg"]

    def test_high_kwh_triggers_warning(self, client):
        payload = {**DEFAULT_PAYLOAD, "elec_kwh": 9999}
        _, data = post_analyze(client, payload)
        assert len(data["data_warnings"]) > 0
        assert any("electricity" in w.lower() for w in data["data_warnings"])

    def test_high_km_triggers_warning(self, client):
        payload = {**DEFAULT_PAYLOAD, "km_week": 5000}
        _, data = post_analyze(client, payload)
        assert any("driving" in w.lower() for w in data["data_warnings"])

    def test_unknown_grid_type_triggers_warning(self, client):
        payload = {**DEFAULT_PAYLOAD, "grid_type": "nuclear"}
        _, data = post_analyze(client, payload)
        assert any("grid type" in w.lower() for w in data["data_warnings"])

    def test_unknown_vehicle_type_triggers_warning(self, client):
        payload = {**DEFAULT_PAYLOAD, "vehicle_type": "hoverboard"}
        _, data = post_analyze(client, payload)
        assert any("vehicle type" in w.lower() for w in data["data_warnings"])

    def test_eco_champion_label(self, client):
        # Very low consumption should yield Eco Champion
        payload = {
            "elec_kwh": 10, "grid_type": "renewable", "gas_kg": 0,
            "household_size": 1, "vehicle_type": "none", "km_week": 0,
            "flights_short": 0, "flights_long": 0, "diet_type": "vegan",
            "food_waste": "never", "fast_fashion": 0, "electronics": 0,
        }
        _, data = post_analyze(client, payload)
        assert data["score"]["label"] == "Eco Champion"

    def test_high_impact_label(self, client):
        # Very high consumption should yield High Impact
        payload = {
            "elec_kwh": 2000, "grid_type": "coal", "gas_kg": 100,
            "household_size": 1, "vehicle_type": "petrol", "km_week": 1000,
            "flights_short": 20, "flights_long": 10, "diet_type": "heavy",
            "food_waste": "often", "fast_fashion": 100, "electronics": 10,
        }
        _, data = post_analyze(client, payload)
        assert data["score"]["label"] == "High Impact"

    def test_action_plan_not_empty(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        assert len(data["action_plan"]) > 0

    def test_equivalencies_not_empty(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        assert len(data["equivalencies"]) > 0

    def test_comparisons_structure(self, client):
        _, data = post_analyze(client, DEFAULT_PAYLOAD)
        comparisons = data["comparisons"]
        for key in ("vs_global_avg", "vs_india_avg", "vs_paris_target"):
            assert key in comparisons
            assert isinstance(comparisons[key], str)
