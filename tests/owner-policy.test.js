import assert from "node:assert/strict";
import test from "node:test";
import { validPolicy, settingsFor, bundled } from "../src/ownerPolicy.js";
test("validate complete published settings before replacing last known policy", () => {
  assert.ok(validPolicy(bundled));
  for (const bad of [
    { price_92: null },
    { effective_on: "2026-11-17" },
    { speed: -1 },
    { vehicle_overrides: { bad: { rate: 0 } } },
    { sound: "true" },
  ])
    assert.equal(validPolicy({ ...bundled, ...bad }), false);
});
test("only selected vehicle and published values reach calculator and native service", () => {
  const s = settingsFor("fiat_tipo_14_mt", {
    ...bundled,
    price_92: 31,
    vehicle_overrides: { fiat_tipo_14_mt: { rate: 8, grade: 92 } },
  });
  assert.equal(s.rate, 8);
  assert.equal(s.prices[s.grade], 31);
  assert.equal(s.asOf, bundled.effective_on);
});
