/* backend/routes/calculate.js
   Express route handler with Climatiq integration + fallback */

const FALLBACK = {
  travel: { 
    car: 0.24, 
    scooter: 0.07, 
    bus: 0.05, 
    train: 0.04, 
    ev: 0.02, 
    walk: 0, 
    cycle: 0 
  },
  electricity: 0.9,
  food: { 
    meat: 1.0, 
    mixed: 0.57, 
    veg: 0.29 
  },
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
  electricity: { 
    default: "electricity_grid_mix" 
  },
  food: {
    meat: "food-beef",
    mixed: null,
    veg: "food-vegetables"
  }
};

async function climatiqEstimate(apiKey, emissionFactorId, parameters) {
  const url = "https://beta3.api.climatiq.org/estimate";
  const payload = { 
    emission_factor: { id: emissionFactorId }, 
    parameters 
  };
  
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
  const travelMode = (data.travelMode || "car").toLowerCase();
  const kWh = Number(data.kWh) || 0;
  const foodCategory = (data.foodCategory || "mixed").toLowerCase();
  const wasteKgPerMonth = Number(data.wasteKgPerMonth) || 0;

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
    used: "fallback",
    originalData: {
      travelKm: parseFloat(travelKm),
      travelMode,
      kWh: parseFloat(kWh),
      foodCategory,
      wasteKgPerMonth: parseFloat(wasteKgPerMonth)
    }
  };
}

export async function calculateCarbonFootprint(req, res) {
  try {
    const body = req.body || {};
    const apiKey = process.env.CLIMATIQ_KEY || process.env.CLIMATIQ_API_KEY;

    const travelKm = Number(body.travelKm) || 0;
    const travelMode = (body.travelMode || "car").toLowerCase();
    const kWh = Number(body.kWh) || 0;
    const foodCategory = (body.foodCategory || "mixed").toLowerCase();
    const wasteKgPerMonth = Number(body.wasteKgPerMonth) || 0;

    // If no API key, use fallback
    if (!apiKey) {
      const result = computeFallback(body);
      return res.status(200).json(result);
    }

    let used = "climatiq";
    const breakdown = { travel: 0, electricity: 0, food: 0, waste: 0 };

    // Calculate travel emissions
    try {
      const efId = CLIMATIQ_IDS.travel[travelMode];
      if (efId && travelKm > 0) {
        const clim = await climatiqEstimate(apiKey, efId, { 
          distance: travelKm, 
          distance_unit: "km" 
        });
        breakdown.travel = Number(clim.co2e) || 0;
      } else {
        breakdown.travel = travelKm * (FALLBACK.travel[travelMode] ?? FALLBACK.travel.car);
        if (used === "climatiq") used = "mixed";
      }
    } catch (err) {
      console.error("Climatiq travel error:", err.message || err);
      breakdown.travel = travelKm * (FALLBACK.travel[travelMode] ?? FALLBACK.travel.car);
      used = "mixed";
    }

    // Calculate electricity emissions
    try {
      const efId = CLIMATIQ_IDS.electricity.default;
      if (efId && kWh > 0) {
        const clim = await climatiqEstimate(apiKey, efId, { 
          energy: kWh, 
          energy_unit: "kWh" 
        });
        breakdown.electricity = Number(clim.co2e) || 0;
      } else {
        breakdown.electricity = kWh * FALLBACK.electricity;
        if (used === "climatiq") used = "mixed";
      }
    } catch (err) {
      console.error("Climatiq electricity error:", err.message || err);
      breakdown.electricity = kWh * FALLBACK.electricity;
      used = "mixed";
    }

    // Calculate food emissions
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
      console.error("Climatiq food error:", err.message || err);
      breakdown.food = FALLBACK.food[foodCategory] ?? FALLBACK.food.mixed;
      used = "mixed";
    }

    // Calculate waste emissions (always fallback)
    try {
      breakdown.waste = (wasteKgPerMonth / 30) * FALLBACK.wastePerKgPerMonth;
    } catch (err) {
      console.error("Waste calc error:", err.message || err);
      breakdown.waste = (wasteKgPerMonth / 30) * FALLBACK.wastePerKgPerMonth;
      used = "mixed";
    }

    const total = +(Object.values(breakdown).reduce((a, b) => a + (Number(b) || 0), 0)).toFixed(2);

    return res.status(200).json({ 
      total, 
      breakdown, 
      used,
      originalData: {
        travelKm: parseFloat(travelKm),
        travelMode,
        kWh: parseFloat(kWh),
        foodCategory,
        wasteKgPerMonth: parseFloat(wasteKgPerMonth)
      }
    });

  } catch (error) {
    console.error("Calculation error:", error);
    return res.status(500).json({ 
      error: "Failed to calculate carbon footprint",
      details: error.message 
    });
  }
}

