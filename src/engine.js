export const vehicles = [
  {
    name: "فيجوري",
    model: "VLR 200",
    type: "موتوسيكل",
    cc: 200,
    rate: 3,
    grade: 92,
  },
  {
    name: "باجاج",
    model: "Boxer 150",
    type: "موتوسيكل",
    cc: 150,
    rate: 2.4,
    grade: 92,
  },
  {
    name: "نيسان",
    model: "Sunny",
    type: "سيارة",
    cc: 1500,
    rate: 7,
    grade: 92,
  },
  {
    name: "تويوتا",
    model: "Corolla",
    type: "سيارة",
    cc: 1600,
    rate: 6.5,
    grade: 95,
  },
];
export const initial = {
  vehicle: 0,
  grade: 92,
  rate: 3,
  prices: { 80: 20.75, 92: 22.25, 95: 24 },
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
