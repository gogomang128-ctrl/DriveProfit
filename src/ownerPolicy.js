import { initial, resolveVehicle } from "./engine.js";
import { origin, key } from "./profile.js";
export const bundled = {
  price_80: initial.prices[80],
  price_92: initial.prices[92],
  price_95: initial.prices[95],
  effective_on: initial.asOf,
  wear: initial.wear,
  speed: initial.speed,
  tank: initial.tank,
  sound: initial.sound,
  vehicle_overrides: {},
};
const within = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;
export function validPolicy(row) {
  if (
    !row ||
    !/^\d{4}-\d{2}-\d{2}$/.test(row.effective_on) ||
    !(Date.parse(row.effective_on) >= Date.parse(bundled.effective_on)) ||
    new Date(row.effective_on).toISOString().slice(0, 10) !== row.effective_on
  )
    return false;
  return (
    [80, 92, 95].every((g) => within(row["price_" + g], 0.01, 99999.99)) &&
    within(row.wear, 0, 100) &&
    within(row.speed, 5, 200) &&
    within(row.tank, 0.1, 150) &&
    typeof row.sound === "boolean" &&
    row.vehicle_overrides !== null &&
    typeof row.vehicle_overrides === "object" &&
    !Array.isArray(row.vehicle_overrides) &&
    Object.values(row.vehicle_overrides).every(
      (v) =>
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        (v.rate === undefined || within(v.rate, 0.1, 100)) &&
        (v.grade === undefined || [80, 92, 95].includes(v.grade)),
    )
  );
}
export function settingsFor(vehicle, row) {
  const v = resolveVehicle(vehicle),
    o = row.vehicle_overrides[v.id];
  return {
    vehicle: v.id,
    grade: o?.grade ?? v.grade,
    rate: o?.rate ?? v.rate,
    mode: "mixed",
    wear: row.wear,
    speed: row.speed,
    tank: row.tank,
    sound: row.sound,
    prices: { 80: row.price_80, 92: row.price_92, 95: row.price_95 },
    asOf: row.effective_on,
  };
}
export async function fetchPolicy() {
  const ac = new AbortController(),
    timer = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(
      origin +
        "/rest/v1/drive_policy?id=eq.1&select=price_80,price_92,price_95,effective_on,wear,speed,tank,sound,vehicle_overrides",
      {
        headers: { apikey: key },
        cache: "no-store",
        credentials: "omit",
        signal: ac.signal,
      },
    );
    if (!r.ok) throw Error("policy unavailable");
    const [row] = await r.json();
    if (!validPolicy(row)) throw Error("invalid policy");
    return row;
  } finally {
    clearTimeout(timer);
  }
}
