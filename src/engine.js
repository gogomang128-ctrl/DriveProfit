import reference from "../public/data/fuel-eg.json" with { type: "json" };
import records from "../vehicles_egypt.json" with { type: "json" };
export const vehicles = [
  {
    id: "vigorey_vlr_200",
    name: "فيجوري",
    model: "VLR 200",
    type: "موتوسيكل",
    cc: 200,
    rate: 3,
    grade: 92,
  },
  {
    id: "bajaj_boxer_150",
    name: "باجاج",
    model: "Boxer 150",
    type: "موتوسيكل",
    cc: 150,
    rate: 2.4,
    grade: 92,
  },
];
// Preserve the two legacy indices from earlier installations, then use stable IDs for all future selections.
const catalog = records.map((r) => ({
  id: r.id,
  name: r.brand.split(" / ")[0],
  model: r.model.split(" / ")[1],
  search: [r.brand, r.model, r.reference_model_year].join(" "),
  type: "سيارة",
  cc: r.engine_cc,
  rate: r.liters_per_100km_avg,
  city: r.liters_per_100km_city,
  highway: r.liters_per_100km_highway,
  grade: r.fuel_type,
  tank: r.tank_capacity_liters,
  year: r.reference_model_year,
  gear: r.transmission,
  spec: r.spec_reference,
}));
vehicles.push(
  ...["nissan_sunny_n17", "toyota_corolla_e210"].map((id) =>
    catalog.find((v) => v.id === id),
  ),
  ...catalog.filter(
    (v) => !["nissan_sunny_n17", "toyota_corolla_e210"].includes(v.id),
  ),
);
export function resolveVehicle(key) {
  return (
    (typeof key === "number"
      ? vehicles[key]
      : vehicles.find((v) => v.id === key)) || vehicles[0]
  );
}
export const initial = {
  vehicle: 0,
  grade: 92,
  rate: 3,
  prices: reference.prices,
  source: reference.source,
  asOf: reference.asOf,
  wear: 5,
  speed: 80,
  tank: 8,
  sound: false,
};
export function calc(km, fare, rate, price, wear) {
  if (
    ![km, fare, rate, price, wear].every((n) => Number.isFinite(n) && n >= 0) ||
    wear > 100 ||
    !rate ||
    !price
  )
    throw Error("قيم غير صالحة");
  const liters = (km * rate) / 100,
    fuel = liters * price,
    cost = fuel + (fare * wear) / 100;
  return { liters, fuel, cost, net: fare - cost };
}
export function distance(a, b) {
  const rad = Math.PI / 180,
    dlat = (b.lat - a.lat) * rad,
    dlon = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
