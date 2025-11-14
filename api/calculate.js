/* api/calculate.js
   Vercel serverless function with Climatiq integration + fallback
*/
const FALLBACK = {
  travel: { car: 0.24, scooter: 0.07, bus: 0.05, train: 0.04, ev: 0.02, walk: 0, cycle: 0 },
  electricity: 0.9,
  food: { meat: 1.0, mixed: 0.57, veg: 0.29 },
  wastePerKgPerMonth: 0.5
};

const CLIMATIQ_IDS = {
  travel: {
    car: "passenger_vehicle-vehicle_type_car-fuel_source_petrol",
    ev: "passenger_vehicle-vehicle_type_car-fuel_source_electricity",
    bus: "passenger_vehicle-vehicle_type_bus-fuel_source_diesel",
    train: "passenger_transport_rail",
    scooter: "passenger_vehicle-vehicle_type_motorcycle-fuel_source_petrol",
    walk: null,
    cycle: null
  },
  electricity: { default: "electricity_grid_mix" },
  food: {
    meat: "food-beef",
    mixed: null,
    veg: "food-vegetables"
  }
};

async function climatiqEstimate(apiKey, emissionFactorId, parameters) {
  const url = "https://beta3.api.climatiq.org/estimate";
  const payload = { emission_factor: { id: emissionFactorId }, parameters };
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Climatiq ${resp.status}: ${text}`);
  }
  return resp.json();
}

function computeFallback(data) {
  const travelKm = Number(data.travelKm) || 0;
  const travelMode = (data.travelMode || data.vehicleType || "car").toLowerCase();
  const kWh = Number(data.kWh || data.familyKwh) || 0;
  const foodCategory = (data.foodCategory || data.diet || data.familyDiet || "mixed").toLowerCase();
  const wasteKgPerMonth = Number(data.wasteKgPerMonth || data.waste || data.familyWaste) || 0;

  const travelFactor = FALLBACK.travel[travelMode] ?? FALLBACK.travel.car;
  const travel = travelKm * travelFactor;
  const electricity = kWh * FALLBACK.electricity;
  const food = FALLBACK.food[foodCategory] ?? FALLBACK.food.mixed;
  const waste = (wasteKgPerMonth / 30) * FALLBACK.wastePerKgPerMonth;

  const total = +(travel + electricity + food + waste).toFixed(2);
  return {
    total,
    breakdown: {
      travel: +travel.toFixed(2),
      electricity: +electricity.toFixed(2),
      food: +food.toFixed(2),
      waste: +waste.toFixed(2)
    },
    used: "fallback"
  };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    const body = req.body || {};
    const apiKey = process.env.CLIMATIQ_KEY;

    // Accept multiple alternate keys (frontend may send diet / familyKwh / familyWaste etc.)
    const travelKm = Number(body.travelKm || body.familyTravelKm || 0) || 0;
    const travelMode = (body.travelMode || body.vehicleType || "car").toLowerCase();
    const kWh = Number(body.kWh || body.familyKwh || 0) || 0;
    const foodCategory = (body.foodCategory || body.diet || body.familyDiet || "mixed").toLowerCase();
    const wasteKgPerMonth = Number(body.wasteKgPerMonth || body.waste || body.familyWaste || 0) || 0;

    // If Climatiq key missing — use fallback (safe)
    if (!apiKey) {
      const result = computeFallback({ travelKm, travelMode, kWh, foodCategory, wasteKgPerMonth });
      result.originalData = { travelKm, travelMode, kWh, foodCategory, wasteKgPerMonth };
      return res.status(200).json(result);
    }

    let used = "climatiq";
    const breakdown = { travel: 0, electricity: 0, food: 0, waste: 0 };

    // --- Travel (try Climatiq, fallback if needed) ---
    try {
      const efId = CLIMATIQ_IDS.travel[travelMode];
      if (efId && travelKm > 0) {
        const clim = await climatiqEstimate(apiKey, efId, { distance: travelKm, distance_unit: "km" });
        breakdown.travel = Number(clim.co2e) || 0;
      } else {
        breakdown.travel = travelKm * (FALLBACK.travel[travelMode] ?? FALLBACK.travel.car);
        if (used === "climatiq") used = "mixed";
      }
    } catch (err) {
      console.error("Climatiq travel error:", err?.message || err);
      breakdown.travel = travelKm * (FALLBACK.travel[travelMode] ?? FALLBACK.travel.car);
      used = "mixed";
    }

    // --- Electricity ---
    try {
      const efId = CLIMATIQ_IDS.electricity.default;
      if (efId && kWh > 0) {
        const clim = await climatiqEstimate(apiKey, efId, { energy: kWh, energy_unit: "kWh" });
        breakdown.electricity = Number(clim.co2e) || 0;
      } else {
        breakdown.electricity = kWh * FALLBACK.electricity;
        if (used === "climatiq") used = "mixed";
      }
    } catch (err) {
      console.error("Climatiq electricity error:", err?.message || err);
      breakdown.electricity = kWh * FALLBACK.electricity;
      used = "mixed";
    }

    // --- Food ---
    try {
      const efId = CLIMATIQ_IDS.food[foodCategory];
      if (efId) {
        const clim = await climatiqEstimate(apiKey, efId, { quantity: 1 });
        breakdown.food = Number(clim.co2e) || 0;
      } else {
        breakdown.food = FALLBACK.food[foodCategory] ?? FALLBACK.food.mixed;
        if (used === "climatiq") used = "mixed";
      }
    } catch (err) {
      console.error("Climatiq food error:", err?.message || err);
      breakdown.food = FALLBACK.food[foodCategory] ?? FALLBACK.food.mixed;
      used = "mixed";
    }

    // --- Waste (simple calc) ---
    try {
      breakdown.waste = (wasteKgPerMonth / 30) * FALLBACK.wastePerKgPerMonth;
    } catch (err) {
      console.error("Waste calc error:", err?.message || err);
      breakdown.waste = (wasteKgPerMonth / 30) * FALLBACK.wastePerKgPerMonth;
      used = "mixed";
    }

    const total = +(Object.values(breakdown).reduce((a, b) => a + (Number(b) || 0), 0)).toFixed(2);

    return res.status(200).json({
      total,
      breakdown,
      used,
      originalData: { travelKm, travelMode, kWh, foodCategory, wasteKgPerMonth }
    });
  } catch (ex) {
    console.error("Unhandled error in /api/calculate", ex);
    return res.status(500).json({ error: "Internal server error" });
  }
};
